
import React, { useMemo, useState } from 'react';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  isWithinInterval, 
  startOfDay, 
  endOfDay 
} from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Search, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  CalendarDays
} from 'lucide-react';
import { Transaction, TransactionStatus } from '../types';
import { formatCurrency } from '../utils';
import AddTransactionModal from './AddTransactionModal';

interface TransactionsListProps {
  transactions: Transaction[];
  categories: string[];
  updateStatus: (id: string, status: TransactionStatus) => void;
  onDelete: (id: string) => void;
  onAdd: (tx: any) => void;
}

type DateFilterType = 'all' | 'currentMonth' | 'previousMonth' | 'custom';

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, categories, updateStatus, onDelete, onAdd }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customRange, setCustomRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    
    return transactions
      .filter(tx => {
        // Type filter
        const matchesType = filter === 'all' || tx.type === filter;
        
        // Search filter (Name and Category)
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          tx.name.toLowerCase().includes(term) || 
          tx.category.toLowerCase().includes(term);
        
        // Date filter
        const txDate = parseISO(tx.date);
        let matchesDate = true;

        if (dateFilter === 'currentMonth') {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          matchesDate = isWithinInterval(txDate, { start: startOfDay(start), end: endOfDay(end) });
        } else if (dateFilter === 'previousMonth') {
          const prevMonth = subMonths(now, 1);
          const start = startOfMonth(prevMonth);
          const end = endOfMonth(prevMonth);
          matchesDate = isWithinInterval(txDate, { start: startOfDay(start), end: endOfDay(end) });
        } else if (dateFilter === 'custom') {
          const start = parseISO(customRange.start);
          const end = parseISO(customRange.end);
          matchesDate = isWithinInterval(txDate, { start: startOfDay(start), end: endOfDay(end) });
        }

        return matchesType && matchesSearch && matchesDate;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, filter, dateFilter, customRange, searchTerm]);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'open': return <Clock className="text-amber-500" size={18} />;
      case 'overdue': return <AlertCircle className="text-rose-500" size={18} />;
    }
  };

  const getStatusText = (status: TransactionStatus) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'open': return 'Em aberto';
      case 'overdue': return 'Atrasado';
    }
  };

  const handleMarkAsPaid = (tx: Transaction) => {
    const confirmed = window.confirm(`Deseja marcar a transação "${tx.name}" como paga?`);
    if (confirmed) {
      updateStatus(tx.id, 'paid');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transações</h2>
          <p className="text-slate-500">Histórico completo de receitas e gastos</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          Nova Transação
        </button>
      </header>

      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        {/* Barra de Pesquisa e Filtro de Tipo */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter('income')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Receitas
            </button>
            <button 
              onClick={() => setFilter('expense')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gastos
            </button>
          </div>
        </div>

        {/* Filtros de Data */}
        <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Período:</span>
          </div>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todo o histórico</option>
            <option value="currentMonth">Mês Atual</option>
            <option value="previousMonth">Mês Anterior</option>
            <option value="custom">Intervalo Personalizado</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <input 
                type="date" 
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input 
                type="date" 
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {tx.type === 'income' ? <ArrowUpCircle className="text-emerald-500" size={20} /> : <ArrowDownCircle className="text-rose-500" size={20} />}
                      <span className="font-medium text-slate-800">{tx.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {format(parseISO(tx.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className={`text-sm font-medium ${tx.status === 'paid' ? 'text-emerald-600' : tx.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {getStatusText(tx.status)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      {tx.status !== 'paid' && tx.type === 'expense' && (
                        <button 
                          onClick={() => handleMarkAsPaid(tx)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Marcar como pago"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this transaction?')) {
                            onDelete(tx.id);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma transação encontrada no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal 
          categories={categories}
          transactions={transactions}
          onClose={() => setShowAddModal(false)} 
          onSubmit={(data) => {
            onAdd(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TransactionsList;
