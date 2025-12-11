import { useEffect, useState } from "react";

type Tx = {
  id?: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
};

type Props = {
  open: boolean;
  tx: Tx | null;
  onClose: () => void;
  onSubmit: (id: number, data: Partial<Tx>) => Promise<void> | void;
};

export default function EditTransactionModal({ open, tx, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Tx | null>(null);
  useEffect(() => {
    if (tx) setForm(tx);
  }, [tx]);
  if (!open || !form || !tx?.id) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-black/50 text-neutral-100 border border-amber-500/30 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="font-semibold">Editar Transação</h3>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
        <form
          className="grid grid-cols-1 gap-3 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const payload: Partial<Tx> = {
              description: form.description,
              amount: form.amount,
              type: form.type,
              category: form.category,
              date: form.date,
            };
            await onSubmit(tx.id!, payload);
            onClose();
          }}
        >
          <input
            className="input-premium"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição"
          />
          <input
            className="input-premium"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="Valor"
          />
          <select
            className="select-premium"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          >
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
          <input
            className="input-premium"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Categoria"
          />
          <input
            className="input-premium"
            type="datetime-local"
            value={new Date(form.date).toISOString().slice(0,16)}
            onChange={(e) => {
              const dt = e.target.value ? new Date(e.target.value) : new Date();
              setForm({ ...form, date: dt.toISOString() });
            }}
          />
          <button className="btn-premium justify-center">Salvar</button>
        </form>
      </div>
    </div>
  );
}
