# Maaser Tracker — Product Requirements Document

## Original Problem Statement
Build a personal finance tracker for the frum community to track maaser (tithing) obligations. The app auto-calculates 10% maaser on income and tracks give/lend distributions against that obligation.

## Latest Architecture
- **Framework**: Next.js (App Router) — unified frontend + serverless API routes
- **Database**: Supabase (PostgreSQL), accessed server-side only
- **Security**: AES zero-knowledge encryption (amounts stored as `0.0`, real values in `*_encrypted` columns)
- **Deployment**: Vercel-ready (`vercel.json`, `.npmrc` with `legacy-peer-deps`)
- **PWA**: Service Worker (`sw.js`) + `manifest.json` with generated icons
- **Email**: Resend for verification emails, contact form, admin notifications, monthly summaries

## Core Features (All Implemented)
- JWT auth (server-side, 30-day expiry)
- **Email verification on signup** (6-digit code + magic link button, disposable email blocking)
- Transaction CRUD with Give/Lend split balances
- Hebrew & Gregorian calendar support
- Recurring transactions with cron processing
- CSV bank statement import with smart column mapping
- Analytics charts (Recharts)
- Export to CSV/PDF
- Contact form via Resend email
- Admin panel
- Unauthenticated SEO landing page
- Skeleton loading states for dashboard balances & totals
- Settings: currency, maaser %, distribution mode (give-only vs give+lend), calendar preference

## What's Been Implemented (Completed)
- Full Next.js migration from CRA + FastAPI (Apr 2026)
- Zero-knowledge AES encryption for all sensitive transaction data
- CSV import modal with smart column mapping and preview
- PWA setup (manifest + service worker)
- Polished landing page
- Auth error flash fix (no page reload on 401)
- UI refinements: lend color violet, inline totals, trailing decimal fix
- Skeleton loading states for balances and totals sections
- Vercel deployment fixes (react-day-picker v9.6.4, .npmrc)
- **Email verification on signup** (Apr 2026):
  - 6-digit code input with auto-focus/auto-advance/auto-submit
  - Magic link button in email for one-click verification
  - Disposable/temp email blocking (disposable-email-domains package)
  - Unverified users blocked from login, shown verification screen
  - Resend verification with 1-minute rate limiting
  - Beautiful branded email template
  - Both FastAPI backend and Next.js API routes updated

## Database Schema Changes
- `users` table new columns: `email_verified` (boolean, default false), `verification_code` (text), `verification_expires` (timestamptz)

## Backlog / Future (User has NOT requested these — do not build)
- P1: Push notification / email reminders for recurring transactions
- P2: Budget goals and tracking

## 3rd Party Integrations
- Supabase (Database/Auth) — user-provided API key
- Resend (Email) — user-provided API key

## Key Files
- `/app/frontend/src/app/api/` — All serverless API routes
- `/app/frontend/src/app/api/auth/verify-email/route.js` — Email verification endpoint
- `/app/frontend/src/app/api/auth/resend-verification/route.js` — Resend verification endpoint
- `/app/frontend/src/lib/email-verification.js` — Code generation, disposable check, email template
- `/app/frontend/src/lib/encryption.js` — AES zero-knowledge logic
- `/app/frontend/src/components/EmailVerification.js` — 6-digit code input UI
- `/app/frontend/src/components/AuthPage.js` — Auth with verification flow
- `/app/frontend/src/components/Dashboard.js` — Main dashboard
- `/app/backend/server.py` — FastAPI backend (mirrors Next.js routes for K8s dev)
