# DLG Bookclub 📚

A retro Windows 95/98-themed book club webapp for the DLG reading circle (~10-30 members).

**Live:** https://dlg-bookclub.vercel.app  
**Repo:** https://github.com/asifnady/dlg-bookclub

---

## Features

- **Retro Win95 Boot Experience** — BIOS → DOS → splash → desktop → login
- **Email-Only Auth** — Check email, auto-login returning users, magic link for first-time verification, registration for new members
- **Admin Approval Flow** — New registrations wait for admin approval; admin notified via AgentMail
- **Admin Panel** — Win95-styled admin dashboard at `/admin` to approve/reject registrations, manage members
- **Custom Session System** — 30-day `dlg_session` cookie, middleware-protected routes
- **AgentMail Integration** — Registration notifications sent to `deskofasifnadeem@agentmail.to`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Custom session system (email-only, no passwords)
- **Email:** Resend (magic links), AgentMail (admin notifications)
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables — copy to .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
#   RESEND_API_KEY=<your-resend-key>
#   AGENTMAIL_API_KEY=<your-agentmail-key>

# Run dev server
npm run dev
```

## Database

Run `supabase-schema.sql` then `schema-migration.sql` in Supabase SQL Editor.
Add RLS policies for `pending_registrations` (INSERT, SELECT, UPDATE for anon).

## Project Structure

```
app/
├── page.tsx              # Main app (login/register UI)
├── login/page.tsx        # Dedicated login page
├── admin/page.tsx        # Admin panel
├── api/
│   ├── check-email/      # Check if email exists
│   ├── register/         # Submit registration
│   ├── session/          # Create/verify session
│   ├── logout/           # Clear session
│   ├── admin/
│   │   ├── pending/      # List pending registrations
│   │   ├── pending/[id]/ # Approve/reject registration
│   │   └── members/      # List/remove members
│   └── auth/callback/    # Magic link callback
├── auth/callback/        # Auth callback page
lib/
├── supabase/
│   ├── client.ts         # Browser supabase client
│   └── server.ts         # Server supabase client
├── admin-auth.ts         # Admin session verification
middleware.ts             # Route protection
```

## Docs

- [PROGRESS.md](./PROGRESS.md) — What's built and what's next
- [PLAN.md](./PLAN.md) — Build plan by phase
- [DESIGN.md](./DESIGN.md) — Design spec
- [SCHEMA.md](./SCHEMA.md) — Database schema reference
