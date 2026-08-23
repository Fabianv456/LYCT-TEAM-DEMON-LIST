"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function CountriesLeaderboardPage() {
  const supabase = supabaseBrowser();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("country_leaderboard")
          .select("country_code, total_points, completed_demons_count")
          .order("total_points", { ascending: false });

        if (error) throw error;

        if (data) {
          const countryMap = new Map();
          data.forEach((row) => {
            const existing = countryMap.get(row.country_code);
            if (!existing || row.total_points > existing.total_points) {
              countryMap.set(row.country_code, row);
            }
          });
          const unique = Array.from(countryMap.values());
          setCountries(unique);
        }
      } catch (err) {
        console.error("Error loading countries leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const getCountryFlag = (code) => {
    if (!code) return "";
    return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Leaderboard por País</h1>
        <p className="mt-1 text-sm text-zinc-400">Ranking de países por puntos totales.</p>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-base-900" />
      ) : countries.length === 0 ? (
        <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
          Todavía no hay países en la leaderboard.
        </p>
      ) : (
        <div className="grid gap-3">
          {countries.map((country, index) => (
            <Link
              key={country.country_code}
              href={`/leaderboard/${country.country_code}`}
              className="flex items-center gap-4 rounded-2xl border border-base-700/60 bg-base-900 p-4 transition hover:border-accent-cyan/60"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-base-800 font-display text-sm font-bold text-white">
                #{index + 1}
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-semibold text-white">
                  {getCountryFlag(country.country_code)} {country.country_code}
                </p>
              </div>
              <div className="flex-none text-right">
                <p className="font-display text-lg font-bold text-white">{(country.total_points || 0).toLocaleString()}</p>
                <p className="text-xs text-zinc-500">{country.completed_demons_count || 0} ED</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
