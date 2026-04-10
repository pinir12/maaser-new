# Finance Tracker - PRD

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS (blue theme)
- **Backend**: FastAPI + Supabase (PostgreSQL)
- **Email**: Resend (transactional emails)
- **Charts**: Recharts
- **Export**: jspdf + jspdf-autotable
- **Hebrew Calendar**: @hebcal/core
- **Currency Rates**: open.er-api.com (free, no key)

## What's Implemented

### Core Features
- [x] Transaction types: Income, Give, Lend
- [x] Maaser auto-calculation (configurable % via settings)
- [x] Custom give/lend ratio (settings, visual bar)
- [x] All-time running totals
- [x] View modes: All Time, Year, Month
- [x] Hebrew/Gregorian calendar
- [x] Recurring transactions with cron sync
- [x] Recurring transaction edit/delete management (dedicated section)
- [x] Search with filters
- [x] Analytics charts (Area, Bar, Pie)
- [x] Export (CSV, PDF)
- [x] Accordion collapsible transaction groups (Income, Give, Lend)

### User Settings (Database-Persisted)
- [x] Base currency
- [x] Default view (all_time/year/month)
- [x] Calendar mode (Gregorian/Hebrew)
- [x] Distribution mode (both/give_only)
- [x] Default maaser percentage (configurable, default 10%)
- [x] Give/Lend ratio (shown only in both mode)

### Communication
- [x] Admin email on new user signup (via Resend)
- [x] Contact form modal (sends to admin via Resend)

### Admin
- [x] Admin panel (conditionally rendered via is_admin flag)
- [x] User management: view, toggle admin, delete users

### Transaction Enhancements
- [x] Autofill/prediction (type description to get past transaction suggestions)
- [x] Hebrew date picker (in Hebrew calendar mode)
- [x] Live currency conversion (auto-fetch exchange rates)

### UI/UX
- [x] Clean blue Tailwind theme with modern glassmorphism
- [x] Stats cards stretch to fill width uniformly (flex-1)
- [x] Add Transaction button at top with gradient
- [x] Compact stats cards
- [x] Settings modal with maaser % and give/lend ratio
- [x] Responsive design
- [x] Backdrop blur header
- [x] Vercel deployment ready (verified build succeeds)

## Database Schema
```sql
users:
- id, email, password_hash, name
- base_currency, distribution_mode
- default_view, use_hebrew_calendar
- is_admin (boolean, default false)
- default_maaser_percentage (numeric, default 10)
- give_ratio (numeric, default 50)
- lend_ratio (numeric, default 50)

transactions:
- id, user_id, description, amount, currency
- exchange_rate_to_base, type (income/give/lend)
- maaser_percentage, maaser_amount
- recipient_name, date, hebrew_date
- is_recurring, recurring_frequency, recurring_end_date
```

## SQL Required (Run in Supabase Dashboard)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_maaser_percentage NUMERIC DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS give_ratio NUMERIC DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lend_ratio NUMERIC DEFAULT 50;

-- Set your admin user:
UPDATE users SET is_admin = TRUE WHERE email = 'mail@pinir.co.uk';
```

## API Endpoints
- POST /api/cron/recurring - Process recurring transactions
- POST /api/email/signup-notification - Admin notification on signup
- POST /api/email/contact - Contact form submission
- GET /api/currency/rates/{base} - Live exchange rates (cached 1hr)

## Next Tasks
- Push notifications for upcoming recurring transactions
- Budget goals and tracking feature
