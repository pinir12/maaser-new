# Maaser Tracker — Product Requirements Document

## Original Problem Statement
Build a personal finance tracker for the frum community to track maaser (tithing) obligations. The app auto-calculates 10% maaser on income and tracks give/lend distributions against that obligation.

## Architecture
- **Framework**: Next.js (App Router) — unified frontend + serverless API routes
- **Database**: Supabase (PostgreSQL), accessed server-side only
- **Security**: AES zero-knowledge encryption, all DB calls server-side only
- **Deployment**: Vercel-ready
- **PWA**: Service Worker + manifest
- **Email**: Resend for verification, password reset, magic login, contact, summaries

## Core Features (All Implemented)
- JWT auth with email verification on signup
- **Passwordless signup** (email-only, no password required)
- **Magic link login** (for passwordless users or anyone)
- **Forgot password** (code + magic link → set new password)
- **Set password in Settings** (for passwordless users)
- Disposable email blocking
- Transaction CRUD with Give/Lend split balances
- Hebrew & Gregorian calendar support
- Recurring transactions with cron processing
- CSV bank statement import with smart column mapping
- Analytics charts, Export to CSV/PDF
- Contact form, Admin panel
- SEO landing page, Skeleton loading states

## What's Been Implemented
- Full Next.js migration from CRA + FastAPI (Apr 2026)
- Zero-knowledge AES encryption
- CSV import modal
- PWA setup
- Polished landing page
- Email verification on signup (Apr 2026)
- **Forgot password flow** (Apr 2026)
- **Passwordless signup + magic link login** (Apr 2026)
- **Set password via Settings** (Apr 2026)
- All 3 email templates: verification (blue), reset (slate/dark), magic login (green)

## Database Schema
- `users`: id, email, password_hash (empty string for passwordless), name, base_currency, distribution_mode, created_at, default_view, use_hebrew_calendar, is_admin, default_maaser_percentage, give_ratio, lend_ratio, email_verified, verification_code, verification_expires

## Backlog (NOT requested)
- P1: Push notification / email reminders for recurring transactions
- P2: Budget goals and tracking

## Key Files
- `/app/backend/server.py` — FastAPI backend (mirrors Next.js routes for K8s dev)
- `/app/frontend/src/app/api/auth/` — All auth API routes
- `/app/frontend/src/components/AuthPage.js` — Auth with all flows
- `/app/frontend/src/components/ForgotPassword.js` — Forgot password
- `/app/frontend/src/components/MagicLoginFlow.js` — Magic link login
- `/app/frontend/src/components/EmailVerification.js` — 6-digit code input
- `/app/frontend/src/components/SettingsModal.js` — Settings with set password
- `/app/frontend/src/lib/email-verification.js` — Code generation, disposable check, email template
