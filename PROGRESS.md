# DLG Bookclub — Progress 🐅

> **Rule:** Every time you work on this project, update this file.
> Last updated: July 29, 2026

---

## Status Overview

| Phase | Status | Notes |
|---|---|---|
| **Foundation** | ✅ Done | Repo, Next.js, Supabase project, DB schema |
| **Auth** | ✅ Done | Win95 boot-up login, email check, auto-login, callback |
| **Registration** | ✅ Done | Self-registration form, pending_registrations, admin AgentMail notification |
| **UI Redesign** | ✅ Done | Retro Windows 95 full boot experience (BIOS → DOS → Win95 → login) |
| **Deploy** | ✅ Done | Vercel deployed, keepalive cron active |
| **Admin Panel** | ✅ Done | Win95-styled admin: approve/reject registrations, member list with search + remove |
| **Admin Seeded** | ✅ Done | a.nadeem89@gmail.com inserted in members table as admin (verified=true, is_admin=true) |
| **Wishlist** | ⏳ Next | Suggest + view books |
| **Book Poll** | ⏳ | Create, vote, close, announce |
| **Meeting Poll** | ⏳ | + Google Calendar integration |
| **Profile & Avatars** | ⏳ | |
| **Notifications** | ⏳ | AgentMail for member-facing emails |
| **Home Dashboard** | ⏳ | Quote of the week, activity feed |

---

## ✅ Phase 1 — Foundation

- [x] GitHub repo created: `asifnady/dlg-bookclub`
- [x] Supabase project created (`ozyvwadyfgqslvrckles.supabase.co`)
- [x] Next.js 15 scaffolded (TypeScript, Tailwind, App Router)
- [x] `@supabase/supabase-js` + `@supabase/ssr` installed
- [x] `lib/supabase/client.ts` + `lib/supabase/server.ts` created
- [x] Full DB schema with tables + indexes created in Supabase

---

## ✅ Phase 2 — Auth

- [x] Email-only check: user types email → `/api/check-email` checks `members` table
- [x] First-time (unverified): one-time magic link sent to verify email
- [x] Verified returning: auto-login via custom `dlg_session` cookie — no email sent
- [x] Non-member: registration form appears (First Name, Last Name, City)
- [x] API routes: `/api/check-email`, `/api/session` (create/validate), `/api/logout`, `/api/register`
- [x] Auth callback: `/auth/callback` marks members as `verified=true` on first login
- [x] Middleware: checks both Supabase session AND custom `dlg_session` cookie
- [x] DB: added `verified`, `first_name`, `last_name`, `city`, `session_token`, `session_expires_at` to `members`

---

## ✅ Phase 3 — Self-Registration with Admin Approval

- [x] `/api/register` — creates `pending_registrations` row + AgentMail notification
- [x] Registration form in Win95 dialog for non-members
- [x] "Already pending" and "Submitted" states handled
- [x] Notifications sent to `deskofasifnadeem@agentmail.to`

---

## ✅ Phase 4 — Retro Windows 95 UI

- [x] Full BIOS boot sequence (POST, memory test, drive detection)
- [x] MS-DOS startup (HIMEM.SYS + EMM386.EXE)
- [x] Windows 95 splash (colorful logo, animated loading bar)
- [x] Win95 desktop (teal background, icons, taskbar with Start + clock)
- [x] Win95 login dialog (raised/sunken borders, blue title bar)

---

## ✅ Phase 5 — Deployment & Keepalive

- [x] GitHub → Vercel auto-deploy at https://dlg-bookclub.vercel.app
- [x] Env vars configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AGENTMAIL_API_KEY`
- [x] OpenClaw cron job pings Supabase REST API every 2 days

---

## ✅ Phase 6 — Admin Panel

- [x] Win95-styled `/admin` page with Pending Approvals + Members tabs
- [x] Approve: creates member in `members` table, marks pending as approved
- [x] Reject: marks pending as rejected
- [x] Members tab: search, list with emails, remove with confirmation
- [x] Admin guard via `lib/admin-auth.ts` (session cookie + `is_admin` flag)
- [x] 🛠️ Admin Panel button visible only to admin users
- [x] API routes: pending (list/approve/reject) + members (list/remove)

---

## ✅ Phase 7 — Admin Seeded

- [x] `a.nadeem89@gmail.com` inserted into `members` via Supabase REST API
- [x] `is_admin: true`, `verified: true`
- [x] Auto-login works for admin

---

## ✅ Phase 8 — Wishlist

- [x] `POST /api/books` — suggest a book (title, author, amazon_link)
- [x] `GET /api/books` — list books with `?past=true` filter
- [x] Wishlist view with sort (newest first)
- [x] Past reads segmented toggle
- [x] Suggest a Book Win95 modal dialog
- [x] Member dashboard now shows books tab with book list

## ⏳ Phase 9 — Book Poll

- [ ] Poll creation flow (pick 5 books)
- [ ] Vote page with checkboxes + countdown
- [ ] Auto-close + winner detection
- [ ] Results display

## ⏳ Phase 10 — Meeting Poll

- [ ] Admin creates meeting poll (date options)
- [ ] Multi-vote for members
- [ ] Auto-select winner + Google Calendar event
- [ ] Meeting confirmation display

## ⏳ Phase 11 — Profile & Avatars

- [ ] Avatar selection (fictional characters grid)
- [ ] Profile page: members list, suggestions, votes

## ⏳ Phase 12 — Notifications (AgentMail)

- [ ] Member-facing emails (invites, poll alerts, meeting reminders)
- [ ] Notification pause toggle

## ⏳ Phase 13 — Home Dashboard

- [ ] Quote of the week from `quotes` table
- [ ] Active poll / meeting cards
- [ ] Member activity feed

---

## Key Decisions

- **Stack:** Next.js 15 + TypeScript + Tailwind + Supabase + AgentMail + Google Calendar
- **Auth:** Hybrid — Supabase magic link (one-time verify) + custom session token (returning)
- **UI:** Retro Windows 95 boot-up experience
- **Registration:** Self-registration with admin approval
- **Notifications:** AgentMail (`deskofasifnadeem@agentmail.to`)
- **Deploy:** Vercel (auto-deploy from GitHub)
- **Keepalive:** OpenClaw cron every 2 days
- **Cost:** $0/month (free tiers)
- **Supabase project:** `ozyvwadyfgqslvrckles.supabase.co`
- **Movies tab (designed, not built):** Shared feed of member movie/series recommendations. Replaces Profile in bottom tab bar; Profile moves to gear/avatar icon top-right. New tables: `media`, `media_recommendations`. Auto-fetch from TMDB + OMDb. Monthly email digest. Self-serve publishing (no admin approval). RT rating as bonus.

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main app: BIOS → Win95 login → dashboard |
| `app/login/page.tsx` | Glass-morphism login page |
| `app/admin/page.tsx` | Admin panel UI |
| `app/api/check-email/route.ts` | Email lookup (not_found / unverified / verified) |
| `app/api/register/route.ts` | New member registration |
| `app/api/session/route.ts` | Session create + check |
| `app/api/logout/route.ts` | Clear session |
| `app/api/admin/*` | Admin API routes |
| `app/auth/callback/route.ts` | Magic link OTP callback |
| `lib/supabase/*` | Supabase client config |
| `lib/admin-auth.ts` | Admin session verification |
| `middleware.ts` | Route protection |
| `PROGRESS.md` | This file — progress tracker |
| `PLAN.md` | Build plan by phase |
| `DESIGN.md` | Full spec / design document |
| `SCHEMA.md` | Database schema reference |

## Known Issues

- [ ] Chicken-egg: first admin needs manual seeding (done once, no automation for it)
- [ ] Mobile responsiveness for Win95 UI
