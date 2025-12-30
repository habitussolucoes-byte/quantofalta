
import { format, startOfMonth, endOfMonth, isBefore, parseISO, isSameMonth, getDate, differenceInDays } from 'date-fns';
import { Transaction, RecurringTemplate, AppState } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateMonthlyRecurring = (
  templates: RecurringTemplate[],
  currentDate: Date
): Transaction[] => {
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  
  return templates.map(t => {
    // Determine the due date for this specific month
    const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), t.dueDay);
    const today = new Date();
    
    let status: 'open' | 'overdue' = 'open';
    if (isBefore(dueDate, today) && !isSameMonth(dueDate, today)) {
       // This shouldn't happen during fresh generation for current month, 
       // but logic dictates checking if date has passed.
    }

    return {
      id: `rec-${t.id}-${monthStart}`,
      name: t.name,
      amount: t.amount,
      date: format(dueDate, 'yyyy-MM-dd'),
      status: 'open',
      type: 'expense',
      templateId: t.id,
      category: t.category
    };
  });
};

export const syncStateForNewMonth = (state: AppState): AppState => {
  const now = new Date();
  const lastSync = parseISO(state.lastSyncDate);

  // If it's a new month
  if (!isSameMonth(now, lastSync)) {
    // 1. Identify previous open expenses and mark as overdue
    const updatedTransactions = state.transactions.map(tx => {
      if (tx.type === 'expense' && tx.status === 'open' && isBefore(parseISO(tx.date), startOfMonth(now))) {
        return { ...tx, status: 'overdue' as const };
      }
      return tx;
    });

    // 2. Generate recurring expenses for the new month
    const newMonthlyExpenses = generateMonthlyRecurring(state.recurringTemplates, now);
    
    // 3. Filter out if they already exist (safety check)
    const filteredNewExpenses = newMonthlyExpenses.filter(
      ne => !updatedTransactions.find(t => t.id === ne.id)
    );

    return {
      ...state,
      transactions: [...updatedTransactions, ...filteredNewExpenses],
      lastSyncDate: now.toISOString()
    };
  }

  return state;
};

export const getDaysRemainingInMonth = () => {
  const now = new Date();
  const lastDay = endOfMonth(now);
  return Math.max(1, differenceInDays(lastDay, now) + 1);
};
