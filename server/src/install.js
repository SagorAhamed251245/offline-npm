"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { parsePackage, packageLabel } = require("./parser");
const { getStorageDir, readMeta } = require("./storage");
const log = require("./logger");

/**
 * Finds all cached versions of a package in storage.
 * Returns array of { version, pkgDir, meta }
 */
function findCachedVersions(storageDir, name) {
  // Scoped packages: @scope/name → stored in storageDir/@scope/name/
  const pkgPath = path.join(storageDir, ...name.split("/"));

  if (!fs.existsSync(pkgPath)) return [];

  return fs
    .readdirSync(pkgPath)
    .filter((v) => {
      const meta = readMeta(path.join(pkgPath, v));
      return meta !== null;
    })
    .map((v) => ({
      version: v,
      pkgDir: path.join(pkgPath, v),
      meta: readMeta(path.join(pkgPath, v)),
    }));
}

/**
 * Picks the best cached version for the requested spec.
 * If version is 'latest', picks the most recently downloaded entry.
 * Otherwise does an exact match.
 */
function pickVersion(cached, requestedVersion) {
  if (!cached.length) return null;

  if (requestedVersion === "latest") {
    // Sort by downloadedAt descending, pick newest
    return cached.sort(
      (a, b) => new Date(b.meta.downloadedAt) - new Date(a.meta.downloadedAt),
    )[0];
  }

  // Exact version match
  return cached.find((c) => c.version === requestedVersion) || null;
}

/**
 * Runs npm install with the .tgz file path as the target.
 * Uses offline-friendly flags to prevent fetching from npm registry.
 */
function runNpmInstall(tgzPath, saveFlag) {
  const args = [
    "install",
    tgzPath,
    "--prefer-offline", // Use cache first before fetching
    "--no-audit", // Skip npm audit (requires network)
  ];
  if (saveFlag === "save") args.push("--save");
  if (saveFlag === "save-dev") args.push("--save-dev");

  const result = spawnSync("npm", args, {
    encoding: "utf-8",
    stdio: "inherit",
    shell: true, // Windows compatibility
  });

  return result.status === 0;
}

/**
 * Convert local file URL path to registry tarball URL if possible.
 */
function normalizeResolvedUrl(fileUri) {
  if (typeof fileUri !== "string" || !fileUri.startsWith("file:")) return null;

  let absolute = fileUri.replace(/^file:\/\//, "").replace(/^file:/, "");
  absolute = decodeURIComponent(absolute).replace(/\\/g, "/");

  const marker = ".offline-npm-cache/";
  const idx = absolute.indexOf(marker);
  if (idx === -1) return null;

  const subpath = absolute.slice(idx + marker.length);
  const parts = subpath.split("/").filter(Boolean);

  // unscoped: name/version/name-version.tgz
  // scoped: @scope/name/version/name-version.tgz
  let packageName;
  let version;
  if (parts[0].startsWith("@")) {
    if (parts.length < 4) return null;
    packageName = `${parts[0]}/${parts[1]}`;
    version = parts[2];
  } else {
    if (parts.length < 3) return null;
    packageName = parts[0];
    version = parts[1];
  }

  const baseName = packageName.includes("/")
    ? packageName.split("/").pop()
    : packageName;
  const tarballName = `${baseName}-${version}.tgz`;

  return `https://registry.npmjs.org/${packageName}/-/${tarballName}`;
}

function normalizeDependency() {}
function sanitizePackageLock() {
  const lockFile = path.resolve("package-lock.json");
  if (!fs.existsSync(lockFile)) return;

  try {
    const lockData = JSON.parse(fs.readFileSync(lockFile, "utf-8"));

    function sanitizeNode(node) {
      if (!node || typeof node !== "object") return;
      if (node.resolved && typeof node.resolved === "string") {
        const normalized = normalizeResolvedUrl(node.resolved);
        if (normalized) node.resolved = normalized;
      }
      if (node.dependencies && typeof node.dependencies === "object") {
        for (const depName of Object.keys(node.dependencies)) {
          sanitizeNode(node.dependencies[depName]);
        }
      }
    }

    // npm v7+ uses `packages` and `dependencies`
    if (lockData.packages && typeof lockData.packages === "object") {
      for (const pkgPath of Object.keys(lockData.packages)) {
        sanitizeNode(lockData.packages[pkgPath]);
      }
    }
    if (lockData.dependencies && typeof lockData.dependencies === "object") {
      sanitizeNode(lockData.dependencies);
    }

    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2), "utf-8");
  } catch (err) {
    log.warn(`Could not sanitize package-lock.json: ${err.message}`);
  }
}

function sanitizePackageJson(name, version, saveFlag) {
  if (!saveFlag) return;

  const pkgJsonPath = path.resolve("package.json");
  if (!fs.existsSync(pkgJsonPath)) return;

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const section =
      saveFlag === "save-dev" ? "devDependencies" : "dependencies";
    if (!pkgJson[section]) pkgJson[section] = {};

    const current = pkgJson[section][name];
    if (typeof current === "string" && current.startsWith("file:")) {
      pkgJson[section][name] = version;
    }
    console.log({ pkgJson });
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), "utf-8");
  } catch (err) {
    log.warn(`Could not sanitize package.json (${name}): ${err.message}`);
  }
}

/**
 * Entry point for `offline-npm install <package>`
 */
async function installPackage(pkgInput, options) {
  const { name, version } = parsePackage(pkgInput);
  const storageDir = getStorageDir(options.storage);

  log.header(`📦  offline-npm install`);
  log.info(
    `Looking up ${log.bold(packageLabel(name, version))} in local cache...`,
  );
  log.dim(`Storage: ${storageDir}`);
  console.log("");

  const cached = findCachedVersions(storageDir, name);

  if (!cached.length) {
    log.error(`Package ${log.bold(name)} not found in local cache.`);
    log.info(
      `Run ${log.bold(`offline-npm add ${pkgInput}`)} while online first.`,
    );
    process.exit(1);
  }

  const match = pickVersion(cached, version);

  if (!match) {
    log.error(
      `Version ${log.bold(version)} of ${log.bold(name)} is not cached.`,
    );
    log.info(`Cached versions: ${cached.map((c) => c.version).join(", ")}`);
    log.info(
      `Run ${log.bold(`offline-npm add ${pkgInput}`)} while online to download it.`,
    );
    process.exit(1);
  }

  const tgzPath = path.join(match.pkgDir, match.meta.tgz);

  if (!fs.existsSync(tgzPath)) {
    log.error(`Cached .tgz file is missing: ${tgzPath}`);
    log.info(
      `Run ${log.bold(`offline-npm add ${pkgInput}`)} again to re-download.`,
    );
    process.exit(1);
  }

  log.step(
    `Installing ${log.bold(packageLabel(name, match.version))} from cache...`,
  );
  log.dim(`Source: ${tgzPath}`);
  console.log("");

  const saveFlag = options.saveDev ? "save-dev" : options.save ? "save" : null;
  const ok = runNpmInstall(tgzPath, saveFlag);

  console.log("");
  if (ok) {
    log.success(
      `Installed ${log.bold(packageLabel(name, match.version))} successfully (offline).`,
    );

    sanitizePackageJson(name, match.version, saveFlag);
    sanitizePackageLock();

    log.info("Package metadata was rewritten to production-friendly sources.");
  } else {
    log.error(`npm install failed. Check output above for details.`);
    process.exit(1);
  }
}

module.exports = { installPackage };
