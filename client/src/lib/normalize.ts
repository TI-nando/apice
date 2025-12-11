export function normalizeTransactions(items: any[]): Array<{
  id?: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
}> {
  if (!Array.isArray(items)) return [];
  return items
    .map((t) => {
      const amount = Number((t?.amount ?? 0).toString().replace(",", "."));
      const type = String(t?.type ?? "EXPENSE").toUpperCase();
      const category = String(t?.category ?? "Outros");
      const description = String(t?.description ?? "").trim() || "Sem descrição";
      const dateRaw = t?.date ?? new Date().toISOString();
      const date = new Date(dateRaw).toISOString();
      if (type !== "INCOME" && type !== "EXPENSE") return null;
      if (!isFinite(amount)) return null;
      return {
        id: typeof t?.id === "number" ? t.id : undefined,
        description,
        amount,
        type: type as "INCOME" | "EXPENSE",
        category,
        date,
      };
    })
    .filter(Boolean) as any;
}

export function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  } catch {
    return `R$ ${(value || 0).toFixed(2)}`;
  }
}
