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
  const list = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
  return res.json(list);
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

router.delete("/transactions/reset", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  await prisma.transaction.deleteMany({ where: { userId } });
  return res.json({ ok: true });
});

export default router;
