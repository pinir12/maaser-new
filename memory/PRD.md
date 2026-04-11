# Finance Tracker - PRD

## Tech Stack
- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + Recharts + @hebcal/core
- **Backend**: Next.js API Routes (for Vercel) / FastAPI (dev environment)
- **Database**: Supabase (PostgreSQL) — accessed server-side only
- **Email**: Resend (admin notifications, contact form, monthly summary)
- **Currency**: open.er-api.com (free, no key, cached 1hr)

## Architecture
Single Next.js project deployable to Vercel. API routes handle all server-side logic (JWT auth, Supabase queries, email). Frontend components are "use client" React components. In the dev/preview environment, API calls route to the legacy FastAPI backend via ingress.

### Key Files
- `src/app/layout.js` — Root HTML layout
- `src/app/page.js` — Client entry (AuthProvider + Dashboard/HomePage)
- `src/app/api/` — All API route handlers (mirror of FastAPI endpoints)
- `src/lib/supabase-server.js` — Server-side Supabase REST helpers
- `src/lib/jwt-server.js` — Server-side JWT + auth helpers
- `src/components/` — All UI components (unchanged, with "use client")
- `.env.local` — All secrets (SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, RESEND_API_KEY)
- `vercel.json` — Cron job schedules

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
- Top balance cards: fixed-width, left-aligned next to Add Transaction button
- Period totals (give+lend mode): combined Give Portion + Given into one card, Lend Portion + Lent into one card (3 cards total instead of 5)
- Insights panel: compares current vs previous period (income trend, giving/lending changes, maaser fulfillment). Hidden when no previous data exists or in All Time view
- Homepage / landing page for non-authenticated users (hero, dashboard preview, feature cards, testimonial, CTA)
- Lend color theme: changed from rose/red to violet/purple across all components
- Auth error fix: login/signup errors now persist on screen (no more flash-back to homepage)
- Transaction encryption: AES-256-GCM encryption for amounts, descriptions, and recipient names in database
- SEO: rich metadata, keywords, Open Graph, Twitter cards, JSON-LD structured data for "maaser tracker"
- Trailing decimal fix: all transaction amounts now show 2 decimal places consistently
- Sync recurring button: moved from header into the Recurring Transactions panel
- CRON endpoints confirmed ready: POST /api/cron/recurring (daily), POST /api/cron/monthly-summary (monthly 1st)

## Next Tasks
- Push notifications for upcoming recurring transactions
- Budget goals and tracking feature
