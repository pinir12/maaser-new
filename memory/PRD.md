# Finance Tracker - PRD

## Problem Statement
Personal finance tracker with Hebrew/Gregorian calendar, Income/Maaser/Give/Lend tracking, built on React + FastAPI + Supabase.

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS (blue theme) + Recharts + @hebcal/core
- **Backend**: FastAPI (all DB operations, JWT auth, email, currency)
- **Database**: Supabase (PostgreSQL) — accessed server-side only
- **Email**: Resend (admin notifications, contact form, monthly summary)
- **Currency**: open.er-api.com (free, no key, cached 1hr)

## Architecture
All database operations go through the FastAPI backend. The frontend has NO direct database access. Authentication uses JWT tokens (30-day expiry). The Supabase service role key is stored only in the backend .env.

## What's Implemented

### Security (Server-Side Migration)
- [x] All Supabase operations moved to backend FastAPI endpoints
- [x] JWT authentication (login, signup, protected routes)
- [x] Supabase key removed from frontend entirely
- [x] Password hashes never exposed in API responses
- [x] Admin-only endpoints with is_admin verification

### Core Features
- [x] Transaction CRUD via API (Income, Give, Lend)
- [x] Maaser auto-calculation (configurable % in settings, default 10%)
- [x] Custom give/lend ratio (settings, visual bar)
- [x] All-time running totals (updates immediately on add/delete)
- [x] View modes: All Time, Year, Month
- [x] Hebrew/Gregorian calendar (year view fixed)
- [x] Recurring transactions with cron sync + dedicated management
- [x] Search with filters
- [x] Analytics charts (Area, Bar, Pie)
- [x] Export (CSV, PDF)
- [x] Accordion collapsible transaction groups
- [x] Live currency conversion (auto-fetch rates)
- [x] Transaction autofill/prediction

### Communication
- [x] Admin email on new user signup (Resend)
- [x] Contact form modal (Resend)
- [x] Monthly maaser summary email endpoint

### Admin
- [x] Admin panel (conditionally rendered via is_admin flag)
- [x] User management: view, toggle admin, delete users

### UI/UX
- [x] Clean blue Tailwind theme with glassmorphism
- [x] Stats cards flex-1 stretch uniformly
- [x] Hebrew date picker in Hebrew calendar mode
- [x] Vercel deployment ready

## API Endpoints
```
POST /api/auth/login          - Login with email/password, returns JWT
POST /api/auth/signup         - Register new user, returns JWT
GET  /api/transactions        - Get user's transactions (protected)
POST /api/transactions        - Create transaction (protected)
PUT  /api/transactions/{id}   - Update transaction (protected)
DELETE /api/transactions/{id} - Delete transaction (protected)
GET  /api/user/settings       - Get user settings (protected)
PUT  /api/user/settings       - Update user settings (protected)
GET  /api/admin/users         - List users (admin only)
PUT  /api/admin/users/{id}    - Update user (admin only)
DELETE /api/admin/users/{id}  - Delete user (admin only)
GET  /api/transactions/recurring     - Get recurring templates
PUT  /api/transactions/recurring/bulk-update  - Bulk update recurring
DELETE /api/transactions/recurring/bulk-delete - Bulk delete recurring
GET  /api/transactions/suggestions   - Autofill suggestions
POST /api/email/contact       - Send contact form email
GET  /api/currency/rates/{base}      - Live exchange rates
POST /api/cron/recurring      - Process recurring transactions
POST /api/cron/monthly-summary       - Send monthly maaser emails
```

## SQL Required (Supabase Dashboard)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_maaser_percentage NUMERIC DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS give_ratio NUMERIC DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lend_ratio NUMERIC DEFAULT 50;
UPDATE users SET is_admin = TRUE WHERE email = 'mail@pinir.co.uk';
```

## Next Tasks
- Push notifications for upcoming recurring transactions
- Budget goals and tracking feature
