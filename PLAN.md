# DLG Bookclub — Build Plan

## Phase 1: Boot & Auth (✅ Complete)
**Goal:** Retro Win95 experience with working email-only auth.

- [x] Win95 boot animation sequence
- [x] Email check → new/returning user routing
- [x] Magic link auth via Resend
- [x] Registration form + pending approval
- [x] Custom session system (30-day cookie)

## Phase 2: Admin Panel (✅ Complete)
**Goal:** Admin can manage members and registrations.

- [x] Admin dashboard at `/admin`
- [x] Approve/reject pending registrations
- [x] List and remove members
- [x] AgentMail notification for new registrations
- [x] Admin session verification

## Phase 3: Books & Polls (🔜 In Progress)
**Goal:** Members can suggest books and vote on reading list.

- [ ] Book suggestion form and wishlist view
- [ ] Poll creation (pick 5 books from suggestions)
- [ ] Voting with ranked preferences
- [ ] Auto-close polls and announce winner
- [ ] Past reads archive

## Phase 4: Meetings & Calendar
**Goal:** Schedule and track book club meetings.

- [ ] Meeting poll (date/time proposals)
- [ ] Google Calendar event creation (via API)
- [ ] Venue / Google Meet link display
- [ ] Meeting history

## Phase 5: Movies Tab
**Goal:** Shared movie/TV recommendations feed.

- [ ] Movies tab replacing Profile tab
- [ ] Search + add via TMDB/OMDb API
- [ ] Member rating and comments
- [ ] Monthly email digest

## Phase 6: Polish & Community
**Goal:** Make the club feel alive.

- [ ] Home dashboard with quote of the week
- [ ] Member notifications via AgentMail
- [ ] Profile page with avatar upload
- [ ] Activity feed
- [ ] Reading progress per member

---

### Tech Debt / Infrastructure
- Add `.env.example` to repo
- Supabase RLS audit for all tables
- Error boundary for API routes (more specific error messages)
- Loading states for admin panel
