# 📦 Offline NPM Manager - Server & CLI

Server component providing both **CLI tool** (`offline-npm` command) and **REST API (Express)** for managing offline npm packages.

This is the core backend - handles package downloads, caching, dependency resolution, and provides both command-line and HTTP access.

---

## Features

✅ **CLI Commands** - Add, install, list, and remove packages from terminal  
✅ **REST API** - Full HTTP endpoints for programmatic access  
✅ **Dependency Management** - Automatically cache package dependencies  
✅ **Smart Caching** - Detect already-cached packages  
✅ **Scoped Packages** - Full support for `@scope/package` naming  
✅ **Cross-Platform** - Works on Windows, macOS, and Linux  
✅ **Version Control** - Store and manage multiple versions  
✅ **Real-time Feedback** - Progress indicators and error messages

---

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - REST API framework (port 3001)
- **Commander.js** - CLI argument parser
- **npm** - Package downloads and installation
- **Native modules** - fs, path, spawn (no external dependencies for core logic)

---

## Installation

### Prerequisites

- **Node.js** 16 or higher
- **npm** 8 or higher

### Setup

```bash
# From the project root
npm run install:all

# Or just the server
cd server
npm install
```

### Install CLI Globally (Optional)

Make `offline-npm` command available anywhere:

```bash
cd server
npm install -g
```

Now you can use the CLI from any directory:

```bash
offline-npm add express
offline-npm list
offline-npm install react
```

**Note:** If you prefer not to install globally, use the local path:

```bash
node /path/to/server/bin/offline-npm.js add express
```

---

## Quick Start

### Start the Server

```bash
# Enable both CLI and API
npm run server
# or
cd server && npm start
```

This will:

- Start Express API on `http://localhost:3001`
- CLI tool ready for immediate use
- Keep npm registry available for downloads
- Use default cache: `~/.offline-npm-cache/`

### Use the CLI

```bash
# Add a package to cache
node bin/offline-npm.js add express

# List all cached packages
node bin/offline-npm.js list

# Install from cache
node bin/offline-npm.js install react

# Remove from cache
node bin/offline-npm.js remove lodash
```

### Check the API

```bash
# Verify API is running
curl http://localhost:3001/api/packages

# Add a package via API
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"lodash"}'
```

---

## Storage Structure

Packages stored in `~/.offline-npm-cache/` (configurable via `STORAGE_DIR` env var):

```
~/.offline-npm-cache/
├── lodash/
│   └── 4.17.23/
│       ├── lodash-4.17.23.tgz          # Package tarball
│       └── meta.json                   # Metadata: name, version, size, date
├── express/
│   └── 5.2.1/
│       ├── express-5.2.1.tgz
│       └── meta.json
└── @babel/                             # Scoped packages
    └── core/
        ├── 7.20.5/
        │   ├── core-7.20.5.tgz
        │   └── meta.json
```

**meta.json Example:**

```json
{
  "name": "express",
  "version": "5.2.1",
  "size": 23150,
  "downloadedAt": "2026-03-24T10:15:30Z",
  "hasDeps": true
}
```

---

## Environment Variables

| Variable      | Default                | Description             |
| ------------- | ---------------------- | ----------------------- |
| `PORT`        | `3001`                 | API server port         |
| `STORAGE_DIR` | `~/.offline-npm-cache` | Package cache directory |

### Example: Custom Storage

```bash
# Use external drive or custom location
STORAGE_DIR=/mnt/usb/npm-cache npm start

# Windows
set STORAGE_DIR=D:\npm-packages && npm start
```

---

## CLI Commands

### `add` - Download and cache a package

Downloads a package using `npm pack` and stores it locally.

```bash
offline-npm add <package>                    # Latest version
offline-npm add react@17.0.2                 # Specific version
offline-npm add @babel/core                  # Scoped package
offline-npm add lodash@^4.17.0               # Version range

# With options
offline-npm add express --deps               # Download dependencies
offline-npm add react -s /custom/path        # Custom storage dir
```

**Options:**

- `-d, --deps` - Also download all dependencies recursively
- `-s, --storage <path>` - Custom storage directory

---

### `install` - Install a package from cache

Installs a cached package to `node_modules/`. The package must be cached first.

```bash
offline-npm install <package>                    # Latest cached version
offline-npm install react@17.0.2                 # Specific version
offline-npm install @babel/core                  # Scoped package

# With options
offline-npm install express --save               # Add to package.json
offline-npm install lodash --save-dev            # Add to devDependencies
```

**Important:** For packages with dependencies, you must download them WITH dependencies first:

```bash
# Download WITH dependencies (do this while online)
offline-npm add express --deps                   # Caches express + all deps

# Then install offline (works even without internet)
offline-npm install express
```

**Options:**

- `--save` - Add to `dependencies` in package.json
- `--save-dev` - Add to `devDependencies` in package.json
- `-s, --storage <path>` - Custom storage directory

---

```bash
offline-npm list                 # Show all packages
offline-npm ls                   # Alias
offline-npm list -s /custom/dir  # List from custom storage
```

**Output:**

```
📦  offline-npm list

   Storage: ~/.offline-npm-cache

┌──────────┬─────────┬──────────┬───────────────────────┬─────────┐
│ Package  │ Version │ Size     │ Downloaded            │ Status  │
├──────────┼─────────┼──────────┼───────────────────────┼─────────┤
│ lodash   │ 4.17.23 │ 307.5 KB │ 3/24/2026, 9:48 AM    │ ✔ ready │
│ express  │ 5.2.1   │ 22.6 KB  │ 3/24/2026, 10:15 AM   │ ✔ ready │
└──────────┴─────────┴──────────┴───────────────────────┴─────────┘

✔  2 package versions in cache.
```

---

## REST API Reference

All endpoints return JSON and are prefixed with `/api`.

### `GET /api/packages` - List all cached packages

Retrieve all packages currently in the cache.

**Response:**

```json
{
  "packages": [
    {
      "id": "lodash@4.17.23",
      "name": "lodash",
      "version": "4.17.23",
      "size": 314880,
      "sizeLabel": "307.5 KB",
      "downloadedAt": "2026-03-24T09:48:00Z",
      "status": "ready"
    },
    {
      "id": "express@5.2.1",
      "name": "express",
      "version": "5.2.1",
      "size": 23150,
      "sizeLabel": "22.6 KB",
      "downloadedAt": "2026-03-24T10:15:30Z",
      "status": "ready"
    }
  ]
}
```

**Usage:**

```bash
curl http://localhost:3001/api/packages
```

---

### `POST /api/packages/add` - Download and cache a package

Add a new package or a specific version to the cache using npm pack.

**Request:**

```json
{
  "package": "express", // Can be "name", "name@version", "@scope/name"
  "downloadDeps": false // Optional: download dependencies
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Package downloaded successfully",
  "package": {
    "name": "express",
    "version": "5.2.1",
    "size": 23150,
    "sizeLabel": "22.6 KB"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Cannot resolve package: invalid-pkg-xyz",
  "error": "Package not found in npm registry"
}
```

**Examples:**

```bash
# Latest version
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"lodash"}'

# Specific version
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"react@17.0.2"}'

# Scoped package
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"@babel/core"}'

# With dependencies
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"express","downloadDeps":true}'
```

---

### `POST /api/packages/install` - Install from cache

Install a package from the local cache to node_modules/.

**Request:**

```json
{
  "package": "express@5.2.1" // Must match cached version
}
```

**Response:**

```json
{
  "success": true,
  "message": "Package installed successfully",
  "installed": "express@5.2.1"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/packages/install \
  -H "Content-Type: application/json" \
  -d '{"package":"express@5.2.1"}'
```

---

### `DELETE /api/packages/:name/:version` - Remove from cache

Delete a specific package version from the cache.

**Parameters:**

- `name` - Package name (URL-encoded, e.g., `@babel%2Fcore`)
- `version` - Package version (e.g., `5.2.1`)

**Response:**

```json
{
  "success": true,
  "message": "Package removed successfully"
}
```

**Examples:**

```bash
# Remove lodash@4.17.23
curl -X DELETE http://localhost:3001/api/packages/lodash/4.17.23

# Remove scoped package @babel/core@7.20.5
curl -X DELETE 'http://localhost:3001/api/packages/%40babel%2Fcore/7.20.5'
```

---

### `POST /api/packages/search` - Search packages (optional)

Search npm registry for packages (requires internet).

**Request:**

```json
{
  "query": "react",
  "limit": 10
}
```

**Note:** Use this to find packages before adding them.

---

## Project Structure

```
server/
├── README.md
├── package.json
├── bin/
│   └── offline-npm.js               # CLI entry point
├── src/
│   ├── index.js                     # Express API server
│   ├── add.js                       # Download packages (npm pack)
│   ├── install.js                   # Install from cache
│   ├── list.js                      # List cached packages
│   ├── remove.js                    # Remove packages
│   ├── storage.js                   # Shared storage utilities
│   ├── parser.js                    # Package spec parsing
│   └── logger.js                    # CLI output formatting
└── test/
    └── test.js                      # Unit tests
```

---

## Code Architecture

### Shared Modules

**storage.js** - Filesystem operations

- `getStoragePath()` - Get cache directory (respects STORAGE_DIR env)
- `ensureStorage()` - Create cache directory if needed
- `readMeta()` - Read package metadata
- `writeMeta()` - Write package metadata

**parser.js** - Parse package specifications

- `parsePackage(spec)` - Extract name, version from "name@version"
- `getPackagePath(name, version)` - Get storage path for package
- `packageLabel(size)` - Format size with units (KB, MB)

**logger.js** - CLI output formatting

- `log()` - Print messages to console
- `success()` - Print success messages (green)
- `error()` - Print errors (red)
- `info()` - Print info (blue)
- `table()` - Display formatted table

### API Implementation (index.js)

Express server handling HTTP requests with proper error handling.

**Endpoints:**

- `GET /api/packages` - List all cached packages
- `GET /api/stats` - Return statistics
- `POST /api/packages/add` - Download package
- `POST /api/packages/install` - Install from cache
- `DELETE /api/packages/:name/:version` - Remove package

**Key Features:**

- Windows-compatible `spawn()` with `shell: true`
- Proper error handling for ENOENT errors
- Shared module imports (no code duplication)

### CLI Implementation (bin/offline-npm.js)

Commander.js-based CLI with subcommands.

**Commands:**

- `offline-npm add <package>` - Download package
- `offline-npm list` - Show cached packages
- `offline-npm install <package>` - Install from cache
- `offline-npm remove <package>` - Delete from cache

**Features:**

- Global options: `--storage <path>`
- Per-command options: `--deps`, `--save`, `--save-dev`
- User-friendly output with colors and tables

---

## Example Workflow

```bash
# ── Step 1: While online - Download WITH dependencies ──────────────
offline-npm add express@4.18.2 --deps      # IMPORTANT: download + all deps
offline-npm add lodash@4.17.21              # (no deps needed for lodash)
offline-npm add typescript@5.3.2
offline-npm list                            # Verify all cached

# ── Step 2: Go offline ────────────────────────────────────────────
# Disconnect from internet, board a plane, enter a data center...
# All package dependencies are already cached, so install will work

# ── Step 3: Install from cache (works offline!) ───────────────────
mkdir my-project && cd my-project
npm init -y

# Use CLI to install from cache
offline-npm install express@4.18.2 --save
offline-npm install lodash@4.17.21 --save
offline-npm install typescript@5.3.2 --save-dev
```

**Key Points:**

- Use `--deps` flag when adding packages that have dependencies
- Without `--deps`, you'll only cache that single package
- `install` requires all dependencies to be cached (use `--deps` on `add`)
- Once dependencies are cached, `install` works completely offline

---

## Options Reference

| Flag            | Description                                             |
| --------------- | ------------------------------------------------------- |
| `--deps, -d`    | (add only) recursively download all dependencies        |
| `--storage, -s` | override default `~/.offline-npm-cache`                 |
| `--save`        | (install only) add to `dependencies` in package.json    |
| `--save-dev`    | (install only) add to `devDependencies` in package.json |

---

## Testing

```bash
# Run test suite
npm test

# or
node src/test/test.js
```

Tests validate:

- Package specification parsing
- Storage path resolution
- Error handling for invalid packages

**Note:** Tests require no network access - use local fixtures.

---

## How It Works

| Operation        | Mechanism                                                               |
| ---------------- | ----------------------------------------------------------------------- |
| **Add Package**  | `npm pack name@version --pack-destination dir` → saves .tgz + meta.json |
| **Install**      | `npm install /path/to/package.tgz` → extracts to node_modules/          |
| **List**         | Walk storage directory → read meta.json → format output                 |
| **Remove**       | Delete .tgz and meta.json files from storage                            |
| **Dependencies** | Recursive `offline-npm add` for each dependency (if --deps)             |

---

## Requirements

- **Node.js** ≥ 16
- **npm** 8+ (must be in PATH)
- Internet for `add` command only; `install`/`list`/`remove` work offline

---

## Advanced Usage

### Custom Storage Location

```bash
# Store packages on external USB drive
STORAGE_DIR=/Volumes/external-drive/npm-packages offline-npm list

# Or use --storage flag
offline-npm add react --storage /mnt/usb/cache
offline-npm list -s /mnt/usb/cache
```

### Offline Installation Without CLI

If you prefer not to install the CLI globally, you can still use the API server for package management:

```bash
# Start API server
npm start

# Use curl or your app to call /api/packages/add, etc.
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"react"}'
```

---

## Troubleshooting

### "npm: command not found"

**Problem:** npm is not in your PATH

**Solutions:**

1. Verify npm is installed: `npm --version`
2. Add Node.js bin to PATH (check installation)
3. Restart terminal after npm installation

---

### "Cannot resolve package: xyz"

**Problem:** Package doesn't exist or npm registry unreachable

**Solutions:**

1. Check package name spelling
2. Test with known package: `offline-npm add lodash`
3. Verify internet connection
4. Check npm registry: `npm search lodash`

---

### "ENOENT: no such file or directory"

**Problem:** Storage directory doesn't exist or cache corrupted

**Solutions:**

1. Create storage dir: `mkdir -p ~/.offline-npm-cache`
2. Check permissions: `ls -la ~/.offline-npm-cache/`
3. Verify STORAGE_DIR env variable
4. Delete and recreate: `rm -rf ~/.offline-npm-cache`

---

### Package installs but can't be required

**Problem:** Dependencies missing or incorrect version

**Solutions:**

1. Re-download with `--deps`: `offline-npm add react --deps`
2. Install missing deps separately
3. Use specific version that was cached

---

## License

MIT

---

## More Information

- [Main README](../README.md) - Project overview and architecture
- [Client README](../client/README.md) - UI documentation
