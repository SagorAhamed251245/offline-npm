"use strict";

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { parsePackage, packageLabel } = require("./parser");
const { getStorageDir, getPackageDir, writeMeta } = require("./storage");
const log = require("./logger");

/**
 * Resolves the exact version for a package spec using `npm view`.
 */
function resolveVersion(name, version) {
  try {
    const result = execSync(
      `npm view ${packageLabel(name, version)} version --json`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    // npm may return a quoted string or a bare version
    return result.replace(/"/g, "");
  } catch (err) {
    throw new Error(
      `Could not resolve version for ${packageLabel(name, version)}. ` +
        `Are you online? Does this package exist?`,
    );
  }
}

/**
 * Fetches the dependency tree for a package using `npm view`.
 * Returns an object like { "dep": "^1.0.0", ... }
 */
function getDependencies(name, version) {
  try {
    const raw = execSync(
      `npm view ${packageLabel(name, version)} dependencies --json`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    if (!raw || raw === "undefined") return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Downloads a single .tgz via `npm pack` into the given directory.
 * Returns the path of the downloaded .tgz file.
 */
function npmPack(pkgLabel, destDir) {
  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    const cmd = `npm pack ${pkgLabel} --pack-destination "${destDir}"`;
    const output = execSync(cmd, { encoding: "utf-8" });
    const lines = output
      .trim()
      .split("\n")
      .filter((l) => l.trim() && !l.includes("npm"));
    const tgzName = lines.pop().trim();

    if (!tgzName) {
      throw new Error(`No output from npm pack for ${pkgLabel}`);
    }

    return path.join(destDir, tgzName);
  } catch (err) {
    log.error(`npm pack failed: ${err.message}`);
    throw err;
  }
}

/**
 * Recursively downloads a package and (optionally) its dependencies.
 */
async function downloadPackage(
  name,
  version,
  storageDir,
  downloadDeps,
  visited = new Set(),
) {
  const label = packageLabel(name, version);
  if (visited.has(label)) return;
  visited.add(label);

  log.step(`Resolving ${log.bold(label)} ...`);

  let resolvedVersion;
  try {
    resolvedVersion = resolveVersion(name, version);
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }

  const pkgDir = getPackageDir(storageDir, name, resolvedVersion);
  const metaPath = path.join(pkgDir, "meta.json");

  // Check if already cached
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (meta.tgz && fs.existsSync(path.join(pkgDir, meta.tgz))) {
      log.info(
        `Already cached: ${log.bold(packageLabel(name, resolvedVersion))}`,
      );
      return;
    }
  }

  log.step(`Downloading ${log.bold(packageLabel(name, resolvedVersion))} ...`);

  let tgzPath;
  try {
    tgzPath = npmPack(packageLabel(name, resolvedVersion), pkgDir);
  } catch (err) {
    log.error(`Failed to download ${label}: ${err.message}`);
    process.exit(1);
  }

  const tgzName = path.basename(tgzPath);
  const stats = fs.statSync(tgzPath);

  writeMeta(pkgDir, {
    name,
    version: resolvedVersion,
    requestedVersion: version,
    tgz: tgzName,
    size: stats.size,
    downloadedAt: new Date().toISOString(),
    hasDeps: downloadDeps,
  });

  log.success(
    `Saved ${log.bold(packageLabel(name, resolvedVersion))} ` +
      `(${(stats.size / 1024).toFixed(1)} KB) → ${pkgDir}`,
  );

  // Recursively download deps if requested
  if (downloadDeps) {
    const deps = getDependencies(name, resolvedVersion);
    const depEntries = Object.entries(deps);

    if (depEntries.length > 0) {
      log.info(
        `Found ${depEntries.length} dependenc${depEntries.length === 1 ? "y" : "ies"} for ${packageLabel(name, resolvedVersion)}`,
      );
      for (const [depName, depRange] of depEntries) {
        // Use the range directly; npm will resolve it
        await downloadPackage(
          depName,
          depRange,
          storageDir,
          downloadDeps,
          visited,
        );
      }
    }
  }
}

/**
 * Entry point for `offline-npm add <package>`
 */
async function addPackage(pkgInput, options) {
  const { name, version } = parsePackage(pkgInput);
  const storageDir = getStorageDir(options.storage);

  log.header(`📦  offline-npm add`);
  log.info(`Storage directory: ${storageDir}`);
  if (options.deps) {
    log.info(`Dependency download: ${log.bold("enabled")}`);
  }
  console.log("");

  await downloadPackage(name, version, storageDir, options.deps);

  console.log("");
  log.success(
    `Done! Run ${log.bold(`offline-npm install ${pkgInput}`)} anytime — even offline.`,
  );
}

module.exports = { addPackage };
