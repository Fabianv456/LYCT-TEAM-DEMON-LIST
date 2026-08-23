"use client";

import { useEffect, useRef, useState } from "react";

export default function MediaUploader({ onUpload, currentUrl, onRemove, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar 5MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await onUpload(file);
      setPreview(url);
    } catch (err) {
      alert("Error al subir la imagen: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function onInputChange(e) {
    const file = e.target.files[0];
    handleFile(file);
  }

  function clearImage() {
    setPreview(null);
    if (onRemove) onRemove();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm text-zinc-400">Imagen / Thumbnail</label>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-base-700 bg-base-800">
          <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="flex-1 rounded-xl border border-base-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-700 disabled:opacity-50"
            >
              Cambiar imagen
            </button>
            <button
              type="button"
              onClick={clearImage}
              disabled={disabled}
              className="rounded-xl border border-accent-red px-3 py-2 text-sm text-accent-red transition hover:bg-accent-red/10 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${
            dragOver
              ? "border-accent-purple bg-base-800"
              : "border-base-700 bg-base-900 hover:border-base-600"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {uploading ? (
            <p className="text-sm text-zinc-400">Subiendo imagen...</p>
          ) : (
            <>
              <p className="text-sm text-zinc-400">Arrastra una imagen aquí o haz clic para seleccionar</p>
              <p className="mt-1 text-xs text-zinc-600">JPG, PNG, WEBP — Máx 5MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}
