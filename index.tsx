
// --- TYPES & GLOBAL DECLARATIONS ---
declare const lucide: any;

interface Window {
    openAddModal: () => void;
    payTx: (id: string) => void;
    deleteTx: (id: string) => void;
    deleteTpl: (id: string) => void;
    addCategory: () => void;
    deleteCategory: (name: string) => void;
    saveRecurring: (e: any) => void;
    switchTab: (tabId: string) => void;
    updateFormLabels: () => void;
    toggleParcelas: () => void;
    closeModal: () => void;
    openGoalModal: () => void;
    addGoalVal: (id: string) => void;
    deleteGoal: (id: string) => void;
}

// --- HELPERS DE DATA (Sem date-fns para simplicidade total) ---
const dateUtils = {
    formatISO: (date: Date) => date.toISOString().split('T')[0],
    parseISO: (str: string) => new Date(str + 'T00:00:00'),
    isSameMonth: (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear(),
    addMonths: (date: Date, months: number) => {
        let d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    },
    daysRemaining: () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Math.max(1, lastDay - now.getDate() + 1);
    },
    formatDisplay: (str: string) => {
        const [y, m, d] = str.split('-');
        return `${d}/${m}/${y.slice(2)}`;
    }
};

// --- ESTADO GLOBAL ---
let state: any = {
    transactions: [],
    categories: ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Saúde', 'Outros'],
    goals: [],
    recurringTemplates: [],
    activeTab: 'dashboard',
    lastSyncMonth: ''
};

// --- CORE ENGINE ---
const loadState = () => {
    const saved = localStorage.getItem('quanto_falta_v2');
    if (saved) state = { ...state, ...JSON.parse(saved) };
    syncMonthly();
};

const saveState = () => {
    localStorage.setItem('quanto_falta_v2', JSON.stringify(state));
    render();
};

const syncMonthly = () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    if (state.lastSyncMonth !== currentMonthKey) {
        // Atualiza transações do mês anterior que ficaram abertas para 'Atrasadas'
        state.transactions = state.transactions.map((tx: any) => {
            if (tx.type === 'expense' && tx.status === 'open') {
                const txDate = dateUtils.parseISO(tx.date);
                if (txDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
                    return { ...tx, status: 'overdue' };
                }
            }
            return tx;
        });

        // Gera as recorrências para o novo mês
        state.recurringTemplates.forEach((tpl: any) => {
            const dueDate = new Date(now.getFullYear(), now.getMonth(), tpl.dueDay);
            const id = `rec-${tpl.id}-${currentMonthKey}`;
            if (!state.transactions.find((t: any) => t.id === id)) {
                state.transactions.push({
                    id,
                    name: tpl.name,
                    amount: tpl.amount,
                    category: tpl.category,
                    date: dateUtils.formatISO(dueDate),
                    type: 'expense',
                    status: 'open'
                });
            }
        });

        state.lastSyncMonth = currentMonthKey;
        saveState();
    }
};

// --- RENDERIZADORES ---

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const renderDashboard = () => {
    const now = new Date();
    const relevantTx = state.transactions.filter((tx: any) => {
        const d = dateUtils.parseISO(tx.date);
        return dateUtils.isSameMonth(d, now) || tx.status === 'overdue';
    });

    const income = relevantTx.filter((tx: any) => tx.type === 'income').reduce((acc: number, tx: any) => acc + tx.amount, 0);
    const totalExp = relevantTx.filter((tx: any) => tx.type === 'expense').reduce((acc: number, tx: any) => acc + tx.amount, 0);
    const unpaid = relevantTx.filter((tx: any) => tx.type === 'expense' && tx.status !== 'paid').reduce((acc: number, tx: any) => acc + tx.amount, 0);
    
    const urgent = relevantTx.filter((tx: any) => tx.type === 'expense' && tx.status !== 'paid').sort((a: any, b: any) => a.date.localeCompare(b.date))[0];
    const days = dateUtils.daysRemaining();

    const html = `
        <div class="space-y-6">
            <header class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-extrabold text-slate-800">Seu Dinheiro</h2>
                    <p class="text-slate-500">${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
                <button onclick="window.openAddModal()" class="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                    <i data-lucide="plus" class="w-5 h-5"></i> Novo Lançamento
                </button>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Receitas</p>
                    <p class="text-3xl font-black text-emerald-600">${formatCurrency(income)}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Dívida Total</p>
                    <p class="text-3xl font-black text-rose-600">${formatCurrency(totalExp)}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm ring-2 ring-amber-50">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Falta Pagar</p>
                    <p class="text-3xl font-black text-amber-600">${formatCurrency(unpaid)}</p>
                    <p class="text-[10px] text-amber-400 font-bold uppercase mt-1">Estimado para este mês</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-8 rounded-3xl border border-emerald-50 shadow-sm">
                    <h3 class="text-lg font-bold text-slate-800 mb-2">Meta de Quitação</h3>
                    <p class="text-slate-600 text-sm mb-6 leading-relaxed">Você precisa economizar ou receber <span class="font-bold text-emerald-600">${formatCurrency(unpaid/days)}/dia</span> para quitar o mês sem saldo negativo.</p>
                    <div class="w-full bg-slate-100 h-6 rounded-full overflow-hidden">
                        <div class="bg-emerald-500 h-full transition-all duration-1000" style="width: ${Math.min(100, (income / (totalExp || 1)) * 100)}%"></div>
                    </div>
                    <div class="flex justify-between mt-3 text-[10px] font-black text-slate-400 uppercase">
                        <span>Cobertura: ${((income / (totalExp || 1)) * 100).toFixed(0)}%</span>
                        <span>${days} dias restantes</span>
                    </div>
                </div>

                ${urgent ? `
                    <div class="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <i data-lucide="alert-triangle" class="w-24 h-24 text-white"></i>
                        </div>
                        <div class="relative z-10">
                            <h4 class="font-black text-emerald-400 text-xs uppercase tracking-[0.2em] mb-4">Urgência Máxima</h4>
                            <p class="text-2xl font-black text-white">${urgent.name}</p>
                            <p class="text-emerald-200/60 font-medium mt-1">
                                ${urgent.status === 'overdue' ? '<span class="text-rose-400 font-black">ATRASADA!</span>' : 'Vence em ' + dateUtils.formatDisplay(urgent.date)}
                            </p>
                            <button onclick="window.payTx('${urgent.id}')" class="mt-6 bg-white text-slate-900 font-extrabold px-6 py-3 rounded-2xl hover:bg-emerald-50 transition-all flex items-center gap-2">
                                <i data-lucide="check-circle-2" class="w-5 h-5"></i> Marcar como Pago
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="bg-emerald-50 p-8 rounded-3xl border border-dashed border-emerald-200 flex flex-col items-center justify-center text-center">
                        <i data-lucide="smile" class="text-emerald-400 w-12 h-12 mb-3"></i>
                        <p class="text-emerald-800 font-bold">Tudo sob controle!</p>
                        <p class="text-emerald-600 text-sm">Nenhuma conta pendente para os próximos dias.</p>
                    </div>
                `}
            </div>
        </div>
    `;
    const container = document.getElementById('tab-dashboard');
    if (container) container.innerHTML = html;
};

const renderTransactions = () => {
    const sorted = [...state.transactions].sort((a: any, b: any) => b.date.localeCompare(a.date));
    const html = `
        <div class="space-y-6">
            <h2 class="text-2xl font-black text-slate-800">Transações</h2>
            <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th class="px-8 py-5">Item</th>
                            <th class="px-8 py-5">Data</th>
                            <th class="px-8 py-5">Categoria</th>
                            <th class="px-8 py-5">Status</th>
                            <th class="px-8 py-5 text-right">Valor</th>
                            <th class="px-8 py-5 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-sm">
                        ${sorted.map((tx: any) => `
                            <tr class="hover:bg-slate-50/30 transition-colors">
                                <td class="px-8 py-5 font-bold text-slate-700">
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}"></div>
                                        ${tx.name}
                                    </div>
                                </td>
                                <td class="px-8 py-5 text-slate-500 font-medium">${dateUtils.formatDisplay(tx.date)}</td>
                                <td class="px-8 py-5"><span class="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase">${tx.category}</span></td>
                                <td class="px-8 py-5">
                                    <span class="font-bold ${tx.status === 'paid' ? 'text-emerald-500' : tx.status === 'overdue' ? 'text-rose-600' : 'text-amber-500'}">
                                        ${tx.status === 'paid' ? 'Pago' : tx.status === 'overdue' ? 'Atrasado' : 'Aberto'}
                                    </span>
                                </td>
                                <td class="px-8 py-5 text-right font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}">
                                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                                </td>
                                <td class="px-8 py-5 text-right">
                                    <div class="flex justify-end gap-2">
                                        ${tx.status !== 'paid' ? `
                                            <button onclick="window.payTx('${tx.id}')" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><i data-lucide="check" class="w-5 h-5"></i></button>
                                        ` : ''}
                                        <button onclick="window.deleteTx('${tx.id}')" class="p-2 text-rose-300 hover:text-rose-500 rounded-xl transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${sorted.length === 0 ? '<p class="p-20 text-center text-slate-300 italic">Nenhum registro encontrado.</p>' : ''}
            </div>
        </div>
    `;
    const container = document.getElementById('tab-transactions');
    if (container) container.innerHTML = html;
};

const renderInsights = () => {
    const expenses = state.transactions.filter((t: any) => t.type === 'expense');
    // Fix: Explicitly type catStats to avoid 'unknown' errors
    const catStats: Record<string, { count: number, total: number }> = {};
    expenses.forEach((tx: any) => {
        if(!catStats[tx.category]) catStats[tx.category] = { count: 0, total: 0 };
        catStats[tx.category].count++;
        catStats[tx.category].total += tx.amount;
    });

    // Fix: Property access on catStats entries is now safe due to typing
    const frequency = Object.entries(catStats).sort((a,b) => b[1].count - a[1].count);

    const html = `
        <div class="space-y-6">
            <header>
                <h2 class="text-2xl font-black text-slate-800">Análise de Decisão</h2>
                <p class="text-slate-500">Identifique padrões de consumo para cortar gastos formiga.</p>
            </header>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Frequência por Categoria</h3>
                    <div class="space-y-5">
                        ${frequency.map(([name, data]) => `
                            <div class="group">
                                <div class="flex justify-between items-end mb-2">
                                    <div>
                                        <p class="font-bold text-slate-700">${name}</p>
                                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">${data.count} vezes no período</p>
                                    </div>
                                    <p class="font-black text-slate-800">${formatCurrency(data.total)}</p>
                                </div>
                                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div class="bg-blue-500 h-full transition-all duration-700" style="width: ${(data.count / Math.max(...frequency.map(f=>f[1].count))) * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-6">
                    <div class="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl">
                        <h4 class="font-black mb-3 flex items-center gap-2"><i data-lucide="zap"></i> Dica do Especialista</h4>
                        <p class="text-emerald-50 text-sm leading-relaxed">
                            Gastos com alta frequência e valores baixos são os mais fáceis de economizar. Tente reduzir o número de vezes que gasta em <strong>${frequency[0]?.[0] || 'suas categorias'}</strong> para ver um impacto imediato.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    const container = document.getElementById('tab-insights');
    if (container) container.innerHTML = html;
};

const renderGoals = () => {
    const html = `
        <div class="space-y-6">
            <header class="flex justify-between items-center">
                <h2 class="text-2xl font-black text-slate-800">Metas Financeiras</h2>
                <button onclick="window.openGoalModal()" class="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2">
                    <i data-lucide="plus"></i> Nova Meta
                </button>
            </header>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${state.goals.map((g: any) => {
                    const progress = (g.current / g.target) * 100;
                    return `
                        <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div class="absolute top-0 left-0 h-1 bg-emerald-500" style="width: ${Math.min(100, progress)}%"></div>
                            <div class="flex justify-between items-start mb-6">
                                <h3 class="font-black text-slate-800 text-lg">${g.name}</h3>
                                <div class="flex gap-1">
                                    <button onclick="window.addGoalVal('${g.id}')" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><i data-lucide="plus-circle" class="w-5 h-5"></i></button>
                                    <button onclick="window.deleteGoal('${g.id}')" class="p-2 text-rose-300 hover:text-rose-500 rounded-xl"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                                </div>
                            </div>
                            <div class="flex justify-between items-end mb-4">
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acumulado</p>
                                    <p class="text-2xl font-black text-emerald-600">${formatCurrency(g.current)}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                                    <p class="font-bold text-slate-700">${formatCurrency(g.target)}</p>
                                </div>
                            </div>
                            <div class="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                                <div class="bg-emerald-500 h-full transition-all duration-700" style="width: ${Math.min(100, progress)}%"></div>
                            </div>
                            <p class="text-center font-black text-slate-400 text-[10px] uppercase mt-4 tracking-widest">${progress.toFixed(1)}% COMPLETO</p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    const container = document.getElementById('tab-goals');
    if (container) container.innerHTML = html;
};

const renderSettings = () => {
    const html = `
        <div class="space-y-8 pb-10">
            <h2 class="text-2xl font-black text-slate-800">Ajustes & Recorrência</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2"><i data-lucide="repeat" class="w-4 h-4 text-emerald-500"></i> Despesa Recorrente Mensal</h3>
                    <form onsubmit="window.saveRecurring(event)" class="space-y-4">
                        <input type="text" id="rec-name" placeholder="Ex: Internet, Aluguel" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" required />
                        <div class="grid grid-cols-2 gap-4">
                            <input type="number" id="rec-amount" step="0.01" placeholder="Valor" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" required />
                            <select id="rec-cat" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium">
                                ${state.categories.map((c: string) => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <input type="number" id="rec-day" placeholder="Dia do Vencimento (1-31)" min="1" max="31" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" required />
                        <button type="submit" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl">Criar Automação</button>
                    </form>
                </div>
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2"><i data-lucide="tag" class="w-4 h-4 text-blue-500"></i> Suas Categorias</h3>
                    <div class="flex gap-2 mb-6">
                        <input type="text" id="new-cat" placeholder="Nova..." class="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none">
                        <button onclick="window.addCategory()" class="bg-slate-900 text-white p-3 rounded-xl"><i data-lucide="plus"></i></button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${state.categories.map((c: string) => `
                            <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-xs font-bold text-slate-600 border border-slate-100">
                                ${c}
                                <button onclick="window.deleteCategory('${c}')" class="text-slate-300 hover:text-rose-500 transition-all"><i data-lucide="x" class="w-3 h-3"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="space-y-4">
                <h3 class="font-black text-slate-800 uppercase text-xs tracking-widest">Modelos Ativos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${state.recurringTemplates.map((t: any) => `
                        <div class="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div>
                                <p class="font-black text-slate-800">${t.name}</p>
                                <p class="text-[10px] text-slate-400 font-black uppercase">Todo dia ${t.dueDay} • ${t.category}</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <p class="font-black text-slate-800">${formatCurrency(t.amount)}</p>
                                <button onclick="window.deleteTpl('${t.id}')" class="text-rose-200 hover:text-rose-500 p-2 transition-all"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    const container = document.getElementById('tab-settings');
    if (container) container.innerHTML = html;
};

const render = () => {
    const tabs: Record<string, () => void> = { dashboard: renderDashboard, transactions: renderTransactions, insights: renderInsights, goals: renderGoals, settings: renderSettings };
    if(tabs[state.activeTab]) tabs[state.activeTab]();
    // Fix: Lucide declaration at top allows this call
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// --- NAVEGAÇÃO ---
// Fix: Use window interface extension
window.switchTab = (tabId: string) => {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const activeTabEl = document.getElementById(`tab-${tabId}`);
    if (activeTabEl) activeTabEl.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        // Fix: Cast b to HTMLElement to access dataset
        if((b as HTMLElement).dataset.tab === tabId) b.classList.add('active');
    });
    render();
};

// --- ACTIONS ---

// Fix: Use window interface extension
window.payTx = (id: string) => {
    const tx = state.transactions.find((t: any) => t.id === id);
    if(tx) { tx.status = 'paid'; saveState(); }
};

// Fix: Use window interface extension
window.deleteTx = (id: string) => {
    if(confirm('Excluir lançamento?')) {
        state.transactions = state.transactions.filter((t: any) => t.id !== id);
        saveState();
    }
};

// Fix: Use window interface extension
window.deleteTpl = (id: string) => {
    if(confirm('Excluir modelo? Novas contas não serão mais geradas.')) {
        state.recurringTemplates = state.recurringTemplates.filter((t: any) => t.id !== id);
        saveState();
    }
};

// Fix: Use window interface extension
window.addCategory = () => {
    // Fix: Cast to HTMLInputElement to access value
    const input = document.getElementById('new-cat') as HTMLInputElement;
    const name = input ? input.value.trim() : '';
    if(name && !state.categories.includes(name)) {
        state.categories.push(name);
        saveState();
    }
};

// Fix: Use window interface extension
window.deleteCategory = (name: string) => {
    state.categories = state.categories.filter((c: string) => c !== name);
    saveState();
};

// Fix: Use window interface extension
window.saveRecurring = (e: any) => {
    e.preventDefault();
    // Fix: Cast to HTMLInputElement to access value
    const nameEl = document.getElementById('rec-name') as HTMLInputElement;
    const amountEl = document.getElementById('rec-amount') as HTMLInputElement;
    const catEl = document.getElementById('rec-cat') as HTMLSelectElement;
    const dayEl = document.getElementById('rec-day') as HTMLInputElement;

    const tpl = {
        id: Math.random().toString(36).substr(2, 9),
        name: nameEl.value,
        amount: parseFloat(amountEl.value),
        category: catEl.value,
        dueDay: parseInt(dayEl.value)
    };
    state.recurringTemplates.push(tpl);
    
    // Gera logo para o mês atual também
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), tpl.dueDay);
    state.transactions.push({
        id: `rec-${tpl.id}-${now.getFullYear()}-${now.getMonth()}`,
        name: tpl.name,
        amount: tpl.amount,
        category: tpl.category,
        date: dateUtils.formatISO(dueDate),
        type: 'expense',
        status: 'open'
    });

    saveState();
};

// --- MODAL DE LANÇAMENTO ---
// Fix: Use window interface extension
window.openAddModal = () => {
    const container = document.getElementById('modal-container');
    if (!container) return;
    container.innerHTML = `
        <div class="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 class="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2"><i data-lucide="plus-circle" class="text-emerald-500"></i> Novo Lançamento</h3>
            <form id="tx-form" class="space-y-5">
                <div class="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl">
                    <input type="radio" name="type" id="income" value="income" onchange="window.updateFormLabels()" class="hidden peer/income">
                    <label for="income" class="flex-1 text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer text-slate-400 peer-checked/income:bg-white peer-checked/income:text-emerald-600 peer-checked/income:shadow-sm transition-all">Receita</label>
                    <input type="radio" name="type" id="expense" value="expense" checked onchange="window.updateFormLabels()" class="hidden peer/expense">
                    <label for="expense" class="flex-1 text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer text-slate-400 peer-checked/expense:bg-white peer-checked/expense:text-rose-600 peer-checked/expense:shadow-sm transition-all">Gasto</label>
                </div>

                <div class="space-y-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do item</label>
                    <input type="text" id="tx-name" placeholder="Ex: Mercado, Freelance, Aluguel..." class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" required />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor (R$)</label>
                        <input type="number" id="tx-amount" step="0.01" placeholder="0,00" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" required />
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                        <select id="tx-cat" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium">
                            ${state.categories.map((c: string) => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="space-y-1">
                    <label id="date-label" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data de Vencimento</label>
                    <input type="date" id="tx-date" value="${dateUtils.formatISO(new Date())}" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" required />
                </div>

                <div id="expense-options" class="space-y-4">
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" id="tx-parcelar" onchange="window.toggleParcelas()" class="w-5 h-5 accent-emerald-600 cursor-pointer">
                        <label for="tx-parcelar" class="text-sm font-bold text-slate-600 cursor-pointer select-none">Parcelar este gasto?</label>
                    </div>
                    <div id="parcelas-container" class="hidden animate-in slide-in-from-top-2">
                         <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Número de parcelas</label>
                         <input type="number" id="tx-num-parcelas" min="2" max="120" placeholder="Ex: 12" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500">
                    </div>
                    <div id="paid-check" class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" id="tx-paid" class="w-5 h-5 accent-emerald-600 cursor-pointer">
                        <label for="tx-paid" class="text-sm font-bold text-slate-600 cursor-pointer select-none">Já está pago?</label>
                    </div>
                </div>

                <div class="flex gap-4 pt-6">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Confirmar</button>
                </div>
            </form>
        </div>
    `;
    container.classList.remove('hidden');
    container.classList.add('active');
    // Fix: Lucide declaration at top allows this call
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const form = document.getElementById('tx-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            // Fix: Cast elements to access value/checked
            const typeInput = document.querySelector('input[name="type"]:checked') as HTMLInputElement;
            const type = typeInput ? typeInput.value : 'expense';
            const name = (document.getElementById('tx-name') as HTMLInputElement).value;
            const amount = parseFloat((document.getElementById('tx-amount') as HTMLInputElement).value);
            const cat = (document.getElementById('tx-cat') as HTMLSelectElement).value;
            const dateStr = (document.getElementById('tx-date') as HTMLInputElement).value;
            const paidEl = document.getElementById('tx-paid') as HTMLInputElement;
            const isPaid = paidEl ? paidEl.checked : false;
            const parcelarEl = document.getElementById('tx-parcelar') as HTMLInputElement;
            const isParcelar = parcelarEl ? parcelarEl.checked : false;
            const numParcelasEl = document.getElementById('tx-num-parcelas') as HTMLInputElement;
            const numParcelas = numParcelasEl ? parseInt(numParcelasEl.value) : 1;

            if (type === 'expense' && isParcelar && numParcelas > 1) {
                const startDate = dateUtils.parseISO(dateStr);
                for (let i = 0; i < numParcelas; i++) {
                    const currentMonth = dateUtils.addMonths(startDate, i);
                    state.transactions.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: `${name} (${String(i+1).padStart(2,'0')}/${String(numParcelas).padStart(2,'0')})`,
                        amount: amount, // Valor total ou parcelado? Geralmente usuário insere o valor da parcela
                        category: cat,
                        date: dateUtils.formatISO(currentMonth),
                        type: 'expense',
                        status: (i === 0 && isPaid) ? 'paid' : 'open'
                    });
                }
            } else {
                state.transactions.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    amount,
                    category: cat,
                    date: dateStr,
                    type,
                    status: (type === 'income' || isPaid) ? 'paid' : 'open'
                });
            }
            window.closeModal();
            saveState();
        };
    }
};

// Fix: Use window interface extension
window.updateFormLabels = () => {
    // Fix: Cast to HTMLInputElement to access value
    const checkedInput = document.querySelector('input[name="type"]:checked') as HTMLInputElement;
    const type = checkedInput ? checkedInput.value : 'expense';
    const label = document.getElementById('date-label');
    const options = document.getElementById('expense-options');
    if(label) label.innerText = type === 'income' ? 'Data de Recebimento' : 'Data de Vencimento';
    if(options) {
        if(type === 'income') options.classList.add('hidden');
        else options.classList.remove('hidden');
    }
};

// Fix: Use window interface extension
window.toggleParcelas = () => {
    const container = document.getElementById('parcelas-container');
    // Fix: Cast to HTMLInputElement to access checked
    const parcelarEl = document.getElementById('tx-parcelar') as HTMLInputElement;
    const isChecked = parcelarEl ? parcelarEl.checked : false;
    if(container) container.classList.toggle('hidden', !isChecked);
};

// Fix: Use window interface extension
window.closeModal = () => {
    const container = document.getElementById('modal-container');
    if (container) {
        container.classList.add('hidden');
        container.classList.remove('active');
    }
};

// --- METAS ---
// Fix: Use window interface extension
window.openGoalModal = () => {
    const container = document.getElementById('modal-container');
    if (!container) return;
    container.innerHTML = `
        <div class="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 class="text-xl font-black text-slate-800 mb-6">Nova Meta</h3>
            <form id="goal-form" class="space-y-4">
                <input type="text" id="goal-name" placeholder="Ex: Viagem, Carro" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" required />
                <input type="number" id="goal-target" step="0.01" placeholder="Valor Objetivo" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" required />
                <input type="number" id="goal-current" step="0.01" placeholder="Já tenho (opcional)" class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-4 text-slate-400 font-bold">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">Salvar</button>
                </div>
            </form>
        </div>
    `;
    container.classList.remove('hidden');
    container.classList.add('active');
    const form = document.getElementById('goal-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            // Fix: Cast to HTMLInputElement to access value
            const nameVal = (document.getElementById('goal-name') as HTMLInputElement).value;
            const targetVal = parseFloat((document.getElementById('goal-target') as HTMLInputElement).value);
            const currentVal = parseFloat((document.getElementById('goal-current') as HTMLInputElement).value) || 0;
            
            state.goals.push({
                id: Math.random().toString(36).substr(2, 9),
                name: nameVal,
                target: targetVal,
                current: currentVal
            });
            window.closeModal();
            saveState();
        };
    }
};

// Fix: Use window interface extension
window.addGoalVal = (id: string) => {
    const goal = state.goals.find((g: any) => g.id === id);
    if(goal) {
        const val = prompt(`Quanto deseja somar à meta "${goal.name}"?`);
        if(val && !isNaN(parseFloat(val))) {
            goal.current += parseFloat(val);
            saveState();
        }
    }
};

// Fix: Use window interface extension
window.deleteGoal = (id: string) => {
    if(confirm('Excluir meta?')) {
        state.goals = state.goals.filter((g: any) => g.id !== id);
        saveState();
    }
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    render();
});
