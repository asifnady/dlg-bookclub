<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 📋 Project Docs

| File | What |
|------|------|
| `PROGRESS.md` | ✅ **Must update every session** — progress tracker, status, key decisions |
| `PLAN.md` | Build plan by phase — what to do next |
| `DESIGN.md` | Full spec / design document |
| `SCHEMA.md` | Database schema reference |

**Rule:** Every time you work on this project, update PROGRESS.md with what changed.

# 🌐 Deployment
- **Live URL:** https://dlg-bookclub.vercel.app
- **Supabase:** ozyvwadyfgqslvrckles.supabase.co
- **Admin:** a.nadeem89@gmail.com (seeded in DB)

# 🔑 API Keys Available
- **GitHub token:** Stored in workspace `TOOLS.md` (classic, repo scope)
- **Supabase anon key:** In `.env.example` (public — embedded in client JS)
- **Supabase service_role key:** ❌ Not available — only in Vercel dashboard
- **Vercel token:** ❌ Not available — CLI not logged in
- **AgentMail key:** ❌ Not available — only in Vercel dashboard
