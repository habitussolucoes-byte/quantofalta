
export type TransactionStatus = 'paid' | 'open' | 'overdue';

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO format
  status: TransactionStatus;
  type: 'income' | 'expense';
  templateId?: string; // If it came from a recurring template
  category: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface AppState {
  recurringTemplates: RecurringTemplate[];
  transactions: Transaction[];
  goals: Goal[];
  categories: string[];
  lastSyncDate: string; // Used to trigger monthly generation
}
