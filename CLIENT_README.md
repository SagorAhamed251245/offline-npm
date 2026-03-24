# 📦 Offline NPM Dashboard - UI

Modern React web dashboard for managing offline npm packages with visual package management, search, filtering, and real-time statistics.

---

## Features

✅ **Beautiful UI** - Terminal-aesthetic dark theme with custom design tokens  
✅ **Real-time Stats** - Total packages, unique count, total cache size  
✅ **Search & Filter** - Live search by package name or version  
✅ **Sorting** - Sort by date, name, or size  
✅ **Add Packages** - Modal dialog to download packages from npm  
✅ **Visual Cards** - Clean package cards with actions  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Error Handling** - User-friendly error messages and notifications

---

## Technology Stack

- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client (via fetch wrapper)
- **ESLint** - Code linting

---

## Installation

### Prerequisites

- **Node.js** 16 or higher
- **npm** 8 or higher

### Setup

```bash
# From the project root
npm run install:all

# Or just the client
cd client
npm install
```

---

## Development

### Start Development Server

```bash
# From project root (starts both server and client)
npm run dev

# Or just the UI
cd client
npm run dev
```

This starts:

- **API Server**: http://localhost:3001 (auto-proxied by Vite)
- **React UI**: http://localhost:5173

### Build for Production

```bash
cd client
npm run build
```

Output: `client/dist/`

### Preview Production Build

```bash
cd client
npm run preview
```

### Lint Code

```bash
cd client
npm run lint
```

---

## Components

### `App.jsx` - Main Container

Root component managing layout, state, and routing.

**Responsibilities:**

- Layout container with header and main content area
- State management via `usePackages()` hook
- Loading and error states
- Modal visibility control

**Key Sections:**

- Header with logo and controls
- Stats bar showing cache statistics
- Package grid with search and sorting
- Add package modal dialog

---

### `StatsBar.jsx` - Statistics Display

Shows cache overview with 4 key metrics.

**Displays:**

- Total package versions cached
- Unique package count
- Total cache size (formatted)
- Storage directory path

**Props:**

```jsx
<StatsBar stats={statsData} loading={isLoading} />
```

---

### `PackageCard.jsx` - Package Item

Individual package display with actions.

**Features:**

- Package name and version
- Download size (with loading indicator)
- Download date (formatted)
- Package status badge
- Action buttons (install, delete)
- Loading states during operations

**Props:**

```jsx
<PackageCard
  package={packageData}
  onInstall={(pkg) => {}}
  onDelete={(name, version) => {}}
  loading={isLoading}
/>
```

---

### `AddPackageModal.jsx` - Download Modal

Modal dialog for adding new packages.

**Features:**

- Package name input (with suggestions)
- Toggle for recursive dependency download
- Error messages for resolution failures
- Loading state during download
- Cancel/Download buttons

**Props:**

```jsx
<AddPackageModal
  isOpen={showModal}
  onClose={() => {}}
  onAdd={async (pkg, deps) => {}}
  loading={isLoading}
/>
```

---

### `SearchBar.jsx` - Search & Filter

Input for live filtering packages.

**Features:**

- Real-time search as you type
- Sort options (date, name, size)
- Clear button

**Props:**

```jsx
<SearchBar
  query={searchQuery}
  onQueryChange={(query) => {}}
  sortBy={sortMethod}
  onSortChange={(sort) => {}}
/>
```

---

### `EmptyState.jsx` - No Results

Placeholder when no packages are cached.

**Shows:**

- Icon and message
- Instructions to add first package
- Link to add package modal

---

## Hooks

### `usePackages()`

Custom React hook for package management.

```javascript
const {
  packages, // Array of package objects
  stats, // Stats object { total, uniquePackages, totalSize }
  loading, // Boolean - initial data loading
  error, // String - error message if any
  refresh, // Function - refetch package list
  addPackage, // Function - download new package
  installPackage, // Function - install from cache
  deletePackage, // Function - remove from cache
} = usePackages();
```

**Usage:**

```jsx
const { packages, loading, error, addPackage } = usePackages();

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return (
  <div>
    {packages.map((pkg) => (
      <PackageCard key={pkg.id} package={pkg} />
    ))}
  </div>
);
```

---

## API Integration

### HTTP Client (`lib/api.jsx`)

Fetch wrapper with error handling and baseURL configuration.

**Available Methods:**

```javascript
// Get all packages
await api.getPackages();

// Get statistics
await api.getStats();

// Add/download a package
await api.addPackage(packageName, downloadDeps);

// Install from cache
await api.installPackage(packageName);

// Delete from cache
await api.deletePackage(name, version);
```

**Configuration:**

- Base URL: `http://localhost:3001/api`
- Timeout: Standard fetch defaults
- Error handling: Returns error messages on failure

---

## Styling & Design

### TailwindCSS Configuration

Located in `tailwind.config.js`

**Custom Design Tokens:**

- Color palette: Dark theme with acid/neon accents
- Typography: Terminal-like font stack
- Spacing: Consistent rhythm-based spacing
- Animations: Smooth transitions and skeleton loaders

### CSS Conventions

- Utility-first approach with TailwindCSS
- Component-scoped styles where needed
- Custom CSS in `index.css`:
  - Global styles
  - Custom animations (skeleton loader)
  - Design system overrides

---

## Features Walkthrough

### Add a Package

1. Click the **Add Package** button in the header
2. Enter package name (e.g., `react`, `@babel/core`)
3. (Optional) Toggle **Download dependencies** for full tree
4. Click **Download**
5. Wait for download to complete
6. Package appears in the grid

### Search Packages

1. Type in the **Search bar** at the top
2. Results filter in real-time by name or version
3. Click **Clear** icon to reset

### Sort Packages

Use the **Sort dropdown** to order by:

- **Date** (newest first) - default
- **Name** (alphabetical)
- **Size** (largest first)

### Install Package

1. Click **Install** button on a package card
2. Package installs to local `node_modules/`
3. Status updates to show success

### Delete Package

1. Click **Delete** (trash icon) on a package card
2. Confirm removal
3. Package removed from cache

---

## Performance Optimization

1. **Lazy Loading** - Package list loads on demand
2. **Search Debouncing** - Prevents excessive filtering
3. **Memoization** - Components prevent unnecessary re-renders
4. **Image Lazy Loading** - Deferred loading for icons
5. **CSS Optimization** - PurgeCSS removes unused styles on build

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: Full support (tested on iOS Safari, Android Chrome)

---

## Configuration

### Environment Variables

Create `.env.local` in `client/` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

Default: `http://localhost:3001/api`

### Vite Config

See `vite.config.js` for:

- React plugin configuration
- Development server proxy settings
- Build output configuration

---

## Troubleshooting

### UI doesn't load

**Problem**: Page shows blank or error in console

**Solutions**:

1. Check API server is running: `npm run server`
2. Check port 3001 is not in use
3. Clear browser cache
4. Open DevTools and check console for CORS errors

```bash
# Verify API is running
curl http://localhost:3001/api/packages
```

### Search not working

**Problem**: Search bar doesn't filter results

**Solutions**:

1. Check package names match search term
2. Clear search and try again
3. Refresh page

### Add package fails

**Problem**: "Cannot resolve package" error

**Solutions**:

1. Check internet connection
2. Verify package name (e.g., check `npm search`)
3. Check API server logs for errors
4. Try a well-known package like `lodash` first

### Styling looks broken

**Problem**: Components not styled correctly

**Solutions**:

1. Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Rebuild CSS: `npm run dev`
3. Check TailwindCSS is compiled: `dist/style.css` should exist after build

---

## Development Workflow

### Creating a New Component

1. Create file in `src/components/`
2. Write React component with JSX
3. Style with TailwindCSS classes
4. Export from component file
5. Import and use in App.jsx

### Adding an API Call

1. Add method to `lib/api.jsx`
2. Use in custom hook or component
3. Handle loading and error states
4. Display results to user

### Testing Styles

```bash
# Start dev server with Vite HMR
npm run dev

# Edit component or CSS file
# Changes appear instantly in browser
```

---

## Project Structure

```
client/
├── README.md
├── package.json
├── vite.config.js              # Vite build config
├── tailwind.config.js          # TailwindCSS theme
├── postcss.config.js           # PostCSS plugins
├── index.html                  # Entry HTML
├── public/                     # Static assets
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # Root component
    ├── index.css              # Global styles
    ├── lib/
    │   └── api.jsx           # HTTP client
    ├── hooks/
    │   └── usePackages.jsx   # Package management hook
    └── components/
        ├── App.jsx
        ├── AddPackageModal.jsx
        ├── EmptyState.jsx
        ├── PackageCard.jsx
        ├── SearchBar.jsx
        └── StatsBar.jsx
```

---

## License

MIT

---

## More Information

- [Main README](README.md) - Project overview
- [Server README](server/README.md) - CLI & API documentation
