# Finance Tracker - PRD

## Original Problem Statement
Personal finance tracker for maaser (tithe) management with:
- **Transaction Types**: Income, Give (charity), Lend (loans)
- **Maaser Calculation**: Auto-calculate percentage from income
- **All-Time Running Totals**: Always visible at top
- **View Modes**: All Time, This Year, This Month
- **Hebrew Date Support**: @hebcal/core integration
- **Recurring Transactions**: With automated cron sync
- **Search & Filters**: Full search with multiple filter options
- **Analytics Charts**: Visual trends (Area, Bar, Pie)
- **Export**: CSV and PDF export functionality

## Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Recharts
- **Backend**: FastAPI (Python) + Supabase (PostgreSQL)
- **Auth**: Custom credentials auth with bcrypt
- **Libraries**: @hebcal/core, zod, react-hook-form, lucide-react, recharts, jspdf

## What's Been Implemented (January 2026)

### Core Features
- [x] Separate transaction types: Income, Give, Lend
- [x] Maaser auto-calculation from income (configurable %)
- [x] All-time running totals (always visible)
- [x] View modes: All Time, This Year, This Month
- [x] Period-specific summaries (Monthly/Yearly)
- [x] Hebrew/Gregorian calendar toggle
- [x] Recurring transactions (Daily, Weekly, Bi-weekly, Monthly, Yearly)

### Cron Job (Automated Recurring)
- [x] Backend endpoint: POST /api/cron/recurring
- [x] Processes all recurring transactions automatically
- [x] Creates new entries for due recurring items
- [x] Respects recurring_end_date
- [x] Frontend "Sync Recurring" button for manual trigger

### Analytics Charts
- [x] Toggle button to show/hide charts
- [x] Area chart for trends over time
- [x] Bar chart for monthly comparisons
- [x] Pie chart for distribution breakdown
- [x] Summary stats: Avg Monthly Income, Maaser, Given
- [x] Color-coded by transaction type

### Export Functionality
- [x] CSV export with all transaction data
- [x] PDF export with:
  - Summary statistics
  - Transaction table
  - Professional formatting
  - Page numbers

### Search & Filters
- [x] Text search by description/recipient
- [x] Filter by transaction type
- [x] Filter by date range
- [x] Filter by amount range
- [x] Filter by recurring status
- [x] Filter by recipient name
- [x] Clear All Filters button

## Database Schema
```sql
transactions:
- id, user_id, description, amount, currency
- exchange_rate_to_base, type (income/give/lend)
- maaser_percentage, maaser_amount (for income)
- recipient_name (for give/lend)
- date, hebrew_date
- is_recurring, recurring_frequency, recurring_end_date
```

## API Endpoints
- GET /api/ - Health check
- GET/POST /api/status - Status checks
- POST /api/cron/recurring - Process recurring transactions

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Income/Give/Lend separation
- [x] Maaser calculation
- [x] All-time running totals
- [x] View modes
- [x] Search & filters
- [x] Recurring sync (cron)
- [x] Analytics charts
- [x] Export (CSV/PDF)

### P1 (High Priority) - Future
- [ ] Scheduled cron job (external scheduler)
- [ ] Email notifications for recurring
- [ ] Maaser distribution suggestions

### P2 (Medium Priority) - Future
- [ ] Multi-user household support
- [ ] Category tagging
- [ ] Budget goals

## Next Tasks
1. Set up external cron scheduler (e.g., Railway cron, Supabase pg_cron)
2. Add email notifications for upcoming recurring transactions
3. Add budget goals and tracking
