import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/admin-auth";

// POST /api/admin/pending/[id]/approve — approve a registration
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action; // 'approve' or 'reject'

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get the pending registration
  const { data: pending } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("id", id)
    .single();

  if (!pending) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  if (pending.status !== "pending") {
    return NextResponse.json({ error: `Registration already ${pending.status}` }, { status: 400 });
  }

  if (action === "reject") {
    const { error: rejectError } = await supabase
      .from("pending_registrations")
      .update({ status: "rejected" })
      .eq("id", id);

    if (rejectError) {
      console.error("reject error:", rejectError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ status: "rejected" });
  }

  // Approve: create member + mark pending as approved
  const displayName = `${pending.first_name} ${pending.last_name}`.trim();

  // Insert member
  const { error: memberError } = await supabase.from("members").insert({
    email: pending.email,
    name: displayName,
    first_name: pending.first_name,
    last_name: pending.last_name,
    city: pending.city,
    verified: false, // they still need to verify via magic link once
    is_admin: false,
  });

  if (memberError) {
    console.error("create member error:", memberError);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }

  // Mark pending as approved
  const { error: updateError } = await supabase
    .from("pending_registrations")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) {
    console.error("update pending error:", updateError);
    // Non-fatal — member was already created
  }

  return NextResponse.json({ status: "approved" });
}
