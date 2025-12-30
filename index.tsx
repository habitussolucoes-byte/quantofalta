
import { 
  format, 
  isSameMonth, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  isBefore, 
  differenceInDays,
  subMonths,
  addMonths,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';

// --- ESTADO ---
let state = {
  recurringTemplates: [],
  transactions: [],
  goals: [],
  categories: ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Saúde', 'Outros'],
  lastSyncDate: new Date().toISOString(),
  activeTab: 'dashboard'
};

const UI = {
  currentFilter: 'all',
  dateFilter: 'currentMonth',
  searchTerm: '',
  customRange: {
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  }
};

// --- UTILS ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const saveState = () => {
  localStorage.setItem('finanza_state', JSON.stringify(state));
  render();
};

const loadState = () => {
  const saved = localStorage.getItem('finanza_state');
  if (saved) {
    state = { ...state, ...JSON.parse(saved) };
    syncMonthly();
  }
};

const syncMonthly = () => {
  const now = new Date();
  const lastSync = parseISO(state.lastSyncDate);

  if (!isSameMonth(now, lastSync)) {
    state.transactions = state.transactions.map((tx: any) => {
      if (tx.type === 'expense' && tx.status === 'open' && isBefore(parseISO(tx.date), startOfMonth(now))) {
        return { ...tx, status: 'overdue' };
      }
      return tx;
    });

    const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
    state.recurringTemplates.forEach((t: any) => {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), t.dueDay);
      const txId = `rec-${t.id}-${monthStartStr}`;
      
      if (!state.transactions.find((tx: any) => tx.id === txId)) {
        state.transactions.push({
          id: txId,
          name: t.name,
          amount: t.amount,
          date: format(dueDate, 'yyyy-MM-dd'),
          status: 'open',
          type: 'expense',
          category: t.category
        });
      }
    });

    state.lastSyncDate = now.toISOString();
    saveState();
  }
};

// --- RENDERIZADORES ---

const renderDashboard = () => {
  const now = new Date();
  const currentMonthExpenses = state.transactions.filter((tx: any) => {
    if (tx.type !== 'expense') return false;
    const txDate = parseISO(tx.date);
    return isSameMonth(txDate, now) || tx.status === 'overdue';
  });

  const income = state.transactions
    .filter((tx: any) => tx.type === 'income' && isSameMonth(parseISO(tx.date), now))
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const totalExp = currentMonthExpenses.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const unpaid = currentMonthExpenses.filter((tx: any) => tx.status !== 'paid').reduce((sum: number, tx: any) => sum + tx.amount, 0);
  
  const urgent = currentMonthExpenses.filter((tx: any) => tx.status !== 'paid').sort((a: any, b: any) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return parseISO(a.date).getTime() - parseISO(b.date).getTime();
  })[0];

  const daysLeft = Math.max(1, differenceInDays(endOfMonth(now), now) + 1);
  const dailyNeeded = unpaid / daysLeft;

  const html = `
    <div class="space-y-6 animate-in fade-in duration-500">
      <header class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Painel Financeiro</h2>
          <p class="text-slate-500">${format(now, "MMMM 'de' yyyy")}</p>
        </div>
        <button onclick="window.showAddTransactionModal()" class="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95">
          <i data-lucide="plus" class="w-5 h-5"></i> Novo Lançamento
        </button>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-6 rounded-2xl border bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-xl bg-emerald-50 text-emerald-600"><i data-lucide="trending-up"></i></div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Receita</h4>
          </div>
          <p class="text-2xl font-bold text-slate-900">${formatCurrency(income)}</p>
        </div>
        <div class="p-6 rounded-2xl border bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-xl bg-rose-50 text-rose-600"><i data-lucide="trending-down"></i></div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Dívida do Mês</h4>
          </div>
          <p class="text-2xl font-bold text-slate-900">${formatCurrency(totalExp)}</p>
        </div>
        <div class="p-6 rounded-2xl border bg-white shadow-sm ring-2 ring-amber-100 border-amber-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-xl bg-amber-50 text-amber-600"><i data-lucide="wallet"></i></div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Falta Pagar</h4>
          </div>
          <p class="text-2xl font-bold text-slate-900">${formatCurrency(unpaid)}</p>
          <p class="text-xs text-amber-600 font-medium">Restante do mês</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-2">Meta de Quitação</h3>
          <p class="text-slate-600 text-sm mb-4">Você precisa de <span class="font-bold text-emerald-600">${formatCurrency(dailyNeeded)}/dia</span> para quitar suas contas antes do fim do mês.</p>
          <div class="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full transition-all duration-1000" style="width: ${Math.min(100, (income / (totalExp || 1)) * 100)}%"></div>
          </div>
          <div class="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
            <span>Cobertura: ${((income / (totalExp || 1)) * 100).toFixed(0)}%</span>
            <span>${daysLeft} dias restantes</span>
          </div>
        </div>
        ${urgent ? `
          <div class="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4 animate-pulse-slow">
            <i data-lucide="alert-circle" class="text-emerald-600 w-8 h-8"></i>
            <div class="flex-1">
              <h4 class="font-bold text-emerald-800 text-xs uppercase tracking-widest">Urgência Próxima</h4>
              <p class="text-xl font-bold text-emerald-950 mt-1">${urgent.name}</p>
              <p class="text-sm text-emerald-700">${urgent.status === 'overdue' ? '<span class="text-rose-600 font-bold">ATRASADA!</span>' : 'Vence em ' + Math.abs(differenceInDays(parseISO(urgent.date), now)) + ' dias'}</p>
              <button onclick="window.payTransaction('${urgent.id}')" class="mt-3 bg-white text-emerald-700 text-xs font-bold py-2 px-4 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all">Pagar agora</button>
            </div>
          </div>
        ` : `
          <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic text-sm">
            Nenhuma conta pendente para os próximos dias.
          </div>
        `}
      </div>
    </div>
  `;
  document.getElementById('dashboard')!.innerHTML = html;
};

const renderTransactions = () => {
  const now = new Date();
  const filtered = state.transactions.filter((tx: any) => {
    const matchesType = UI.currentFilter === 'all' || tx.type === UI.currentFilter;
    const matchesSearch = tx.name.toLowerCase().includes(UI.searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(UI.searchTerm.toLowerCase());
    
    const txDate = parseISO(tx.date);
    let matchesDate = true;
    if (UI.dateFilter === 'currentMonth') matchesDate = isSameMonth(txDate, now);
    else if (UI.dateFilter === 'previousMonth') matchesDate = isSameMonth(txDate, subMonths(now, 1));
    else if (UI.dateFilter === 'all') matchesDate = true;
    else if (UI.dateFilter === 'custom') {
      matchesDate = isWithinInterval(txDate, { start: startOfDay(parseISO(UI.customRange.start)), end: endOfDay(parseISO(UI.customRange.end)) });
    }
    return matchesType && matchesSearch && matchesDate;
  }).sort((a: any, b: any) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const html = `
    <div class="space-y-6">
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Transações</h2>
        <div class="flex bg-slate-100 p-1 rounded-xl">
          <button onclick="window.setTxFilter('all')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${UI.currentFilter === 'all' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}">TODAS</button>
          <button onclick="window.setTxFilter('income')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${UI.currentFilter === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}">RECEITAS</button>
          <button onclick="window.setTxFilter('expense')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${UI.currentFilter === 'expense' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}">GASTOS</button>
        </div>
      </header>

      <div class="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
        <div class="relative">
          <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"></i>
          <input type="text" placeholder="Pesquisar por nome ou categoria..." value="${UI.searchTerm}" oninput="window.setSearch(this.value)" class="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
        </div>
        <div class="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-50">
          <select onchange="window.setDateFilter(this.value)" class="bg-slate-50 border rounded-lg p-2 text-xs font-bold">
            <option value="currentMonth" ${UI.dateFilter === 'currentMonth' ? 'selected' : ''}>Mês Atual</option>
            <option value="previousMonth" ${UI.dateFilter === 'previousMonth' ? 'selected' : ''}>Mês Anterior</option>
            <option value="all" ${UI.dateFilter === 'all' ? 'selected' : ''}>Tudo</option>
            <option value="custom" ${UI.dateFilter === 'custom' ? 'selected' : ''}>Intervalo Personalizado</option>
          </select>
          ${UI.dateFilter === 'custom' ? `
            <div class="flex items-center gap-2">
              <input type="date" value="${UI.customRange.start}" onchange="window.setCustomRange('start', this.value)" class="text-xs border p-1 rounded">
              <span class="text-slate-400">até</span>
              <input type="date" value="${UI.customRange.end}" onchange="window.setCustomRange('end', this.value)" class="text-xs border p-1 rounded">
            </div>
          ` : ''}
        </div>
      </div>

      <div class="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <tr>
              <th class="px-6 py-4">Item</th>
              <th class="px-6 py-4">Data</th>
              <th class="px-6 py-4">Categoria</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Valor</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y text-sm">
            ${filtered.map((tx: any) => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-700 flex items-center gap-3">
                  ${tx.type === 'income' ? '<i data-lucide="arrow-up-circle" class="text-emerald-500 w-4 h-4"></i>' : '<i data-lucide="arrow-down-circle" class="text-rose-500 w-4 h-4"></i>'}
                  ${tx.name}
                </td>
                <td class="px-6 py-4 text-slate-500">${format(parseISO(tx.date), 'dd/MM/yy')}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">${tx.category}</span></td>
                <td class="px-6 py-4">
                  <span class="font-bold ${tx.status === 'paid' ? 'text-emerald-500' : tx.status === 'overdue' ? 'text-rose-600' : 'text-amber-500'}">
                    ${tx.status === 'paid' ? 'Pago' : tx.status === 'overdue' ? 'Atrasado' : 'Aberto'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}">
                  ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  ${tx.status !== 'paid' ? `<button onclick="window.payTransaction('${tx.id}')" class="text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg transition-all active:scale-90"><i data-lucide="check-circle" class="w-5 h-5"></i></button>` : ''}
                  <button onclick="window.deleteTransaction('${tx.id}')" class="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all active:scale-90"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </td>
              </tr>
            `).join('')}
            ${filtered.length === 0 ? '<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">Nenhum registro encontrado.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('transactions')!.innerHTML = html;
  (window as any).lucide.createIcons();
};

const renderInsights = () => {
  const expenses = state.transactions.filter((t: any) => t.type === 'expense');
  const catMap: Record<string, { count: number, total: number }> = {};
  
  expenses.forEach((t: any) => {
    if (!catMap[t.category]) catMap[t.category] = { count: 0, total: 0 };
    catMap[t.category].count += 1;
    catMap[t.category].total += t.amount;
  });

  const frequency = Object.entries(catMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const html = `
    <div class="space-y-6">
      <header>
        <h2 class="text-2xl font-bold text-slate-800">Análise de Decisão</h2>
        <p class="text-slate-500">Onde está o ralo do seu dinheiro? Identifique a frequência para cortar gastos.</p>
      </header>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><i data-lucide="activity" class="text-blue-500"></i> Frequência por Categoria</h3>
          <div class="space-y-4">
            ${frequency.length > 0 ? frequency.map(item => `
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex-1">
                  <div class="flex justify-between mb-1">
                    <span class="font-bold text-slate-700">${item.name}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">${item.count} transações</span>
                  </div>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-full transition-all duration-700" style="width: ${(item.count / Math.max(...frequency.map(f => f.count))) * 100}%"></div>
                  </div>
                </div>
                <div class="ml-6 text-right">
                  <p class="font-bold text-slate-800">${formatCurrency(item.total)}</p>
                </div>
              </div>
            `).join('') : '<p class="text-center py-12 text-slate-400">Sem dados suficientes.</p>'}
          </div>
        </section>
        <div class="space-y-6">
          <div class="bg-emerald-600 p-6 rounded-2xl text-white shadow-xl">
            <h4 class="font-bold mb-2 flex items-center gap-2"><i data-lucide="zap"></i> Insight de Corte</h4>
            <p class="text-emerald-50 text-sm leading-relaxed">
              Você sabia? Categorias com <strong>alta frequência</strong> de transações pequenas (gastos formiga) tendem a ser mais fáceis de cortar do que gastos fixos grandes.
            </p>
          </div>
          <div class="bg-white p-6 rounded-2xl border shadow-sm">
            <h4 class="font-bold text-slate-800 mb-4">Sugestão de Atenção</h4>
            ${frequency.filter(f => f.count > 3).map(f => `
              <div class="flex items-center gap-3 p-3 border-l-4 border-amber-400 bg-amber-50 mb-2 rounded-r-xl">
                <i data-lucide="alert-triangle" class="text-amber-600 w-5 h-5"></i>
                <span class="text-sm font-medium text-amber-900"><strong>${f.name}</strong> está ocorrendo com muita frequência. Considere limitar a ${Math.max(1, f.count - 2)} vezes/mês.</span>
              </div>
            `).join('')}
            ${frequency.filter(f => f.count > 3).length === 0 ? '<p class="text-xs text-slate-400 italic">Nenhum comportamento repetitivo alarmante detectado.</p>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('insights')!.innerHTML = html;
  (window as any).lucide.createIcons();
};

const renderGoals = () => {
  const html = `
    <div class="space-y-6">
      <header class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Metas Financeiras</h2>
        <button onclick="window.showAddGoalModal()" class="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <i data-lucide="plus"></i> Nova Meta
        </button>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${state.goals.map((g: any) => {
          const progress = (g.currentAmount / g.targetAmount) * 100;
          return `
            <div class="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
              <div class="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-1000" style="width: ${Math.min(100, progress)}%"></div>
              <div class="flex justify-between mb-4">
                <h3 class="font-bold text-slate-800 text-lg">${g.name}</h3>
                <div class="flex gap-1">
                  <button onclick="window.updateGoalAmount('${g.id}')" class="text-emerald-600 p-1.5 hover:bg-emerald-50 rounded-lg"><i data-lucide="plus-circle" class="w-5 h-5"></i></button>
                  <button onclick="window.deleteGoal('${g.id}')" class="text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </div>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between items-end">
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acumulado</span>
                    <p class="text-2xl font-black text-emerald-600">${formatCurrency(g.currentAmount)}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objetivo</span>
                    <p class="font-bold text-slate-700">${formatCurrency(g.targetAmount)}</p>
                  </div>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full transition-all duration-700" style="width: ${Math.min(100, progress)}%"></div>
                </div>
                <p class="text-center font-bold text-slate-400 text-[10px] uppercase">${progress.toFixed(1)}% Completo</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  document.getElementById('goals')!.innerHTML = html;
  (window as any).lucide.createIcons();
};

const renderSettings = () => {
  const html = `
    <div class="space-y-8 pb-10">
      <header>
        <h2 class="text-2xl font-bold text-slate-800">Ajustes & Categorias</h2>
        <p class="text-slate-500">Configure despesas recorrentes e organize suas categorias.</p>
      </header>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section class="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 class="text-lg font-bold mb-6 flex items-center gap-2"><i data-lucide="repeat" class="text-emerald-500"></i> Novo Modelo Recorrente</h3>
          <form onsubmit="window.saveRecurring(event)" class="space-y-4">
            <input type="text" id="rec-name" placeholder="Nome (ex: Internet)" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" required />
            <div class="grid grid-cols-2 gap-4">
              <input type="number" id="rec-amount" step="0.01" placeholder="Valor" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" required />
              <select id="rec-category" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                ${state.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <input type="number" id="rec-day" placeholder="Dia de Vencimento (1-31)" min="1" max="31" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" required />
            <button type="submit" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all">Salvar Modelo</button>
          </form>
        </section>

        <section class="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 class="text-lg font-bold mb-6 flex items-center gap-2"><i data-lucide="tag" class="text-blue-500"></i> Categorias</h3>
          <div class="flex gap-2 mb-6">
            <input type="text" id="new-cat-name" placeholder="Nova categoria..." class="flex-1 p-2 bg-slate-50 border rounded-lg outline-none">
            <button onclick="window.addCategory()" class="bg-blue-600 text-white p-2 rounded-lg"><i data-lucide="plus"></i></button>
          </div>
          <div class="flex flex-wrap gap-2">
            ${state.categories.map(c => `
              <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-full text-xs font-bold text-slate-600 group">
                <span onclick="window.editCategory('${c}')" class="cursor-pointer hover:text-blue-600 transition-all">${c}</span>
                <button onclick="window.deleteCategory('${c}')" class="text-slate-300 hover:text-rose-500 transition-all"><i data-lucide="x" class="w-3 h-3"></i></button>
              </div>
            `).join('')}
          </div>
        </section>
      </div>

      <section class="space-y-4">
        <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="layers" class="text-emerald-500"></i> Modelos Recorrentes Ativos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${state.recurringTemplates.map((t: any) => `
            <div class="bg-white p-4 rounded-xl border flex justify-between items-center hover:border-emerald-100 transition-all">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-emerald-50 text-emerald-600 rounded-full"><i data-lucide="repeat"></i></div>
                <div>
                  <p class="font-bold text-slate-800">${t.name}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase">Todo dia ${t.dueDay} • ${t.category}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <p class="font-bold text-slate-800">${formatCurrency(t.amount)}</p>
                <button onclick="window.deleteTemplate('${t.id}')" class="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
  document.getElementById('settings')!.innerHTML = html;
  (window as any).lucide.createIcons();
};

const render = () => {
  const contents = {
    dashboard: renderDashboard,
    transactions: renderTransactions,
    insights: renderInsights,
    goals: renderGoals,
    settings: renderSettings
  };
  
  if (contents[state.activeTab]) {
    contents[state.activeTab]();
  }
  (window as any).lucide.createIcons();
};

// --- MODAIS ---

const showModal = (html: string) => {
  const container = document.getElementById('modal-container')!;
  container.innerHTML = html;
  container.classList.add('active');
  (window as any).lucide.createIcons();
};

const closeModal = () => {
  document.getElementById('modal-container')!.classList.remove('active');
};

// --- EXPOSIÇÃO GLOBAL DE FUNÇÕES ---

(window as any).setTxFilter = (f: string) => { UI.currentFilter = f; render(); };
(window as any).setSearch = (s: string) => { UI.searchTerm = s; render(); };
(window as any).setDateFilter = (f: string) => { UI.dateFilter = f; render(); };
(window as any).setCustomRange = (key: string, val: string) => { UI.customRange[key as 'start' | 'end'] = val; render(); };

(window as any).toggleTxTypeLabels = (type: string) => {
  const dateLabel = document.getElementById('date-label');
  const paidContainer = document.getElementById('paid-container');
  const installmentsSection = document.getElementById('installments-section');
  
  if (dateLabel) {
    dateLabel.innerText = type === 'income' ? 'Data de Recebimento' : 'Data de Vencimento';
  }
  if (paidContainer) {
    if (type === 'income') {
      paidContainer.classList.add('hidden');
      if(installmentsSection) installmentsSection.classList.add('hidden');
    } else {
      paidContainer.classList.remove('hidden');
      if(installmentsSection) installmentsSection.classList.remove('hidden');
    }
  }
};

(window as any).toggleInstallmentsInput = () => {
  const isChecked = (document.getElementById('tx-is-installment') as HTMLInputElement).checked;
  const inputContainer = document.getElementById('installments-input-container');
  if (inputContainer) {
    if (isChecked) inputContainer.classList.remove('hidden');
    else inputContainer.classList.add('hidden');
  }
};

(window as any).showAddTransactionModal = () => {
  showModal(`
    <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><i data-lucide="plus-circle" class="text-emerald-600"></i> Novo Lançamento</h3>
      <form onsubmit="window.saveTransaction(event)" class="space-y-4">
        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl">
          <input type="radio" name="type" id="income" value="income" onchange="window.toggleTxTypeLabels('income')" class="hidden peer/income">
          <label for="income" class="flex-1 text-center py-2.5 rounded-xl font-bold text-xs cursor-pointer text-slate-400 peer-checked/income:bg-white peer-checked/income:text-emerald-600 peer-checked/income:shadow-sm transition-all uppercase tracking-widest">Receita</label>
          <input type="radio" name="type" id="expense" value="expense" checked onchange="window.toggleTxTypeLabels('expense')" class="hidden peer/expense">
          <label for="expense" class="flex-1 text-center py-2.5 rounded-xl font-bold text-xs cursor-pointer text-slate-400 peer-checked/expense:bg-white peer-checked/expense:text-rose-600 peer-checked/expense:shadow-sm transition-all uppercase tracking-widest">Gasto</label>
        </div>
        
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nome do item</label>
          <input type="text" id="tx-name" placeholder="Ex: Mercado, Salário, Aluguel..." class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor (R$)</label>
            <input type="number" id="tx-amount" step="0.01" placeholder="0,00" class="w-full p-3 bg-slate-50 border rounded-xl outline-none" required />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Categoria</label>
            <select id="tx-category" class="w-full p-3 bg-slate-50 border rounded-xl outline-none">
              ${state.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label id="date-label" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Data de Vencimento</label>
          <input type="date" id="tx-date" value="${format(new Date(), 'yyyy-MM-dd')}" class="w-full p-3 bg-slate-50 border rounded-xl outline-none" required />
        </div>

        <div id="installments-section" class="space-y-3">
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <input type="checkbox" id="tx-is-installment" onchange="window.toggleInstallmentsInput()" class="w-5 h-5 accent-emerald-600 cursor-pointer">
            <label for="tx-is-installment" class="text-sm font-bold text-slate-600 cursor-pointer select-none">Parcelar este gasto?</label>
          </div>
          <div id="installments-input-container" class="hidden animate-in slide-in-from-top-2">
             <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Número de parcelas</label>
             <input type="number" id="tx-installments-count" min="2" max="120" placeholder="Ex: 12" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
          </div>
        </div>

        <div id="paid-container" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <input type="checkbox" id="tx-paid" class="w-5 h-5 accent-emerald-600 cursor-pointer">
          <label for="tx-paid" class="text-sm font-bold text-slate-600 cursor-pointer select-none">Já está pago?</label>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">Confirmar</button>
        </div>
      </form>
    </div>
  `);
};

(window as any).saveTransaction = (e: any) => {
  e.preventDefault();
  const type = (document.querySelector('input[name="type"]:checked') as HTMLInputElement).value;
  const name = (document.getElementById('tx-name') as HTMLInputElement).value;
  const amount = parseFloat((document.getElementById('tx-amount') as HTMLInputElement).value);
  const category = (document.getElementById('tx-category') as HTMLSelectElement).value;
  const dateStr = (document.getElementById('tx-date') as HTMLInputElement).value;
  const isPaid = (document.getElementById('tx-paid') as HTMLInputElement)?.checked || false;
  const isInstallment = (document.getElementById('tx-is-installment') as HTMLInputElement)?.checked || false;
  const installmentsCount = parseInt((document.getElementById('tx-installments-count') as HTMLInputElement)?.value) || 1;

  if (isInstallment && type === 'expense' && installmentsCount > 1) {
    // Lógica de parcelamento
    const startDate = parseISO(dateStr);
    for (let i = 0; i < installmentsCount; i++) {
      const currentTxDate = addMonths(startDate, i);
      const installmentLabel = ` (${String(i + 1).padStart(2, '0')}/${String(installmentsCount).padStart(2, '0')})`;
      
      state.transactions.push({ 
        id: Math.random().toString(36).substr(2, 9), 
        name: name + installmentLabel, 
        amount: amount, // Valor por parcela
        type, 
        category, 
        date: format(currentTxDate, 'yyyy-MM-dd'), 
        status: (i === 0 && isPaid) ? 'paid' : 'open' 
      });
    }
  } else {
    // Lançamento simples
    state.transactions.push({ 
      id: Math.random().toString(36).substr(2, 9), 
      name, 
      amount, 
      type, 
      category, 
      date: dateStr, 
      status: (type === 'income' || isPaid) ? 'paid' : 'open' 
    });
  }

  closeModal();
  saveState();
};

(window as any).payTransaction = (id: string) => {
  const tx = state.transactions.find((t: any) => t.id === id);
  if (tx) { tx.status = 'paid'; saveState(); }
};

(window as any).deleteTransaction = (id: string) => {
  if (confirm('Deseja excluir esta transação?')) {
    state.transactions = state.transactions.filter((t: any) => t.id !== id);
    saveState();
  }
};

(window as any).saveRecurring = (e: any) => {
  e.preventDefault();
  const name = (document.getElementById('rec-name') as HTMLInputElement).value;
  const amount = parseFloat((document.getElementById('rec-amount') as HTMLInputElement).value);
  const category = (document.getElementById('rec-category') as HTMLSelectElement).value;
  const dueDay = parseInt((document.getElementById('rec-day') as HTMLInputElement).value);
  const id = Math.random().toString(36).substr(2, 9);

  state.recurringTemplates.push({ id, name, amount, category, dueDay });
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  state.transactions.push({
    id: `rec-${id}-${format(startOfMonth(now), 'yyyy-MM-dd')}`,
    name, amount, category, date: format(dueDate, 'yyyy-MM-dd'), type: 'expense', status: 'open'
  });
  saveState();
};

(window as any).deleteTemplate = (id: string) => {
  if (confirm('Excluir este modelo? Isso não apagará transações já geradas.')) {
    state.recurringTemplates = state.recurringTemplates.filter((t: any) => t.id !== id);
    saveState();
  }
};

(window as any).addCategory = () => {
  const input = document.getElementById('new-cat-name') as HTMLInputElement;
  const name = input.value.trim();
  if (name && !state.categories.includes(name)) {
    state.categories.push(name);
    input.value = '';
    saveState();
  }
};

(window as any).editCategory = (old: string) => {
  const next = prompt(`Novo nome para a categoria "${old}":`, old);
  if (next && next.trim() && next !== old) {
    state.categories = state.categories.map(c => c === old ? next.trim() : c);
    state.transactions = state.transactions.map(t => t.category === old ? { ...t, category: next.trim() } : t);
    state.recurringTemplates = state.recurringTemplates.map(r => r.category === old ? { ...r, category: next.trim() } : r);
    saveState();
  }
};

(window as any).deleteCategory = (name: string) => {
  if (confirm(`Excluir a categoria "${name}"?`)) {
    state.categories = state.categories.filter(c => c !== name);
    saveState();
  }
};

(window as any).showAddGoalModal = () => {
  showModal(`
    <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
      <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><i data-lucide="target" class="text-emerald-600"></i> Nova Meta</h3>
      <form onsubmit="window.saveGoal(event)" class="space-y-4">
        <input type="text" id="goal-name" placeholder="Nome da Meta" class="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" required />
        <input type="number" id="goal-target" step="0.01" placeholder="Valor Objetivo" class="w-full p-3 bg-slate-50 border rounded-xl outline-none" required />
        <input type="number" id="goal-current" step="0.01" placeholder="Valor Inicial" class="w-full p-3 bg-slate-50 border rounded-xl outline-none" value="0" />
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">Criar Meta</button>
        </div>
      </form>
    </div>
  `);
};

(window as any).saveGoal = (e: any) => {
  e.preventDefault();
  const name = (document.getElementById('goal-name') as HTMLInputElement).value;
  const targetAmount = parseFloat((document.getElementById('goal-target') as HTMLInputElement).value);
  const currentAmount = parseFloat((document.getElementById('goal-current') as HTMLInputElement).value);
  state.goals.push({ id: Math.random().toString(36).substr(2, 9), name, targetAmount, currentAmount });
  closeModal();
  saveState();
};

(window as any).updateGoalAmount = (id: string) => {
  const goal = state.goals.find((g: any) => g.id === id);
  if (goal) {
    const add = prompt(`Quanto deseja adicionar à meta "${goal.name}"?`, '0');
    if (add && !isNaN(parseFloat(add))) {
      goal.currentAmount += parseFloat(add);
      saveState();
    }
  }
};

(window as any).deleteGoal = (id: string) => {
  if (confirm('Deseja excluir esta meta?')) {
    state.goals = state.goals.filter((g: any) => g.id !== id);
    saveState();
  }
};

(window as any).closeModal = closeModal;

// --- NAVEGAÇÃO ---

const setupNavigation = () => {
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = (btn as HTMLElement).dataset.tab;
      state.activeTab = tabId!;
      
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active', 'text-emerald-600');
        b.classList.add('text-slate-500');
      });
      
      document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(b => {
        b.classList.add('active');
        b.classList.remove('text-slate-500');
      });

      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const activeEl = document.getElementById(tabId!);
      if (activeEl) activeEl.classList.add('active');
      render();
    });
  });
};

// --- INIT ---
loadState();
setupNavigation();
render();
