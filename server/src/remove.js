"use strict";

const fs = require("fs");
const path = require("path");
const { parsePackage, packageLabel } = require("../src/parser");
const { getStorageDir } = require("../src/storage");
const log = require("../src/logger");

/**
 * Recursively removes a directory.
 */
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Entry point for `offline-npm remove <package>`
 */
async function removePackage(pkgInput, options) {
  const { name, version } = parsePackage(pkgInput);
  const storageDir = getStorageDir(options.storage);

  log.header("📦  offline-npm remove");

  const nameParts = name.startsWith("@") ? name.split("/") : [name];
  const pkgDir = path.join(storageDir, ...nameParts);

  if (!fs.existsSync(pkgDir)) {
    log.error(`Package ${log.bold(name)} is not in the local cache.`);
    process.exit(1);
  }

  if (version === "latest") {
    // Remove all versions
    rmDir(pkgDir);
    log.success(`Removed all cached versions of ${log.bold(name)}.`);
  } else {
    const versionDir = path.join(pkgDir, version);
    if (!fs.existsSync(versionDir)) {
      log.error(
        `Version ${log.bold(version)} of ${log.bold(name)} is not cached.`,
      );
      process.exit(1);
    }
    rmDir(versionDir);
    log.success(`Removed ${log.bold(packageLabel(name, version))} from cache.`);

    // Clean up empty parent dirs
    try {
      if (fs.readdirSync(pkgDir).length === 0) fs.rmdirSync(pkgDir);
      // for scoped packages, clean the @scope dir too
      if (name.startsWith("@")) {
        const scopeDir = path.join(storageDir, nameParts[0]);
        if (fs.existsSync(scopeDir) && fs.readdirSync(scopeDir).length === 0) {
          fs.rmdirSync(scopeDir);
        }
      }
    } catch {
      /* ignore cleanup errors */
    }
  }
}

module.exports = { removePackage };
