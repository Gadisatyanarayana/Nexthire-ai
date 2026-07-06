import { createClient } from "@supabase/supabase-js";

type SyncUserInput = {
  name: string | null;
  email: string;
};

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const rawAllowlist = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");

  const allowlist = String(rawAllowlist || "")
    .split(/[\n,;]+/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  if (allowlist.length === 0) return false;
  return allowlist.includes(normalizeEmail(email));
}

export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function upsertUserAdmin(user: SyncUserInput) {
  const supabaseAdmin = getAdminClient();

  const payload = {
    name: user.name,
    email: user.email,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(payload, { onConflict: "email" })
    .select("id, name, email")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to sync user");
  }

  return data;
}
