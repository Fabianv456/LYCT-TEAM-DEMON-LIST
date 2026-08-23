"use client";

import Link from "next/link";

export default function DemonCard({ demon }) {
  const difficultyColor = {
    "Easy Demon": "text-emerald-400 border-emerald-500/40",
    "Medium Demon": "text-yellow-400 border-yellow-500/40",
    "Hard Demon": "text-orange-400 border-orange-500/40",
    "Insane Demon": "text-red-400 border-red-500/40",
    "Extreme Demon": "text-accent-red border-accent-red/40",
  };

  return (
    <Link
      href={`/demon/${demon.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-base-700/60 bg-base-900 transition hover:border-accent-cyan/60"
    >
      {demon.background_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition duration-500 group-hover:opacity-50"
          style={{ backgroundImage: `url(${demon.background_url})` }}
        />
      )}
      <div className="relative flex flex-col sm:flex-row items-center gap-5 p-5">
        <div className="relative h-32 w-32 flex-none">
          {demon.thumbnail_url ? (
            <img
              src={demon.thumbnail_url}
              alt={demon.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-base-800 text-xs text-zinc-600">Sin img</div>
          )}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-xl font-semibold text-white transition group-hover:text-accent-cyan">
            #{demon.position} — {demon.name}
          </h3>
          <p className="text-sm text-zinc-400">por {demon.creator}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyColor[demon.difficulty] || "text-zinc-300 border-base-700"}`}>
              {demon.difficulty}
            </span>
            <span className="text-xs text-zinc-500">ID: {demon.level_id}</span>
            <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 text-xs font-medium text-cyan-300">
              {demon.points || 100} pts
            </span>
          </div>
        </div>

        {demon.extreme_demon_icon_url ? (
          <img
            src={demon.extreme_demon_icon_url}
            alt="Extreme Demon"
            className="h-24 w-24 flex-none object-contain"
          />
        ) : (
          <span className="text-6xl">🔥</span>
        )}
      </div>
    </Link>
  );
}
