# Finance Tracker - PRD

## Original Problem Statement
Personal finance tracker for maaser (tithe) management with:
- **Transaction Types**: Income, Give (charity), Lend (loans)
- **Maaser Calculation**: Auto-calculate percentage from income
- **All-Time Running Totals**: Always visible at top
- **View Modes**: All Time, This Year, This Month
- **Hebrew Date Support**: @hebcal/core integration
- **Recurring Transactions**: With cron sync functionality
- **Search & Filters**: Full search with multiple filter options

## Tech Stack
- **Frontend**: React 19 with Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Custom credentials auth with bcrypt
- **Libraries**: @hebcal/core, zod, react-hook-form, lucide-react

## User Flow
1. **Add Income** → System calculates Maaser (default 10%)
2. **Add Give** → Charity donation (reduces maaser balance)
3. **Add Lend** → Loan to someone (reduces maaser balance)
4. **Sync Recurring** → Generates pending recurring transactions
5. **Track Balance** → Dashboard shows all-time running totals

## What's Been Implemented (January 2026)

### Core Features
- [x] Separate transaction types: Income, Give, Lend
- [x] Maaser auto-calculation from income (configurable %)
- [x] All-time running totals (always visible)
- [x] View modes: All Time, This Year, This Month
- [x] Period-specific summaries (Monthly/Yearly)
- [x] Hebrew/Gregorian calendar toggle
- [x] Recurring transactions (Daily, Weekly, Bi-weekly, Monthly, Yearly)
- [x] "Sync Recurring" button to generate pending transactions

### Search & Filters
- [x] Text search by description/recipient
- [x] Filter by transaction type
- [x] Filter by date range
- [x] Filter by amount range
- [x] Filter by recurring status
- [x] Filter by recipient name
- [x] Clear All Filters button

### UI/UX
- [x] Glassmorphism design with earthy tones
- [x] Transactions grouped by type (Income, Gives, Lends)
- [x] Real-time filter count badge
- [x] Responsive mobile design
- [x] give_only mode properly unmounts lend components

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

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Income/Give/Lend separation
- [x] Maaser calculation
- [x] All-time running totals
- [x] View modes (All Time/Year/Month)
- [x] Search & filters
- [x] Recurring transaction sync

### P1 (High Priority) - Future
- [ ] Automated cron job for recurring (currently manual sync)
- [ ] Export transactions (CSV/PDF)
- [ ] Maaser distribution suggestions

### P2 (Medium Priority) - Future
- [ ] Charts and analytics view
- [ ] Category tagging
- [ ] Multi-user household support

## Next Tasks
1. Add visual charts for income/maaser trends
2. Add export functionality (CSV/PDF)
3. Set up automated cron job for recurring transactions
