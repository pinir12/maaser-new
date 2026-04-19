# Maaser Tracker — Product Requirements Document

## Original Problem Statement
Build a personal finance tracker for the frum community to track maaser (tithing) obligations.

## Architecture
- **Framework**: Next.js (App Router) — unified frontend + serverless API routes
- **Database**: Supabase (PostgreSQL), server-side only with JWT-based RLS
- **Security**: AES zero-knowledge encryption, JWT RLS (anon key + user JWT for user ops, service_role for admin ops)
- **Deployment**: Vercel-ready
- **PWA**: Service Worker + manifest with M icon
- **Email**: Resend via mail@pinir.co.uk

## Core Features
- JWT auth with email verification, passwordless signup, magic link login, forgot password
- Disposable email blocking
- **Paginated transactions** (50 at a time with "Load more")
- **Server-side totals** via `/api/transactions/totals` (always accurate regardless of pagination)
- Transaction CRUD with Give/Lend split balances
- Hebrew & Gregorian calendar support (session-only toggle)
- Recurring transactions with cron processing
- CSV import with smart column mapping + headerless CSV support
- Analytics, Export, Contact form, Admin panel
- SEO landing page, Skeleton loading states

## Recent Changes
- Pagination: transactions load 50 at a time, "Load more" button for additional pages
- Server-side totals: `/api/transactions/totals` computes all-time balances from all records
- Email from address: all emails now from `mail@pinir.co.uk`
- Email logo centering: switched from inline-flex to table-based centering for email client compatibility
- Verify link fix: added NEXT_PUBLIC_APP_URL + VERCEL_URL fallback
- RLS: user-scoped Supabase helpers use anon key + user JWT

## Backlog (NOT requested)
- Push notifications (P1), Budget goals (P2)
