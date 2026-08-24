"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "@/lib/supabaseClient";

const TABS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
];

const PAGE_SIZE = 10;

export default function ModPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, profile, isStaff, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved_today: 0, rejected_today: 0, total: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!authLoading && !isStaff && !isAdmin) router.push("/");
  }, [authLoading, isStaff, isAdmin, router]);

  async function loadStats() {
    try {
      const { data } = await supabase.rpc("get_moderation_stats");
      if (data?.length) setStats(data[0]);
    } catch (err) {
      console.error("Error loading moderation stats:", err);
    }
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        query = query.or(`gd_username.ilike.%${q}%,comment.ilike.%${q}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      const demonIds = Array.from(new Set((data || []).map((s) => s.demon_id).filter(Boolean)));
      const userIds = Array.from(new Set((data || []).map((s) => s.user_id).filter(Boolean)));
      const [{ data: demons }, { data: profiles }] = await Promise.all([
        demonIds.length
          ? supabase.from("demons").select("id, name, position, creator").in("id", demonIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? supabase.from("profiles").select("id, username").in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);
      const demonMap = Object.fromEntries((demons || []).map((d) => [d.id, d]));
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      const normalized = (data || []).map((item) => {
        const demon = demonMap[item.demon_id];
        const profile = profileMap[item.user_id];
        return {
          ...item,
          demon_name: demon?.name || "Demon desconocido",
          demon_position: demon?.position || "?",
          submitter_username: profile?.username || item.gd_username || "Desconocido",
        };
      });
      setItems(normalized);
      setTotal(count || 0);
    } catch (err) {
      setError(err.message || "Error al cargar las submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isStaff || isAdmin) {
      loadStats();
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, isAdmin, activeTab, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleApprove(submission) {
    if (!submission?.id) return;
    setBusyId(submission.id);
    const { error } = await supabase
      .from("submissions")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", submission.id);

    setBusyId(null);

    if (error) {
      alert("Error al aprobar: " + error.message);
      return;
    }

    await loadItems();
    await loadStats();
    setSelected(null);
  }

  async function handleReject(submission, reason) {
    if (!submission?.id) return;
    setBusyId(submission.id);
    const { error } = await supabase
      .from("submissions")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", submission.id);

    setBusyId(null);

    if (error) {
      alert("Error al rechazar: " + error.message);
      return;
    }

    await loadItems();
    await loadStats();
    setSelected(null);
  }

  if (authLoading || !isStaff) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Panel de moderación</h1>
        <p className="text-sm text-zinc-400">Gestiona las submissions de completions.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-base-700/60 bg-base-900 p-4 text-center">
          <p className="font-display text-2xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="mt-1 text-xs text-zinc-500">Pendientes</p>
        </div>
        <div className="rounded-2xl border border-base-700/60 bg-base-900 p-4 text-center">
          <p className="font-display text-2xl font-bold text-emerald-400">{stats.approved_today}</p>
          <p className="mt-1 text-xs text-zinc-500">Aprobadas hoy</p>
        </div>
        <div className="rounded-2xl border border-base-700/60 bg-base-900 p-4 text-center">
          <p className="font-display text-2xl font-bold text-accent-red">{stats.rejected_today}</p>
          <p className="mt-1 text-xs text-zinc-500">Rechazadas hoy</p>
        </div>
        <div className="rounded-2xl border border-base-700/60 bg-base-900 p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-zinc-500">Total</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-base-700/60 bg-base-900 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-base-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setPage(1)}
        placeholder="Buscar por jugador o nivel..."
        className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-accent-cyan"
      />

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-base-900" />
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          No hay submissions {activeTab === "pending" ? "pendientes" : activeTab === "approved" ? "aprobadas" : activeTab === "rejected" ? "rechazadas" : ""}.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className="cursor-pointer rounded-2xl border border-base-700/60 bg-base-900 p-5 transition hover:border-accent-cyan/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-white">
                    {s.submitter_username} <span className="text-zinc-500">→</span> #{s.demon_position} {s.demon_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Enviado el {new Date(s.created_at).toLocaleString()}
                    {s.fps ? ` · ${s.fps} FPS` : ""}
                    {s.refresh_rate ? ` · ${s.refresh_rate}Hz` : ""}
                  </p>
                </div>
                <a
                  href={s.video_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-base-700 px-3 py-1.5 text-sm text-accent-cyan hover:border-accent-cyan"
                >
                  Ver vídeo ↗
                </a>
              </div>

              {s.comment && <p className="mt-2 text-sm text-zinc-400">"{s.comment}"</p>}

              {s.status === "pending" && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    placeholder="Motivo de rechazo (opcional)"
                    defaultValue={s.rejection_reason || ""}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReject(s, e.target.value);
                    }}
                    className="flex-1 rounded-xl border border-base-700 bg-base-800 px-3 py-2 text-sm text-white outline-none focus:border-accent-cyan"
                    id={`reject-${s.id}`}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!s.id || busyId === s.id}
                      onClick={(e) => { e.stopPropagation(); handleApprove(s); }}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={!s.id || busyId === s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.getElementById(`reject-${s.id}`);
                        handleReject(s, input?.value || "");
                      }}
                      className="rounded-xl bg-accent-red px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {s.status === "rejected" && s.rejection_reason && (
                <p className="mt-2 text-xs text-zinc-500">Motivo: {s.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-zinc-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-base-700/60 bg-base-900 p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  #{selected.demon_position} {selected.demon_name}
                </h3>
                <p className="text-sm text-zinc-400">
                  Enviado por <span className="text-zinc-200">{selected.submitter_username}</span>
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-base-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-base-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-base-700/60 bg-base-800 p-4">
                <p className="text-sm text-zinc-400">Vídeo de la completion</p>
                <a
                  href={selected.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-accent-cyan hover:underline"
                >
                  Abrir vídeo ↗
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-base-700/60 bg-base-800 p-4">
                  <p className="text-sm text-zinc-400">FPS</p>
                  <p className="font-display text-lg font-bold text-white">{selected.fps || "—"}</p>
                </div>
                <div className="rounded-xl border border-base-700/60 bg-base-800 p-4">
                  <p className="text-sm text-zinc-400">Refresh rate</p>
                  <p className="font-display text-lg font-bold text-white">{selected.refresh_rate ? `${selected.refresh_rate}Hz` : "—"}</p>
                </div>
              </div>

              {selected.comment && (
                <div className="rounded-xl border border-base-700/60 bg-base-800 p-4">
                  <p className="text-sm text-zinc-400">Comentario</p>
                  <p className="mt-1 text-sm text-white">"{selected.comment}"</p>
                </div>
              )}

              <p className="text-xs text-zinc-500">
                Enviado el {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>

            {selected.status === "pending" && (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  disabled={busyId === selected.id}
                  onClick={() => handleApprove(selected)}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  disabled={busyId === selected.id}
                  onClick={() => {
                    const reason = prompt("Motivo de rechazo (opcional):") || "";
                    handleReject(selected, reason);
                  }}
                  className="flex-1 rounded-xl bg-accent-red px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
