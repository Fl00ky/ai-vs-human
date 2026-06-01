import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin guard. Returns the Supabase client + userId when the caller
 * is an authenticated admin, otherwise null. Never trust the client for this.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (!(data as { is_admin: boolean } | null)?.is_admin) return null;
  return { supabase, userId: session.user.id };
}
