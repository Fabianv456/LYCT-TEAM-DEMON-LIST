"use client";

import { useEffect, useRef, useState } from "react";
import MediaUploader from "@/components/MediaUploader";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { uploadDemonImage } from "@/lib/supabaseStorage";

const DIFFICULTIES = ["Easy Demon", "Medium Demon", "Hard Demon", "Insane Demon", "Extreme Demon"];

export default function LevelForm({ demon, onSuccess, onCreated, onCancel, initialThumbnailUrl, onThumbnailChange, initialBackgroundUrl, onBackgroundChange, initialExtremeDemonIconUrl, onExtremeDemonIconChange }) {
  const supabase = supabaseBrowser();

  const isEdit = !!demon;
  const previousPosition = demon?.position || null;
  const [form, setForm] = useState({
    name: demon?.name || "",
    creator: demon?.creator || "",
    level_id: demon?.level_id || "",
    position: demon?.position || "",
    difficulty: demon?.difficulty || "Extreme Demon",
    description: demon?.description || "",
    verification_video_url: demon?.verification_video_url || "",
    points: demon?.points || 100,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(demon?.thumbnail_url || initialThumbnailUrl || "");
  const [backgroundUrl, setBackgroundUrl] = useState(demon?.background_url || initialBackgroundUrl || "");
  const [extremeDemonIconUrl, setExtremeDemonIconUrl] = useState(demon?.extreme_demon_icon_url || initialExtremeDemonIconUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setThumbnailUrl(demon?.thumbnail_url || initialThumbnailUrl || "");
    setBackgroundUrl(demon?.background_url || initialBackgroundUrl || "");
    setExtremeDemonIconUrl(demon?.extreme_demon_icon_url || initialExtremeDemonIconUrl || "");
  }, [demon?.thumbnail_url, demon?.background_url, demon?.extreme_demon_icon_url, initialThumbnailUrl, initialBackgroundUrl, initialExtremeDemonIconUrl]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(file) {
    let demonId = demon?.id;
    if (!demonId) {
      setError("Primero crea el nivel para poder subir la imagen.");
      return null;
    }
    const url = await uploadDemonImage(file, demonId);
    setThumbnailUrl(url);
    onThumbnailChange?.(url);
    return url;
  }

  function handleImageRemove() {
    setThumbnailUrl("");
    onThumbnailChange?.("");
  }

  async function handleBackgroundUpload(file) {
    let demonId = demon?.id;
    if (!demonId) {
      setError("Primero crea el nivel para poder subir la imagen de fondo.");
      return null;
    }
    const url = await uploadDemonImage(file, demonId);
    setBackgroundUrl(url);
    onBackgroundChange?.(url);
    return url;
  }

  function handleBackgroundRemove() {
    setBackgroundUrl("");
    onBackgroundChange?.("");
  }

  async function handleExtremeDemonIconUpload(file) {
    let demonId = demon?.id;
    if (!demonId) {
      setError("Primero crea el nivel para poder subir el icono.");
      return null;
    }
    const url = await uploadDemonImage(file, demonId);
    setExtremeDemonIconUrl(url);
    onExtremeDemonIconChange?.(url);
    return url;
  }

  function handleExtremeDemonIconRemove() {
    setExtremeDemonIconUrl("");
    onExtremeDemonIconChange?.("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.name.trim() || !form.creator.trim() || !form.level_id.trim()) {
      setError("Nombre, creador y ID del nivel son obligatorios.");
      setSaving(false);
      return;
    }

    const positionNum = Number(form.position);
    if (!Number.isInteger(positionNum) || positionNum < 1) {
      setError("La posición debe ser un número entero positivo.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        creator: form.creator.trim(),
        level_id: form.level_id.trim(),
        position: positionNum,
        difficulty: form.difficulty,
        description: form.description.trim() || null,
        verification_video_url: form.verification_video_url.trim() || null,
        thumbnail_url: thumbnailUrl || null,
        background_url: backgroundUrl || null,
        extreme_demon_icon_url: extremeDemonIconUrl || null,
        points: Number(form.points) || 100,
      };

      if (isEdit) {
        const { error } = await supabase.from("demons").update(payload).eq("id", demon.id);
        if (error) throw error;
        onSuccess?.();
      } else {
        const { data, error } = await supabase.from("demons").insert(payload).select("id").single();
        if (error) throw error;
        onCreated?.(data);
        onThumbnailChange?.(null);
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || "Error al guardar el nivel.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-base-700/60 bg-base-900 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-zinc-400">Nombre del nivel</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Creador</label>
          <input
            required
            value={form.creator}
            onChange={(e) => update("creator", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">ID del nivel</label>
          <input
            required
            value={form.level_id}
            onChange={(e) => update("level_id", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Posición / Ranking</label>
          <input
            type="number"
            required
            min="1"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Dificultad</label>
          <select
            value={form.difficulty}
            onChange={(e) => update("difficulty", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Puntos</label>
          <input
            type="number"
            required
            min="0"
            value={form.points}
            onChange={(e) => update("points", e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-zinc-400">URL de verificación (opcional)</label>
          <input
            type="url"
            value={form.verification_video_url}
            onChange={(e) => update("verification_video_url", e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-zinc-400">Descripción (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-purple"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-zinc-400">Icono Extreme Demon (opcional)</label>
          <MediaUploader
            currentUrl={extremeDemonIconUrl}
            onUpload={handleExtremeDemonIconUpload}
            onRemove={handleExtremeDemonIconRemove}
          />
        </div>
      </div>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent-gradient px-6 py-2.5 font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear nivel"}
        </button>
      </div>
    </form>
  );
}
