"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function LeaderboardCard({ player, rank, showCountry = true }) {
  const code = (player.country_code || "").toUpperCase();
  const country = code
    ? String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : "";

  return (
    <Link
      href={`/profile/${player.username}`}
      className="card-gradient-border flex items-center gap-4 p-4 transition"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-base-800 font-display text-sm font-bold text-white">
        #{rank}
      </div>

      <Avatar src={player.avatar_url} alt={player.username} size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-semibold text-white truncate">{player.username}</p>
        {showCountry && country && (
          <p className="text-xs text-zinc-500">{country} {player.country_code}</p>
        )}
      </div>

      <div className="flex-none text-right">
        <p className="font-display text-lg font-bold text-white">{player.total_points.toLocaleString()}</p>
        <p className="text-xs text-zinc-500">{player.completed_demons_count} ED</p>
      </div>
    </Link>
  );
}
