"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import { COUNTRIES } from "@/components/CountrySelector";

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
        <p className="font-display text-lg font-bold text-white">{player.total_points.toLocaleString()}</p>
        <p className="text-xs text-zinc-500">{player.completed_demons_count} ED</p>
      </div>
    </div>
  );
}

export default function CountryLeaderboardPage({ params }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryName, setCountryName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let code = params?.countryCode;
    if (!code && typeof window !== "undefined") {
      const path = window.location.pathname;
      const match = path.match(/\/leaderboard\/([^\/]+)/);
      code = match ? match[1] : "";
    }
    if (!code) return;
    setCountryCode(code);

    async function load() {
      setLoading(true);
      setError("");
      try {
        const country = COUNTRIES.find((c) => c.code === code);
        setCountryName(country ? `${country.flag} ${country.name}` : code);

        const { data, error } = await supabase
          .from("country_leaderboard")
          .select("*")
          .eq("country_code", code)
          .order("rank", { ascending: true });

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        setError(err.message || "Error al cargar el leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, supabase]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link href="/leaderboard" className="text-sm text-zinc-400 hover:text-white">← Volver a leaderboard global</Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">Leaderboard {countryName}</h1>
        <p className="mt-1 text-sm text-zinc-400">Ranking de jugadores de este país por puntos.</p>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-base-900" />
      ) : players.length === 0 ? (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          Todavía no hay jugadores de este país en la leaderboard.
        </p>
      ) : (
        <div className="grid gap-3">
          {players.map((player) => (
            <LeaderboardCard key={player.id} player={player} rank={player.rank} showCountry={false} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-accent-red">{error}</p>}
    </div>
  );
}
