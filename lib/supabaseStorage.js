"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";

const BUCKET = "demon-images";

export async function uploadDemonImage(file, demonId) {
  const supabase = supabaseBrowser();
  const ext = file.name.split(".").pop();
  const path = `${demonId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteDemonImage(path) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
