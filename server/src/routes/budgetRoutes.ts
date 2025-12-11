import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const budgetSchema = z.object({
  category: z.string().min(2),
  limit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
});

router.get("/budgets", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const month = parseInt(String(req.query.month || new Date().getMonth() + 1), 10);
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);
  const items = await prisma.budget.findMany({ where: { userId, month, year } });
  return res.json(items);
});

router.post("/budgets", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { category, limit, month, year } = parsed.data;
  const upserted = await prisma.budget.upsert({
    where: { userId_category_month_year: { userId, category, month, year } },
    update: { limit },
    create: { userId, category, limit, month, year },
  });
  return res.status(201).json(upserted);
});

router.delete("/budgets/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const userId = (req as any).userId as number;
  const b = await prisma.budget.findUnique({ where: { id } });
  if (!b || b.userId !== userId) return res.status(404).json({ error: "Not found" });
  await prisma.budget.delete({ where: { id } });
  return res.json({ ok: true });
});

router.get("/budgets/status", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const month = parseInt(String(req.query.month || new Date().getMonth() + 1), 10);
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);
  const budgets = await prisma.budget.findMany({ where: { userId, month, year } });
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const txs = await prisma.transaction.findMany({ where: { userId, date: { gte: start, lte: end } } });
  const spentByCat: Record<string, number> = {};
  for (const t of txs) if (t.type === "EXPENSE") spentByCat[t.category] = (spentByCat[t.category] || 0) + Number(t.amount);
  const status = budgets.map(b => ({
    id: b.id,
    category: b.category,
    limit: Number(b.limit),
    spent: Number(spentByCat[b.category] || 0),
    remaining: Number(b.limit) - Number(spentByCat[b.category] || 0),
    percent: Math.round(((Number(spentByCat[b.category] || 0)) / Math.max(1, Number(b.limit))) * 100),
    alert: (Number(spentByCat[b.category] || 0)) >= Number(b.limit) * 0.8,
  }));
  return res.json(status);
});

export default router;
