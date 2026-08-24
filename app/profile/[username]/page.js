"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { username } = useParams();
  const supabase = supabaseBrowser();
  const { user, profile: authProfile, isStaff, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const decodedUsername = decodeURIComponent(username);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", decodedUsername)
          .single();

        if (profileData) {
          const { data: completionsData } = await supabase
            .from("completions")
            .select("*")
            .eq("user_id", profileData.id)
            .order("demon_position", { ascending: true });
          setCompletions(completionsData || []);

          const { data: rankData } = await supabase
            .from("global_leaderboard")
            .select("rank")
            .eq("id", profileData.id)
            .single();

          setProfile({
            ...profileData,
            rank: rankData?.rank || null,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    if (username) load();
  }, [username, supabase]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  if (!profile) {
    return <p className="text-zinc-400">No se encontró ese jugador.</p>;
  }

  const country = profile.country_code
    ? String.fromCodePoint(...[...profile.country_code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : "";

  async function handleRevoke(completion) {
    if (!confirm(`¿Estás seguro de que querés revocar la completion de "#${completion.demon_position} ${completion.demon_name}"? Se quitarán los puntos automáticamente.`)) return;
    
    setRevokingId(completion.id);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "rejected",
          rejection_reason: "Revocado por moderador",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", completion.id)
        .eq("status", "approved");

      if (error) throw error;

      setCompletions((prev) => prev.filter((c) => c.id !== completion.id));
      setProfile((prev) => ({
        ...prev,
        total_points: Math.max(0, (prev.total_points || 0) - (completion.points || 100)),
        completed_demons_count: Math.max(0, (prev.completed_demons_count || 0) - 1),
      }));
    } catch (err) {
      alert("Error al revocar: " + (err.message || err));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="card-gradient-border flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <Avatar src={profile.avatar_url} alt={profile.username} size="xl" />
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-white">{profile.username}</h1>
          {profile.gd_username && (
            <p className="text-sm text-zinc-400">GD: {profile.gd_username}</p>
          )}
          {country && (
            <p className="text-sm text-zinc-400">{country} {profile.country_code}</p>
          )}
          {profile.rank && (
            <p className="mt-1 text-sm text-accent-cyan">Global Rank #{profile.rank}</p>
          )}
          {profile.role !== "user" && (
            <span className="mt-1 inline-block rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-0.5 text-xs font-medium capitalize text-cyan-300">
              {profile.role}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/profile/edit`}
          className="rounded-xl border border-base-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-base-800"
        >
          Editar perfil
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Puntos totales" value={profile.total_points?.toLocaleString() || 0} />
        <StatCard label="Extreme Demons" value={profile.completed_demons_count || 0} />
        <StatCard label="Ranking global" value={profile.rank ? `#${profile.rank}` : "—"} />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">Completions aceptadas</h2>
        {completions.length === 0 ? (
          <p className="rounded-xl border border-base-700/60 bg-base-900/60 p-4 text-sm text-zinc-500">
            Este jugador todavía no tiene completions aprobadas.
          </p>
        ) : (
          <div className="grid gap-2">
            {completions.map((c) => (
              <div
                key={c.id}
                className="card-gradient-border flex items-center justify-between px-4 py-3 transition"
              >
                <Link href={`/demon/${c.demon_id}`} className="flex-1 min-w-0">
                  <span className="text-sm text-white">#{c.demon_position} — {c.demon_name}</span>
                  <span className="text-xs text-zinc-500 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
                </Link>
                {(isStaff || isAdmin) && (
                  <button
                    onClick={() => handleRevoke(c)}
                    disabled={revokingId === c.id}
                    className="ml-3 rounded-lg border border-accent-red px-3 py-1.5 text-xs font-medium text-accent-red transition hover:bg-accent-red/10 disabled:opacity-50"
                  >
                    {revokingId === c.id ? "Revocando..." : "Revocar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-base-700/60 bg-base-900 p-4 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
