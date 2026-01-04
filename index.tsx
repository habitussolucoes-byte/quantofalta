
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Wallet, 
  Repeat,
  X,
  AlertCircle,
  TrendingUp,
  Landmark
} from 'lucide-react';

// --- Interfaces ---
interface Bank { id: string; name: string; balance: number; }
interface Transaction { id: string; name: string; amount: number; category: string; status: 'open' | 'paid'; date: string; }
interface Goal { id: string; name: string; target: number; current: number; }
interface Template { id: string; name: string; amount: number; category: string; }

interface AppState {
  banks: Bank[];
  transactions: Transaction[];
  goals: Goal[];
  templates: Template[];
  categories: string[];
}

// --- Utils ---
const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const genId = () => Math.random().toString(36).substring(2, 11);

const App = () => {
  const [state, setState] = useState<AppState>({
    banks: [],
    transactions: [],
    goals: [],
    templates: [],
    categories: ['Alimentação', 'Moradia', 'Lazer', 'Saúde', 'Internet', 'Assinaturas', 'Outros'],
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSetup, setIsSetup] = useState(true);
  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('quanto_falta_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      setState(parsed);
      if (parsed.banks.length > 0) setIsSetup(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('quanto_falta_v3', JSON.stringify(state));
  }, [state]);

  // Cálculos de Liquidez
  const totals = useMemo(() => {
    const banks = state.banks.reduce((acc, b) => acc + b.balance, 0);
    const unpaid = state.transactions
      .filter(t => t.status === 'open')
      .reduce((acc, t) => acc + t.amount, 0);
    const diff = banks - unpaid;
    return { banks, unpaid, diff };
  }, [state]);

  // Ações
  const generateMonthlyExpenses = () => {
    const newTxs = state.templates.map(tmp => ({
      id: genId(),
      name: tmp.name,
      amount: tmp.amount,
      category: tmp.category,
      status: 'open',
      date: new Date().toISOString().split('T')[0]
    } as Transaction));
    setState(s => ({ ...s, transactions: [...newTxs, ...s.transactions] }));
    alert(`${newTxs.length} despesas recorrentes geradas!`);
  };

  const deleteTx = (id: string) => setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
  const markPaid = (id: string) => setState(s => ({ ...s, transactions: s.transactions.map(t => t.id === id ? {...t, status: 'paid'} : t) }));

  if (isSetup) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6 z-[200]">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border w-full max-w-md text-center">
            <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <Landmark size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Boas-vindas!</h2>
            <p className="text-slate-500 text-sm mb-8">Vamos começar cadastrando seu primeiro saldo bancário.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target as any;
              const n = f.bname.value;
              const b = parseFloat(f.bbal.value);
              if (n && !isNaN(b)) {
                setState(s => ({ ...s, banks: [{ id: genId(), name: n, balance: b }] }));
                setIsSetup(false);
              }
            }} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Banco</label>
                <input name="bname" placeholder="Ex: Nubank, Itaú..." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Saldo Atual</label>
                <input name="bbal" type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-emerald-500" required />
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 mt-4">Criar Minha Conta</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r h-screen fixed left-0 top-0 z-40 p-6">
        <div className="mb-10 px-2">
            <h1 className="text-xl font-black text-emerald-600 flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-lg"><Wallet size={20} /></div>
                Quanto Falta?
            </h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard />} label="Início" onClick={() => setActiveTab('dashboard')} />
          <NavItem active={activeTab === 'transactions'} icon={<Receipt />} label="Contas" onClick={() => setActiveTab('transactions')} />
          <NavItem active={activeTab === 'goals'} icon={<Target />} label="Metas" onClick={() => setActiveTab('goals')} />
          <NavItem active={activeTab === 'settings'} icon={<Settings />} label="Ajustes" onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Liquidez Real</p>
           <p className={`text-lg font-black ${totals.diff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmtBRL(totals.diff)}</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="content-area p-4 md:p-10 max-w-5xl">
        {activeTab === 'dashboard' && <DashboardView state={state} totals={totals} onAdd={() => setModal({type: 'tx'})} onMarkPaid={markPaid} />}
        {activeTab === 'transactions' && <TransactionsView transactions={state.transactions} onAdd={() => setModal({type: 'tx'})} onPay={markPaid} onDelete={deleteTx} />}
        {activeTab === 'goals' && <GoalsView goals={state.goals} onAdd={() => setModal({type: 'goal'})} onSave={(id, v) => setState(s => ({...s, goals: s.goals.map(g => g.id === id ? {...g, current: g.current + v} : g)}))} onDelete={(id) => setState(s => ({...s, goals: s.goals.filter(g => g.id !== id)}))} />}
        {activeTab === 'settings' && <SettingsView state={state} setState={setState} onGenerate={generateMonthlyExpenses} />}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard />} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem active={activeTab === 'transactions'} icon={<Receipt />} onClick={() => setActiveTab('transactions')} />
        <MobileNavItem active={activeTab === 'goals'} icon={<Target />} onClick={() => setActiveTab('goals')} />
        <MobileNavItem active={activeTab === 'settings'} icon={<Settings />} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X /></button>
            {modal.type === 'tx' && <AddTxForm categories={state.categories} onSubmit={(tx) => {
              setState(s => ({...s, transactions: [{id: genId(), status: 'open', date: new Date().toISOString().split('T')[0], ...tx} as Transaction, ...s.transactions]}));
              setModal(null);
            }} />}
            {modal.type === 'goal' && <AddGoalForm onSubmit={(goal) => {
              setState(s => ({...s, goals: [...s.goals, {id: genId(), current: 0, ...goal} as Goal]}));
              setModal(null);
            }} />}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Components ---

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50'}`}>
    {React.cloneElement(icon, { size: 20 })} {label}
  </button>
);

const MobileNavItem = ({ active, icon, onClick }: any) => (
  <button onClick={onClick} className={`p-2 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
    {React.cloneElement(icon, { size: 24 })}
  </button>
);

const DashboardView = ({ state, totals, onAdd, onMarkPaid }: any) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <header className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Início</h2>
        <p className="text-slate-400 text-sm">Resumo da sua saúde financeira</p>
      </div>
      <button onClick={onAdd} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100"><Plus /></button>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {state.banks.map((b: any) => (
        <div key={b.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl text-slate-400"><Landmark size={20} /></div>
            <p className="font-bold text-slate-700">{b.name}</p>
          </div>
          <p className="font-black text-emerald-600">{fmtBRL(b.balance)}</p>
        </div>
      ))}
    </div>

    <div className={`${totals.diff < 0 ? 'bg-slate-900' : 'bg-emerald-600'} text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden`}>
      <div className="relative z-10">
        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
          {totals.diff < 0 ? 'Falta para Quitar Tudo' : 'Liquidez Real (Saldo Livre)'}
        </h3>
        <span className="text-4xl font-black">{fmtBRL(Math.abs(totals.diff))}</span>
        <p className="text-[10px] text-white/50 mt-4 uppercase font-bold tracking-tighter">Comparativo Saldo Bancário vs Contas em Aberto</p>
      </div>
      <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
          <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Receipt size={18} className="text-rose-500" /> Próximos Vencimentos</h4>
          <div className="space-y-3">
             {state.transactions.filter((t:any) => t.status === 'open').slice(0, 4).map((t:any) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                   <div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t.category}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <p className="font-black text-rose-500">{fmtBRL(t.amount)}</p>
                      <button onClick={() => onMarkPaid(t.id)} className="text-emerald-500"><CheckCircle2 size={18} /></button>
                   </div>
                </div>
             ))}
             {state.transactions.filter((t:any) => t.status === 'open').length === 0 && <p className="text-slate-300 text-sm italic py-4">Tudo em dia!</p>}
          </div>
       </div>
       <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
          <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-blue-500" /> Metas</h4>
          <div className="space-y-4">
             {state.goals.slice(0, 2).map((g:any) => {
                const prog = Math.min(100, (g.current / g.target) * 100);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1">
                       <span>{g.name}</span>
                       <span>{prog.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: `${prog}%` }}></div>
                    </div>
                  </div>
                );
             })}
          </div>
       </div>
    </div>
  </div>
);

const TransactionsView = ({ transactions, onAdd, onPay, onDelete }: any) => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <header className="flex justify-between items-center">
      <h2 className="text-3xl font-black text-slate-800">Contas a Pagar</h2>
      <button onClick={onAdd} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100"><Plus /></button>
    </header>
    <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
          <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-right"></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((t: any) => (
            <tr key={t.id} className={t.status === 'paid' ? 'opacity-40' : ''}>
              <td className="px-6 py-4">
                <p className="font-bold text-slate-700">{t.name}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black">{t.category} • {t.date.split('-').reverse().slice(0,2).join('/')}</p>
              </td>
              <td className="px-6 py-4 text-right font-black text-rose-500">{fmtBRL(t.amount)}</td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                {t.status === 'open' && <button onClick={() => onPay(t.id)} className="text-emerald-500 p-1"><CheckCircle2 size={22} /></button>}
                <button onClick={() => onDelete(t.id)} className="text-slate-200 hover:text-rose-500 p-1"><Trash2 size={20} /></button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-300 italic">Nenhuma conta agendada.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const GoalsView = ({ goals, onAdd, onSave, onDelete }: any) => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <header className="flex justify-between items-center">
      <h2 className="text-3xl font-black text-slate-800">Minhas Metas</h2>
      <button onClick={onAdd} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100"><Plus /></button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {goals.map((g: any) => {
        const prog = Math.min(100, (g.current / g.target) * 100);
        return (
          <div key={g.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${prog}%` }}></div>
             <div className="flex justify-between mb-4">
                <h3 className="font-black text-slate-800 text-lg">{g.name}</h3>
                <button onClick={() => onDelete(g.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={18} /></button>
             </div>
             <div className="flex justify-between items-end mb-4">
                <div><p className="text-[9px] uppercase font-black text-slate-400">Poupado</p><p className="text-2xl font-black text-emerald-600">{fmtBRL(g.current)}</p></div>
                <div className="text-right"><p className="text-[9px] uppercase font-black text-slate-400">Objetivo</p><p className="font-bold text-slate-700">{fmtBRL(g.target)}</p></div>
             </div>
             <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-6"><div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${prog}%` }}></div></div>
             <input type="number" placeholder="Adicionar Valor R$" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" onKeyDown={(e:any) => {
               if(e.key === 'Enter' && e.target.value) {
                 onSave(g.id, parseFloat(e.target.value));
                 e.target.value = '';
               }
             }} />
          </div>
        );
      })}
    </div>
  </div>
);

const SettingsView = ({ state, setState, onGenerate }: any) => (
  <div className="space-y-10 animate-in fade-in duration-300">
    <h2 className="text-3xl font-black text-slate-800">Ajustes</h2>
    
    <section className="bg-white p-8 rounded-[2.5rem] border space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Repeat size={16} /> Modelos Recorrentes</h3>
          <button onClick={onGenerate} className="bg-emerald-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl">Gerar Mês</button>
       </div>
       <div className="space-y-4">
          <div className="flex gap-2">
             <input id="tmp-name" placeholder="Netflix, Internet..." className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold text-sm outline-none" />
             <input id="tmp-val" type="number" placeholder="Valor" className="w-24 p-3 bg-slate-50 border rounded-xl font-bold text-sm outline-none" />
             <button onClick={() => {
                const n = (document.getElementById('tmp-name') as HTMLInputElement).value;
                const v = parseFloat((document.getElementById('tmp-val') as HTMLInputElement).value);
                if(n && v) {
                  setState((s:any) => ({...s, templates: [...s.templates, {id: genId(), name: n, amount: v, category: 'Assinaturas'}]}));
                  (document.getElementById('tmp-name') as HTMLInputElement).value = '';
                  (document.getElementById('tmp-val') as HTMLInputElement).value = '';
                }
             }} className="bg-slate-900 text-white p-3 rounded-xl"><Plus size={20}/></button>
          </div>
          {state.templates.map((t: any) => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="font-bold text-slate-700">{t.name}</span>
               <div className="flex items-center gap-4">
                  <span className="font-black text-emerald-600">{fmtBRL(t.amount)}</span>
                  <button onClick={() => setState((s:any) => ({...s, templates: s.templates.filter((x:any) => x.id !== t.id)}))} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
               </div>
            </div>
          ))}
       </div>
    </section>

    <section className="bg-white p-8 rounded-[2.5rem] border space-y-6">
       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Landmark size={16} /> Meus Bancos</h3>
       <div className="space-y-4">
          {state.banks.map((b: any) => (
            <div key={b.id} className="flex gap-4 items-center">
               <input className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold text-sm" value={b.name} onChange={(e) => setState((s:any) => ({...s, banks: s.banks.map((x:any) => x.id === b.id ? {...x, name: e.target.value} : x)}))} />
               <input type="number" className="w-32 p-3 bg-white border rounded-xl font-black text-emerald-600 text-sm text-right" value={b.balance} onChange={(e) => setState((s:any) => ({...s, banks: s.banks.map((x:any) => x.id === b.id ? {...x, balance: parseFloat(e.target.value) || 0} : x)}))} />
               <button onClick={() => { if(confirm('Remover banco?')) setState((s:any) => ({...s, banks: s.banks.filter((x:any) => x.id !== b.id)})); }} className="text-slate-300 hover:text-rose-500"><Trash2 size={20}/></button>
            </div>
          ))}
          <button onClick={() => setState((s:any) => ({...s, banks: [...s.banks, {id: genId(), name: 'Novo Banco', balance: 0}]}))} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">+ Adicionar Banco</button>
       </div>
    </section>

    <button onClick={() => { if(confirm('Apagar todos os dados?')) { localStorage.clear(); location.reload(); } }} className="w-full py-4 text-rose-500 font-black uppercase text-[10px]">Reiniciar Aplicativo</button>
  </div>
);

// --- Forms ---

const AddTxForm = ({ categories, onSubmit }: any) => (
  <form onSubmit={(e) => {
    e.preventDefault();
    const f = e.target as any;
    onSubmit({ name: f.name.value, amount: parseFloat(f.amount.value), category: f.cat.value });
  }} className="space-y-4">
    <h3 className="text-2xl font-black mb-6">Novo Gasto</h3>
    <input name="name" placeholder="Descrição" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" required />
    <input name="amount" type="number" step="0.01" placeholder="Valor R$" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" required />
    <select name="cat" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold">
       {categories.map((c:string) => <option key={c} value={c}>{c}</option>)}
    </select>
    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 mt-4">Agendar Gasto</button>
  </form>
);

const AddGoalForm = ({ onSubmit }: any) => (
  <form onSubmit={(e) => {
    e.preventDefault();
    const f = e.target as any;
    onSubmit({ name: f.name.value, target: parseFloat(f.target.value) });
  }} className="space-y-4">
    <h3 className="text-2xl font-black mb-6">Nova Meta</h3>
    <input name="name" placeholder="Nome do Objetivo" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" required />
    <input name="target" type="number" step="0.01" placeholder="Valor Alvo R$" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" required />
    <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 mt-4">Criar Meta</button>
  </form>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
