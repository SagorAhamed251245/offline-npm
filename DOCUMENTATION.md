# 📚 Offline NPM Documentation Guide

Complete documentation for the Offline NPM Dashboard system.

---

## 📖 Documentation Files

### [README.md](README.md) - **Start Here**

Main project overview with:

- Project features and benefits
- System architecture diagram
- Quick start guide
- Storage structure explanation
- Configuration options
- Troubleshooting examples

**Read this first for project overview.**

---

### [server/README.md](server/README.md) - **Backend & CLI**

Complete CLI tool and REST API documentation:

- CLI setup and usage (add, list, install, remove)
- REST API endpoint reference with examples
- Project code architecture
- Storage structure details
- Environment variables
- Troubleshooting guide

**Use this for CLI commands and API integration.**

---

### [client/README.md](client/README.md) - **Web UI & Components**

React dashboard documentation:

- Component structure and usage
- Features walkthrough
- Custom hooks (usePackages)
- API integration guide
- Styling system (TailwindCSS)
- Development workflow
- Browser support

**Use this for UI development and customization.**

---

## 🚀 Quick Reference

### Start Development

```bash
# Install all dependencies
npm run install:all

# Start both server and UI
npm run dev
```

Access at:

- **API**: http://localhost:3001
- **UI**: http://localhost:5174

---

### CLI Quick Commands

```bash
# Download a package
node server/bin/offline-npm.js add express

# List cached packages
node server/bin/offline-npm.js list

# Install from cache
node server/bin/offline-npm.js install express

# Remove from cache
node server/bin/offline-npm.js remove express
```

---

### API Quick Requests

```bash
# List all packages
curl http://localhost:3001/api/packages

# Add a package
curl -X POST http://localhost:3001/api/packages/add \
  -H "Content-Type: application/json" \
  -d '{"package":"lodash"}'

# Remove a package
curl -X DELETE http://localhost:3001/api/packages/lodash/4.17.23
```

---

## 📂 Documentation Structure

```
offline-npm-dashboard/
├── README.md                          ← Project overview
├── DOCUMENTATION.md                   ← This file
├── server/
│   └── README.md                      ← CLI & API docs
└── client/
    └── README.md                      ← UI & components docs
```

---

## 🎯 Finding What You Need

**I want to...**

- **Add a package offline** → [server/README.md](server/README.md#cli-commands)
- **Use REST API endpoints** → [server/README.md](server/README.md#rest-api-reference)
- **Modify UI components** → [client/README.md](client/README.md#components)
- **Understand the architecture** → [README.md](README.md#system-architecture)
- **Develop a feature** → [client/README.md](client/README.md#development-workflow)
- **Troubleshoot issues** → [README.md](README.md#troubleshooting) or [server/README.md](server/README.md#troubleshooting)
- **Configure storage** → [server/README.md](server/README.md#environment-variables)
- **Custom styling** → [client/README.md](client/README.md#styling--design)

---

## 🔑 Key Concepts

### Three-Layer System

1. **CLI** (`server/bin/offline-npm.js`) - Terminal tool
2. **API** (`server/src/index.js`) - REST endpoints
3. **UI** (`client/src/App.jsx`) - React dashboard

All three share the same **storage** and **core modules**.

### Shared Storage

```
~/.offline-npm-cache/
├── package-name/
│   └── version/
│       ├── package-name-version.tgz
│       └── meta.json
```

Accessible from CLI, API, and UI simultaneously.

### Core Modules

- **storage.js** - File operations and caching
- **parser.js** - Package spec parsing
- **logger.js** - Formatted output
- **add.js** - Download packages
- **install.js** - Install from cache
- **list.js** - List packages
- **remove.js** - Delete packages

---

## 💡 Usage Patterns

### Pattern 1: Online → Cache → Offline Install

```bash
# While online
offline-npm add react --deps     # Cache dependencies
offline-npm add lodash
offline-npm list                 # Verify cache

# Go offline (no internet needed)
offline-npm install react --save
offline-npm install lodash --save
```

### Pattern 2: API Server → Web UI

```bash
# Server handles all operations
npm start

# UI calls REST endpoints
# Add button on UI → POST /api/packages/add
# Delete button on UI → DELETE /api/packages/:name/:version
```

### Pattern 3: Programmatic Integration

```javascript
// From any Node.js app
const response = await fetch("http://localhost:3001/api/packages/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ package: "axios" }),
});
```

---

## 📊 System Components

| Component | Purpose                         | Documentation                        |
| --------- | ------------------------------- | ------------------------------------ |
| CLI Tool  | Command-line package management | [server/README.md](server/README.md) |
| REST API  | HTTP endpoints for operations   | [server/README.md](server/README.md) |
| React UI  | Visual dashboard interface      | [client/README.md](client/README.md) |
| Storage   | File-based package cache        | [README.md](README.md)               |

---

## 🛠️ Development

### Adding a New CLI Command

1. Edit `server/src/your-command.js`
2. Export function that implements logic
3. Edit `server/bin/offline-npm.js` to register command

### Adding a New API Endpoint

1. Edit `server/src/index.js`
2. Add Express route handler
3. Handle errors and return JSON response

### Adding a New UI Component

1. Create `client/src/components/YourComponent.jsx`
2. Export React component
3. Import in `App.jsx` or other components

---

## ✅ Requirements

- Node.js 16+
- npm 8+
- Each component properly documented in its README

---

## 📞 Support

For detailed information:

- **Project Overview** → [README.md](README.md)
- **Backend Issues** → [server/README.md](server/README.md#troubleshooting)
- **UI Issues** → [client/README.md](client/README.md#troubleshooting)

---

## 📝 License

MIT

---

**Last Updated**: Documentation system established with three integrated READMEs covering CLI, API, UI, and shared architecture.
