import React from "react";
import { PackageOpen, Search } from "lucide-react";

export function EmptyState({ query, onAdd }) {
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search size={40} className="text-ink-700 mb-4" />
        <p className="text-ink-400 font-body text-sm">
          No packages match{" "}
          <span className="text-ink-200 font-mono">"{query}"</span>
        </p>
        <p className="text-ink-600 text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center mb-5">
        <PackageOpen size={28} className="text-ink-500" />
      </div>
      <h3 className="text-ink-200 font-display font-bold text-lg mb-1">
        No packages cached yet
      </h3>
      <p className="text-ink-500 text-sm font-body max-w-xs mb-6">
        Add a package while online to store it locally for offline installation.
      </p>
      <button onClick={onAdd} className="btn-primary">
        Add your first package
      </button>
    </div>
  );
}
