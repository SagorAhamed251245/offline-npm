'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');

const DEFAULT_STORAGE = path.join(os.homedir(), '.offline-npm-cache');

/**
 * Resolves the storage directory, creating it if needed.
 * @param {string|null} customPath - Optional override path
 * @returns {string} Resolved absolute storage path
 */
function getStorageDir(customPath = null) {
  const dir = customPath ? path.resolve(customPath) : DEFAULT_STORAGE;
  ensureDir(dir);
  return dir;
}

/**
 * Returns the directory for a specific package + version
 * e.g. ~/.offline-npm-cache/express/4.18.2/
 */
function getPackageDir(storageDir, name, version) {
  const dir = path.join(storageDir, name, version);
  ensureDir(dir);
  return dir;
}

/**
 * Recursively ensures a directory exists.
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read the metadata JSON for a stored package.
 */
function readMeta(pkgDir) {
  const metaPath = path.join(pkgDir, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

/**
 * Write metadata JSON for a stored package.
 */
function writeMeta(pkgDir, meta) {
  const metaPath = path.join(pkgDir, 'meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
}

module.exports = {
  DEFAULT_STORAGE,
  getStorageDir,
  getPackageDir,
  ensureDir,
  readMeta,
  writeMeta,
};
