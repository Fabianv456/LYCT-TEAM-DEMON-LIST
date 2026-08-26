"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

export default function DemonDetailPage() {
  const { id } = useParams();
  const supabase = supabaseBrowser();
  const { isStaff } = useAuth();
  const [demon, setDemon] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissions, setShowSubmissions] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: demonData } = await supabase.from("demons").select("*").eq("id", id).single();
      const { data: completionsData } = await supabase
        .from("completions")
        .select("*")
        .eq("demon_id", id)
        .order("created_at", { ascending: true });
      const { data: imagesData } = await supabase.from("demon_images").select("*").eq("demon_id", id).order("created_at");
      const { data: tagsData } = await supabase.from("demon_tags").select("*").eq("demon_id", id);

      setDemon(demonData);
      setCompletions(completionsData || []);
      setImages(imagesData || []);
      setTags(tagsData || []);
      setLoading(false);
    }
    if (id) load();
  }, [id, supabase]);

  useEffect(() => {
    async function loadSubmissions() {
      if (!showSubmissions || !isStaff) return;
      const { data } = await supabase
        .from("submissions")
        .select("*")
        .eq("demon_id", id)
        .order("created_at", { ascending: false });
      setAllSubmissions(data || []);
    }
    loadSubmissions();
  }, [showSubmissions, isStaff, id, supabase]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  if (!demon) {
    return <p className="text-zinc-400">No se encontró ese demon.</p>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Volver a la lista</Link>

      <div className="card-gradient-border relative flex flex-col gap-6 p-6 sm:flex-row">
        {demon.background_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 transition duration-500"
            style={{ backgroundImage: `url(${demon.background_url})` }}
          />
        )}
        <div className="relative h-48 w-full flex-none overflow-hidden rounded-xl bg-base-800 sm:w-72">
          {demon.thumbnail_url ? (
            <img src={demon.thumbnail_url} alt={demon.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">Sin imagen</div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-gradient font-bold text-white shadow-glow">
              #{demon.position}
            </span>
            <h1 className="font-display text-2xl font-bold text-white">{demon.name}</h1>
          </div>
          <p className="text-zinc-400">Creado por <span className="text-zinc-200">{demon.creator}</span></p>
          <p className="text-sm text-zinc-500">ID del nivel: <span className="text-zinc-300">{demon.level_id}</span></p>
          <span className="inline-block rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 text-xs font-medium text-cyan-300">
            {demon.difficulty}
          </span>
          {demon.description && <p className="pt-2 text-sm text-zinc-400">{demon.description}</p>}
          {demon.verification_video_url && (
            <a
              href={demon.verification_video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-accent-cyan hover:underline"
            >
              Ver vídeo de verificación ↗
            </a>
          )}

          {isStaff && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/admin`}
                className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800"
              >
                Editar nivel
              </Link>
              <button
                onClick={() => setShowSubmissions(!showSubmissions)}
                className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800"
              >
                {showSubmissions ? "Ocultar submissions" : "Ver submissions"}
              </button>
            </div>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Galería</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border border-base-700/60 bg-base-900">
                <img src={img.url} alt="" className="h-32 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Etiquetas</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-base-700 bg-base-800 px-3 py-1 text-xs text-zinc-300">
                {tag.tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {showSubmissions && isStaff && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Todas las submissions</h2>
          {allSubmissions.length === 0 ? (
            <p className="rounded-xl border border-base-700/60 bg-base-900/60 p-4 text-sm text-zinc-500">
              No hay submissions para este nivel.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-base-700/60">
              <table className="w-full text-left text-sm">
                <thead className="bg-base-800 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Jugador</th>
                    <th className="px-4 py-3 font-medium">Vídeo</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-700/60 bg-base-900">
                  {allSubmissions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-zinc-200">{s.gd_username}</td>
                      <td className="px-4 py-3">
                        <a href={s.video_url} target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">
                          Ver vídeo ↗
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                          s.status === "pending" ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" :
                          s.status === "approved" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" :
                          "border-accent-red/40 bg-accent-red/10 text-accent-red"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">
          Jugadores que lo han completado ({completions.length})
        </h2>
        {completions.length === 0 ? (
          <p className="rounded-xl border border-base-700/60 bg-base-900/60 p-4 text-sm text-zinc-500">
            Nadie ha completado este demon todavía. ¡Sé el primero!
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-base-700/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-base-800 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Jugador</th>
                  <th className="px-4 py-3 font-medium">Vídeo</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-700/60 bg-base-900">
                {completions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-zinc-200">{c.gd_username}</td>
                    <td className="px-4 py-3">
                      <a href={c.video_url} target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">
                        Ver vídeo ↗
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
