import { z } from 'zod';

// Transaction types
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  GIVE: 'give',
  LEND: 'lend'
};

// Recurring frequencies
export const RECURRING_FREQUENCIES = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

// Income transaction schema
export const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  exchange_rate_to_base: z.number().positive('Exchange rate must be positive'),
  date: z.string().or(z.date()),
  maaser_percentage: z.number().min(0).max(100).default(10),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.string().default('none'),
  recurring_end_date: z.string().optional().nullable()
});

// Give transaction schema
export const giveSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  exchange_rate_to_base: z.number().positive('Exchange rate must be positive'),
  date: z.string().or(z.date()),
  recipient_name: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.string().default('none'),
  recurring_end_date: z.string().optional().nullable()
});

// Lend transaction schema
export const lendSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  exchange_rate_to_base: z.number().positive('Exchange rate must be positive'),
  date: z.string().or(z.date()),
  recipient_name: z.string().min(1, 'Recipient name is required'),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.string().default('none'),
  recurring_end_date: z.string().optional().nullable()
});

// User settings schema
export const userSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  base_currency: z.string().min(1, 'Base currency is required'),
  distribution_mode: z.enum(['both', 'give_only']),
  default_maaser_percentage: z.number().min(0).max(100).default(10)
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Register schema
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  base_currency: z.string().min(1, 'Base currency is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Currency list
export const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
];

export function getCurrencySymbol(code) {
  return currencies.find(c => c.code === code)?.symbol || code;
}

// Calculate maaser from income
export function calculateMaaser(amount, percentage = 10) {
  return (amount * percentage) / 100;
}

// Get recurring frequency label
export function getRecurringLabel(frequency) {
  const labels = {
    none: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };
  return labels[frequency] || frequency;
}
