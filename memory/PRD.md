# Finance Tracker - PRD

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS (blue theme) + Recharts + @hebcal/core
- **Backend**: FastAPI (all DB operations, JWT auth, email, currency)
- **Database**: Supabase (PostgreSQL) — accessed server-side only
- **Email**: Resend (admin notifications, contact form, monthly summary)
- **Currency**: open.er-api.com (free, no key, cached 1hr)

## Architecture
All database operations go through FastAPI backend. Frontend has NO direct database access. Authentication uses JWT tokens (30-day expiry). Supabase service role key stored only in backend .env.

## Core Business Logic: Maaser Split

### give_only mode
- Income → 10% (configurable) = Maaser total
- **Maaser Owed** = total maaser - total given
- Stats cards: Income | Maaser Owed | Given (3 cards)

### give+lend mode  
- Income → 10% (configurable) = Maaser total
- Maaser is SPLIT by give/lend ratio (default 50/50, configurable)
- **Give Owed** = (total maaser × give_ratio) - total given
- **Lend Owed** = (total maaser × lend_ratio) - total lent
- Stats cards: Income | Give Owed | Lend Owed | Given | Lent (5 cards)
- NO single "Maaser" total in this mode

## What's Implemented

### Security
- [x] All Supabase operations moved to backend
- [x] JWT authentication (30-day expiry)
- [x] Supabase key removed from frontend
- [x] Password hashes never exposed in API
- [x] Admin-only endpoints with is_admin check

### Core Features
- [x] Transaction CRUD via API
- [x] Configurable maaser % (settings, default 10%)
- [x] Give/Lend ratio split (settings, default 50/50)
- [x] Separate Give Owed / Lend Owed balances (give+lend mode)
- [x] Single Maaser Owed balance (give_only mode)
- [x] All-time totals update on add/delete
- [x] View modes: All Time, Year, Month
- [x] Hebrew/Gregorian calendar with correct month navigation
- [x] Timezone-safe date filtering (string comparison)
- [x] Recurring transactions with cron sync + management
- [x] Search with filters
- [x] Analytics charts
- [x] Export (CSV, PDF)
- [x] Accordion collapsible transaction groups
- [x] Live currency conversion (no NaN)
- [x] Transaction autofill/prediction
- [x] Hebrew date picker

### Communication
- [x] Admin email on signup (Resend)
- [x] Contact form modal (Resend)
- [x] Monthly maaser summary email endpoint

### Admin
- [x] Admin panel (is_admin flag)
- [x] User management

## API Endpoints
```
Auth:     POST /api/auth/login, POST /api/auth/signup
Txns:     GET/POST /api/transactions, PUT/DELETE /api/transactions/{id}
Settings: GET/PUT /api/user/settings
Admin:    GET /api/admin/users, PUT/DELETE /api/admin/users/{id}
Recurring: GET /api/transactions/recurring, PUT/DELETE bulk operations
Other:    GET /api/transactions/suggestions, POST /api/email/contact
          GET /api/currency/rates/{base}
Cron:     POST /api/cron/recurring, POST /api/cron/monthly-summary
```

## SQL Required
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_maaser_percentage NUMERIC DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS give_ratio NUMERIC DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lend_ratio NUMERIC DEFAULT 50;
UPDATE users SET is_admin = TRUE WHERE email = 'mail@pinir.co.uk';
```

## Recent Changes (Feb 2026)
- Top balance cards: fixed-width (not full-stretch) on desktop, right-aligned
- Period totals (give+lend mode): combined Give Portion + Given into one card, Lend Portion + Lent into one card (3 cards total instead of 5)
- CRON endpoints confirmed ready: POST /api/cron/recurring (daily), POST /api/cron/monthly-summary (monthly 1st)

## Next Tasks
- Push notifications for upcoming recurring transactions
- Budget goals and tracking feature
