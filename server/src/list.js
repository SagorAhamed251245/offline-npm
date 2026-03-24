"use strict";

const fs = require("fs");
const path = require("path");
const { getStorageDir, readMeta } = require("../src/storage");
const log = require("../src/logger");

/**
 * Walks the storage directory and collects all cached packages.
 * Returns data in API format suitable for both CLI and REST endpoints.
 */
function collectPackages(storageDir) {
  const results = [];

  function walk(dir, nameParts) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);

      // Scoped packages start with '@'
      if (nameParts.length === 0 && entry.name.startsWith("@")) {
        walk(fullPath, [entry.name]);
        continue;
      }

      if (
        nameParts.length === 0 ||
        (nameParts.length === 1 && nameParts[0].startsWith("@"))
      ) {
        // This level is the package name
        const pkgName = nameParts.length
          ? `${nameParts[0]}/${entry.name}`
          : entry.name;
        // Go into version directories
        walkVersions(fullPath, pkgName);
      }
    }
  }

  function walkVersions(pkgDir, pkgName) {
    if (!fs.existsSync(pkgDir)) return;
    const entries = fs.readdirSync(pkgDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const versionDir = path.join(pkgDir, entry.name);
      const meta = readMeta(versionDir);
      if (meta) {
        const tgzPath = path.join(versionDir, meta.tgz || "");
        const tgzExists = fs.existsSync(tgzPath);
        results.push({
          id: `${pkgName}@${entry.name}`,
          name: pkgName,
          version: entry.name,
          size: meta.size || 0,
          sizeLabel: meta.size ? `${(meta.size / 1024).toFixed(1)} KB` : "?",
          downloadedAt: meta.downloadedAt || null,
          tgz: meta.tgz || null,
          tgzPath,
          status: tgzExists ? "ready" : "missing",
          hasDeps: meta.hasDeps || false,
        });
      }
    }
  }

  walk(storageDir, []);
  return results.sort(
    (a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt),
  );
}

/**
 * Entry point for `offline-npm list`
 */
async function listPackages(options) {
  const storageDir = getStorageDir(options.storage);

  log.header("📦  offline-npm list");
  log.dim(`Storage: ${storageDir}`);
  console.log("");

  const packages = collectPackages(storageDir);

  if (!packages.length) {
    log.warn("No packages cached yet.");
    log.info(
      `Run ${log.bold("offline-npm add <package>")} to download packages.`,
    );
    return;
  }

  // Format for CLI display
  const displayTable = packages.map((p) => ({
    Package: p.name,
    Version: p.version,
    Size: p.sizeLabel,
    Downloaded: p.downloadedAt
      ? new Date(p.downloadedAt).toLocaleString()
      : "?",
    Status: p.status === "ready" ? "✔ ready" : "✖ missing",
  }));

  log.table(displayTable);
  console.log("");
  log.success(
    `${packages.length} package version${packages.length === 1 ? "" : "s"} in cache.`,
  );
}

module.exports = { listPackages, collectPackages };
