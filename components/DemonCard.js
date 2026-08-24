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
      className="group card-gradient-border card-gradient-border-lg block p-4 transition"
    >
      {demon.background_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition duration-500 group-hover:opacity-50"
          style={{ backgroundImage: `url(${demon.background_url})` }}
        />
      )}
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-accent-gradient font-display text-lg font-bold text-white shadow-glow">
          #{demon.position}
        </div>

        <div className="h-16 w-28 flex-none overflow-hidden rounded-lg bg-base-800">
          {demon.thumbnail_url ? (
            <img
              src={demon.thumbnail_url}
              alt={demon.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">Sin img</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-white transition group-hover:text-accent-cyan">
            {demon.name}
          </h3>
          <p className="truncate text-sm text-white">por {demon.creator}</p>
          <div className="mt-1 flex flex-wrap items-center justify-start gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyColor[demon.difficulty] || "text-zinc-300 border-base-700"}`}>
              {demon.difficulty}
            </span>
            <span className="text-xs text-zinc-500">ID: {demon.level_id}</span>
            <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
              {demon.points || 100} pts
            </span>
          </div>
        </div>

        {demon.extreme_demon_icon_url ? (
          <img
            src={demon.extreme_demon_icon_url}
            alt="Extreme Demon"
            className="h-12 w-12 flex-none object-contain"
          />
        ) : (
          <span className="text-3xl">🔥</span>
        )}
      </div>
    </Link>
  );
}
