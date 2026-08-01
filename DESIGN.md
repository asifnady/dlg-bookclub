# DLG Bookclub — Design & Spec

> Compiled from the complete grill session (June 27–29, 2026)
> Last updated: July 29, 2026
> Status: ✅ V1 deployed on Vercel

---

## 1. Identity

- **Single-club, single-purpose webapp.** The app IS the bookclub.
- Members: Asif's existing bookclub circle (~10–30 people).
- **Book lifecycle:** Wishlist → Poll winner → **Currently Reading** → Past Read (after meeting).

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (React, TypeScript, Tailwind, App Router) | Frontend + API routes in one project |
| Databases | **Supabase** (PostgreSQL) | Database, row-level security |
| Auth | **Supabase Auth** — Magic link (one-time) + custom session token | Verify email once, auto-login thereafter |
| Emails | **AgentMail** (`deskofasifnadeem@agentmail.to`) | Registration notifications, member-facing emails |
| Calendar | **Google Calendar API** (existing setup) | Meeting confirmations → calendar events |
| Deployment | **Vercel** | Auto-deploy from GitHub |
| Cost | **$0/month** (free tiers) | Supabase free tier + Vercel free tier |

**Supabase free tier headroom:** 500MB database, 50K monthly active users, 2M API requests/mo.

**Pausing behavior:** Supabase pauses after 7 days inactivity. Prevented with keepalive cron (queries members table every 2 days).

---

## 3. Roles & Permissions

| Role | Who | Capabilities |
|---|---|---|
| **Admin** | Asif (only) | Approve registrations, invite/remove members, toggle notification pause, create meeting polls, designate poll creators, generate invite links, see member emails, add past reads (for migration) |
| **Member** | Everyone else | Suggest books, vote in polls, add quotes, change avatar, view members (names only), pause own notifications |
| **Editor** | _Future_ | Can add text content to the webapp |

---

## 4. Membership & Registration

- **Self-registration with admin approval.** Anyone can submit a registration request, admin approves.

### 4.1 Login Flow

```
User types email →
  ├─ Not in members table → 📝 Registration form (First Name, Last Name, City)
  │                          → pending_registrations table (status: pending)
  │                          → Admin gets email via AgentMail
  │                          → Admin approves → member created
  │                          → User tries again → magic link sent (verify email)
  │                          → Auto-login from then on
  │
  ├─ In members, not verified → 📬 Magic link sent
  │                            → Click link → /auth/callback marks verified
  │                            → Custom session cookie set
  │                            → Auto-login from then on
  │
  └─ In members, verified ✅  → /api/session creates custom session token
                               → Sets dlg_session cookie
                               → Auto-login, no email needed
```

### 4.2 Statuses

| Status | Meaning |
|---|---|
| `not_found` | Email not in `members` → registration form |
| `unverified` | In `members` but `verified = false` → send magic link |
| `verified` | In `members`, `verified = true` → auto-login |
| `already_pending` | Already submitted a registration |
| `submitted` | Registration submitted, awaiting admin approval |

---

## 5. Login Page — Retro Windows 95

- **Full boot sequence every visit:**
  1. **BIOS POST** — Award Modular BIOS screen with memory test, drive detection
  2. **MS-DOS startup** — HIMEM.SYS, EMM386.EXE
  3. **Windows 95 splash** — Colorful Microsoft logo, animated loading bar
  4. **Windows 95 desktop** — Teal background, icons (My Books, Polls, Recycle Bin)
  5. **Login dialog** — Win95-style dialog box with email input

- **Design:** Gray dialog boxes with raised/sunken borders, blue title bar, MS Sans Serif font, Start bar with clock
- **Auth:** Auto-login for returning verified members

---

## 6. Frontend Design

### 6.1 Tab Structure

| Tab | Icon | Content |
|---|---|---|
| **Home** | 🏠 | Quote of the week (top), active poll alert, next meeting card, recent member activity, member avatars row |
| **Books** | 📚 | Segmented toggle: **Wishlist** (default) / **Past Reads** |
| **Polls** | 🗳️ | Active poll (checkboxes + submit + countdown), meeting poll banner, past polls with winner |
| **Meetings** | 📅 | Next meeting card (book, date, Meet link, venue), past meetings list |
| **Movies** | 🎬 | Shared feed of member recommendations (movie/series), newest first. Each card: poster, IMDb/RT ratings, genre, title, type, "Loved this because...", recommender name + avatar. "+" button to add |

> **Note:** Profile tab moved to a gear/avatar icon in the top-right corner (accessible from any tab).

### 6.2 Avatars
- Curated list of fictional characters from books + pop culture
- No custom image uploads
- Rotate new characters in as club reads more books

### 6.3 Navigation
- Bottom tab bar, 5 tabs max, thumb-reach optimized for mobile
- No hamburger menus, no deep nesting

---

## 7. Book Wishlist

- Any member can suggest a book (Wishlist tab, not Past Reads)
- **Fields:** Title (required), Author (required), Suggested by (auto-filled), Amazon link (optional)
- Book covers: **Post-MVP**, auto-fetched from Open Library API

## 7b. Past Reads

- Segmented toggle on Books tab alongside Wishlist
- Admin-only **"Add Past Read"** button (Win95 modal dialog with Title, Author, Month Read, optional Amazon link)
- For migrating existing books the club has already read before the app existed
- Books listed with month they were read

---

## 8. Book Poll (Monthly Read Selection)

### Lifecycle
1. **Admin designates a poll creator** — one-time authorization link (valid 7 days or until poll created)
2. Poll creator picks **5 books from the wishlist**
3. Poll opens for all members, runs **7 days**, closes **Sunday afternoon**
4. Winner auto-selected (most votes). **Tie** → poll creator chooses (tiebreaker)
5. Winner marked as **currently reading** on Home Dashboard
6. After the meeting, book transitions to Past Read
7. New cycle begins after the weekend following the meeting

### Voting Rules
- **Multi-vote** — checkboxes, vote for as many as you want
- **Votes can be changed** before poll closes

### Sequencing
- **Strictly sequential.** One active book poll at a time.

---

## 9. Meeting Poll

- **Created by admin only** (Asif)
- **Options:** Monday–Thursday, 21:00–22:00 CET
- **Duration:** Minimum 7 days, closes Sunday afternoon
- **Multi-vote** — members check all days they can attend
- **Auto-select winner.** Tie → admin chooses

### After Confirmation
- Meeting set: book title, date/time, **Google Meet link**, **fictional venue name** (e.g. "The Prancing Pony 🐴")
- **Google Calendar invite** sent to all members
- Occurs ~1 month after book selection

---

## 10. Notifications

### Registration Approval (Done)
- AgentMail to `deskofasifnadeem@agentmail.to` on new registration

### Future Member Notifications (AgentMail)

| # | Trigger | Sent To |
|---|---|---|
| 1 | Invite to join | New member's email |
| 2 | Poll creator authorization | Designated member |
| 3 | Book poll open — "Vote now!" | All members |
| 4 | Book poll result — "Book X won!" | All members |
| 5 | Meeting poll open | All members |
| 6 | Meeting confirmed + calendar invite | All members |
| 7 | Meeting reminder (day-of) | All members |

### Notification Preferences
- **Master toggle:** "Pause all emails"
- **Exceptions:** Invites, poll authorizations, meeting confirmations
- Admin can toggle any member's pause setting

---

## 11. Quotes

- **Source:** Past books the club has read
- **Frequency:** Changes every 1–2 weeks
- **Display:** On Home tab (top)
- **Future v2:** Members can submit quotes via text or image OCR

---

## 12. Second Draft Features (Deferred)

- Member-submitted quotes (OCR from image)
- Kindle highlights integration
- "Merry-go-round" — rotating feed of what members are watching/listening to/reading

---

## 13. Database Tables (Full Schema)

See `SCHEMA.md` for the complete schema reference.

Tables: `members`, `pending_registrations`, `books`, `polls`, `poll_options`, `votes`, `meetings`, `invite_tokens`, `poll_creator_tokens`, `quotes`, `invites`, `media`, `media_recommendations`

---

## 14. Admin Panel (You Only)

- [x] **Pending registrations** — view + approve/reject
- [x] **Members list** — view all members, see emails, remove member
- [ ] **Invite** — enter email to send invite / generate shareable link
- [ ] **Toggle notification pause** per member
- [ ] **Designate poll creator** — triggers one-time auth link
- [ ] **Create meeting poll**
- [ ] **Trigger re-do** of meeting poll

---

## 15. Movies — Shared Recommendation Feed

A shared feed of member movie/series recommendations, accessible from the 🎬 Movies tab. The Profile tab moved to a gear/avatar icon (top-right) to make room.

### 15.1 Feed Display
- **Sort:** Newest recommendations first
- **Each card shows:** Auto-fetched poster, IMDb rating, RT rating (bonus, nullable), genre, title, type (movie/series), member's "Loved this because..." text, recommender name + avatar
- **"+" button** to add your own recommendation

### 15.2 Data Model (New Tables)

See `SCHEMA.md` for full column definitions.

- `media` — title, type (movie|series), year, poster_url, genre, imdb_rating, rt_rating (nullable), seasons_count (nullable int), tmdb_id
- `media_recommendations` — member_id (FK→members), media_id (FK→media), loved_this_because (text), created_at (timestamp)

### 15.3 Auto-Fetch Pipeline
- **TMDB API** → poster_url, genre, year, tmdb_id (dedup by tmdb_id)
- **OMDb API** → imdb_rating
- **RT rating** (bonus) — periodic/on-add script attempts fetch once; if unavailable, leave null

### 15.4 Member Actions
- **Add recommendation:** Search/select a title → write "Loved this because..." → instant publish (self-serve, no admin approval)
- **Edit:** Member can update their own `loved_this_because` text
- **Delete:** Member can delete their own recommendation entirely

### 15.5 Monthly Email Digest
- **Trigger:** First of each month (OpenClaw cron)
- **Content:** Lists NEW recommendations added that month, including "loved this because" text
- **Delivery:** AgentMail (`deskofasifnadeem@agentmail.to`)
- **Opt-out:** Respects `members.notifications_paused` toggles

### 15.6 Visibility
- **Members only** (must be logged in). No public access.

---

_This design doc is updated as development progresses. Major drift from original sessions noted above._
