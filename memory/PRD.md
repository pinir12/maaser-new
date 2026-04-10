# Finance Tracker - PRD

## Original Problem Statement
Personal finance tracker with:
- **Separate Transaction Types**: Income, Give (charity), Lend (loans)
- **Maaser Calculation**: Auto-calculate 10% from income
- **Currency Normalization**: Dashboard stats in base_currency
- **Hebrew Date Logic**: @hebcal/core for Monthly View toggle
- **Recurring Transactions**: For all transaction types
- **Lend Cleanup**: distribution_mode === 'give_only' unmounts lend components

## Tech Stack
- **Frontend**: React 19 with Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Custom credentials auth with bcrypt
- **Libraries**: @hebcal/core, zod, react-hook-form, lucide-react

## User Flow
1. **Add Income** → System calculates Maaser (default 10%)
2. **Add Give** → Charity donation (reduces maaser balance)
3. **Add Lend** → Loan to someone (reduces maaser balance, only if not give_only mode)
4. **Track Balance** → Dashboard shows: Income, Maaser Owed, Maaser Balance, Given, Lent

## Core Requirements (Static)
- [x] Separate transaction types: Income, Give, Lend
- [x] Maaser auto-calculation from income
- [x] Dashboard with proper stats separation
- [x] Currency selection with exchange rate
- [x] Hebrew/Gregorian calendar toggle
- [x] Monthly view navigation
- [x] Distribution mode toggle (both/give_only)
- [x] Recurring transactions for all types

## What's Been Implemented (January 2026)
- [x] Auth system with bcrypt password hashing
- [x] Glassmorphism UI design
- [x] Transaction types: Income (green), Give (dark green), Lend (red)
- [x] Maaser percentage input (default 10%)
- [x] Real-time maaser calculation display
- [x] Dashboard stats: Total Income, Maaser Owed, Maaser Balance, Total Given, Total Lent
- [x] Transactions grouped by type in list view
- [x] Hebrew date display using @hebcal/core
- [x] give_only mode properly UNMOUNTS lend components
- [x] Recurring transaction options: Daily, Weekly, Bi-weekly, Monthly, Yearly
- [x] Currency normalization with exchange_rate_to_base
- [x] Mobile responsive design

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
- [x] Hebrew calendar integration
- [x] Recurring transactions

### P1 (High Priority) - Future
- [ ] Recurring transaction auto-generation (cron job)
- [ ] Export transactions (CSV/PDF)
- [ ] Maaser distribution suggestions

### P2 (Medium Priority) - Future
- [ ] Charts and analytics view
- [ ] Category tagging
- [ ] Multi-user household support

## Next Tasks
1. Implement cron job for recurring transaction generation
2. Add export functionality
3. Add charts for income/maaser trends
