
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface AddTransactionModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: string[];
  transactions: Transaction[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSubmit, categories, transactions }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: categories[0] || 'Geral'
  });

  const handleSave = () => {
    if (!formData.name || !formData.amount) return;

    const amountValue = parseFloat(formData.amount || '0');
    
    // Check for duplicates (same name, amount and date)
    const isDuplicate = transactions.some((t: Transaction) => 
      t.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      t.amount === amountValue &&
      t.date === formData.date
    );

    if (isDuplicate) {
      const confirmed = window.confirm(
        `Atenção: Já existe uma transação registrada com o nome "${formData.name}", valor ${formatCurrency(amountValue)} e data ${format(parseISO(formData.date), 'dd/MM/yyyy')}.\n\nDeseja adicionar esta transação duplicada mesmo assim?`
      );
      if (!confirmed) return;
    }

    onSubmit({
      ...formData,
      amount: amountValue,
      status: formData.type === 'income' ? 'paid' : 'open'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Nova Transação</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFormData({...formData, type: 'income'})}
                className={`flex-1 py-2 rounded-lg border font-medium transition-all ${formData.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}
              >
                Receita
              </button>
              <button 
                onClick={() => setFormData({...formData, type: 'expense'})}
                className={`flex-1 py-2 rounded-lg border font-medium transition-all ${formData.type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 text-slate-400'}`}
              >
                Gasto
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Aluguel, Salário, Mercado..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!formData.name || !formData.amount}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
