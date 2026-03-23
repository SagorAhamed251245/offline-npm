import React, { useState } from "react";
import {
  Package2,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react";

function timeAgo(isoDate) {
  if (!isoDate) return "unknown";
  const diff = (Date.now() - new Date(isoDate)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScopedName({ name }) {
  if (name.startsWith("@")) {
    const [scope, ...rest] = name.split("/");
    return (
      <span className="font-mono text-sm font-medium">
        <span className="text-ink-400">{scope}/</span>
        <span className="text-ink-50">{rest.join("/")}</span>
      </span>
    );
  }
  return (
    <span className="font-mono text-sm font-medium text-ink-50">{name}</span>
  );
}

export function PackageCard({ pkg, onInstall, onDelete }) {
  const [installState, setInstallState] = useState("idle"); // idle|loading|success|error
  const [deleteState, setDeleteState] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleInstall() {
    setInstallState("loading");
    setErrorMsg("");
    try {
      await onInstall(`${pkg.name}@${pkg.version}`);
      setInstallState("success");
      setTimeout(() => setInstallState("idle"), 2500);
    } catch (err) {
      setInstallState("error");
      setErrorMsg(err.message);
      setTimeout(() => setInstallState("idle"), 3000);
    }
  }

  async function handleDelete() {
    if (deleteState === "confirm") {
      setDeleteState("loading");
      try {
        await onDelete(pkg.name, pkg.version);
      } catch {
        setDeleteState("idle");
      }
    } else {
      setDeleteState("confirm");
      setTimeout(() => setDeleteState("idle"), 3000);
    }
  }

  return (
    <div
      className={`card group p-5 hover:border-ink-600 transition-all duration-200
                     hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5
                     ${deleteState === "confirm" ? "border-rose-500/40" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
            <Package2 size={15} className="text-sky-400" />
          </div>
          <div className="min-w-0">
            <ScopedName name={pkg.name} />
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`badge shrink-0 ${
            pkg.status === "ready"
              ? "bg-acid-500/15 text-acid-400"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {pkg.status === "ready" ? (
            <>
              <CheckCircle2 size={10} /> ready
            </>
          ) : (
            <>
              <AlertCircle size={10} /> missing
            </>
          )}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="badge bg-ink-700 text-amber-400 border border-ink-600">
          v{pkg.version}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink-400 font-mono">
          <HardDrive size={11} /> {pkg.sizeLabel}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink-400 font-mono">
          <Clock size={11} /> {timeAgo(pkg.downloadedAt)}
        </span>
      </div>

      {/* Error inline */}
      {installState === "error" && (
        <p className="text-xs text-rose-400 font-body mb-3 bg-rose-500/10 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          disabled={pkg.status !== "ready" || installState === "loading"}
          className={`btn flex-1 justify-center text-xs transition-all
            ${
              installState === "success"
                ? "bg-acid-500/15 text-acid-400 border border-acid-500/30"
                : installState === "error"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "btn-ghost"
            }
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {installState === "loading" && (
            <>
              <Loader2 size={13} className="animate-spin" /> Installing…
            </>
          )}
          {installState === "success" && (
            <>
              <CheckCircle2 size={13} /> Installed!
            </>
          )}
          {installState === "error" && (
            <>
              <AlertCircle size={13} /> Failed
            </>
          )}
          {installState === "idle" && (
            <>
              <Download size={13} /> Install
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleteState === "loading"}
          className={`btn text-xs transition-all
            ${
              deleteState === "confirm"
                ? "bg-rose-500 text-white border-rose-500 px-4"
                : "btn-danger"
            }
            disabled:opacity-40`}
        >
          {deleteState === "loading" && (
            <Loader2 size={13} className="animate-spin" />
          )}
          {deleteState === "confirm" && "Confirm?"}
          {deleteState === "idle" && <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}
