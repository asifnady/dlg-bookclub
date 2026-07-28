import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/dlg_session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify session
  const { data: members } = await supabase
    .from("members")
    .select("id")
    .eq("session_token", match[1])
    .gte("session_expires_at", new Date().toISOString())
    .limit(1);

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Parse query params
  const url = new URL(req.url);
  const past = url.searchParams.get("past");
  const isPastRead = past === "true" ? true : past === "false" ? false : undefined;

  let query = supabase
    .from("books")
    .select(`
      id,
      title,
      author,
      amazon_link,
      is_past_read,
      month_read,
      created_at,
      suggested_by,
      members!books_suggested_by_fkey ( name, first_name, last_name, avatar )
    `)
    .order("created_at", { ascending: false });

  if (isPastRead !== undefined) {
    query = query.eq("is_past_read", isPastRead);
  }

  const { data: books, error } = await query;

  if (error) {
    console.error("GET /api/books error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/dlg_session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify session and get member (including is_admin for past-read additions)
  const { data: members } = await supabase
    .from("members")
    .select("id, is_admin")
    .eq("session_token", match[1])
    .gte("session_expires_at", new Date().toISOString())
    .limit(1);

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const member = members[0];
  const body = await req.json();
  const { title, author, amazon_link, is_past_read, month_read } = body;

  if (!title?.trim() || !author?.trim()) {
    return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
  }

  // Build insert — only admins can set is_past_read + month_read
  const isPast = !!is_past_read;
  if (isPast && !member.is_admin) {
    return NextResponse.json({ error: "Only admins can add past reads" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("books")
    .insert({
      title: title.trim(),
      author: author.trim(),
      amazon_link: amazon_link?.trim() || null,
      suggested_by: member.id,
      is_past_read: isPast,
      month_read: isPast && month_read ? month_read : null,
    })
    .select()
    .single();

  if (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", book: data });
}
