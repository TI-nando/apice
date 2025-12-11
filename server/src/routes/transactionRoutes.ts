import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  description: z.string(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  date: z.string(),
});

router.get("/transactions", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const hasPaging = typeof req.query.page !== "undefined" || typeof req.query.limit !== "undefined";
  if (!hasPaging) {
    const list = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
    return res.json(list);
  }
  const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
  const limit = Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1);
  const skip = (page - 1) * limit;
  const [list, total] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" }, skip, take: limit }),
    prisma.transaction.count({ where: { userId } }),
  ]);
  return res.json({ items: list, page, limit, total });
});

router.post("/transactions", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const userId = (req as any).userId as number;
  const data = parsed.data;
  const created = await prisma.transaction.create({
    data: {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      userId,
    },
  });
  return res.status(201).json(created);
});

router.put("/transactions/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const userId = (req as any).userId as number;
  const data = parsed.data;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: "Not found" });
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      description: data.description ?? existing.description,
      amount: data.amount ?? existing.amount,
      type: data.type ?? existing.type,
      category: data.category ?? existing.category,
      date: data.date ? new Date(data.date) : existing.date,
    },
  });
  return res.json(updated);
});

router.delete("/transactions/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const userId = (req as any).userId as number;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: "Not found" });
  await prisma.transaction.delete({ where: { id } });
  return res.json({ ok: true });
});

router.delete("/transactions/reset", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  await prisma.transaction.deleteMany({ where: { userId } });
  return res.json({ ok: true });
});

router.get("/transactions/summary", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const txs = await prisma.transaction.findMany({ where: { userId } });
  const income = txs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const byCategory: Record<string, number> = {};
  for (const t of txs) byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  const topCategories = Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([category, total]) => ({ category, total }));
  return res.json({ income, expense, balance, topCategories });
});

router.get("/transactions/export", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const txs = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
  const header = ["descricao", "categoria", "tipo", "valor", "data"].join(";");
  const rows = txs.map(t => [
    t.description.replace(/;/g, ","),
    t.category.replace(/;/g, ","),
    t.type,
    Number(t.amount).toFixed(2),
    new Date(t.date).toISOString(),
  ].join(";"));
  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=transacoes.csv");
  return res.send(csv);
});

router.post("/transactions/import", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const text: string = String(req.body?.csv || "");
  if (!text.trim()) return res.status(400).json({ error: "CSV vazio" });
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return res.status(400).json({ error: "CSV sem linhas" });
  const headerLine = lines[0] as string;
  const rows = lines.slice(1);
  const cols = headerLine.split(/;|,|\t/).map(s => s.trim().toLowerCase());
  const idx = {
    descricao: cols.findIndex(c => c.includes("descr")),
    categoria: cols.findIndex(c => c.includes("categ")),
    tipo: cols.findIndex(c => c.includes("tipo")),
    valor: cols.findIndex(c => c.includes("valor")),
    data: cols.findIndex(c => c.includes("data")),
  };
  const batch = [] as any[];
  for (const r of rows) {
    const parts = r.split(/;|,|\t/);
    const description = String(parts[idx.descricao] || "").trim() || "Importado";
    const category = String(parts[idx.categoria] || "Outros").trim();
    const typeRaw = String(parts[idx.tipo] || "EXPENSE").trim().toUpperCase();
    const type = typeRaw === "INCOME" ? "INCOME" : "EXPENSE";
    const amount = Number(String(parts[idx.valor] || "0").replace(",", "."));
    const dateStr = String(parts[idx.data] || new Date().toISOString());
    const date = new Date(dateStr);
    if (!isFinite(amount)) continue;
    batch.push({ description, category, type, amount, date, userId });
  }
  if (batch.length === 0) return res.status(400).json({ error: "Nenhuma linha válida" });
  await prisma.transaction.createMany({ data: batch.map(b => ({
    description: b.description,
    category: b.category,
    type: b.type,
    amount: b.amount,
    date: b.date,
    userId,
  })) });
  return res.json({ ok: true, imported: batch.length });
});

export default router;
