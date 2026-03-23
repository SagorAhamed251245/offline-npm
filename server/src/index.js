"use strict";

const express = require("express");
const cors = require("cors");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

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

function readMeta(pkgDir) {
  const metaPath = path.join(pkgDir, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Walk the storage directory and return all cached packages.
 */
function getAllPackages() {
  ensureDir(STORAGE_DIR);
  const results = [];

  function walkVersions(pkgDir, pkgName) {
    if (!fs.existsSync(pkgDir)) return;
    for (const versionEntry of fs.readdirSync(pkgDir, {
      withFileTypes: true,
    })) {
      if (!versionEntry.isDirectory()) continue;
      const vDir = path.join(pkgDir, versionEntry.name);
      const meta = readMeta(vDir);
      if (!meta) continue;
      const tgzPath = path.join(vDir, meta.tgz || "");
      results.push({
        id: `${pkgName}@${versionEntry.name}`,
        name: pkgName,
        version: versionEntry.name,
        size: meta.size || 0,
        sizeLabel: meta.size ? `${(meta.size / 1024).toFixed(1)} KB` : "?",
        downloadedAt: meta.downloadedAt || null,
        tgz: meta.tgz || null,
        tgzPath,
        status: tgzExists(tgzPath) ? "ready" : "missing",
        hasDeps: meta.hasDeps || false,
      });
    }
  }

  for (const entry of fs.readdirSync(STORAGE_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(STORAGE_DIR, entry.name);
    if (entry.name.startsWith("@")) {
      // Scoped package: go one level deeper
      for (const scopedEntry of fs.readdirSync(fullPath, {
        withFileTypes: true,
      })) {
        if (!scopedEntry.isDirectory()) continue;
        walkVersions(
          path.join(fullPath, scopedEntry.name),
          `${entry.name}/${scopedEntry.name}`,
        );
      }
    } else {
      walkVersions(fullPath, entry.name);
    }
  }

  return results.sort(
    (a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt),
  );
}

function tgzExists(tgzPath) {
  return tgzPath && fs.existsSync(tgzPath);
}

/**
 * Run a CLI command and return { success, stdout, stderr }
 */
function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { encoding: "utf-8" });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) =>
      resolve({ success: code === 0, stdout, stderr, code }),
    );
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/packages — list all cached packages
app.get("/api/packages", (req, res) => {
  try {
    const packages = getAllPackages();
    res.json({ packages, storageDir: STORAGE_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — summary statistics
app.get("/api/stats", (req, res) => {
  try {
    const packages = getAllPackages();
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

  const args = ["pack", pkg.trim(), "--pack-destination"];

  // Resolve name/version to determine destination
  const atIdx = pkg.startsWith("@") ? pkg.indexOf("@", 1) : pkg.indexOf("@");
  const name = atIdx === -1 ? pkg.trim() : pkg.trim().slice(0, atIdx);
  const version = atIdx === -1 ? "latest" : pkg.trim().slice(atIdx + 1);

  // Resolve exact version first
  let resolvedVersion = version;
  try {
    const vResult = execSync(
      `npm view ${pkg.trim()} version --json 2>/dev/null`,
      { encoding: "utf-8", timeout: 15000 },
    )
      .trim()
      .replace(/"/g, "");
    resolvedVersion = vResult || version;
  } catch {
    return res
      .status(400)
      .json({ error: `Cannot resolve package: ${pkg}. Are you online?` });
  }

  const destDir = path.join(STORAGE_DIR, ...name.split("/"), resolvedVersion);
  ensureDir(destDir);

  const result = await runCommand("npm", [
    "pack",
    `${name}@${resolvedVersion}`,
    "--pack-destination",
    destDir,
  ]);

  if (!result.success) {
    return res.status(500).json({ error: result.stderr || "npm pack failed" });
  }

  const tgzName = result.stdout.trim().split("\n").pop().trim();
  const tgzPath = path.join(destDir, tgzName);
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
  fs.writeFileSync(
    path.join(destDir, "meta.json"),
    JSON.stringify(meta, null, 2),
  );

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
