import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const recurringSchema = z.object({
  description: z.string().min(2),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(2),
  cadence: z.enum(["MONTHLY", "WEEKLY", "YEARLY"]),
  nextDate: z.string(),
  active: z.boolean().optional().default(true),
});

router.get("/recurrings", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const items = await prisma.recurringTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return res.json(items);
});

router.post("/recurrings", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const parsed = recurringSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const data = parsed.data;
  const created = await prisma.recurringTransaction.create({
    data: {
      userId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      cadence: data.cadence,
      nextDate: new Date(data.nextDate),
      active: data.active,
    },
  });
  return res.status(201).json(created);
});

router.put("/recurrings/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const userId = (req as any).userId as number;
  const existing = await prisma.recurringTransaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: "Not found" });
  const parsed = recurringSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const data = parsed.data as any;
  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: {
      description: data.description ?? existing.description,
      amount: data.amount ?? existing.amount,
      type: data.type ?? existing.type,
      category: data.category ?? existing.category,
      cadence: data.cadence ?? existing.cadence,
      nextDate: data.nextDate ? new Date(data.nextDate) : existing.nextDate,
      active: typeof data.active === "boolean" ? data.active : existing.active,
    },
  });
  return res.json(updated);
});

router.delete("/recurrings/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const userId = (req as any).userId as number;
  const existing = await prisma.recurringTransaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: "Not found" });
  await prisma.recurringTransaction.delete({ where: { id } });
  return res.json({ ok: true });
});

router.get("/recurrings/forecast", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const months = Math.min(Math.max(parseInt(String(req.query.months || "3"), 10) || 3, 1), 12);
  const rec = await prisma.recurringTransaction.findMany({ where: { userId, active: true } });
  const start = new Date();
  const forecast: Array<{ month: number; year: number; income: number; expense: number }> = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let income = 0, expense = 0;
    for (const r of rec) {
      const next = new Date(r.nextDate);
      const cadence = r.cadence;
      const amt = Number(r.amount);
      if (cadence === "MONTHLY") {
        income += r.type === "INCOME" ? amt : 0;
        expense += r.type === "EXPENSE" ? amt : 0;
      } else if (cadence === "WEEKLY") {
        income += r.type === "INCOME" ? amt * 4 : 0;
        expense += r.type === "EXPENSE" ? amt * 4 : 0;
      } else if (cadence === "YEARLY") {
        if (next.getMonth() + 1 === month) {
          income += r.type === "INCOME" ? amt : 0;
          expense += r.type === "EXPENSE" ? amt : 0;
        }
      }
    }
    forecast.push({ month, year, income, expense });
  }
  return res.json(forecast);
});

export default router;
