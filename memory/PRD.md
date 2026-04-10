# Finance Tracker - PRD

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS (blue theme)
- **Backend**: FastAPI + Supabase (PostgreSQL)
- **Charts**: Recharts
- **Export**: jspdf + jspdf-autotable
- **Hebrew Calendar**: @hebcal/core

## What's Implemented

### Core Features
- [x] Transaction types: Income, Give, Lend
- [x] Maaser auto-calculation (configurable %)
- [x] All-time running totals
- [x] View modes: All Time, Year, Month
- [x] Hebrew/Gregorian calendar
- [x] Recurring transactions with cron sync
- [x] Search with filters
- [x] Analytics charts (Area, Bar, Pie)
- [x] Export (CSV, PDF)

### User Settings (Database-Persisted)
- [x] Base currency
- [x] Default view (all_time/year/month)
- [x] Calendar mode (Gregorian/Hebrew)
- [x] Distribution mode (both/give_only)

### UI/UX
- [x] Clean blue Tailwind theme
- [x] Add Transaction button at top
- [x] Compact stats cards
- [x] Settings modal
- [x] Responsive design

## Database Schema
```sql
users:
- id, email, password_hash, name
- base_currency, distribution_mode
- default_view, use_hebrew_calendar

transactions:
- id, user_id, description, amount, currency
- exchange_rate_to_base, type (income/give/lend)
- maaser_percentage, maaser_amount
- recipient_name, date, hebrew_date
- is_recurring, recurring_frequency, recurring_end_date
```

## Next Tasks
1. Automated external cron scheduler
2. Email notifications
3. Budget goals feature
