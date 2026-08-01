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
  // Admin approval = verification: member can log in immediately (no magic link needed)
  const displayName = `${pending.first_name} ${pending.last_name}`.trim();

  // Insert member
  const { error: memberError } = await supabase.from("members").insert({
    email: pending.email,
    name: displayName,
    first_name: pending.first_name,
    last_name: pending.last_name,
    city: pending.city,
    verified: true, // admin approval is sufficient for verification
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

  // Welcome email to the new member (via AgentMail)
  const agentmailKey = process.env.AGENTMAIL_API_KEY;
  if (agentmailKey) {
    try {
      const res = await fetch(
        "https://api.agentmail.to/v0/inboxes/deskofasifnadeem@agentmail.to/messages/send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${agentmailKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: [pending.email],
            subject: "🎉 YOU'RE IN! Welcome to DLG Bookclub (This Is Kind of a Big Deal)",
            text: `Greetings, ${pending.first_name}! I'm not Ron Burgundy, but I play one at book club. And on behalf of the most distinguished reading society this side of anywhere: YOUR MEMBERSHIP HAS BEEN APPROVED.\n\nYou may now log in at https://dlg-bookclub.vercel.app/login with your email (${pending.email}). No password needed — because when you're this important, you don't need passwords. You need BOOKS.\n\nWe read. We discuss. We occasionally get very serious about snacks. And now, you're officially part of it. I've been waiting for you. We all have. Mostly me.\n\nHappy reading, you magnificent bibliophile!\n— The DLG Bookclub`,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error("AgentMail welcome error:", res.status, errText);
      }
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }
  }

  return NextResponse.json({ status: "approved" });
}
