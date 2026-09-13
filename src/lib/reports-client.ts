import { supabase } from "@/integrations/supabase/client";

// Keep the existing feature imports stable while using this project's
// managed backend for reports and administrator authentication.
export const reportsDb = supabase;

export function generateTrackId(): string {
  // 10-digit numeric code
  const bytes = new Uint8Array(10);
  (typeof crypto !== "undefined" ? crypto : (globalThis as any).crypto).getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 10; i++) out += (bytes[i] % 10).toString();
  return out;
}
