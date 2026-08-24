"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import { COUNTRIES } from "@/components/CountrySelector";
import LeaderboardCard from "@/components/LeaderboardCard";

export default function CountryLeaderboardPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const params = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryName, setCountryName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const code = params?.countryCode;
        if (!code) return;

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
            <LeaderboardCard key={player.id} player={player} rank={player.rank} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-accent-red">{error}</p>}
    </div>
  );
}
