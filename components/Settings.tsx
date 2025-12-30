
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Repeat, Calendar, Tag, Layers, X, Check } from 'lucide-react';
import { RecurringTemplate } from '../types';
import { formatCurrency } from '../utils';

interface SettingsProps {
  templates: RecurringTemplate[];
  categories: string[];
  onSaveTemplate: (template: RecurringTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onAddCategory: (name: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  templates, 
  categories, 
  onSaveTemplate, 
  onDeleteTemplate,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const [templateForm, setTemplateForm] = useState({
    name: '',
    amount: '',
    dueDay: '5',
    category: categories[0] || 'Geral'
  });

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Sync templateForm category if the current selection is deleted
  useEffect(() => {
    if (!categories.includes(templateForm.category) && categories.length > 0) {
      setTemplateForm(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories, templateForm.category]);

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.amount) return;

    onSaveTemplate({
      id: Math.random().toString(36).substr(2, 9),
      name: templateForm.name,
      amount: parseFloat(templateForm.amount),
      dueDay: parseInt(templateForm.dueDay),
      category: templateForm.category
    });

    setTemplateForm({ 
      name: '', 
      amount: '', 
      dueDay: '5', 
      category: categories[0] || 'Geral' 
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onAddCategory(trimmed);
      setNewCategory('');
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCategory(cat);
    setEditingValue(cat);
  };

  const handleSaveEdit = () => {
    if (editingCategory && editingValue.trim() && editingValue.trim() !== editingCategory) {
      onEditCategory(editingCategory, editingValue.trim());
    }
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-slate-500">Gerencie suas despesas recorrentes, categorias e automação</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recurring Templates Section */}
        <section className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Repeat className="text-emerald-500" />
            Novo Modelo Recorrente
          </h3>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Despesa</label>
              <input 
                type="text" 
                value={templateForm.name}
                onChange={e => setTemplateForm({...templateForm, name: e.target.value})}
                placeholder="Ex: Netflix, Internet, Aluguel..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={templateForm.amount}
                  onChange={e => setTemplateForm({...templateForm, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                <select 
                  value={templateForm.category}
                  onChange={e => setTemplateForm({...templateForm, category: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {categories.length === 0 && <option value="Geral">Geral</option>}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dia do Vencimento</label>
              <input 
                type="number" 
                min="1" 
                max="31"
                value={templateForm.dueDay}
                onChange={e => setTemplateForm({...templateForm, dueDay: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button 
              type="submit"
              disabled={!templateForm.name || !templateForm.amount}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              Adicionar Modelo
            </button>
          </form>
        </section>

        {/* Categories Section */}
        <section className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Tag className="text-blue-500" />
            Categorias de Gastos
          </h3>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={!newCategory.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus size={24} />
            </button>
          </form>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div 
                key={category} 
                className={`flex items-center gap-2 pl-4 pr-2 py-2 rounded-full text-sm font-medium transition-all ${
                  editingCategory === category 
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-inner' 
                  : 'bg-slate-50 border border-slate-200 group hover:bg-white hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                {editingCategory === category ? (
                  <div className="flex items-center gap-1">
                    <input 
                      autoFocus
                      type="text"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onBlur={handleSaveEdit}
                      className="bg-transparent outline-none text-blue-800 font-bold border-none p-0 w-24"
                    />
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); handleSaveEdit(); }}
                      className="text-emerald-600 hover:bg-emerald-100 rounded-full p-0.5"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); handleCancelEdit(); }}
                      className="text-slate-400 hover:bg-slate-100 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span 
                      onClick={() => handleStartEdit(category)}
                      className="cursor-pointer text-slate-700 hover:text-blue-600"
                      title="Clique para renomear"
                    >
                      {category}
                    </span>
                    <button 
                      onClick={() => onDeleteCategory(category)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                      title={`Excluir categoria: ${category}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-slate-400 text-sm italic py-4">Nenhuma categoria personalizada.</p>
            )}
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Dica: clique no nome de uma categoria para renomeá-la.
          </p>
        </section>
      </div>

      {/* List of Recurring Templates */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-emerald-500" />
          Meus Modelos Atuais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-4 rounded-xl border flex justify-between items-center group hover:border-emerald-100 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                  <Repeat size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{template.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} />
                    Vence todo dia {template.dueDay}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{formatCurrency(template.amount)}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold px-2 py-0.5 bg-slate-50 border rounded-full">{template.category}</p>
                </div>
                <button 
                  onClick={() => onDeleteTemplate(template.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="Excluir modelo"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {templates.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-200 text-slate-400">
            <p>Nenhum modelo recorrente cadastrado.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
