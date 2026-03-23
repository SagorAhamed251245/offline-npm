import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function AddPackageModal({ onAdd, onClose }) {
  const [pkg, setPkg]       = useState('');
  const [deps, setDeps]     = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pkg.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      await onAdd(pkg.trim(), deps);
      setStatus('success');
      setMessage(`${pkg.trim()} downloaded successfully!`);
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card w-full max-w-md p-6 shadow-2xl border-ink-600 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-ink-50">Add Package</h2>
            <p className="text-xs text-ink-400 font-body mt-0.5">Downloads via npm pack — requires internet</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package input */}
          <div>
            <label className="block text-xs text-ink-400 font-body uppercase tracking-wider mb-1.5">
              Package name
            </label>
            <input
              ref={inputRef}
              className="input"
              placeholder="e.g. express  or  lodash@4.17.21"
              value={pkg}
              onChange={e => { setPkg(e.target.value); setStatus('idle'); }}
              disabled={status === 'loading' || status === 'success'}
            />
          </div>

          {/* Options */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-9 h-5 rounded-full transition-colors relative ${deps ? 'bg-acid-500' : 'bg-ink-600'}`}
                 onClick={() => setDeps(d => !d)}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                               ${deps ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-ink-300 font-body group-hover:text-ink-100 transition-colors">
              Download dependencies recursively
            </span>
          </label>

          {/* Status message */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-body">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-acid-500/10 border border-acid-500/20 text-acid-400 text-sm font-body">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pkg.trim() || status === 'loading' || status === 'success'}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <><Loader2 size={15} className="animate-spin" /> Downloading…</>
              ) : (
                <><Download size={15} /> Download</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}