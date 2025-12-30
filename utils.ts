
// Fix: Added necessary imports for date manipulation
import { endOfMonth, differenceInDays } from 'date-fns';

/**
 * Formats a numeric value into a localized currency string using BRL (Brazilian Real) format.
 * Used across multiple components for consistent financial display.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Calculates the total number of days remaining in the current calendar month, including the current day.
 * Used in the Dashboard for calculating daily savings goals.
 */
export const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const end = endOfMonth(now);
  // We add 1 to include the current day in the calculation of remaining days
  return Math.max(1, differenceInDays(end, now) + 1);
};
