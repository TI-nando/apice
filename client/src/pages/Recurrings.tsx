import {} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatBRL } from "../lib/normalize";

type Rec = { id: number; description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; cadence: "MONTHLY" | "WEEKLY" | "YEARLY"; nextDate: string; active: boolean };

export default function Recurrings() {
  const qc = useQueryClient();
  const { data: items } = useQuery({ queryKey: ["recurrings"], queryFn: async () => (await api.get(`/recurrings`)).data as Rec[] });
  const { data: forecast } = useQuery({ queryKey: ["recurrings-forecast"], queryFn: async () => (await api.get(`/recurrings/forecast`, { params: { months: 3 } })).data as Array<{ month: number; year: number; income: number; expense: number }> });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Rec, "id" | "active"> & { active?: boolean }) => (await api.post(`/recurrings`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurrings"] }),
  });
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; data: Partial<Rec> }) => (await api.put(`/recurrings/${payload.id}`, payload.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurrings"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/recurrings/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurrings"] }),
  });

  return (
    <div className="space-y-6">
      <div className="card-premium p-5">
        <h3 className="font-semibold mb-2 text-center">Assinaturas e Recorrências</h3>
        <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target as HTMLFormElement);
          const payload = {
            description: String(fd.get("description") || "").trim(),
            amount: Number(fd.get("amount") || 0),
            type: String(fd.get("type") || "EXPENSE") as any,
            category: String(fd.get("category") || "Outros").trim(),
            cadence: String(fd.get("cadence") || "MONTHLY") as any,
            nextDate: String(fd.get("nextDate") || new Date().toISOString()),
            active: true,
          };
          if (!payload.description || !isFinite(payload.amount) || payload.amount <= 0) return;
          await createMutation.mutateAsync(payload);
          (e.target as HTMLFormElement).reset();
        }}>
          <input name="description" placeholder="Descrição" className="input-premium md:col-span-3" />
          <input name="amount" type="number" step="0.01" placeholder="Valor" className="input-premium md:col-span-2" />
          <select name="type" className="select-premium md:col-span-2">
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
          <input name="category" placeholder="Categoria" className="input-premium md:col-span-2" />
          <select name="cadence" className="select-premium md:col-span-2">
            <option value="MONTHLY">Mensal</option>
            <option value="WEEKLY">Semanal</option>
            <option value="YEARLY">Anual</option>
          </select>
          <input name="nextDate" type="date" className="input-premium md:col-span-1" />
          <button className="btn-premium md:col-span-12 justify-self-center">Adicionar</button>
        </form>
      </div>

      <div className="card-premium p-5">
        <h3 className="font-semibold mb-2 text-center">Próximos 3 meses (Forecast)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(forecast || []).map((f, i) => (
            <div key={i} className="rounded-xl border border-amber-500/20 bg-black/40 p-4 text-center">
              <p className="text-xs">{String(f.month).padStart(2, "0")}/{f.year}</p>
              <p className="text-sm">Receita: <span className="text-emerald-400 font-semibold">{formatBRL(f.income)}</span></p>
              <p className="text-sm">Despesa: <span className="text-rose-400 font-semibold">{formatBRL(f.expense)}</span></p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-premium p-5">
        <h3 className="font-semibold mb-2 text-center">Lista</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(items || []).map((r) => (
            <div key={r.id} className="rounded-xl border border-amber-500/20 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.description}</span>
                <button className="btn-secondary" onClick={() => deleteMutation.mutate(r.id)}>Excluir</button>
              </div>
              <p className="text-sm text-neutral-300">{r.category} • {r.cadence} • {new Date(r.nextDate).toLocaleDateString()}</p>
              <div className="mt-2 text-sm">{r.type === "INCOME" ? <span className="text-emerald-400">{formatBRL(r.amount)}</span> : <span className="text-rose-400">{formatBRL(r.amount)}</span>}</div>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={r.active} onChange={(e) => updateMutation.mutate({ id: r.id, data: { active: e.target.checked } })} /> Ativo</label>
              </div>
            </div>
          ))}
          {(items || []).length === 0 && <p className="text-sm text-neutral-300 text-center">Sem recorrências</p>}
        </div>
      </div>
    </div>
  );
}
