# DLG Bookclub — Database Schema

**Supabase Project:** `ozyvwadyfgqslvrckles.supabase.co`

> Run `supabase-schema.sql` first, then `schema-migration.sql` in Supabase SQL Editor.

---

## Tables

### 1. `members`

Club members (admin-seeded + approved registrations).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `email` | TEXT | — | UNIQUE, NOT NULL |
| `name` | TEXT | — | Display name |
| `first_name` | TEXT | — | Added by migration |
| `last_name` | TEXT | — | Added by migration |
| `city` | TEXT | — | Added by migration |
| `avatar` | TEXT | `'default'` | |
| `verified` | BOOLEAN | `false` | Added by migration; true after magic link verified |
| `is_admin` | BOOLEAN | `false` | |
| `session_token` | TEXT | — | Added by migration; UUID for custom session |
| `session_expires_at` | TIMESTAMPTZ | — | Added by migration; 30 days from login |
| `notifications_paused` | BOOLEAN | `false` | |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 2. `pending_registrations`

Created by migration. Holds new sign-ups awaiting admin approval.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `email` | TEXT | — | UNIQUE, NOT NULL |
| `first_name` | TEXT | — | NOT NULL |
| `last_name` | TEXT | — | NOT NULL |
| `city` | TEXT | — | NOT NULL |
| `status` | TEXT | `'pending'` | CHECK: `pending`, `approved`, `rejected` |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 3. `books`

Books suggested by members.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `title` | TEXT | — | NOT NULL |
| `author` | TEXT | — | NOT NULL |
| `suggested_by` | UUID | — | FK → `members(id)` ON DELETE SET NULL |
| `amazon_link` | TEXT | — | |
| `is_past_read` | BOOLEAN | `false` | |
| `month_read` | DATE | — | When the club read it |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 4. `polls`

Book or meeting polls.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `type` | TEXT | — | CHECK: `book` or `meeting` |
| `creator_id` | UUID | — | FK → `members(id)` ON DELETE SET NULL |
| `status` | TEXT | `'open'` | CHECK: `open` or `closed` |
| `closes_at` | TIMESTAMPTZ | — | NOT NULL |
| `winner_id` | UUID | — | FK → `books(id)` ON DELETE SET NULL |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 5. `poll_options`

Options/choices for a poll.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `poll_id` | UUID | — | FK → `polls(id)` ON DELETE CASCADE, NOT NULL |
| `book_id` | UUID | — | FK → `books(id)` ON DELETE CASCADE |

### 6. `votes`

Member votes on poll options.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `poll_id` | UUID | — | FK → `polls(id)` ON DELETE CASCADE, NOT NULL |
| `member_id` | UUID | — | FK → `members(id)` ON DELETE CASCADE, NOT NULL |
| `poll_option_id` | UUID | — | FK → `poll_options(id)` ON DELETE CASCADE, NOT NULL |
| `created_at` | TIMESTAMPTZ | `NOW()` | |
| | | | UNIQUE (`poll_id`, `member_id`, `poll_option_id`) |

### 7. `meetings`

Scheduled/booked meetings.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `book_id` | UUID | — | FK → `books(id)` ON DELETE SET NULL |
| `date` | DATE | — | NOT NULL |
| `time` | TIME | — | NOT NULL |
| `venue_name` | TEXT | — | |
| `google_meet_link` | TEXT | — | |
| `google_calendar_event_id` | TEXT | — | |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 8. `invite_tokens`

Invite tokens for member invitations.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `token` | TEXT | — | UNIQUE, NOT NULL |
| `created_by` | UUID | — | FK → `members(id)` ON DELETE CASCADE |
| `expires_at` | TIMESTAMPTZ | — | NOT NULL |
| `used` | BOOLEAN | `false` | |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 9. `poll_creator_tokens`

Tokens for poll creator validation.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `member_id` | UUID | — | FK → `members(id)` ON DELETE CASCADE, NOT NULL |
| `token` | TEXT | — | UNIQUE, NOT NULL |
| `expires_at` | TIMESTAMPTZ | — | NOT NULL |
| `used` | BOOLEAN | `false` | |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

### 10. `quotes`

Quote of the week entries.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `book_id` | UUID | — | FK → `books(id)` ON DELETE SET NULL |
| `text` | TEXT | — | NOT NULL |
| `submitted_by` | UUID | — | FK → `members(id)` ON DELETE SET NULL |
| `active` | BOOLEAN | `false` | |
| `created_at` | TIMESTAMPTZ | `NOW()` | |

## Indexes

```sql
CREATE INDEX idx_books_suggested_by ON books(suggested_by);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_type ON polls(type);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_member_id ON votes(member_id);
CREATE INDEX idx_quotes_active ON quotes(active);
```

## RLS Policies

```sql
-- Applied after migration. Run these in Supabase SQL Editor:

-- Allow anon to insert into pending_registrations (registration form)
CREATE POLICY "anon_insert_pending_registrations" 
ON pending_registrations 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anon to read pending_registrations (admin panel list)
CREATE POLICY "anon_select_pending_registrations" 
ON pending_registrations 
FOR SELECT 
TO anon 
USING (true);

-- Allow anon to update pending_registrations (admin approve/reject)
CREATE POLICY "anon_update_pending_registrations" 
ON pending_registrations 
FOR UPDATE 
TO anon 
USING (true);

-- Allow anon to insert into members (admin approval creates member)
CREATE POLICY "anon_insert_members" 
ON members 
FOR INSERT 
TO anon 
WITH CHECK (true);
```

## Migration Order

1. Run `supabase-schema.sql` — creates base tables (members, books, polls, etc.)
2. Run `schema-migration.sql` — adds columns to members, creates `pending_registrations`
3. Run the RLS policies above
