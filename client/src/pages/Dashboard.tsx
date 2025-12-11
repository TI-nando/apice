import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AIModal from "../components/AIModal";
import WelcomeBanner from "../components/WelcomeBanner";
import ValueTooltip from "../components/ValueTooltip";
import { api } from "../services/api";
import { normalizeTransactions, formatBRL } from "../lib/normalize";
import SummaryCards from "../components/SummaryCards";
import { Trash2, Download, Pencil } from "lucide-react";
import EditTransactionModal from "../components/EditTransactionModal";

type Tx = {
  id?: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
};


export default function Dashboard() {
  const [transactions, setTransactions] = useState<Tx[]>([
    { description: "Salário", amount: 5000, type: "INCOME", category: "Receita", date: new Date().toISOString() },
    { description: "Aluguel", amount: 1800, type: "EXPENSE", category: "Moradia", date: new Date().toISOString() },
    { description: "Mercado", amount: 600, type: "EXPENSE", category: "Alimentação", date: new Date().toISOString() },
  ]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState<number | null>(null);

  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: async () => {
      const res = await api.get(`/transactions`, { params: { page, limit } });
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const norm = normalizeTransactions(items);
      const t = typeof res.data?.total === "number" ? res.data.total : null;
      setTotal(t);
      return norm;
    },
  });
  useEffect(() => {
    if (data) setTransactions(data);
  }, [data]);

  useEffect(() => {
    function handler() { askAI(); }
    window.addEventListener('open-ai-advisor', handler as EventListener);
    return () => window.removeEventListener('open-ai-advisor', handler as EventListener);
  }, []);

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<Tx, "id">) => (await api.post<Tx>("/transactions", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/transactions/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: Partial<Tx> }) => (await api.put(`/transactions/${payload.id}`, payload.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const { data: budgets } = useQuery({
    queryKey: ["budgets", new Date().getMonth()+1, new Date().getFullYear()],
    queryFn: async () => (await api.get(`/budgets/status`)).data as Array<{ id: number; category: string; limit: number; spent: number; remaining: number }>,
  });

  const filtered = useMemo(() => transactions.filter((t) =>
    (typeFilter === "ALL" || t.type === typeFilter) &&
    (search === "" || t.description.toLowerCase().includes(search.toLowerCase()))
  ), [transactions, typeFilter, search]);
  const income = useMemo(() => filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0), [filtered]);
  const expense = useMemo(() => filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = useMemo(() => income - expense, [income, expense]);

  async function askAI() {
    const res = await api.post("/ai-advisor", { transactions });
    setAiData(res.data);
    setAiOpen(true);
  }

  async function exportCSV() {
    const res = await api.get(`/transactions/export`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function importCSV(file: File) {
    const text = await file.text();
    await api.post(`/transactions/import`, { csv: text });
    qc.invalidateQueries({ queryKey: ["transactions", page, limit] });
  }

  return (
    <>
      {showWelcome && (
        <WelcomeBanner name={localStorage.getItem("userName") || "Usuário"} onClose={() => setShowWelcome(false)} />
      )}
          <SummaryCards income={income} expense={expense} balance={balance} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="card-premium p-5 lg:col-span-2">
              <h3 className="font-semibold mb-2 text-center">Adicionar Transação</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-12 gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const fd = new FormData(form);
                  const payload: Omit<Tx, "id"> = {
                    description: String(fd.get("description") || ""),
                    amount: Number(fd.get("amount") || 0),
                    type: (String(fd.get("type") || "EXPENSE") as any),
                    category: String(fd.get("category") || "Outros"),
                    date: (() => { const r = String(fd.get("date") || ""); return r ? new Date(r).toISOString() : new Date().toISOString(); })(),
                  };
                  if (!payload.description || !isFinite(payload.amount) || payload.amount <= 0) {
                    setFormError("Preencha descrição e valor maior que zero");
                    return;
                  }
                  setFormError("");
                  addMutation.mutate(payload);
                  form.reset();
                }}
              >
                <input name="description" placeholder="Digite a descrição da transação" aria-label="Descrição da transação" className="input-premium md:col-span-12 min-w-[280px]" />
                <input name="amount" type="number" step="0.01" placeholder="Digite o valor" aria-label="Valor da transação" className="input-premium md:col-span-3 min-w-[180px]" />
                <select name="type" className="select-premium md:col-span-3 min-w-[160px]" aria-label="Tipo de transação">
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </select>
                <input name="category" placeholder="Digite a categoria" aria-label="Categoria" className="input-premium md:col-span-3 min-w-[180px]" />
                <input name="date" type="date" aria-label="Data" className="input-premium md:col-span-3 w-full max-w-[220px]" />
                <button className="mt-2 md:mt-0 btn-premium md:col-span-12 justify-self-center w-full md:w-40 justify-center text-center" aria-label="Salvar transação">Salvar</button>
              </form>
              {formError && <p className="text-rose-400 text-sm mt-2" aria-live="assertive">{formError}</p>}
            </div>
            <div className="card-premium p-5 flex flex-wrap items-end gap-3 justify-center text-center">
              <h3 className="font-semibold w-full text-center">Filtros</h3>
              <div className="flex flex-wrap gap-3 w-full justify-center">
                <input aria-label="Buscar por descrição" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Digite a descrição para filtrar" className="input-premium flex-1 min-w-[220px]" />
                <select aria-label="Filtrar por tipo" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-premium w-48">
                  <option value="ALL">Todos</option>
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </select>
                <button className="btn-secondary" onClick={() => { setTypeFilter("ALL"); setSearch(""); }} aria-label="Limpar filtros">Limpar</button>
              </div>
              <div className="min-h-5">
                {isLoading && <span className="text-sm text-neutral-300">Carregando...</span>}
                {isError && <span className="text-sm text-rose-400">Erro ao carregar</span>}
              </div>
              <div className="mt-3 flex gap-2 justify-center">
                <button className="btn-secondary" onClick={exportCSV}><Download size={16} /> Exportar CSV</button>
                <label className="btn-secondary">
                  Importar CSV
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importCSV(f);
                  }} />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-premium p-5 h-64 md:h-80">
              <h3 className="font-semibold mb-2 text-center">Distribuição por Categoria</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <radialGradient id="pieGold" cx="50%" cy="50%" r="80%">
                      <stop offset="0%" stopColor="#fff3cd" />
                      <stop offset="60%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#b45309" />
                    </radialGradient>
                    <radialGradient id="pieRed" cx="50%" cy="50%" r="80%">
                      <stop offset="0%" stopColor="#fee2e2" />
                      <stop offset="60%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </radialGradient>
                    <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
                    </filter>
                  </defs>
                  <Pie dataKey="amount" data={filtered} nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={110} stroke="#111" strokeWidth={2} style={{ filter: 'url(#pieShadow)' }}>
                    {filtered.map((t, i) => (
                      <Cell key={i} fill={t.type === 'INCOME' ? 'url(#pieGold)' : 'url(#pieRed)'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ValueTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card-premium p-5 h-64 md:h-80">
              <h3 className="font-semibold mb-2 text-center">Receita vs Despesa</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Receita", valor: income }, { name: "Despesa", valor: expense }] }>
                  <defs>
                    <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffd700" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </linearGradient>
                    <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
                    </filter>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ValueTooltip />} />
                  <Bar dataKey="valor" radius={[8,8,0,0]} style={{ filter: 'url(#barShadow)' }}>
                    <Cell fill="url(#barGold)" />
                    <Cell fill="url(#barRed)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          
          <div className="card-premium p-5">
            <h3 className="font-semibold mb-2 text-center">Transações</h3>
            <div className="overflow-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th className="py-2 px-2">Descrição</th>
                    <th className="py-2 px-2">Categoria</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2">Valor</th>
                    <th className="py-2 px-2">Data</th>
                    <th className="py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-neutral-300">Nenhuma transação encontrada</td>
                    </tr>
                  )}
                  {filtered.map((t, idx) => (
                    <tr key={t.id ?? `${t.description}-${t.date}-${idx}`} className="hover:bg-neutral-900/40">
                      <td className="py-2 px-2">{t.description}</td>
                      <td className="py-2 px-2">{t.category}</td>
                      <td className="py-2 px-2">
                        <span className={t.type === "INCOME" ? "badge-income" : "badge-expense"}>{t.type}</span>
                      </td>
                      <td className="py-2 px-2">{formatBRL(t.amount)}</td>
                      <td className="py-2 px-2">{new Date(t.date).toLocaleString()}</td>
                      <td className="py-2 px-2 flex gap-2">
                        {t.id && <button className="btn-secondary" onClick={() => { setEditing(t); setEditOpen(true); }} aria-label="Editar transação"><Pencil size={14} /></button>}
                        {t.id && <button className="btn-secondary" onClick={() => deleteMutation.mutate(t.id!)} aria-label="Excluir transação"><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
              <span className="text-sm text-neutral-300">Página {page}{total ? ` de ${Math.max(1, Math.ceil(total / limit))}` : ""}</span>
              <button className="btn-secondary" disabled={total ? page >= Math.ceil(total / limit) : false} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
          </div>

          <div className="card-premium p-5">
            <h3 className="font-semibold mb-2 text-center">Orçamento do Mês</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets?.length ? budgets.map((b) => (
                <div key={b.id} className="rounded-xl border border-amber-500/20 bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{b.category}</span>
                    <span className="text-sm text-neutral-300">Limite: {formatBRL(b.limit)}</span>
                  </div>
                  <div className="mt-2 w-full h-3 rounded bg-neutral-800">
                    <div className="h-3 rounded" style={{ width: `${Math.min(100, Math.round((b.spent / Math.max(1, b.limit)) * 100))}%`, background: b.spent > b.limit ? "#7f1d1d" : "#FFD700" }} />
                  </div>
                  <div className="mt-2 text-sm text-neutral-300 flex justify-between">
                    <span>Gasto: {formatBRL(b.spent)}</span>
                    <span>Restante: {formatBRL(b.remaining)}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-neutral-300">Sem orçamento definido</p>}
            </div>
            <form className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              const payload = {
                category: String(fd.get("bcategory") || "").trim(),
                limit: Number(fd.get("blimit") || 0),
                month: new Date().getMonth()+1,
                year: new Date().getFullYear(),
              };
              if (!payload.category || !isFinite(payload.limit) || payload.limit <= 0) return;
              await api.post(`/budgets`, payload);
              qc.invalidateQueries({ queryKey: ["budgets", payload.month, payload.year] });
              (e.target as HTMLFormElement).reset();
            }}>
              <input name="bcategory" placeholder="Categoria" className="input-premium md:col-span-5 justify-self-center" />
              <input name="blimit" type="number" step="0.01" placeholder="Limite" className="input-premium md:col-span-5 justify-self-center" />
              <button className="btn-premium md:col-span-2 justify-self-center">Salvar Orçamento</button>
            </form>
          </div>

      <AIModal open={aiOpen} onClose={() => setAiOpen(false)} content={aiData} />
      <EditTransactionModal open={editOpen} tx={editing} onClose={() => setEditOpen(false)} onSubmit={async (id, data) => { await updateMutation.mutateAsync({ id, data }); }} />
    </>
  );
}
