import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check members table using REST API (bypass RLS for anon key on SELECT)
    const { data: members, error } = await supabase
      .from("members")
      .select("id, email, verified, first_name, last_name, name")
      .eq("email", email.toLowerCase().trim())
      .limit(1);

    if (error) {
      console.error("check-email error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ status: "not_found" });
    }

    const member = members[0];
    if (!member.verified) {
      return NextResponse.json({ status: "unverified", member: { email: member.email } });
    }

    // Verified member — return their basic info
    return NextResponse.json({
      status: "verified",
      member: {
        id: member.id,
        email: member.email,
        name: member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim(),
      },
    });
  } catch (err) {
    console.error("check-email error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
