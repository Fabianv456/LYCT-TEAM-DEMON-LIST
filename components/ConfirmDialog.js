"use client";

import { useEffect, useRef, useState } from "react";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmar", danger = false }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onCancel?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-base-700/60 bg-base-900 p-6 shadow-glow">
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
              danger
                ? "bg-accent-red hover:opacity-90"
                : "bg-accent-gradient shadow-glow hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
