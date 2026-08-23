"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";

function LeaderboardCard({ player, rank }) {
  const country = player.country_code
    ? String.fromCodePoint(...[...player.country_code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : "";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-base-700/60 bg-base-900 p-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-base-800 font-display text-sm font-bold text-white">
        #{rank}
      </div>

      <Avatar src={player.avatar_url} alt={player.username} size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-semibold text-white truncate">{player.username}</p>
        {country && (
          <p className="text-xs text-zinc-500">{country} {player.country_code}</p>
        )}
      </div>

      <div className="flex-none text-right">
        <p className="font-display text-lg font-bold text-white">{(player.total_points || 0).toLocaleString()}</p>
        <p className="text-xs text-zinc-500">{player.completed_demons_count || 0} ED</p>
      </div>
    </div>
  );
}

export default function GlobalLeaderboardPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("global_leaderboard")
          .select("*")
          .order("rank", { ascending: true });

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        setError(err.message || "Error al cargar el leaderboard global.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-base-900" />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Leaderboard Global</h1>
        <p className="mt-1 text-sm text-zinc-400">Ranking mundial de jugadores por puntos.</p>
      </div>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      <div className="grid gap-3">
        {players.map((player) => (
          <LeaderboardCard key={player.id} player={player} rank={player.rank} />
        ))}
      </div>

      {!error && players.length === 0 && (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          Todavía no hay jugadores en la leaderboard.
        </p>
      )}
    </div>
  );
}
