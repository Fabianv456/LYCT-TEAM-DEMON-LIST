"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function SubmitPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [demons, setDemons] = useState([]);
  const [demonId, setDemonId] = useState("");
  const [gdUsername, setGdUsername] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fps, setFps] = useState("");
  const [refreshRate, setRefreshRate] = useState("");
  const [comment, setComment] = useState("");
  const [rawCompleteUrl, setRawCompleteUrl] = useState("");
  const [modMenu, setModMenu] = useState("");
  const [device, setDevice] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile?.gd_username) setGdUsername(profile.gd_username);
  }, [profile]);

  useEffect(() => {
    async function loadDemons() {
      try {
        const { data } = await supabase.from("demons").select("id, name, position").order("position");
        setDemons(data || []);
        if (data?.length) setDemonId(data[0].id);
      } catch (err) {
        setError("Error al cargar los niveles: " + (err.message || err));
      }
    }
    loadDemons();
  }, [supabase]);

  useEffect(() => {
    async function loadSubmissions() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("submissions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setUserSubmissions(data || []);
      } catch (err) {
        console.error("Error loading submissions:", err);
      }
    }
    loadSubmissions();
  }, [user, supabase, success]);

  const selectedDemon = demons.find((d) => d.id === demonId);

  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return ["youtube.com", "youtu.be", "twitch.tv", "vimeo.com", "streamable.com"].some((h) =>
        url.hostname.includes(h)
      );
    } catch {
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!isValidUrl(videoUrl)) {
      setError("Introduce un enlace válido de YouTube, Twitch, Vimeo o Streamable.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      demon_id: demonId,
      user_id: user.id,
      gd_username: gdUsername,
      video_url: videoUrl,
      fps: fps ? Number(fps) : null,
      refresh_rate: refreshRate ? Number(refreshRate) : null,
      comment: comment || null,
      raw_complete_url: rawCompleteUrl || null,
      mod_menu: modMenu || null,
      device: device || null,
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        setError("Ya tienes una submission pendiente o aprobada para este demon.");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess(true);
    setVideoUrl("");
    setComment("");
  }

  if (authLoading || !user) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  const statusStyles = {
    pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    rejected: "border-accent-red/40 bg-accent-red/10 text-accent-red",
  };
  const statusLabels = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Enviar una completion</h1>
        <p className="text-sm text-zinc-400">Tu envío quedará como <span className="text-yellow-400">Pending</span> hasta que un moderador lo revise.</p>
      </div>

      <form onSubmit={handleSubmit} className="card-gradient-border space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Extreme Demon</label>
          <select
            value={demonId}
            onChange={(e) => setDemonId(e.target.value)}
            required
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          >
            {demons.map((d) => (
              <option key={d.id} value={d.id}>#{d.position} — {d.name}</option>
            ))}
          </select>
          {selectedDemon && (
            <p className="mt-1 text-xs text-zinc-500">Nivel #{selectedDemon.position} por {selectedDemon.creator}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Tu nombre de Geometry Dash</label>
          <input
            required
            value={gdUsername}
            onChange={(e) => setGdUsername(e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Enlace del vídeo (YouTube, Twitch...)</label>
          <input
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">FPS (opcional)</label>
            <input
              type="number"
              value={fps}
              onChange={(e) => setFps(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Refresh rate (opcional)</label>
            <input
              type="number"
              value={refreshRate}
              onChange={(e) => setRefreshRate(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Enviar raw complete (opcional)</label>
            <input
              value={rawCompleteUrl}
              onChange={(e) => setRawCompleteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Mod menu usado (opcional)</label>
            <input
              value={modMenu}
              onChange={(e) => setModMenu(e.target.value)}
              placeholder="Ej: Megahack, Replay, etc."
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Dispositivo (opcional)</label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          >
            <option value="">Seleccionar...</option>
            <option value="PC">PC</option>
            <option value="Mobile">Mobile / Celular</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Comentarios (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
          />
        </div>

        {error && <p className="text-sm text-accent-red">{error}</p>}
        {success && <p className="text-sm text-emerald-400">¡Enviado! Tu completion está pendiente de revisión.</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent-gradient py-2.5 font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Enviar para revisión"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">Tus envíos anteriores</h2>
        {userSubmissions.length === 0 ? (
          <p className="rounded-xl border border-base-700/60 bg-base-900/60 p-4 text-sm text-zinc-500">
            Todavía no has enviado ninguna completion.
          </p>
        ) : (
          <div className="grid gap-2">
            {userSubmissions.map((s) => {
              const demon = demons.find((d) => d.id === s.demon_id);
              return (
                 <div
                   key={s.id}
                   className="card-gradient-border relative overflow-hidden px-4 py-3 transition"
                 >
                  {demon?.background_url && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${demon.background_url})` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-24 flex-none overflow-hidden rounded-lg bg-base-800">
                        {demon?.thumbnail_url ? (
                          <img src={demon.thumbnail_url} alt={demon?.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">Sin img</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          #{demon?.position || "?"} {demon?.name || "Demon desconocido"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyles[s.status] || "border-base-700 text-zinc-400"}`}>
                      {statusLabels[s.status] || s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
