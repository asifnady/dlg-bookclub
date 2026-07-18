import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Clear session token from DB
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/dlg_session=([^;]+)/);
    if (match) {
      const supabase = await createClient();
      await supabase
        .from("members")
        .update({ session_token: null, session_expires_at: null })
        .eq("session_token", match[1]);
    }

    const response = NextResponse.json({ status: "ok" });
    response.cookies.set("dlg_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("logout error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
