# 📦 Offline NPM Manager - CLI Tool

A command-line tool for downloading npm packages when online and installing them offline later.

---

## Features

**✅ Add Packages** - Download packages and dependencies for offline use

**✅ Install Packages** - Install from local cache without internet

**✅ List Packages** - View all cached packages

**✅ Remove Packages** - Clean up cached packages

**✅ Dependency Management** - Automatically cache package dependencies

**✅ Smart Caching** - Detect already-cached packages

**✅ Scoped Packages** - Full support for `@scope/package` naming

**✅ Cross-Platform** - Works on Windows, macOS, and Linux

**✅ Version Control** - Store and manage multiple versions

**✅ Real-time Feedback** - Progress indicators and error messages

---

## Installation

### Prerequisites

- **Node.js** 16 or higher
- **npm** 8 or higher

### Install Globally

```bash
npm install -g offline-npm-manager
```

This installs the `offline-npm` command globally.

### Offline Installation

```bash
npm install -g offline-npm-manager --offline
```

---

## Usage

### Add a Package

Download and store a package locally (requires internet):

```bash
offline-npm add <package>
```

Examples:

```bash
offline-npm add axios
offline-npm add react --deps
offline-npm add react@17.0.2
offline-npm add @babel/core
```

**Options:**

- `-d, --deps` → Download all dependencies recursively
- `-s, --storage <path>` → Custom storage directory

---

### Install a Package

Install from local cache (works offline):

```bash
offline-npm install <package>
```

Examples:

```bash
offline-npm install axios --save
offline-npm install lodash --save-dev
offline-npm install react@17.0.2
```

**Options:**

- `--save` → Add to dependencies
- `--save-dev` → Add to devDependencies
- `-s, --storage <path>` → Custom storage

---

### List Cached Packages

```bash
offline-npm list
offline-npm ls
```

Example output:

```
📦  offline-npm list

Storage: ~/.offline-npm-cache

┌──────────┬─────────┬──────────┬───────────────────────┬─────────┐
│ Package  │ Version │ Size     │ Downloaded            │ Status  │
├──────────┼─────────┼──────────┼───────────────────────┼─────────┤
│ lodash   │ 4.17.23 │ 307.5 KB │ 3/24/2026, 9:48 AM    │ ✔ ready │
│ express  │ 5.2.1   │ 22.6 KB  │ 3/24/2026, 10:15 AM   │ ✔ ready │
└──────────┴─────────┴──────────┴───────────────────────┴─────────┘
```

---

### Remove a Package

```bash
offline-npm remove <package>
```

Example:

```bash
offline-npm remove lodash
```

---

## Storage

Default locations:

- **Windows** → `%USERPROFILE%\.offline-npm-cache`
- **macOS/Linux** → `~/.offline-npm-cache`

Override storage:

```bash
offline-npm add react --storage /custom/path
```

---

## Storage Structure

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
        └── 7.20.5/
            ├── core-7.20.5.tgz
            └── meta.json
```

---

## meta.json Example

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

## Uninstall

```bash
npm uninstall -g offline-npm-manager
```

This removes the CLI.

(Optional: manually delete cache if needed)

```bash
rm -rf ~/.offline-npm-cache
```

---

## Example Workflow

```bash
# Step 1: Online
offline-npm add express@4.18.2 --deps
offline-npm add lodash
offline-npm list

# Step 2: Go Offline

# Step 3: Install
mkdir my-project && cd my-project
npm init -y

offline-npm install express@4.18.2 --save
offline-npm install lodash --save
```

---

## How It Works

| Operation    | Description                        |
| ------------ | ---------------------------------- |
| Add Package  | Uses `npm pack` to download `.tgz` |
| Install      | Installs from local `.tgz`         |
| List         | Reads cached metadata              |
| Remove       | Deletes cached files               |
| Dependencies | Recursively cached with `--deps`   |

---

## Requirements

- Node.js ≥ 16
- npm ≥ 8

---

## Troubleshooting

### npm not found

```bash
npm --version
```

Install Node.js or fix PATH.

---

### Package not found

```bash
offline-npm add lodash
```

Check spelling or internet connection.

---

### Missing dependencies

```bash
offline-npm add express --deps
```

---

## License

MIT
