
import React, { useState } from 'react';
import { Plus, Trash2, Target, TrendingUp, Calendar, Edit3 } from 'lucide-react';
import { Goal } from '../types';
import { formatCurrency } from '../utils';
import { format, parseISO } from 'date-fns';

interface GoalsListProps {
  goals: Goal[];
  onSave: (goal: Goal) => void;
  onUpdate: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

const GoalsList: React.FC<GoalsListProps> = ({ goals, onSave, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: format(new Date(), 'yyyy-MM-dd')
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    onSave({
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || '0'),
      deadline: formData.deadline
    });

    setFormData({ 
      name: '', 
      targetAmount: '', 
      currentAmount: '0', 
      deadline: format(new Date(), 'yyyy-MM-dd') 
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Metas Financeiras</h2>
          <p className="text-slate-500">Planeje seus sonhos e acompanhe seu progresso</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          Criar Meta
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Meta</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Viagem, Carro, Reserva..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Objetivo (R$)</label>
              <input 
                type="number" 
                value={formData.targetAmount}
                onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Inicial (R$)</label>
              <input 
                type="number" 
                value={formData.currentAmount}
                onChange={e => setFormData({...formData, currentAmount: e.target.value})}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prazo</label>
              <input 
                type="date" 
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Salvar
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Trash2 size={20} className="md:hidden mx-auto" />
                <span className="hidden md:inline">Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <div key={goal.id} className="bg-white p-6 rounded-2xl border shadow-sm group relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-1 bg-emerald-500 transition-all`} style={{ width: `${Math.min(100, progress)}%` }} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{goal.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />
                      Prazo: {format(parseISO(goal.deadline), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onDelete(goal.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500">Valor Atual</p>
                    {editingId === goal.id ? (
                      <div className="flex gap-2 items-center mt-1">
                        <input 
                          type="number" 
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-24 p-1 border rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button 
                          onClick={() => {
                            onUpdate(goal.id, parseFloat(editValue) || 0);
                            setEditingId(null);
                          }}
                          className="text-emerald-600 font-bold text-xs"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                        {formatCurrency(goal.currentAmount)}
                        <button 
                          onClick={() => {
                            setEditingId(goal.id);
                            setEditValue(goal.currentAmount.toString());
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Objetivo</p>
                    <p className="font-bold text-slate-800">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                
                <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
                  {progress.toFixed(1)}% Completo
                </p>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="md:col-span-2 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
            <TrendingUp size={48} className="mb-4 text-slate-200" />
            <p className="font-medium">Nenhuma meta cadastrada ainda.</p>
            <p className="text-xs">Comece a planejar seus objetivos financeiros hoje!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsList;
