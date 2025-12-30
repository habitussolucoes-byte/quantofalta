
import React, { useMemo, useState } from 'react';
import { format, isSameMonth, parseISO, isBefore, addDays, differenceInDays } from 'date-fns';
import { 
  AlertCircle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  Tag,
  BarChart3,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { AppState, Transaction, TransactionStatus } from '../types';
import { formatCurrency, getDaysRemainingInMonth } from '../utils';
import AddTransactionModal from './AddTransactionModal';

interface DashboardProps {
  state: AppState;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  addTransaction: (tx: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, updateTransactionStatus, addTransaction }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Financial calculations for CURRENT MONTH + OVERDUE
  const { 
    totalIncome, 
    totalExpenses, 
    pendingExpenses, 
    paidExpenses, 
    overdueExpenses,
    urgentExpense,
    remainingToPay,
    categoryBreakdown,
    netSavings,
    savingsRate,
    topCategories
  } = useMemo(() => {
    const now = new Date();
    
    // Expenses to consider: those in the current month OR overdue from previous months
    const relevantExpenses = state.transactions.filter(tx => {
       if (tx.type !== 'expense') return false;
       const txDate = parseISO(tx.date);
       return isSameMonth(txDate, now) || tx.status === 'overdue';
    });

    const income = state.transactions
      .filter(tx => tx.type === 'income' && isSameMonth(parseISO(tx.date), now))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expensesSum = relevantExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const pending = relevantExpenses.filter(tx => tx.status === 'open' || tx.status === 'overdue');
    const paid = relevantExpenses.filter(tx => tx.status === 'paid');
    const overdue = relevantExpenses.filter(tx => tx.status === 'overdue');
    const unpaidSum = pending.reduce((sum, tx) => sum + tx.amount, 0);

    // Category breakdown for current month expenses only (to keep it clean)
    const monthExpenses = state.transactions.filter(tx => tx.type === 'expense' && isSameMonth(parseISO(tx.date), now));
    const breakdownMap: Record<string, number> = {};
    monthExpenses.forEach(tx => {
      breakdownMap[tx.category] = (breakdownMap[tx.category] || 0) + tx.amount;
    });

    const breakdown = Object.entries(breakdownMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly Summary metrics
    const net = income - expensesSum;
    const rate = income > 0 ? (net / income) * 100 : 0;

    // Find urgent expense (overdue first, then soonest due)
    const sortedUrgent = [...pending].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });

    return {
      totalIncome: income,
      totalExpenses: expensesSum,
      pendingExpenses: pending,
      paidExpenses: paid,
      overdueExpenses: overdue,
      urgentExpense: sortedUrgent[0] || null,
      remainingToPay: unpaidSum,
      categoryBreakdown: breakdown,
      netSavings: net,
      savingsRate: rate,
      topCategories: breakdown.slice(0, 3)
    };
  }, [state.transactions]);

  const daysLeft = getDaysRemainingInMonth();
  const dailyIncomeNeeded = remainingToPay > 0 ? remainingToPay / daysLeft : 0;

  const handleMarkAsPaid = (tx: Transaction) => {
    const confirmed = window.confirm(`Deseja marcar a transação "${tx.name}" como paga?`);
    if (confirmed) {
      updateTransactionStatus(tx.id, 'paid');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bem-vindo ao Finanza</h2>
          <p className="text-slate-500">{format(new Date(), "MMMM 'de' yyyy")}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          Nova Receita/Gasto
        </button>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Receita do Mês" 
          value={formatCurrency(totalIncome)} 
          icon={<ArrowUpCircle className="text-emerald-500" />}
          subValue="Ganhos registrados"
        />
        <StatCard 
          title="Dívida Total" 
          value={formatCurrency(totalExpenses)} 
          icon={<ArrowDownCircle className="text-rose-500" />}
          subValue={`${pendingExpenses.length} itens pendentes`}
        />
        <StatCard 
          title="Falta Pagar" 
          value={formatCurrency(remainingToPay)} 
          icon={<DollarSign className="text-amber-500" />}
          highlight={remainingToPay > 0}
          subValue="A quitar este mês"
        />
      </div>

      {/* Resumo Mensal */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-emerald-400" size={24} />
            <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400">Resumo Mensal</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Net Result */}
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm font-medium">Economia Líquida</p>
                <p className={`text-4xl font-bold mt-1 ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netSavings)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-bold ${savingsRate >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {savingsRate.toFixed(1)}% da receita
                </div>
                <span className="text-slate-500 text-xs">preservada</span>
              </div>
            </div>

            {/* Income vs Expenses Bar */}
            <div className="flex flex-col justify-center gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>Receitas</span>
                  <span className="text-emerald-400">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span>Despesas</span>
                  <span className="text-rose-400">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (totalExpenses / (totalIncome || 1)) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <p className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Maiores Gastos</p>
              <div className="space-y-3">
                {topCategories.length > 0 ? topCategories.map((cat, i) => (
                  <div key={cat.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-4 rounded-full ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">{formatCurrency(cat.amount)}</span>
                  </div>
                )) : (
                  <p className="text-xs text-slate-600 italic">Sem dados suficientes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Progress & Category Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Quitação Diária</h3>
            <p className="text-slate-600 mb-4">
              Meta diária de arrecadação/economia: <span className="font-bold text-emerald-600">{formatCurrency(dailyIncomeNeeded)}</span> para fechar o mês sem dívidas ({daysLeft} dias restantes).
            </p>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (totalIncome / (totalExpenses || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Progresso de quitação: {((totalIncome / (totalExpenses || 1)) * 100).toFixed(1)}% das despesas totais
            </p>
          </div>
          
          <div className="mt-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-3">
              <Calendar className="text-emerald-600 mt-1" size={24} />
              <div>
                <h4 className="font-medium text-emerald-800 text-sm">Próxima conta urgente</h4>
                {urgentExpense ? (
                  <>
                    <p className="text-2xl font-bold text-emerald-950 mt-1">{urgentExpense.name}</p>
                    <p className="text-sm text-emerald-700">
                      Vence {urgentExpense.status === 'overdue' ? 'há ' : 'em '}
                      <span className="font-bold">
                        {Math.abs(differenceInDays(parseISO(urgentExpense.date), new Date()))} dias
                      </span>
                      ({format(parseISO(urgentExpense.date), 'dd/MM')})
                    </p>
                    <button 
                      onClick={() => handleMarkAsPaid(urgentExpense)}
                      className="mt-3 bg-white text-emerald-700 text-xs font-bold py-1.5 px-3 rounded border border-emerald-200 hover:bg-emerald-100"
                    >
                      Marcar como paga
                    </button>
                  </>
                ) : (
                  <p className="text-emerald-700 italic mt-1">Nenhuma conta pendente. Bom trabalho!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-800">Detalhamento por Categoria</h3>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {categoryBreakdown.length > 0 ? categoryBreakdown.map((cat, idx) => {
              const percentage = (cat.amount / totalExpenses) * 100;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-500 font-bold">{formatCurrency(cat.amount)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-emerald-400`} 
                      style={{ 
                        width: `${percentage}%`,
                        opacity: 1 - (idx * 0.15)
                      }} 
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Tag size={32} className="mb-2 opacity-20" />
                <p className="text-sm italic">Sem gastos registrados este mês.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goals Shortcut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Metas Financeiras
            </h3>
          </div>
          <div className="space-y-4">
            {state.goals.length > 0 ? state.goals.slice(0, 3).map(goal => (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{goal.name}</span>
                  <span className="text-slate-500">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic">Crie metas para ver seu progresso aqui.</p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Clock size={20} className="text-amber-500" />
            Pendências Recentes
          </h3>
          <div className="space-y-3">
            {pendingExpenses.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  {tx.status === 'overdue' ? <AlertCircle size={18} className="text-rose-500" /> : <Clock size={18} className="text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{tx.name}</p>
                    <p className="text-xs text-slate-500">{format(parseISO(tx.date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(tx.amount)}</p>
                  <button 
                    onClick={() => handleMarkAsPaid(tx)}
                    className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))}
            {pendingExpenses.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-200" />
                <p className="text-sm">Tudo quitado por hoje!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showAddModal && (
        <AddTransactionModal 
          categories={state.categories}
          transactions={state.transactions}
          onClose={() => setShowAddModal(false)} 
          onSubmit={(data) => {
            addTransaction(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, subValue, highlight = false }: any) => (
  <div className={`p-6 rounded-2xl border bg-white shadow-sm transition-transform hover:scale-[1.02] ${highlight ? 'ring-2 ring-amber-100 border-amber-200' : ''}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-slate-50">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;
