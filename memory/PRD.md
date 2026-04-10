# Finance Tracker - PRD

## Original Problem Statement
Personal finance tracker with:
- **Currency Normalization**: Dashboard stats in base_currency using exchange_rate_to_base
- **State Management**: useOptimistic for instant UI feel
- **Lend Cleanup**: distribution_mode === 'give_only' unmounts lend components (not CSS hidden)
- **Hebrew Date Logic**: @hebcal/core for Monthly View toggle
- **Zod Validation**: give_percentage + lend_percentage <= 100%

## Tech Stack
- **Frontend**: React 19 with Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Custom credentials auth with bcrypt
- **Libraries**: @hebcal/core, zod, react-hook-form, lucide-react

## User Personas
1. **Personal Finance User**: Tracks charitable giving and lending
2. **Hebrew Calendar User**: Prefers viewing finances by Hebrew month

## Core Requirements (Static)
- [x] User registration and login
- [x] Dashboard with Total Balance, Total Given, Total Owed stats
- [x] Add/Edit/Delete transactions
- [x] Currency selection with exchange rate
- [x] Hebrew/Gregorian calendar toggle
- [x] Monthly view navigation
- [x] Distribution mode toggle (both/give_only)
- [x] Zod validation for percentages

## What's Been Implemented (January 2026)
- [x] Auth system with bcrypt password hashing
- [x] Glassmorphism UI design with organic/earthy theme
- [x] Dashboard with stats cards
- [x] Transaction CRUD operations
- [x] Hebrew date display using @hebcal/core
- [x] useOptimistic for instant UI updates
- [x] give_only mode properly UNMOUNTS lend components
- [x] Zod validation ensuring give + lend <= 100%
- [x] Currency normalization (exchange_rate_to_base)
- [x] Mobile responsive design

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Core auth flow
- [x] Transaction management
- [x] Hebrew calendar integration
- [x] Distribution mode unmounting

### P1 (High Priority) - Future
- [ ] Session persistence improvements
- [ ] Export transactions (CSV/PDF)
- [ ] Category tagging for transactions

### P2 (Medium Priority) - Future
- [ ] Charts and analytics view
- [ ] Recurring transactions
- [ ] Multi-user household support

## Next Tasks
1. Add charts/analytics for spending trends
2. Implement transaction categories
3. Add export functionality
