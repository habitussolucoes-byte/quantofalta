
// Define the possible statuses for a financial transaction
export type TransactionStatus = 'paid' | 'open' | 'overdue';

// Represents a financial transaction, which can be either income or an expense
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO format date string (e.g., YYYY-MM-DD)
  category: string;
  status: TransactionStatus;
}

// Represents a financial goal that a user is tracking progress towards
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO format date string
}

// Represents a template for a recurring monthly expense
export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
}

// The overall shape of the application's persistent state
export interface AppState {
  transactions: Transaction[];
  categories: string[];
  goals: Goal[];
  templates: RecurringTemplate[];
}
