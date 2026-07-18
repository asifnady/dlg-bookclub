import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, first_name, last_name, city } = await req.json();

    if (!email || !first_name || !last_name || !city) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = await createClient();

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("email", cleanEmail)
      .limit(1);

    if (existingMember && existingMember.length > 0) {
      return NextResponse.json({ status: "already_member" });
    }

    // Insert into pending_registrations
    const { error: insertError } = await supabase
      .from("pending_registrations")
      .insert({
        email: cleanEmail,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        city: city.trim(),
        status: "pending",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ status: "already_pending" });
      }
      console.error("register error:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Send approval email via Resend API
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "DLG Bookclub <onboarding@resend.dev>",
            to: ["a.nadeem89@gmail.com"],
            subject: `📚 New Registration: ${first_name.trim()} ${last_name.trim()}`,
            text: `New DLG Bookclub registration request:

Name: ${first_name.trim()} ${last_name.trim()}
Email: ${cleanEmail}
City: ${city.trim()}

To approve, update pending_registrations status to 'approved' and create a members entry.`,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Resend API error:", errText);
        }
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr);
      }
    }

    return NextResponse.json({ status: "submitted" });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
