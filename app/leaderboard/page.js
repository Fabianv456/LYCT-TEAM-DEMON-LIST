"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import LeaderboardCard from "@/components/LeaderboardCard";

export default function GlobalLeaderboardPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("global_leaderboard")
        .select("*")
        .order("rank", { ascending: true });

      setPlayers(data || []);
      setLoading(false);
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

      <div className="grid gap-3">
        {players.map((player) => (
          <LeaderboardCard key={player.id} player={player} rank={player.rank} />
        ))}
      </div>

      {players.length === 0 && (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          Todavía no hay jugadores en la leaderboard.
        </p>
      )}
    </div>
  );
}
