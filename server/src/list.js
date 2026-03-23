"use strict";

const fs = require("fs");
const path = require("path");
const { getStorageDir, readMeta } = require("../src/storage");
const log = require("../src/logger");

/**
 * Walks the storage directory and collects all cached packages.
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
        const tgzExists = fs.existsSync(path.join(versionDir, meta.tgz || ""));
        results.push({
          Package: pkgName,
          Version: entry.name,
          Size: meta.size ? `${(meta.size / 1024).toFixed(1)} KB` : "?",
          Downloaded: meta.downloadedAt
            ? new Date(meta.downloadedAt).toLocaleString()
            : "?",
          Status: tgzExists ? "✔ ready" : "✖ missing",
        });
      }
    }
  }

  walk(storageDir, []);
  return results;
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

  log.table(packages);
  console.log("");
  log.success(
    `${packages.length} package version${packages.length === 1 ? "" : "s"} in cache.`,
  );
}

module.exports = { listPackages };
