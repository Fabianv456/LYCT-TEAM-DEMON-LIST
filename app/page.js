"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import DemonCard from "@/components/DemonCard";

export default function HomePage() {
  const supabase = supabaseBrowser();
  const [demons, setDemons] = useState([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("position");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let query = supabase.from("demons").select("*").order("position", { ascending: true });

        if (difficulty !== "all") {
          query = query.eq("difficulty", difficulty);
        }

        const { data, error } = await query;
        if (error) throw error;
        setDemons(data || []);
      } catch (err) {
        console.error("Error loading demons:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, difficulty]);

  const filtered = demons.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.creator.toLowerCase().includes(q) ||
      String(d.level_id).includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "position") return a.position - b.position;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "creator") return a.creator.localeCompare(b.creator);
    return 0;
  });

  return (
    <div className="animate-fade-in space-y-8">
      <section className="rounded-3xl border border-base-700/60 bg-base-900 p-8 text-center sm:p-12">
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          LYCT TEAM <span className="text-accent-cyan">DEMON LIST</span>
        </h1>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          Bienvenido a la lista oficial de Extreme Demons de LYCT TEAM.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/submit"
            className="rounded-2xl border border-accent-blue/40 bg-accent-blue/10 p-6 text-center transition hover:border-accent-cyan hover:bg-accent-cyan/10"
          >
            <p className="font-display text-lg font-semibold text-white">Enviar completion</p>
            <p className="mt-1 text-xs text-zinc-400">Registra tu última completion.</p>
          </Link>

          <Link
            href="/leaderboard"
            className="rounded-2xl border border-accent-blue/40 bg-accent-blue/10 p-6 text-center transition hover:border-accent-cyan hover:bg-accent-cyan/10"
          >
            <p className="font-display text-lg font-semibold text-white">Leaderboard</p>
            <p className="mt-1 text-xs text-zinc-400">Ranking mundial de jugadores.</p>
          </Link>

          <Link
            href="/leaderboard/countries"
            className="rounded-2xl border border-accent-blue/40 bg-accent-blue/10 p-6 text-center transition hover:border-accent-cyan hover:bg-accent-cyan/10"
          >
            <p className="font-display text-lg font-semibold text-white">Por País</p>
            <p className="mt-1 text-xs text-zinc-400">Ranking por países.</p>
          </Link>

          <a
            href="https://discord.gg/tu-invitacion"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-accent-blue/40 bg-accent-blue/10 p-6 text-center transition hover:border-accent-cyan hover:bg-accent-cyan/10"
          >
            <p className="font-display text-lg font-semibold text-white">Discord</p>
            <p className="mt-1 text-xs text-zinc-400">Únete a la comunidad.</p>
          </a>
        </div>
      </section>

      <section id="lista" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Demon List</h2>
            <p className="text-sm text-zinc-400">
              {demons.length} {demons.length === 1 ? "nivel" : "niveles"} en la lista.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, creador o ID..."
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-accent-cyan sm:w-64"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            >
              <option value="all">Todas las dificultades</option>
              <option value="Easy Demon">Easy Demon</option>
              <option value="Medium Demon">Medium Demon</option>
              <option value="Hard Demon">Hard Demon</option>
              <option value="Insane Demon">Insane Demon</option>
              <option value="Extreme Demon">Extreme Demon</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            >
              <option value="position">Orden: Ranking</option>
              <option value="name">Orden: Nombre</option>
              <option value="creator">Orden: Creador</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-base-900" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="rounded-2xl border border-base-700/60 bg-base-900/60 p-8 text-center text-zinc-500">
            No se encontraron niveles.
          </p>
        ) : (
          <div className="grid gap-4">
            {sorted.map((demon) => (
              <DemonCard key={demon.id} demon={demon} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
