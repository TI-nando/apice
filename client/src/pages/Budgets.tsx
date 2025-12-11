import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatBRL } from "../lib/normalize";

type BudgetStatus = { id: number; category: string; limit: number; spent: number; remaining: number };

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [formError, setFormError] = useState("");
  const qc = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["budgets-status", month, year],
    queryFn: async () => (await api.get(`/budgets/status`, { params: { month, year } })).data as BudgetStatus[],
  });

  const totalLimit = useMemo(() => (status || []).reduce((s, b) => s + (b.limit || 0), 0), [status]);
  const totalSpent = useMemo(() => (status || []).reduce((s, b) => s + (b.spent || 0), 0), [status]);
  const totalRemaining = useMemo(() => totalLimit - totalSpent, [totalLimit, totalSpent]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/budgets/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets-status", month, year] }),
  });

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-5">
        <h3 className="font-semibold mb-2 text-center">Orçamentos Mensais</h3>
        <div className="flex items-center justify-center gap-3 mb-3">
          <button className="btn-secondary" onClick={() => changeMonth(-1)}>Mês anterior</button>
          <span className="text-sm text-neutral-300">{String(month).padStart(2, "0")}/{year}</span>
          <button className="btn-secondary" onClick={() => changeMonth(1)}>Próximo mês</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 text-center">
            <p className="text-xs">Limite total</p>
            <p className="text-xl font-semibold">{formatBRL(totalLimit)}</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-xs">Gasto total</p>
            <p className="text-xl font-semibold text-rose-400">{formatBRL(totalSpent)}</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-xs">Restante</p>
            <p className="text-xl font-semibold text-emerald-400">{formatBRL(totalRemaining)}</p>
          </div>
        </div>
      </div>

      <div className="card-premium p-5">
        <h3 className="font-semibold mb-3 text-center">Categorias</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(status || []).map((b) => (
            <div key={b.id} className="rounded-xl border border-amber-500/20 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{b.category}</span>
                <button className="btn-secondary" onClick={() => deleteMutation.mutate(b.id)}>Excluir</button>
              </div>
              <div className="mt-2 w-full h-3 rounded bg-neutral-800">
                <div className="h-3 rounded" style={{ width: `${Math.min(100, Math.round((b.spent / Math.max(1, b.limit)) * 100))}%`, background: b.spent > b.limit ? "#7f1d1d" : "#FFD700" }} />
              </div>
              <div className="mt-2 text-sm text-neutral-300 flex justify-between">
                <span>Limite: {formatBRL(b.limit)}</span>
                <span>Gasto: {formatBRL(b.spent)}</span>
              </div>
              <div className="mt-1 text-sm text-neutral-300">Restante: {formatBRL(b.remaining)}</div>
            </div>
          ))}
          {(status || []).length === 0 && <p className="text-sm text-neutral-300 text-center">Sem orçamento para este mês</p>}
        </div>
      </div>

      <div className="card-premium p-5">
        <h3 className="font-semibold mb-2 text-center">Definir Orçamento</h3>
        <form
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target as HTMLFormElement);
            const payload = {
              category: String(fd.get("bcategory") || "").trim(),
              limit: Number(fd.get("blimit") || 0),
              month,
              year,
            };
            if (!payload.category || !isFinite(payload.limit) || payload.limit <= 0) {
              setFormError("Preencha categoria e limite maior que zero");
              return;
            }
            setFormError("");
            await api.post(`/budgets`, payload);
            qc.invalidateQueries({ queryKey: ["budgets-status", month, year] });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <input name="bcategory" placeholder="Categoria" className="input-premium md:col-span-5 justify-self-center" />
          <input name="blimit" type="number" step="0.01" placeholder="Limite" className="input-premium md:col-span-5 justify-self-center" />
          <button className="btn-premium md:col-span-2 justify-self-center">Salvar</button>
        </form>
        {formError && <p className="text-rose-400 text-sm mt-2 text-center" aria-live="assertive">{formError}</p>}
      </div>
    </div>
  );
}
