import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || PLACEHOLDER_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER_KEY;

  try {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch {
    return createClient(PLACEHOLDER_URL, PLACEHOLDER_KEY, {
      auth: { persistSession: false },
    });
  }
}

export const supabaseAdmin = getAdminClient();

export async function upsertUserAdmin(user: SyncUserInput) {
  const mockUser = {
    id: `usr_${Buffer.from(user.email).toString("hex").slice(0, 12)}`,
    name: user.name || user.email.split("@")[0],
    email: user.email,
  };

  try {
    const client = getAdminClient();

    const payload = {
      name: user.name,
      email: user.email,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const doUpsert = async () => {
      // Check if user exists to trigger welcome email
      const { data: existingUser } = await client.from("users").select("id").eq("email", user.email).maybeSingle();
      const isNewUser = !existingUser;

      const { data } = await client
        .from("users")
        .upsert(payload, { onConflict: "email" })
        .select("id, name, email")
        .single();
        
      if (isNewUser && process.env.RESEND_API_KEY && data?.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: "NextHire AI <onboarding@resend.dev>",
              to: [data.email],
              subject: "Welcome to NextHire AI! 🚀",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to NextHire AI, ${data.name || 'Explorer'}!</h2>
                  <p>Thank you for joining NextHire AI. Our platform is designed to give you enterprise-grade mock interviews to help you ace your placements.</p>
                  <h3>What's next?</h3>
                  <ul>
                    <li>Upload your resume to get personalized interview questions.</li>
                    <li>Try a Mock Interview with one of our strict HR personas (like Google or Amazon).</li>
                    <li>Check your Analytics dashboard to see where you can improve!</li>
                  </ul>
                  <p>Happy interviewing!</p>
                  <p>— The NextHire AI Team</p>
                </div>
              `
            })
          });
          console.log("[LOG] Welcome email sent to", data.email);
        } catch (err) {
          console.error("Failed to send welcome email:", err);
        }
      }
      
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
