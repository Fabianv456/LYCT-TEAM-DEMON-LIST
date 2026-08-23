"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { uploadDemonImage, deleteDemonImage } from "@/lib/supabaseStorage";
import Avatar from "@/components/Avatar";
import CountrySelector, { COUNTRIES } from "@/components/CountrySelector";

export default function EditProfilePage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [gdUsername, setGdUsername] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setGdUsername(profile.gd_username || "");
      setCountryCode(profile.country_code || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && user && !profile) {
      setError("No se pudo cargar tu perfil. Intentá recargar.");
    }
  }, [authLoading, user, profile]);

  async function handleAvatarUpload(file) {
    if (!file || !user) return null;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("demon-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("demon-images").getPublicUrl(path);
      const url = data.publicUrl;
      setAvatarUrl(url);
      return url;
    } catch (err) {
      setError("Error al subir la imagen: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!user || !avatarUrl) return;
    try {
      const path = avatarUrl.split("/").slice(-2).join("/");
      await deleteDemonImage(path);
    } catch {
      // ignore delete error
    }
    setAvatarUrl("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.");
      setSaving(false);
      return;
    }

    try {
      const updates = {
        username: username.trim(),
        gd_username: gdUsername.trim() || null,
        country_code: countryCode || null,
        avatar_url: avatarUrl || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("Perfil actualizado correctamente.");
      refreshProfile();
    } catch (err) {
      setError(err.message || "Error al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Editar perfil</h1>
        <p className="text-sm text-zinc-400">Actualiza tu información personal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-base-700/60 bg-base-900 p-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar src={avatarUrl} alt={username} size="xl" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800 disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : avatarUrl ? "Cambiar avatar" : "Subir avatar"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="rounded-xl border border-accent-red px-4 py-2 text-sm text-accent-red transition hover:bg-accent-red/10"
              >
                Eliminar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            className="hidden"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Nombre de usuario</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Nombre en Geometry Dash</label>
          <input
            value={gdUsername}
            onChange={(e) => setGdUsername(e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">País</label>
          <CountrySelector value={countryCode} onChange={setCountryCode} />
        </div>

        {error && <p className="text-sm text-accent-red">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-accent-gradient py-2.5 font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
