"use strict";

/**
 * offline-npm-manager - Basic unit tests
 * Run with: node tests/test.js
 */

const assert = require("assert");
const path = require("path");
const os = require("os");
const fs = require("fs");

const { parsePackage } = require("../src/parser");
const {
  getStorageDir,
  getPackageDir,
  writeMeta,
  readMeta,
  DEFAULT_STORAGE,
} = require("../src/storage");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ── Parser tests ──────────────────────────────────────────────────────────────
console.log("\nparser.js");

test("parses bare package name", () => {
  const r = parsePackage("express");
  assert.strictEqual(r.name, "express");
  assert.strictEqual(r.version, "latest");
});

test("parses package with version", () => {
  const r = parsePackage("express@4.18.2");
  assert.strictEqual(r.name, "express");
  assert.strictEqual(r.version, "4.18.2");
});

test("parses scoped package without version", () => {
  const r = parsePackage("@scope/pkg");
  assert.strictEqual(r.name, "@scope/pkg");
  assert.strictEqual(r.version, "latest");
});

test("parses scoped package with version", () => {
  const r = parsePackage("@scope/pkg@2.0.0");
  assert.strictEqual(r.name, "@scope/pkg");
  assert.strictEqual(r.version, "2.0.0");
});

test("trims whitespace", () => {
  const r = parsePackage("  lodash@4.17.21  ");
  assert.strictEqual(r.name, "lodash");
  assert.strictEqual(r.version, "4.17.21");
});

// ── Storage tests ─────────────────────────────────────────────────────────────
console.log("\nstorage.js");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "offline-npm-test-"));

test("getStorageDir creates directory", () => {
  const dir = getStorageDir(tmpDir);
  assert.ok(fs.existsSync(dir));
});

test("getPackageDir creates nested directory", () => {
  const storageDir = getStorageDir(tmpDir);
  const pkgDir = getPackageDir(storageDir, "express", "4.18.2");
  assert.ok(fs.existsSync(pkgDir));
  assert.ok(pkgDir.endsWith(path.join("express", "4.18.2")));
});

test("writeMeta and readMeta roundtrip", () => {
  const storageDir = getStorageDir(tmpDir);
  const pkgDir = getPackageDir(storageDir, "lodash", "4.17.21");
  const meta = {
    name: "lodash",
    version: "4.17.21",
    tgz: "lodash-4.17.21.tgz",
    size: 12345,
  };
  writeMeta(pkgDir, meta);
  const read = readMeta(pkgDir);
  assert.deepStrictEqual(read, meta);
});

test("readMeta returns null for missing meta", () => {
  const storageDir = getStorageDir(tmpDir);
  const pkgDir = getPackageDir(storageDir, "nonexistent-pkg", "1.0.0");
  const read = readMeta(pkgDir);
  assert.strictEqual(read, null);
});

test("DEFAULT_STORAGE is in home directory", () => {
  assert.ok(DEFAULT_STORAGE.startsWith(os.homedir()));
});

// ── Cleanup ───────────────────────────────────────────────────────────────────
fs.rmSync(tmpDir, { recursive: true, force: true });

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
