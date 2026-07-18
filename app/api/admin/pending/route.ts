import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET /api/admin/pending — list all pending registrations (admin only)
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_registrations")
    .select("id, email, first_name, last_name, city, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list pending error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ registrations: data || [] });
}
