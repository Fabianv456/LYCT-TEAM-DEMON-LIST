"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [gdUsername, setGdUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signUp({
        email,
        password,
        options: {
          data: {
            username,
            gd_username: gdUsername,
          },
        },
      });
      alert("Cuenta creada correctamente. Ya podés iniciar sesión.");
      router.push("/login");
    } catch (err) {
      const msg = err.message || "Error al crear la cuenta.";
      if (msg.includes("rate limit") || msg.includes("429") || msg.includes("security purposes")) {
        setError("Se enviaron muchos emails de confirmación. Esperá 1 hora o deshabilitá la confirmación de email en Supabase.");
      } else {
        setError(msg);
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="card-gradient-border p-6">
        <h1 className="font-display text-2xl font-bold text-white">Crear cuenta</h1>
        <p className="mt-1 text-sm text-zinc-400">Registrate en LYCT TEAM.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Usuario</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Nombre en Geometry Dash</label>
            <input
              value={gdUsername}
              onChange={(e) => setGdUsername(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent-gradient py-2.5 font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          ¿Ya tenés cuenta? <Link href="/login" className="text-accent-cyan hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
