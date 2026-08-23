"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { COUNTRIES } from "@/components/CountrySelector";

export default function CountryLeaderboardPage({ params }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const { countryCode } = params;

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const country = COUNTRIES.find((c) => c.code === countryCode);
      setCountryName(country ? `${country.flag} ${country.name}` : countryCode);

      const { data } = await supabase
        .from("country_leaderboard")
        .select("*")
        .eq("country_code", countryCode)
        .order("rank", { ascending: true });

      setPlayers(data || []);
      setLoading(false);
    }
    load();
  }, [supabase, countryCode]);

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
    </div>
  );
}
