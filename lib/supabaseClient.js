"use client";

import { createBrowserClient } from "@supabase/ssr";

// Este helper crea (o reutiliza) el cliente de Supabase en el navegador.
// Se usa en todos los componentes "client" que necesitan leer/escribir datos.
let client;

export function supabaseBrowser() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Faltan variables de entorno de Supabase. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    throw new Error("Supabase no configurado");
  }

  client = createBrowserClient(url, key);
  return client;
}
