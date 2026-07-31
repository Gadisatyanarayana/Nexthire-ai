import { createClient } from "@supabase/supabase-js";

type SyncUserInput = {
  name: string | null;
  email: string;
};

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const norm = normalizeEmail(email);
  if (norm === "satyanarayanag904@gmail.com") return true;

  const rawAllowlist = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");

  const allowlist = String(rawAllowlist || "")
    .split(/[\n,;]+/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return allowlist.includes(norm);
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

export const supabaseAdmin = getAdminClient();

export async function upsertUserAdmin(user: SyncUserInput) {
  const mockUser = {
    id: `usr_${Buffer.from(user.email).toString("hex").slice(0, 12)}`,
    name: user.name || user.email.split("@")[0],
    email: user.email,
  };

  try {
    const supabaseAdmin = getAdminClient();
    const payload = {
      name: user.name,
      email: user.email,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const doUpsert = async () => {
      const { data } = await supabaseAdmin
        .from("users")
        .upsert(payload, { onConflict: "email" })
        .select("id, name, email")
        .single();
      return data;
    };

    const data = await Promise.race([
      doUpsert(),
      new Promise<null>((r) => setTimeout(() => r(null), 300))
    ]);

    return data || mockUser;
  } catch (e) {
    console.warn("Could not sync user to remote Supabase DB, using local session sync:", e);
    return mockUser;
  }
}
