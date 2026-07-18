import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = await createClient();

    // Get the member
    const { data: members, error } = await supabase
      .from("members")
      .select("id, email, verified, name, first_name, last_name, is_admin")
      .eq("email", cleanEmail)
      .eq("verified", true)
      .limit(1);

    if (error || !members || members.length === 0) {
      return NextResponse.json({ error: "Not found or not verified" }, { status: 404 });
    }

    const member = members[0];

    // Generate a session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store in database
    const { error: updateError } = await supabase
      .from("members")
      .update({
        session_token: sessionToken,
        session_expires_at: expiresAt.toISOString(),
      })
      .eq("id", member.id);

    if (updateError) {
      console.error("session update error:", updateError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const displayName = member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Member";

    // Set session cookie
    const response = NextResponse.json({
      status: "ok",
      member: {
        id: member.id,
        email: member.email,
        name: displayName,
        is_admin: member.is_admin,
      },
    });

    response.cookies.set("dlg_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error("session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET: check if current session is valid
export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/dlg_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ user: null });
    }

    const sessionToken = match[1];
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from("members")
      .select("id, email, verified, name, first_name, last_name, is_admin")
      .eq("session_token", sessionToken)
      .gte("session_expires_at", new Date().toISOString())
      .limit(1);

    if (error || !members || members.length === 0) {
      return NextResponse.json({ user: null });
    }

    const member = members[0];
    const displayName = member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Member";

    return NextResponse.json({
      user: {
        id: member.id,
        email: member.email,
        name: displayName,
        is_admin: member.is_admin,
      },
    });
  } catch (err) {
    console.error("session get error:", err);
    return NextResponse.json({ user: null });
  }
}
