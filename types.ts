// Fix: Re-adding exported types to resolve "is not a module" errors in importing components
export type TransactionStatus = 'paid' | 'open' | 'overdue';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  status: TransactionStatus;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
}

export interface AppState {
  transactions: Transaction[];
  goals: Goal[];
  categories: string[];
  templates: RecurringTemplate[];
}
