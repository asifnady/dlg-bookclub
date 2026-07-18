import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

export async function verifyAdmin(req: Request): Promise<AdminUser | null> {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/dlg_session=([^;]+)/);
  if (!match) return null;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, email, name, first_name, last_name, is_admin")
    .eq("session_token", match[1])
    .gte("session_expires_at", new Date().toISOString())
    .eq("is_admin", true)
    .limit(1);

  if (!members || members.length === 0) return null;

  const m = members[0];
  return {
    id: m.id,
    email: m.email,
    name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Admin",
    is_admin: true,
  };
}
