# Maaser Tracker — Product Requirements Document

## Original Problem Statement
Build a personal finance tracker for the frum community to track maaser (tithing) obligations.

## Architecture
- **Framework**: Next.js (App Router) — unified frontend + serverless API routes
- **Database**: Supabase (PostgreSQL), server-side only with JWT-based RLS
- **Security**: AES zero-knowledge encryption, JWT RLS (anon key + user JWT for user ops, service_role for admin ops)
- **Deployment**: Vercel-ready
- **PWA**: Service Worker + manifest with proper M icon
- **Email**: Resend (requires verified domain for non-owner emails)

## Core Features
- JWT auth with email verification (code + magic link)
- Passwordless signup + magic link login + forgot password
- Disposable email blocking
- Transaction CRUD with Give/Lend split balances
- Hebrew & Gregorian calendar support (session-only toggle, doesn't affect settings)
- Recurring transactions with cron processing
- CSV import with smart column mapping + headerless CSV support
- Analytics, Export, Contact form, Admin panel
- SEO landing page, Skeleton loading states

## JWT RLS Setup
Supabase JWT secret and anon key configured in `.env.local`. User needs to run RLS SQL:

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transactions" ON transactions FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users update own transactions" ON transactions FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users delete own transactions" ON transactions FOR DELETE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users read own profile" ON users FOR SELECT
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users update own profile" ON users FOR UPDATE
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
```

## Key Files
- `/app/frontend/src/lib/supabase-server.js` — Dual-mode helpers (service_role for admin, anon+userJWT for user ops)
- `/app/frontend/src/app/api/` — All API routes
- `/app/frontend/public/` — Icons (favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png)

## Backlog (NOT requested)
- Push notifications (P1), Budget goals (P2)
