# DLG Bookclub — Design

## Visual Concept

**Retro Windows 95/98 desktop UI.** The app transports users to the mid-90s with a pixel-perfect recreation of the classic OS aesthetic:

- Teal (`#008080`) desktop background
- Gray dialog boxes with beveled borders (`#c0c0c0`, white-top/black-bottom borders)
- Dark navy title bars (`#000080`) with white bold text, close/minimize buttons
- MS Sans Serif / Tahoma font family
- 3D button effects (raised default, sunken on active)
- Closing the window reveals the desktop with app icons
- Taskbar at bottom with Start button and clock
- Boot sequence: BIOS POST → DOS prompt → Windows 95 splash → desktop → login dialog

## Auth Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────────┐
│  Email  │ ──→ │  Check Email │ ──→ │  Verified User?  │
│  Input  │     │  /api/check- │     │                  │
│         │     │  email       │     └──────┬───┬───────┘
└─────────┘                                   │   │
                                              │   │ No
                                              │   └─────→ Registration Form
                                              │              │
                                              │         ┌────┴─────┐
                                              │         │ Submit   │
                                              │         │ /api/    │
                                              │         │ register │
                                              │         └────┬─────┘
                                              │              │
                                              │         ┌────┴─────┐
                                              │         │ Pending  │
                                              │         │ Approval │
                                              │         └──────────┘
                                              │
                                              │ Yes
                                              │
                                         ┌────┴──────┐
                                         │  Session   │
                                         │  Valid?    │
                                         └──┬───┬────┘
                                            │   │
                                      No    │   │ Yes
                                       ┌────┘   └──────┐
                                       │                │
                                  ┌────┴────┐    ┌──────┴──────┐
                                  │ Send    │    │  Auto-Login │
                                  │ Magic   │    │  (set       │
                                  │ Link    │    │  session    │
                                  └─────────┘    │  cookie)    │
                                                  └─────────────┘
```

## Registration Flow

```
New Member → Email Input → Not Found → Registration Form
  (first_name, last_name, city) → POST /api/register
    → Insert into pending_registrations (status: "pending")
    → AgentMail notification to admin
    → "Submitted — wait for approval" screen

Admin → Login → /admin → Pending Approvals tab
  → Approve: INSERT INTO members + UPDATE pending_registrations.status = "approved"
  → Reject: UPDATE pending_registrations.status = "rejected"
```

## Session Architecture

- **Custom session tokens** (UUID v4), not Supabase Auth session
- Stored in `members.session_token` + `members.session_expires_at`
- 30-day expiry, refreshed on each login
- `dlg_session` cookie: httpOnly, secure in production, sameSite=lax
- Middleware reads cookie, verifies against DB, redirects to `/login` if invalid
- API routes check `verifyAdmin()` for admin-only endpoints

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/check-email` | POST | Public | Check if member exists |
| `/api/register` | POST | Public | Submit registration |
| `/api/session` | POST | Public | Create session (login) |
| `/api/session` | GET | Cookie | Validate current session |
| `/api/logout` | POST | Cookie | Clear session |
| `/api/admin/pending` | GET | Admin | List pending registrations |
| `/api/admin/pending/[id]` | POST | Admin | Approve/reject registration |
| `/api/admin/members` | GET | Admin | List all members |
| `/api/admin/members` | POST | Admin | Remove member |
| `/auth/callback` | GET | Public | Magic link callback |

## Tech Decisions

- **Why custom sessions instead of Supabase Auth?** Simpler for a small club. No password management, no OAuth complexity. Email-only keeps the UX clean.
- **Why AgentMail for notifications?** API-first email designed for agents. Separate from Resend (used for magic links) to keep concerns isolated.
- **Why Win95 theme?** Fun, distinctive, lightweight. No heavy UI framework needed — just CSS box shadows and borders.
- **Why Vercel?** Zero-config Next.js hosting, free tier sufficient for small club.
