"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile, isStaff, isAdmin, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-40 border-b border-base-700/60 bg-base-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <img
            src="https://images-ext-1.discordapp.net/external/uSWIfFNnti4nMJIUBKr8gkXCJYAtb-8g40zlZ6hRz6o/%3Fsize%3D2048/https/cdn.discordapp.com/icons/1471710908672905247/954f15911f52774964390a9198524b24.png?format=webp&quality=lossless&width=768&height=768"
            alt="LYCT TEAM"
            className="h-8 w-8 rounded-lg object-cover"
          />
          LYCT TEAM
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <Link href="/#lista" className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
            Demon List
          </Link>
          <Link href="/leaderboard" className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
            Leaderboard
          </Link>
          <Link href="/leaderboard/countries" className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
            Por País
          </Link>
          <Link href="/submit" className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
            Enviar completion
          </Link>
          {user && (
            <Link href={`/profile/${profile?.username}`} className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
              Perfil
            </Link>
          )}
          {(isStaff || isAdmin) && (
            <Link href="/mod" className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-base-800 hover:text-white">
              Moderación
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-accent-red transition hover:bg-base-800 hover:text-white">
              Administración
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={toggle}
            className="rounded-lg border border-base-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-base-800"
          >
            {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
          </button>

          {!loading && (
            <>
              {user ? (
                <button
                  onClick={logout}
                  className="rounded-xl border border-base-700 px-3 py-2 text-xs text-zinc-300 transition hover:bg-base-800"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link href="/login" className="rounded-xl bg-accent-gradient px-4 py-2 text-xs font-medium text-white shadow-glow transition hover:opacity-90">
                  Iniciar sesión
                </Link>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden rounded-lg border border-base-700 px-3 py-2 text-sm text-zinc-300"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-base-700/60 bg-base-950 px-4 py-3 sm:hidden">
          <Link href="/#lista" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Demon List</Link>
          <Link href="/leaderboard" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Leaderboard</Link>
          <Link href="/leaderboard/countries" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Por País</Link>
          <Link href="/submit" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Enviar completion</Link>
          {user && (
            <Link href={`/profile/${profile?.username}`} className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Perfil</Link>
          )}
          {(isStaff || isAdmin) && (
            <Link href="/mod" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-base-800">Moderación</Link>
          )}
          {profile?.role === "admin" && (
            <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm text-accent-red hover:bg-base-800">Administración</Link>
          )}
          <button onClick={toggle} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-base-800">
            {theme === "dark" ? "☀️ Tema claro" : "🌙 Tema oscuro"}
          </button>
          {user && (
            <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-base-800">
              Cerrar sesión
            </button>
          )}
          {!user && (
            <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-accent-red hover:bg-base-800">Iniciar sesión</Link>
          )}
        </div>
      )}
    </nav>
  );
}
