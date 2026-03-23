import React from "react";
import { Search, X } from "lucide-react";

export function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
      />
      <input
        className="input pl-9 pr-9"
        placeholder="Search packages…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
