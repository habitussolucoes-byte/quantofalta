
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Settings as SettingsIcon, 
  TrendingUp, 
  Plus, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2
} from 'lucide-react';
import { format, isSameMonth, parseISO, startOfMonth } from 'date-fns';
import { Transaction, AppState, RecurringTemplate, Goal, TransactionStatus } from './types';
import { 
  formatCurrency, 
  syncStateForNewMonth, 
  getDaysRemainingInMonth 
} from './utils';

// Components
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import Settings from './components/Settings';
import GoalsList from './components/GoalsList';

const DEFAULT_CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Saúde', 'Educação', 'Outros'];

const INITIAL_STATE: AppState = {
  recurringTemplates: [],
  transactions: [],
  goals: [],
  categories: DEFAULT_CATEGORIES,
  lastSyncDate: new Date().toISOString()
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'goals' | 'settings'>('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('finanza_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const synced = syncStateForNewMonth(parsed);
        // Migration: Ensure categories exist in old saved state
        if (!synced.categories) {
          synced.categories = DEFAULT_CATEGORIES;
        }
        return synced;
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // Sync state to localStorage on every change
  useEffect(() => {
    localStorage.setItem('finanza_state', JSON.stringify(state));
  }, [state]);

  // Global Handlers
  const addTransaction = (tx: Omit<Transaction, 'id' | 'status'> & { status?: TransactionStatus }) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substr(2, 9),
      status: tx.status || 'open'
    };
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTx]
    }));
  };

  const updateTransactionStatus = (id: string, status: TransactionStatus) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, status } : t)
    }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const saveRecurringTemplate = (template: RecurringTemplate) => {
    setState(prev => ({
      ...prev,
      recurringTemplates: [...prev.recurringTemplates, template]
    }));
    // Also trigger generation for current month if it doesn't exist
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), template.dueDay);
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    
    const newTx: Transaction = {
      id: `rec-${template.id}-${monthStart}`,
      name: template.name,
      amount: template.amount,
      date: format(dueDate, 'yyyy-MM-dd'),
      status: 'open',
      type: 'expense',
      templateId: template.id,
      category: template.category
    };
    
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTx]
    }));
  };

  const deleteTemplate = (id: string) => {
    setState(prev => ({
      ...prev,
      recurringTemplates: prev.recurringTemplates.filter(t => t.id !== id)
    }));
  };

  const saveGoal = (goal: Goal) => {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, goal]
    }));
  };

  const updateGoal = (id: string, amount: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g)
    }));
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
  };

  const addCategory = (name: string) => {
    if (!state.categories.includes(name)) {
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, name]
      }));
    }
  };

  const editCategory = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;
    
    if (state.categories.includes(newName)) {
      alert(`A categoria "${newName}" já existe.`);
      return;
    }

    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c === oldName ? newName : c),
      transactions: prev.transactions.map(t => t.category === oldName ? { ...t, category: newName } : t),
      recurringTemplates: prev.recurringTemplates.map(t => t.category === oldName ? { ...t, category: newName } : t)
    }));
  };

  const deleteCategory = (name: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== name)
    }));
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen fixed left-0 top-0 z-40">
        <div className="p-6">
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <TrendingUp size={28} />
            Quanto falta? v1.0
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<Receipt size={20} />} label="Transações" />
          <NavItem active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon={<TrendingUp size={20} />} label="Metas" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Configurações" />
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} />
        <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<Receipt size={24} />} />
        <MobileNavItem active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon={<TrendingUp size={24} />} />
        <MobileNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={24} />} />
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard 
            state={state} 
            updateTransactionStatus={updateTransactionStatus} 
            addTransaction={addTransaction} 
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsList 
            transactions={state.transactions} 
            categories={state.categories}
            updateStatus={updateTransactionStatus} 
            onDelete={deleteTransaction}
            onAdd={addTransaction}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsList 
            goals={state.goals} 
            onSave={saveGoal} 
            onUpdate={updateGoal} 
            onDelete={deleteGoal} 
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            templates={state.recurringTemplates} 
            categories={state.categories}
            onSaveTemplate={saveRecurringTemplate} 
            onDeleteTemplate={deleteTemplate} 
            onAddCategory={addCategory}
            onEditCategory={editCategory}
            onDeleteCategory={deleteCategory}
          />
        )}
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`p-2 transition-colors ${active ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    {icon}
  </button>
);

export default App;
