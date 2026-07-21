# DLG Bookclub — Progress Tracker

> **Last updated:** 2026-07-22  
> **Current phase:** Post-launch fixes & stabilization

## ✅ Completed

### Boot & UI
- [x] Win95 boot sequence (BIOS → DOS → splash → desktop)
- [x] Login dialog with retro styling
- [x] Registration form (Win95 window style)
- [x] Teal desktop with "My Books" and "Polls" icons
- [x] Admin panel with Win95 UI (tabs, windows, buttons)
- [x] "All caught up!" empty state for pending list
- [x] Desktop background image support

### Auth & Sessions
- [x] Email-only auth flow: check → register → magic link → auto-login
- [x] Returning member auto-login via session cookie
- [x] 30-day custom session (`dlg_session` cookie, stored in DB)
- [x] Middleware route protection
- [x] Logout functionality
- [x] Magic link via Resend

### Registration & Admin
- [x] Self-registration with approval flow
- [x] `pending_registrations` table with approve/reject
- [x] Admin panel: list pending, approve, reject
- [x] Admin panel: list members, remove members
- [x] Admin search/filter members
- [x] AgentMail notification to admin on new registration
- [x] Dedicated login page at `/login`

### Database
- [x] Supabase PostgreSQL schema (members, books, polls, etc.)
- [x] Migration: verified, first_name, last_name, city, session columns
- [x] Migration: pending_registrations table
- [x] RLS policies for pending_registrations (anon: INSERT, SELECT, UPDATE)
- [x] RLS policy for members INSERT (anon, for approval flow)

### Infrastructure
- [x] Vercel deployment
- [x] Supabase keepalive cron (via `keep-alive.ps1`)
- [x] Environment variable configuration

## 🔜 Next Up

### Short-term (Current Phase)
- [ ] Book wishlist — members suggest + browse books
- [ ] Book polling — pick 5 books, vote, auto-close
- [ ] Meeting polls + Google Calendar integration
- [ ] Profile & avatars (gear icon top-right)
- [ ] Movies tab — shared member recommendations with TMDB/OMDb auto-fetch

### Medium-term
- [ ] Monthly email digest for movies
- [ ] Member notifications via AgentMail
- [ ] Home dashboard (quote of the week, recent activity)
- [ ] Quote of the week feature
- [ ] Book club meeting calendar view

### Future
- [ ] Member-to-member messaging
- [ ] Reading progress tracking
- [ ] Discussion threads per book
- [ ] In-app notifications

## Known Issues

- RLS policies need to be verified for `members` DELETE (admin remove member)
- `schema-migration.sql` split from main schema — ensure both run in order
- No `.env.example` in repo (vars documented in README)
