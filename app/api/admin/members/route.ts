import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET /api/admin/members — list all members (admin only)
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, email, name, first_name, last_name, city, verified, is_admin, avatar, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list members error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}

// POST /api/admin/members — remove a member (admin only)
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({}));
  if (!id) {
    return NextResponse.json({ error: "Member ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").delete().eq("id", id);

  if (error) {
    console.error("remove member error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ status: "removed" });
}
