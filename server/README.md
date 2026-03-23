# 📦 offline-npm-manager

> Download npm packages when online. Install them later — even without internet.

---

## Why?

- Air-gapped servers, CI machines, or restricted networks  
- Slow/metered connections where you want to download once and reuse  
- Reproducible offline environments for Docker or dev containers  

---

## Installation

```bash
# Clone or copy the project
cd offline-npm-manager

# Install dependencies (only `commander` — no heavy runtimes needed)
npm install

# Link globally so `offline-npm` is available in your PATH
npm link
```

---

## Folder Structure

```
offline-npm-manager/
├── bin/
│   └── offline-npm.js          # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── add.js                  # `offline-npm add` logic
│   ├── install.js              # `offline-npm install` logic
│   ├── list.js                 # `offline-npm list` logic
│   ├── remove.js               # `offline-npm remove` logic
│   ├── storage.js              # Cache directory helpers
│   ├── parser.js               # Package name/version parser
│   └── logger.js               # Colourful terminal output
├── tests/
│   └── test.js                 # Unit tests (no external test runner)
├── package.json
└── README.md
```

### Cache Layout

Packages are stored under `~/.offline-npm-cache/` by default:

```
~/.offline-npm-cache/
├── express/
│   └── 4.18.2/
│       ├── express-4.18.2.tgz   ← downloaded by npm pack
│       └── meta.json            ← metadata (version, size, timestamp)
├── lodash/
│   └── 4.17.21/
│       ├── lodash-4.17.21.tgz
│       └── meta.json
└── @scope/
    └── pkg/
        └── 1.0.0/
            ├── scope-pkg-1.0.0.tgz
            └── meta.json
```

---

## Commands

### `offline-npm add <package>` *(requires internet)*

Downloads a package using `npm pack` and stores the `.tgz` locally.

```bash
# Download latest version
offline-npm add express

# Download specific version
offline-npm add express@4.18.2

# Download with ALL dependencies recursively
offline-npm add express@4.18.2 --deps

# Use a custom storage path
offline-npm add lodash --storage ./my-cache
```

### `offline-npm install <package>` *(works offline)*

Installs a package from your local cache using `npm install <path/to.tgz>`.

```bash
# Install latest cached version
offline-npm install express

# Install specific cached version
offline-npm install express@4.18.2

# Add to package.json dependencies
offline-npm install express@4.18.2 --save

# Add to devDependencies
offline-npm install jest --save-dev

# Use custom storage path
offline-npm install lodash --storage ./my-cache
```

### `offline-npm list` *(works offline)*

Shows all packages in your local cache.

```bash
offline-npm list
# or
offline-npm ls
```

Example output:

```
┌──────────┬─────────┬──────────┬─────────────────────┬─────────┐
│ Package  │ Version │ Size     │ Downloaded          │ Status  │
├──────────┼─────────┼──────────┼─────────────────────┼─────────┤
│ express  │ 4.18.2  │ 85.3 KB  │ 1/15/2025, 10:30 AM │ ✔ ready │
│ lodash   │ 4.17.21 │ 142.7 KB │ 1/15/2025, 10:31 AM │ ✔ ready │
└──────────┴─────────┴──────────┴─────────────────────┴─────────┘
```

### `offline-npm remove <package>` *(works offline)*

Removes a package from your local cache.

```bash
# Remove a specific version
offline-npm remove express@4.18.2

# Remove ALL cached versions of a package
offline-npm remove express

# Scoped packages
offline-npm remove @scope/pkg@1.0.0
```

---

## Example Workflow

```bash
# ── Step 1: While online ──────────────────────────────────────────
offline-npm add express@4.18.2 --deps   # download express + all deps
offline-npm add lodash@4.17.21
offline-npm add typescript@5.3.2
offline-npm list                         # verify everything is cached

# ── Step 2: Go offline ───────────────────────────────────────────
# Disconnect from internet, board the plane, enter the data center...

# ── Step 3: Install from cache ───────────────────────────────────
mkdir my-project && cd my-project
npm init -y
offline-npm install express@4.18.2 --save
offline-npm install lodash@4.17.21 --save
offline-npm install typescript@5.3.2 --save-dev
```

---

## Options Reference

| Flag | Description |
|------|-------------|
| `--deps` | (add only) recursively download all dependencies |
| `--storage <path>` | override default `~/.offline-npm-cache` |
| `--save` | (install only) add to `dependencies` in package.json |
| `--save-dev` | (install only) add to `devDependencies` in package.json |

---

## Running Tests

```bash
npm test
# or
node tests/test.js
```

Tests cover the parser and storage utilities and require no network access.

---

## How It Works

| Command | Mechanism |
|---------|-----------|
| `add` | Calls `npm pack <name>@<version> --pack-destination <dir>` to download the `.tgz` |
| `install` | Calls `npm install <path/to/package.tgz>` with the local file path |
| Dep resolution | Uses `npm view <pkg> dependencies --json` to walk the tree |
| Version pinning | Uses `npm view <pkg>@<range> version` to resolve exact version |

---

## Requirements

- Node.js ≥ 16
- npm (must be in PATH)
- Internet access for `add` command only

---

## License

MIT
