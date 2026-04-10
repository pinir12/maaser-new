import { z } from 'zod';

// Transaction form schema with percentage validation
export const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  exchange_rate_to_base: z.number().positive('Exchange rate must be positive'),
  type: z.enum(['give', 'lend', 'both']),
  give_percentage: z.number().min(0).max(100).default(100),
  lend_percentage: z.number().min(0).max(100).default(0),
  recipient_name: z.string().optional(),
  date: z.string().or(z.date()),
}).refine(
  (data) => data.give_percentage + data.lend_percentage <= 100,
  {
    message: 'Give percentage + Lend percentage cannot exceed 100%',
    path: ['lend_percentage'],
  }
);

// User settings schema
export const userSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  base_currency: z.string().min(1, 'Base currency is required'),
  distribution_mode: z.enum(['both', 'give_only']),
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
