import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const txSchema = z.object({
  description: z.string(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  date: z.string(),
});

router.post("/ai-advisor", requireAuth, async (req, res) => {
  const override = z.array(txSchema).safeParse(req.body?.transactions);
  const userId = (req as any).userId as number;
  const txsRaw = override.success
    ? override.data
    : await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
  const txs = txsRaw.map(t => ({
        description: t.description,
        amount: Math.abs(Number((t as any).amount || t.amount)),
        type: (t as any).type as "INCOME" | "EXPENSE",
        category: String((t as any).category || t.category).trim(),
        date: new Date((t as any).date || t.date).toISOString(),
      }));

  const now = new Date();
  const last30 = txs.filter(t => (now.getTime() - new Date(t.date).getTime()) / (1000*60*60*24) <= 30);
  const baseTxs = last30.length > 0 ? last30 : txs;
  const income = baseTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = baseTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const byCat: Record<string, number> = {};
  for (const t of txs) byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  const topCategories = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([category, total]) => ({ category, total }));
  const savingsRate = income > 0 ? Math.max(0, Math.min(1, (income - expense) / income)) : 0;
  const recommendedSavings = Number((income * 0.2).toFixed(2));
  const budgetTargets = topCategories.map(c => ({ category: c.category, target: Number((c.total * 0.9).toFixed(2)) }));

  const base = {
    resumo: `Receita: R$ ${income.toFixed(2)}, Despesa: R$ ${expense.toFixed(2)}, Saldo: R$ ${balance.toFixed(2)}`,
    metrics: { income, expense, balance, savingsRate },
    topCategories,
    budget: { recommendedSavings, budgetTargets },
    dicas: [
      `Reserve ao menos R$ ${recommendedSavings.toFixed(2)} este mês`,
      "Defina limites para as categorias com maior gasto",
      "Automatize transferência para poupança no dia do pagamento",
    ],
    riscos: [
      balance < 0 ? "Saldo negativo" : "",
      expense > income * 0.8 ? "Despesas próximas da receita" : "",
    ].filter(Boolean),
    oportunidades: topCategories.map(c => `Otimizar gastos em ${c.category} (R$ ${c.total.toFixed(2)})`),
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ ...base, origem: "local" });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Atue como um consultor financeiro sênior. Responda em JSON estrito com: resumo; metrics{income,expense,balance,savingsRate}; topCategories[{category,total}]; budget{recommendedSavings,budgetTargets:[{category,target}]}; dicas(string[]); riscos(string[]); oportunidades(string[]). Calcule valores com base nas transações do usuário e garanta consistência matemática. Transações: ${JSON.stringify(txs)}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/^```json|```$/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = base;
    }
    return res.json({ ...base, ...parsed, origem: "ai" });
  } catch {
    return res.json({ ...base, origem: "local" });
  }
});

export default router;
