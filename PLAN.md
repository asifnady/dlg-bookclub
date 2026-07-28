# DLG Bookclub — Build Plan

> Based on spec: `DESIGN.md`
> Last updated: July 29, 2026

---

## Phase 1: Foundation ✅

### 1.1 Create Supabase Project
- Project "dlg-bookclub", URL: `ozyvwadyfgqslvrckles.supabase.co`
- Region: Europe
- Keys: anon public key + service_role key in Vercel env vars

### 1.2 Run Database Schema
- All tables created (see `SCHEMA.md`)

### 1.3 Scaffold Next.js
- Next.js 15 + TypeScript + Tailwind + App Router
- `@supabase/supabase-js` + `@supabase/ssr` installed
- `lib/supabase/client.ts` + `lib/supabase/server.ts`

### 1.4 Wire Vercel Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AGENTMAIL_API_KEY`

---

## Phase 2: Auth ✅

### 2.1 Email-Only Login
- `/api/check-email` — checks `members` table (not_found / unverified / verified)
- `/api/session` — POST creates 30-day session token, GET validates
- `/api/logout` — clears session from DB + cookie

### 2.2 Magic Link Verification
- Supabase OTP for first-time email verification
- `/auth/callback` — exchange code, mark verified, create session

### 2.3 Middleware
- Check `dlg_session` cookie + Supabase auth session
- Redirect to `/login` for protected routes

---

## Phase 3: Registration ✅

### 3.1 Registration Form
- Non-member email → registration form (First Name, Last Name, City)
- Creates `pending_registrations` row

### 3.2 Admin Notification
- AgentMail notification to `deskofasifnadeem@agentmail.to`

### 3.3 Admin Approval
- Approve: creates `members` row, marks pending as approved
- Reject: marks pending as rejected

---

## Phase 4: Win95 UI ✅

### 4.1 Boot Sequence
- BIOS POST → MS-DOS → Win95 splash → desktop → login dialog

### 4.2 Win95 Components
- Desktop icons, taskbar with Start + clock, dialog boxes with raised/sunken borders

---

## Phase 5: Deployment ✅

### 5.1 Vercel
- GitHub → Vercel auto-deploy
- Env vars configured

### 5.2 Keepalive
- OpenClaw cron job queries Supabase REST API every 2 days

---

## Phase 6: Admin Panel ✅

### 6.1 Admin Guard
- `lib/admin-auth.ts` — verifies `dlg_session` cookie + `is_admin` flag

### 6.2 Pending Approvals Tab
- List pending registrations, Approve/Reject buttons

### 6.3 Members Tab
- Full list with emails, search, remove

---

## Phase 7: Admin Seeded ✅

### 7.1 Database Insert
- `a.nadeem89@gmail.com` inserted into `members` with `is_admin=true`, `verified=true`

---

## Phase 8: Book Wishlist ✅

### 8.1 Suggest a Book ✅
- Win95 modal dialog: Title, Author, Amazon link (opt)
- Auto-fill "suggested by" from logged-in user
- Only visible on Wishlist tab

### 8.2 Wishlist View ✅
- List all suggested books on Books tab
- Sort by most recent (newest first)

### 8.3 Past Reads View ✅
- Segmented toggle on Books tab alongside Wishlist
- Books where `is_past_read = true`
- Admin-only **"Add Past Read"** button (for migrating existing books)
- Month read picker in dialog

**Approach:** Built UI + API routes in one session.

---

## Phase 8b: Movies Tab ⏳

### 8b.1 Create `media` + `media_recommendations` Tables
- Run migration in Supabase (see SCHEMA.md for full columns)

### 8b.2 TMDB + OMDb API Wrappers
- `lib/tmdb.ts` — fetch poster, genre, year by search; dedup by tmdb_id
- `lib/omdb.ts` — fetch imdb_rating by title+year
- RT rating bonus: optional periodic fetch, leave null if unavailable

### 8b.3 Recommendation CRUD API
- `POST /api/media/recommend` — add (creates media row if new, links member)
- `PATCH /api/media/recommend` — update `loved_this_because`
- `DELETE /api/media/recommend` — delete own recommendation
- `GET /api/media/feed` — fetch all recs newest-first, with member+media joins

### 8b.4 Movies Tab UI
- Shared feed: cards with poster, ratings, genre, title, type, recommender, "Loved this because"
- "+" button → search modal → select movie → write review → publish
- Edit/delete UI on own recommendations (ellipsis menu)

### 8b.5 Tab Bar Restructure
- Replace Profile tab with Movies
- Move profile access to gear/avatar icon (top-right corner)

### 8b.6 Monthly Email Digest
- OpenClaw cron (1st of month): query new media_recommendations from previous month
- Compose email via AgentMail with title, recommender, "loved this because" text
- Respect `notifications_paused` toggle

---

## Phase 9: Book Poll ⏳

### 9.1 Create Poll (Poll Creator Flow)
- Authorized member picks 5 books from wishlist
- 7-day duration, closes Sunday afternoon

### 9.2 Vote Page
- 5 books with checkboxes, submit + change vote allowed
- Countdown timer

### 9.3 Auto-Close
- On-visit logic: if past `closes_at` → close poll, count votes
- Clear winner → update `polls.winner_id`
- Tie → **poll creator breaks the tie** (not admin)

### 9.4 Results
- Winner highlighted, vote counts per book

### 9.5 After Poll Closes
- Winner → **marked as currently reading** (`books.currently_reading = true`)
- Displayed on Home Dashboard card

### 9.6 After Meeting
- Winner → `books.is_past_read = true`, `books.month_read = now()`, `books.currently_reading = false`

---

## Phase 10: Meeting Poll ⏳

### 10.1 Create Meeting Poll (Admin Only)
- Select available dates (Mon-Thu)
- 7-day duration, closes Sunday afternoon

### 10.2 Vote
- Multi-vote: check all dates they can make

### 10.3 Auto-Close + Calendar Event
- Auto-select winning date
- Google Calendar API creates event
- Store event ID in meetings table

### 10.4 Meeting Display
- Book title, date/time, Google Meet link, fictional venue name

---

## Phase 11: Profile & Avatars ⏳

### 11.1 Avatar Selection
- Curated list of 20+ fictional characters
- Grid UI, tap to select, auto-save

### 11.2 Profile Page
- Avatar + name, menu: Members, My Suggestions, My Votes, Notifications toggle, About, Logout

### 11.3 Members List
- All members with avatars + names, admin sees emails

---

## Phase 12: Notifications (AgentMail) ⏳

### 12.1 Email Triggers (7 total)
1. Invite to join — magic link in email
2. Poll creator auth — one-time link
3. Book poll open — "Vote now!"
4. Book poll result — "Book X won!"
5. Meeting poll open
6. Meeting confirmed + calendar invite
7. Meeting reminder (day-of)

### 12.2 Notification Pause
- Check `members.notifications_paused` before sending
- Exceptions: invites, auth, meeting confirmations

---

## Phase 13: Home Dashboard ⏳

### 13.1 Home Tab
- **Currently reading card** — shows active book (poll winner), with cover, title, author
- Quote of the week from `quotes` table
- Active poll alert with countdown
- Next meeting card
- Recent member activity
- Member avatars row

### 13.2 Quote Management
- Pre-populate quotes from past reads
- Auto-rotate every 1-2 weeks

---

## Milestone Timeline

| Phase | Effort | Status |
|---|---|---|
| 1 Foundation | 1 session | ✅ Done |
| 2 Auth | 1 session | ✅ Done |
| 3 Registration | 1 session | ✅ Done |
| 4 Win95 UI | 1 session | ✅ Done |
| 5 Deployment | 1 session | ✅ Done |
| 6 Admin Panel | 1 session | ✅ Done |
| 7 Admin Seeded | — | ✅ Done |
| 8 Wishlist | 1 session | ✅ Done |
| 8b Movies Tab | 2 sessions | ⏳ |
| 9 Book Poll | 2 sessions | ⏳ |
| 10 Meeting Poll | 1 session | ⏳ |
| 11 Profile & Avatars | 1 session | ⏳ |
| 12 Notifications | 1 session | ⏳ |
| 13 Home Dashboard | 1 session | ⏳ |

**Estimated remaining:** ~8 sessions

---

_Update this plan as progress changes. Keep PHASE headers synced with PROGRESS.md._
