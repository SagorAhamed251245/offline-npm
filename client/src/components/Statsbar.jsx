import React from "react";
import { Package, HardDrive, Layers, FolderOpen } from "lucide-react";

function Stat({ icon, label, value, accent }) {
  return (
    <div className="card px-5 py-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
      >
        {icon && <icon size={18} />}
      </div>
      <div>
        <p className="text-xs text-ink-400 font-body uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl font-display font-bold text-ink-50 leading-tight">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export function StatsBar({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card px-5 py-4 h-20 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
      <Stat
        icon={Package}
        label="Cached Versions"
        value={stats?.total}
        accent="bg-sky-500/15 text-sky-400"
      />
      <Stat
        icon={Layers}
        label="Unique Packages"
        value={stats?.uniquePackages}
        accent="bg-acid-500/15 text-acid-400"
      />
      <Stat
        icon={HardDrive}
        label="Total Size"
        value={stats?.totalSizeLabel}
        accent="bg-amber-500/15 text-amber-400"
      />
      <Stat
        icon={FolderOpen}
        label="Cache Dir"
        value="~/.offline-npm-cache"
        accent="bg-rose-500/15 text-rose-400"
      />
    </div>
  );
}
