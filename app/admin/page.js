"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { uploadDemonImage } from "@/lib/supabaseStorage";
import LevelForm from "@/components/LevelForm";
import MediaUploader from "@/components/MediaUploader";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AdminPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, profile, isAdmin, loading: authLoading } = useAuth();

  const [demons, setDemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [authLoading, isAdmin, router]);

  async function loadDemons() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("demons")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setDemons(data || []);
    } catch (err) {
      setError(err.message || "Error al cargar los niveles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadDemons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = demons.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.creator.toLowerCase().includes(q) ||
      d.level_id.includes(q)
    );
  });

  const selected = demons.find((d) => d.id === selectedId) || null;

  function handleSelect(demon) {
    setSelectedId(demon.id);
    setError("");
    setSuccess("");
  }

  function handleCreateNew() {
    setSelectedId(null);
    setError("");
    setSuccess("");
  }

  async function handleSuccess() {
    setSuccess(selectedId ? "Nivel actualizado correctamente." : "Nivel creado correctamente.");
    setError("");
    await loadDemons();
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleCreated(newDemon) {
    setSelectedId(newDemon.id);
    await loadDemons();
  }

  async function handleMove(demonId, direction) {
    setReordering(true);
    try {
      const sorted = [...demons].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((d) => d.id === demonId);
      if (idx === -1) return;

      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= sorted.length) return;

      const target = sorted[targetIdx];

      const { error } = await supabase.rpc("reorder_demons", {
        demon_id: demonId,
        new_position: target.position,
      });

      if (error) throw error;
      await loadDemons();
    } catch (err) {
      setError("Error al reordenar: " + (err.message || err));
    } finally {
      setReordering(false);
    }
  }

  async function handleImageUpload(file) {
    if (!selected) return null;
    const url = await uploadDemonImage(file, selected.id);
    const { error } = await supabase.from("demons").update({ thumbnail_url: url }).eq("id", selected.id);
    if (error) {
      alert("Error al guardar imagen: " + error.message);
      return null;
    }
    setDemons((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, thumbnail_url: url } : d))
    );
    return url;
  }

  function handleImageRemove() {
    if (!selected) return;
    supabase.from("demons").update({ thumbnail_url: null }).eq("id", selected.id);
    setDemons((prev) =>
      prev.map((d) => (d.id === selected?.id ? { ...d, thumbnail_url: null } : d))
    );
  }

  async function handleBackgroundUpload(file) {
    if (!selected) return null;
    const url = await uploadDemonImage(file, selected.id);
    const { error } = await supabase.from("demons").update({ background_url: url }).eq("id", selected.id);
    if (error) {
      alert("Error al guardar imagen de fondo: " + error.message);
      return null;
    }
    setDemons((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, background_url: url } : d))
    );
    return url;
  }

  function handleBackgroundRemove() {
    if (!selected) return;
    supabase.from("demons").update({ background_url: null }).eq("id", selected.id);
    setDemons((prev) =>
      prev.map((d) => (d.id === selected?.id ? { ...d, background_url: null } : d))
    );
  }

  async function handleExtremeDemonIconUpload(file) {
    if (!selected) return null;
    const url = await uploadDemonImage(file, selected.id);
    const { error } = await supabase.from("demons").update({ extreme_demon_icon_url: url }).eq("id", selected.id);
    if (error) {
      alert("Error al guardar icono: " + error.message);
      return null;
    }
    setDemons((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, extreme_demon_icon_url: url } : d))
    );
    return url;
  }

  function handleExtremeDemonIconRemove() {
    if (!selected) return;
    supabase.from("demons").update({ extreme_demon_icon_url: null }).eq("id", selected.id);
    setDemons((prev) =>
      prev.map((d) => (d.id === selected?.id ? { ...d, extreme_demon_icon_url: null } : d))
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("demons").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      setError("Error al eliminar: " + error.message);
    } else {
      setDemons((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
      }
      setSuccess("Nivel eliminado correctamente.");
      setTimeout(() => setSuccess(""), 3000);
    }
    setDeleteTarget(null);
  }

  if (authLoading || !isAdmin) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Administración de niveles</h1>
          <p className="text-sm text-zinc-400">Gestiona la lista de LYCT TEAM.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="rounded-xl bg-accent-gradient px-4 py-2.5 font-medium text-white shadow-glow transition hover:opacity-90"
        >
          + Nuevo nivel
        </button>
      </div>

      {error && <p className="text-sm text-accent-red">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, creador o ID..."
        className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-accent-cyan"
      />

      {loading ? (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-base-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          No se encontraron niveles.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((demon) => {
            const sortedIndex = [...demons].sort((a, b) => a.position - b.position).findIndex((d) => d.id === demon.id);
            return (
              <div
                key={demon.id}
                onClick={() => handleSelect(demon)}
                className="card-gradient-border p-4 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-16 flex-none items-center justify-center rounded-xl bg-accent-gradient font-display text-lg font-bold text-white shadow-glow">
                    <input
                      type="number"
                      value={demon.position}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isInteger(val) || val < 1) return;
                        supabase.from("demons").update({ position: val }).eq("id", demon.id);
                      }}
                      onBlur={() => loadDemons()}
                      className="w-12 bg-transparent text-center outline-none"
                    />
                  </div>
                  <div className="h-16 w-28 flex-none overflow-hidden rounded-lg bg-base-800">
                    {demon.thumbnail_url ? (
                      <img
                        src={demon.thumbnail_url}
                        alt={demon.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">Sin imagen</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold text-white">{demon.name}</h3>
                    <p className="truncate text-sm text-zinc-400">por {demon.creator}</p>
                    <p className="truncate text-xs text-zinc-500">ID: {demon.level_id} · {demon.points || 100} pts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMove(demon.id, -1); }}
                      disabled={reordering || sortedIndex === 0}
                      className="rounded-lg border border-base-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-base-800 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMove(demon.id, 1); }}
                      disabled={reordering || sortedIndex === filtered.length - 1}
                      className="rounded-lg border border-base-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-base-800 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <div className="hidden flex-col items-end gap-1 sm:flex">
                      <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        {demon.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-base-700/60 bg-base-900 p-6 shadow-glow">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">Editar nivel</h2>
              <button
                onClick={handleCreateNew}
                className="rounded-lg border border-base-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-base-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <LevelForm
                demon={selected}
                onSuccess={handleSuccess}
                onCreated={handleCreated}
                onCancel={handleCreateNew}
                initialBackgroundUrl={selected.background_url}
                onBackgroundChange={(url) => {
                  setDemons((prev) =>
                    prev.map((d) => (d.id === selected.id ? { ...d, background_url: url } : d))
                  );
                }}
                initialExtremeDemonIconUrl={selected.extreme_demon_icon_url}
                onExtremeDemonIconChange={(url) => {
                  setDemons((prev) =>
                    prev.map((d) => (d.id === selected.id ? { ...d, extreme_demon_icon_url: url } : d))
                  );
                }}
              />

              <div className="card-gradient-border p-6">
                <h3 className="mb-3 font-display text-lg font-semibold text-white">Imagen del nivel</h3>
                <MediaUploader
                  currentUrl={selected.thumbnail_url}
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                />
              </div>

              <div className="card-gradient-border p-6">
                <h3 className="mb-3 font-display text-lg font-semibold text-white">Imagen de fondo</h3>
                <MediaUploader
                  currentUrl={selected.background_url}
                  onUpload={handleBackgroundUpload}
                  onRemove={handleBackgroundRemove}
                />
              </div>

              <div className="card-gradient-border p-6">
                <h3 className="mb-3 font-display text-lg font-semibold text-white">Icono Extreme Demon</h3>
                <MediaUploader
                  currentUrl={selected.extreme_demon_icon_url}
                  onUpload={handleExtremeDemonIconUpload}
                  onRemove={handleExtremeDemonIconRemove}
                />
              </div>

              <div className="card-gradient-border p-6">
                <h3 className="mb-3 font-display text-lg font-semibold text-accent-red">Zona de peligro</h3>
                <p className="text-sm text-zinc-400">
                  Elimina este nivel permanentemente. Esta acción no se puede deshacer.
                </p>
                <button
                  onClick={() => setDeleteTarget(selected)}
                  className="mt-3 rounded-xl border border-accent-red px-4 py-2 text-sm text-accent-red transition hover:bg-accent-red/10"
                >
                  Eliminar nivel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selected && (
          <div className="card-gradient-border p-6">
            <h2 className="mb-4 font-display text-xl font-bold text-white">Crear nuevo nivel</h2>
          <LevelForm
            onSuccess={handleSuccess}
            onCreated={handleCreated}
            onCancel={undefined}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar nivel"
        message={`¿Estás seguro de que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
