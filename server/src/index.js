"use strict";

const express = require("express");
const cors = require("cors");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { collectPackages } = require("./list");
const { getStorageDir, readMeta, writeMeta } = require("./storage");
const { parsePackage, packageLabel } = require("./parser");

const app = express();
const PORT = process.env.PORT || 3001;
const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(os.homedir(), ".offline-npm-cache");

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Run a CLI command and return { success, stdout, stderr }
 */
function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      shell: true, // Use shell on Windows so npm command is found
      encoding: "utf-8",
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) =>
      resolve({ success: code === 0, stdout, stderr, code }),
    );
    proc.on("error", (err) =>
      resolve({ success: false, stdout, stderr: err.message, code: -1 }),
    );
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/packages — list all cached packages
app.get("/api/packages", (req, res) => {
  try {
    const packages = collectPackages(STORAGE_DIR);
    res.json({ packages, storageDir: STORAGE_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — summary statistics
app.get("/api/stats", (req, res) => {
  try {
    const packages = collectPackages(STORAGE_DIR);
    const totalSize = packages.reduce((s, p) => s + (p.size || 0), 0);
    const uniqueNames = new Set(packages.map((p) => p.name)).size;
    res.json({
      total: packages.length,
      uniquePackages: uniqueNames,
      totalSize,
      totalSizeLabel:
        totalSize > 1024 * 1024
          ? `${(totalSize / 1024 / 1024).toFixed(1)} MB`
          : `${(totalSize / 1024).toFixed(1)} KB`,
      storageDir: STORAGE_DIR,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/packages/add — download a package
app.post("/api/packages/add", async (req, res) => {
  const { package: pkg, deps = false } = req.body;
  if (!pkg || !pkg.trim())
    return res.status(400).json({ error: "Package name required" });

  const pkgInput = pkg.trim();
  let name, version;
  try {
    const parsed = parsePackage(pkgInput);
    name = parsed.name;
    version = parsed.version;
  } catch (err) {
    return res.status(400).json({ error: `Invalid package name: ${pkgInput}` });
  }

  // Let npm pack resolve the version - it handles 'latest' by itself
  let resolvedVersion = version;
  const destDir = path.join(STORAGE_DIR, ...name.split("/"), version);
  ensureDir(destDir);

  // Run npm pack directly - npm will fetch and resolve the version
  const result = await runCommand("npm", [
    "pack",
    packageLabel(name, version),
    "--pack-destination",
    destDir,
  ]);

  if (!result.success) {
    console.error(`[API] npm pack error: ${result.stderr || result.stdout}`);
    return res.status(500).json({
      error: result.stderr
        ? result.stderr.substring(0, 200)
        : `Cannot resolve or download package: ${pkgInput}. Are you online?`,
    });
  }

  // Extract the filename from npm pack output
  const lines = result.stdout
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.includes("npm"));
  const tgzName = lines.pop().trim();
  if (!tgzName) {
    return res.status(500).json({ error: "npm pack produced no output" });
  }

  // Now we know the actual version from npm pack output (e.g., "react-19.2.4.tgz")
  const versionMatch = tgzName.match(/@?[\w-]+-([\w.]+)\.tgz$/);
  if (versionMatch) {
    resolvedVersion = versionMatch[1];
    // Rename to proper directory if needed
    const actualDestDir = path.join(
      STORAGE_DIR,
      ...name.split("/"),
      resolvedVersion,
    );
    if (actualDestDir !== destDir) {
      ensureDir(actualDestDir);
      const oldTgzPath = path.join(destDir, tgzName);
      const newTgzPath = path.join(actualDestDir, tgzName);
      fs.renameSync(oldTgzPath, newTgzPath);
      // Clean up old directory if empty
      try {
        const files = fs.readdirSync(destDir);
        if (!files.length) fs.rmdirSync(destDir);
      } catch {}
    }
  }

  const tgzPath = path.join(
    path.join(STORAGE_DIR, ...name.split("/"), resolvedVersion),
    tgzName,
  );
  const stats = fs.existsSync(tgzPath) ? fs.statSync(tgzPath) : null;

  const meta = {
    name,
    version: resolvedVersion,
    requestedVersion: version,
    tgz: tgzName,
    size: stats ? stats.size : 0,
    downloadedAt: new Date().toISOString(),
    hasDeps: deps,
  };
  const finalDestDir = path.join(
    STORAGE_DIR,
    ...name.split("/"),
    resolvedVersion,
  );
  writeMeta(finalDestDir, meta);

  res.json({
    success: true,
    package: { ...meta, id: `${name}@${resolvedVersion}`, status: "ready" },
  });
});

// POST /api/packages/install — install from cache
app.post("/api/packages/install", async (req, res) => {
  const { package: pkg } = req.body;
  if (!pkg) return res.status(400).json({ error: "Package name required" });

  const atIdx = pkg.startsWith("@") ? pkg.indexOf("@", 1) : pkg.indexOf("@");
  const name = atIdx === -1 ? pkg : pkg.slice(0, atIdx);
  const version = atIdx === -1 ? null : pkg.slice(atIdx + 1);

  const pkgStorageDir = path.join(STORAGE_DIR, ...name.split("/"));
  if (!fs.existsSync(pkgStorageDir)) {
    return res
      .status(404)
      .json({ error: `Package ${name} not found in cache` });
  }

  let targetVersion = version;
  if (!targetVersion) {
    const versions = fs
      .readdirSync(pkgStorageDir)
      .filter((v) => fs.statSync(path.join(pkgStorageDir, v)).isDirectory());
    if (!versions.length)
      return res.status(404).json({ error: `No versions cached for ${name}` });
    targetVersion = versions[versions.length - 1];
  }

  const versionDir = path.join(pkgStorageDir, targetVersion);
  const meta = readMeta(versionDir);
  if (!meta || !meta.tgz)
    return res.status(404).json({ error: `Metadata missing for ${pkg}` });

  const tgzPath = path.join(versionDir, meta.tgz);
  if (!fs.existsSync(tgzPath)) {
    return res
      .status(404)
      .json({ error: `Cached .tgz not found. Re-add the package.` });
  }

  const result = await runCommand("npm", ["install", tgzPath]);
  if (!result.success) {
    return res
      .status(500)
      .json({ error: result.stderr || "npm install failed" });
  }

  res.json({
    success: true,
    message: `Installed ${name}@${targetVersion} from cache`,
  });
});

// DELETE /api/packages/:name/:version — remove from cache
app.delete("/api/packages/:name/:version", (req, res) => {
  const { name, version } = req.params;
  const decodedName = decodeURIComponent(name);
  const versionDir = path.join(STORAGE_DIR, ...decodedName.split("/"), version);

  if (!fs.existsSync(versionDir)) {
    return res
      .status(404)
      .json({ error: "Package version not found in cache" });
  }

  fs.rmSync(versionDir, { recursive: true, force: true });

  // Clean up empty parent dirs
  try {
    const pkgDir = path.join(STORAGE_DIR, ...decodedName.split("/"));
    if (fs.existsSync(pkgDir) && fs.readdirSync(pkgDir).length === 0) {
      fs.rmdirSync(pkgDir);
      if (decodedName.startsWith("@")) {
        const scopeDir = path.join(STORAGE_DIR, decodedName.split("/")[0]);
        if (fs.existsSync(scopeDir) && fs.readdirSync(scopeDir).length === 0) {
          fs.rmdirSync(scopeDir);
        }
      }
    }
  } catch {
    /* ignore */
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n📦 Offline NPM Dashboard API`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`   Storage:    ${STORAGE_DIR}\n`);
});
