# Maaser Tracker — Product Requirements Document

## Original Problem Statement
Build a personal finance tracker for the frum community to track maaser (tithing) obligations.

## Architecture
- **Framework**: Next.js (App Router) — unified frontend + serverless API routes
- **Database**: Supabase (PostgreSQL), server-side only with JWT-based RLS
- **Security**: AES zero-knowledge encryption, JWT RLS, all DB calls server-side
- **Deployment**: Vercel-ready
- **PWA**: Service Worker + manifest
- **Email**: Resend (requires verified domain for non-owner emails)

## Core Features
- JWT auth with email verification (code + magic link)
- Passwordless signup + magic link login
- Forgot password flow
- Disposable email blocking
- Transaction CRUD with Give/Lend split balances
- Hebrew & Gregorian calendar support
- Recurring transactions with cron processing
- CSV import with smart column mapping + headerless CSV support
- Analytics, Export, Contact form, Admin panel
- SEO landing page, Skeleton loading states

## JWT RLS Setup (User Action Required)
1. Get your Supabase JWT secret from: Project Settings > API > JWT Secret
2. Add to .env.local: `SUPABASE_JWT_SECRET=your-secret-here`
3. Run the RLS SQL in Supabase SQL Editor (see below)
4. Restart the app

### RLS SQL to run:
```sql
-- Enable RLS on tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Transactions: users can only access their own
CREATE POLICY "Users read own transactions" ON transactions FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users update own transactions" ON transactions FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users delete own transactions" ON transactions FOR DELETE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

-- Users: can only read/update their own row
CREATE POLICY "Users read own profile" ON users FOR SELECT
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
CREATE POLICY "Users update own profile" ON users FOR UPDATE
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

-- Service role (used for signup, admin) bypasses RLS automatically
```

## Resend Email Note
The `onboarding@resend.dev` sender only delivers to the Resend account owner's email. To send to all users, verify a custom domain at resend.com/domains and update the `from` address in the code.

## Key Files
- `/app/frontend/src/lib/supabase-server.js` — User-scoped helpers (supaGetUser, supaPostUser, etc.)
- `/app/frontend/src/app/api/` — All API routes (use user-scoped Supabase calls)
- `/app/frontend/src/components/CSVImportModal.js` — CSV import with headerless support
- `/app/backend/server.py` — FastAPI backend (mirrors Next.js for K8s)
