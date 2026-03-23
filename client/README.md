# 📦 Offline NPM Dashboard

A terminal-aesthetic React dashboard for managing your offline npm package cache.

---

## Folder Structure

```
offline-npm-dashboard/
├── package.json                    ← root scripts (concurrently)
│
├── server/
│   ├── package.json
│   └── index.js                    ← Express API (port 3001)
│
└── client/
    ├── package.json
    ├── vite.config.js              ← dev proxy → :3001
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← root layout, routing state
        ├── index.css               ← Tailwind + custom design tokens
        ├── lib/
        │   └── api.js              ← fetch wrapper for all API calls
        ├── hooks/
        │   └── usePackages.js      ← data fetching + mutations hook
        └── components/
            ├── StatsBar.jsx        ← 4-stat summary row
            ├── PackageCard.jsx     ← per-package card with actions
            ├── AddPackageModal.jsx ← download modal with toggle
            ├── SearchBar.jsx       ← live filter input
            └── EmptyState.jsx      ← zero-results / no-cache screens
```

---

## Setup

### 1. Install dependencies

```bash
# From project root
cd server && npm install
cd ../client && npm install
```

### 2. Run both servers

```bash
# Terminal 1 — API server (port 3001)
cd server && node index.js

# Terminal 2 — Vite dev server (port 5173)
cd client && npm run dev
```

Or, from the root with concurrently:

```bash
npm install          # installs concurrently
npm run dev          # starts both together
```

### 3. Open the dashboard

```
http://localhost:5173
```

---

## API Reference

| Method   | Endpoint                       | Description                   |
| -------- | ------------------------------ | ----------------------------- |
| `GET`    | `/api/packages`                | List all cached packages      |
| `GET`    | `/api/stats`                   | Summary stats (count, size)   |
| `POST`   | `/api/packages/add`            | Download package via npm pack |
| `POST`   | `/api/packages/install`        | Install from local cache      |
| `DELETE` | `/api/packages/:name/:version` | Remove from cache             |

### POST `/api/packages/add`

```json
{ "package": "express@4.18.2", "deps": false }
```

### POST `/api/packages/install`

```json
{ "package": "express@4.18.2" }
```

---

## Environment Variables

| Variable      | Default                | Description             |
| ------------- | ---------------------- | ----------------------- |
| `PORT`        | `3001`                 | API server port         |
| `STORAGE_DIR` | `~/.offline-npm-cache` | Package cache directory |

```bash
# Custom storage dir example
STORAGE_DIR=/mnt/usb/npm-cache node server/index.js
```

---

## UI Features

- **Stats bar** — cached versions, unique packages, total disk size
- **Package grid** — cards with version badge, size, relative timestamp
- **Add modal** — package name input + optional deps toggle
- **Install** — one-click install from `.tgz` with inline feedback
- **Delete** — two-step confirm (click once → "Confirm?" → click again)
- **Search** — live filter by name or version
- **Sort** — by date added, name (A–Z), or file size
- **Skeleton loading** — shimmer placeholders on first load
- **Error banner** — clear message if API server isn't running

---

## Design System

Dark terminal aesthetic inspired by GitHub's dark theme — ink palette, JetBrains Mono for code, Syne for headings, DM Sans for body copy. Acid green accents for success/primary actions, amber for warnings, sky blue for info.

---

## Requirements

- Node.js ≥ 16
- npm in PATH (used for `npm pack` and `npm install`)
- Internet for the **Add** command; everything else works offline
