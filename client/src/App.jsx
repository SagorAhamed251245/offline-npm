import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Terminal,
} from "lucide-react";

import { usePackages } from "./hooks/usePackages";
import { StatsBar } from "./components/StatsBar";
import { PackageCard } from "./components/PackageCard";
import { AddPackageModal } from "./components/AddPackageModal";
import { SearchBar } from "./components/SearchBar";
import { EmptyState } from "./components/EmptyState";

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="card h-40 skeleton"
          style={{ animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const {
    packages,
    stats,
    loading,
    error,
    refresh,
    addPackage,
    installPackage,
    deletePackage,
  } = usePackages();
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("date"); // date | name | size

  const filtered = useMemo(() => {
    let list = [...packages];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.version.includes(q),
      );
    }
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "size") list.sort((a, b) => b.size - a.size);
    // date sort is default (server already sorts by date)
    return list;
  }, [packages, query, sortBy]);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-acid-500 flex items-center justify-center">
              <Package size={14} className="text-ink-950" />
            </div>
            <span className="font-display font-bold text-ink-50 text-base tracking-tight">
              offline<span className="text-acid-400">·npm</span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-ghost px-2.5 py-2"
              title="Refresh"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin-slow" : ""}
              />
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={15} />
              <span className="hidden sm:inline">Add Package</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <StatsBar stats={stats} loading={loading} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1 bg-ink-800 border border-ink-700 rounded-lg p-1">
            {[
              ["date", "Recent"],
              ["name", "A–Z"],
              ["size", "Size"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all
                  ${sortBy === val ? "bg-ink-600 text-ink-100" : "text-ink-400 hover:text-ink-200"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Package count */}
          {!loading && (
            <span className="text-xs text-ink-500 font-mono whitespace-nowrap hidden sm:block">
              {filtered.length} / {packages.length}
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="card border-rose-500/30 bg-rose-500/5 p-4 flex items-start gap-3 text-rose-300">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-medium">
                Could not connect to the API server
              </p>
              <p className="text-xs text-rose-400/70 mt-0.5 font-mono">
                {error}
              </p>
              <p className="text-xs text-rose-400/60 mt-1">
                Make sure the backend is running:{" "}
                <code className="font-mono">cd server && node index.js</code>
              </p>
            </div>
          </div>
        )}

        {/* Package grid */}
        {loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState query={query} onAdd={() => setShowAdd(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onInstall={installPackage}
                onDelete={deletePackage}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-ink-800 pt-6 flex items-center justify-between text-xs text-ink-600 font-mono">
          <div className="flex items-center gap-1.5">
            <Terminal size={11} />
            offline-npm-manager v1.0.0
          </div>
          <div className="flex items-center gap-1.5">
            <WifiOff size={11} />
            install mode works offline
          </div>
        </footer>
      </main>

      {/* Modal */}
      {showAdd && (
        <AddPackageModal onAdd={addPackage} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
