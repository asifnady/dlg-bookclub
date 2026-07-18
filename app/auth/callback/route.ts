import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();

  // Exchange the auth code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const userEmail = data.user.email;
  if (!userEmail) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Check if user is in the members table
  const { data: members } = await supabase
    .from("members")
    .select("id, email, verified, name, first_name, last_name, is_admin")
    .eq("email", userEmail.toLowerCase())
    .limit(1);

  if (members && members.length > 0) {
    const member = members[0];

    // Mark as verified if not already
    if (!member.verified) {
      await supabase
        .from("members")
        .update({ verified: true })
        .eq("id", member.id);
    }

    // Create a session token for auto-login
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("members")
      .update({
        session_token: sessionToken,
        session_expires_at: expiresAt,
      })
      .eq("id", member.id);

    // Redirect with session cookie
    const response = NextResponse.redirect(`${origin}${next}`);
    response.cookies.set("dlg_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  }

  // User authenticated via Supabase but not in members — possibly pending approval
  return NextResponse.redirect(`${origin}/login?error=not_member`);
}
