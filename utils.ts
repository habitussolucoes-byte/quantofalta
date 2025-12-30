// Fix: Re-adding utility functions and date-fns imports to resolve "is not a module" errors in importing components
import { endOfMonth, differenceInDays, startOfDay } from 'date-fns';

/**
 * Formats a number as a Brazilian Real (BRL) currency string.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Calculates the total number of days remaining in the current month, including today.
 */
export const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const end = endOfMonth(now);
  // Calculates the integer difference between the start of the last day and the start of today, then adds 1 to include today.
  return differenceInDays(startOfDay(end), startOfDay(now)) + 1;
};
