# DLG Bookclub — Database Schema

> Supabase project: `ozyvwadyfgqslvrckles.supabase.co`
> Last updated: July 19, 2026

---

## Tables

### members
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default uuid_generate_v4() |
| email | TEXT | UNIQUE, NOT NULL |
| name | TEXT | Display name |
| first_name | TEXT | From registration |
| last_name | TEXT | From registration |
| city | TEXT | From registration |
| verified | BOOLEAN | Default false. Set true after first magic link login |
| session_token | TEXT | Auto-login token, regenerated each session |
| session_expires_at | TIMESTAMPTZ | 30-day expiry |
| avatar | TEXT | Slug for selected character, default 'default' |
| is_admin | BOOLEAN | Default false |
| notifications_paused | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default now() |

### pending_registrations
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | TEXT | UNIQUE |
| first_name | TEXT | |
| last_name | TEXT | |
| city | TEXT | |
| status | TEXT | 'pending', 'approved', 'rejected' |
| created_at | TIMESTAMP | |

### invites
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | TEXT | UNIQUE |
| token | TEXT | Null until shareable link used |
| method | TEXT | 'email' or 'tokenized_link' |
| status | TEXT | 'pending', 'accepted', 'expired' |
| invited_by | UUID | FK → members.id |
| expires_at | TIMESTAMP | Null for direct email, 7 days for tokens |
| created_at | TIMESTAMP | |

### books
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| author | TEXT | NOT NULL |
| suggested_by | UUID | FK → members.id |
| amazon_link | TEXT | Optional |
| is_past_read | BOOLEAN | Default false |
| month_read | DATE | Null until read |
| created_at | TIMESTAMPTZ | Default now() |
| Index | | idx_books_suggested_by |

### polls
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| type | TEXT | CHECK ('book', 'meeting') |
| creator_id | UUID | FK → members.id |
| status | TEXT | Default 'open', CHECK ('open', 'closed') |
| closes_at | TIMESTAMPTZ | NOT NULL |
| winner_id | UUID | FK → books.id, nullable |
| created_at | TIMESTAMPTZ | Default now() |
| Index | | idx_polls_status, idx_polls_type |

### poll_options
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| poll_id | UUID | FK → polls.id, NOT NULL, CASCADE delete |
| book_id | UUID | FK → books.id, CASCADE delete |

### votes
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| poll_id | UUID | FK → polls.id, NOT NULL, CASCADE delete |
| member_id | UUID | FK → members.id, NOT NULL, CASCADE delete |
| poll_option_id | UUID | FK → poll_options.id, NOT NULL, CASCADE delete |
| created_at | TIMESTAMPTZ | Default now() |
| UNIQUE | | (poll_id, member_id, poll_option_id) |
| Index | | idx_votes_poll_id, idx_votes_member_id |

### meetings
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| book_id | UUID | FK → books.id |
| date | DATE | NOT NULL |
| time | TIME | NOT NULL |
| venue_name | TEXT | Fictional place name |
| google_meet_link | TEXT | |
| google_calendar_event_id | TEXT | |
| created_at | TIMESTAMPTZ | Default now() |

### invite_tokens
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| token | TEXT | UNIQUE, NOT NULL |
| created_by | UUID | FK → members.id, CASCADE delete |
| expires_at | TIMESTAMPTZ | NOT NULL, 7 days |
| used | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default now() |

### poll_creator_tokens
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| member_id | UUID | FK → members.id, NOT NULL, CASCADE delete |
| token | TEXT | UNIQUE, NOT NULL |
| expires_at | TIMESTAMPTZ | NOT NULL, 7 days |
| used | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default now() |

### quotes
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| book_id | UUID | FK → books.id |
| text | TEXT | NOT NULL |
| submitted_by | UUID | FK → members.id (null = system-curated) |
| active | BOOLEAN | Default false, currently displayed? |
| created_at | TIMESTAMPTZ | Default now() |
| Index | | idx_quotes_active |

### media
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default uuid_generate_v4() |
| title | TEXT | NOT NULL |
| type | TEXT | NOT NULL, CHECK ('movie', 'series') |
| year | INTEGER | |
| poster_url | TEXT | Auto-fetched from TMDB |
| genre | TEXT | Auto-fetched from TMDB |
| imdb_rating | DECIMAL(3,1) | Auto-fetched from OMDb |
| rt_rating | INTEGER | Nullable (bonus), 0-100 |
| seasons_count | INTEGER | Nullable, for series |
| tmdb_id | TEXT | NOT NULL, UNIQUE, for lookup dedup |
| created_at | TIMESTAMPTZ | Default now() |

### media_recommendations
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default uuid_generate_v4() |
| member_id | UUID | FK → members.id, NOT NULL, CASCADE delete |
| media_id | UUID | FK → media.id, NOT NULL, CASCADE delete |
| loved_this_because | TEXT | NOT NULL, member's personal review |
| created_at | TIMESTAMPTZ | Default now() |
| UNIQUE | | (member_id, media_id) — one rec per member per title |
| Index | | idx_media_recs_member, idx_media_recs_media |

---

## Migrations

### Initial schema
`schema-to-run.sql` — creates all tables listed above except `pending_registrations`

### Runtime additions to `members` table
Columns added after initial schema run:
- `verified` BOOLEAN default false
- `first_name` TEXT
- `last_name` TEXT
- `city` TEXT
- `session_token` TEXT
- `session_expires_at` TIMESTAMPTZ

### `pending_registrations` table
Created separately after schema migration:
```sql
CREATE TABLE pending_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
