# 📦 Offline NPM Dashboard

> Download npm packages when connected to the internet. Install them later — even without internet.

A complete system for managing offline npm packages with both a **command-line interface (CLI)** and a **modern React dashboard UI**.

---

## Features

✅ **Download packages online** - Cache packages with full dependency trees  
✅ **Install offline** - Use cached packages in air-gapped environments  
✅ **CLI tool** - `offline-npm add`, `install`, `list`, `remove` commands  
✅ **REST API** - Manage packages programmatically  
✅ **Web Dashboard** - Beautiful React UI for visual package management  
✅ **Scoped packages** - Support for `@scope/package` naming  
✅ **Version control** - Store multiple versions of the same package  
✅ **Metadata tracking** - Download dates, sizes, and dependency info

---

## Quick Start

### Prerequisites

- **Node.js** 16 or higher
- **npm** 8 or higher

### Installation

```bash
# Clone the repository
git clone <repo>
cd offline-npm-dashboard

# Install all dependencies
npm run install:all
```

### Start Everything

```bash
# Start both server (API) and client (UI) concurrently
npm run dev
```

This will start:

- **API Server**: http://localhost:3001
- **React UI**: http://localhost:5174

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│          React Dashboard (Port 5174)                │
│      Beautiful UI for package management           │
│  - Add/Remove packages                             │
│  - Search & Filter                                 │
│  - Real-time stats                                 │
└──────────────────┬──────────────────────────────────┘
                   │
             HTTP API Calls
                   │
┌──────────────────▼──────────────────────────────────┐
│         Express API (Port 3001)                     │
│  REST endpoints for package operations             │
│  - GET /api/packages                               │
│  - POST /api/packages/add                          │
│  - POST /api/packages/install                      │
│  - DELETE /api/packages/:name/:version             │
└──────────────────┬──────────────────────────────────┘
                   │
              npm pack/install
                   │
┌──────────────────▼──────────────────────────────────┐
│     Shared Core Modules                            │
│  - add.js (download packages)                      │
│  - install.js (install from cache)                 │
│  - list.js (list cached packages)                  │
│  - storage.js (filesystem operations)              │
│  - parser.js (parse package specs)                 │
└──────────────────┬──────────────────────────────────┘
                   │
         ~/.offline-npm-cache/
          (Local Package Cache)
```

---

## Components

### 1. **CLI Tool** (`server/bin/offline-npm.js`)

Command-line interface for package management.

```bash
offline-npm add <package>           # Download a package
offline-npm add react-bootstrap     # With version
offline-npm add @babel/core@^7.20   # Scoped packages

offline-npm list                    # Show all cached packages
offline-npm ls                      # Alias

offline-npm install <package>       # Install from cache
offline-npm install react           # Install latest
offline-npm install react@17.0.2    # Install specific version

offline-npm remove <package>        # Remove from cache
offline-npm rm lodash               # Alias
```

**See [server/README.md](server/README.md) for detailed CLI usage.**

### 2. **REST API** (`server/src/index.js`)

Express server providing HTTP endpoints for programmatic access.

**Endpoints:**

- `GET /api/packages` - List all cached packages
- `GET /api/stats` - Cache statistics (total size, count)
- `POST /api/packages/add` - Download a package
- `POST /api/packages/install` - Install from cache
- `DELETE /api/packages/:name/:version` - Remove package

**See [server/README.md](server/README.md) for API documentation.**

### 3. **React Dashboard** (`client/`)

Modern web UI built with React, Vite, and TailwindCSS.

Features:

- 📊 Real-time package statistics
- 🔍 Search and filter packages
- ➕ Add packages with modal dialog
- 🗑️ Delete packages
- ⬇️ Download and install operations
- 📱 Responsive design

**See [client/README.md](client/README.md) for UI usage.**

---

## Storage Structure

Packages are stored in `~/.offline-npm-cache/` (macOS/Linux) or `C:\Users\<User>\.offline-npm-cache\` (Windows):

```
~/.offline-npm-cache/
├── lodash/
│   └── 4.17.23/
│       ├── lodash-4.17.23.tgz
│       └── meta.json
├── express/
│   └── 5.2.1/
│       ├── express-5.2.1.tgz
│       └── meta.json
└── @babel/
    └── core/
        ├── 7.20.5/
        │   ├── babel-core-7.20.5.tgz
        │   └── meta.json
```

Each package version includes:

- **.tgz** - Compressed npm tarball
- **meta.json** - Metadata (name, version, size, download date)

---

## Configuration

### Custom Storage Directory

Set a custom storage location via environment variable:

```bash
# macOS/Linux
export STORAGE_DIR=/mnt/offline-packages
npm run dev

# Windows
set STORAGE_DIR=D:\packages
npm run dev
```

### Custom Port

```bash
# Change API port
export PORT=4000
npm run server

# UI port is configured in client/vite.config.js
```

---

## Usage Examples

### Example 1: Cache packages for offline use

```bash
# Online machine - download React ecosystem
npm run server &
npm run client  # Open http://localhost:5174

# Use the dashboard to add:
# - react
# - react-dom
# - react-router
# - axios
```

### Example 2: Install from offline cache

```bash
# Offline machine (with cached packages)
offline-npm install react
offline-npm install react-dom@18.2.0
```

### Example 3: Use API programmatically

```bash
# Add a package
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"lodash"}'

# List packages
curl http://localhost:3001/api/packages

# Get stats
curl http://localhost:3001/api/stats

# Delete a package
curl -X DELETE http://localhost:3001/api/packages/lodash/4.17.23
```

---

## Development

### Project Structure

```
offline-npm-dashboard/
├── README.md                    ← This file
├── package.json                 ← Root scripts
│
├── server/
│   ├── README.md                ← CLI & API docs
│   ├── package.json
│   ├── bin/
│   │   └── offline-npm.js       ← CLI entry point
│   └── src/
│       ├── index.js             ← Express API server
│       ├── add.js               ← Download logic
│       ├── install.js           ← Installation logic
│       ├── list.js              ← List packages
│       ├── remove.js            ← Remove logic
│       ├── storage.js           ← Filesystem ops
│       ├── parser.js            ← Parse package specs
│       ├── logger.js            ← CLI formatting
│       └── test/test.js         ← CLI tests
│
└── client/
    ├── README.md                ← UI docs
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx              ← Main component
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── PackageCard.jsx
        │   ├── SearchBar.jsx
        │   ├── StatsBar.jsx
        │   ├── AddPackageModal.jsx
        │   └── EmptyState.jsx
        ├── hooks/
        │   └── usePackages.jsx  ← API integration
        └── lib/
            └── api.jsx          ← HTTP client
```

### Scripts

```bash
# Root level
npm run install:all     # Install server + client dependencies
npm run dev            # Start server + client (concurrently)
npm run server         # Start API server only
npm run client         # Start UI only (dev mode)
npm run build          # Build client for production

# Server
cd server
npm start              # Start API server
npm test              # Run CLI tests

# Client
cd client
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # ESLint check
```

---

## Troubleshooting

### Issue: "Cannot resolve package" error in UI

**Cause**: API cannot reach npm registry (offline or network issue)

**Solution**:

```bash
# Check internet connection
npm view lodash version

# Restart API with verbose logging
npm run server
```

### Issue: Storage directory not found

**Cause**: Permissions or path issues

**Solution**:

```bash
# Manually set storage directory
export STORAGE_DIR=/var/offline-packages
npm run dev

# Check permissions
ls -la ~/.offline-npm-cache
```

### Issue: Port already in use

**Cause**: Another process using port 3001 or 5174

**Solution**:

```bash
# Find and kill the process
lsof -i :3001  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess  # Windows

# Or use different ports
PORT=4000 npm run server
```

---

## Performance Tips

1. **Cache popular packages** - jQuery, React, Vue, Express, etc.
2. **Download dependencies** - Use `offline-npm add pkg --deps` to get the full tree
3. **Separate environments** - Use different storage directories for different projects
4. **Regular cleanup** - Remove unused packages to save space

---

## License

MIT

---

## Support

For issues or feature requests, please check:

- [server/README.md](server/README.md) - CLI & API details
- [client/README.md](client/README.md) - UI documentation
