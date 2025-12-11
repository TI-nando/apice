import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const txSchema = z.object({
  description: z.string(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  date: z.string(),
});

router.post("/ai-advisor", async (req, res) => {
  const arr = z.array(txSchema).safeParse(req.body?.transactions);
  if (!arr.success) return res.status(400).json({ error: "Invalid transactions" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Configure GEMINI_API_KEY" });
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Você é um consultor financeiro. Com base nas transações fornecidas, responda em JSON com as chaves: resumo, dicas, riscos, oportunidades. Transações: ${JSON.stringify(arr.data)}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/^```json|```$/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { resumo: text };
    }
    return res.json(parsed);
  } catch (e) {
    const txs = arr.data;
    const income = txs.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const byCat: Record<string, number> = {};
    for (const t of txs) byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    const topCats = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,3);
    return res.json({
      resumo: `Receita: R$ ${income.toFixed(2)}, Despesa: R$ ${expense.toFixed(2)}, Saldo: R$ ${balance.toFixed(2)}`,
      dicas: [
        "Defina um teto mensal para as 3 categorias com maior gasto",
        "Reserve 10% da receita para uma reserva de emergência",
        "Revise assinaturas e despesas recorrentes",
      ],
      riscos: [
        balance < 0 ? "Saldo negativo" : "",
        expense > income * 0.8 ? "Despesas muito próximas da receita" : "",
      ].filter(Boolean),
      oportunidades: topCats.map(([cat, amt]) => `Otimizar gastos em ${cat} (R$ ${amt.toFixed(2)})`),
      origem: "fallback",
    });
  }
});

export default router;
