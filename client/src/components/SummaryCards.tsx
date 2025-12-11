import { TrendingUp, Wallet, ArrowDownCircle } from "lucide-react";
import { formatBRL } from "../lib/normalize";

type Props = { income: number; expense: number; balance: number };

export default function SummaryCards({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card-premium p-5 flex items-center gap-3">
        <Wallet className="text-amber-400" />
        <div>
          <p className="text-xs text-neutral-300">Saldo</p>
          <p className="text-2xl font-semibold">{formatBRL(balance)}</p>
        </div>
      </div>
      <div className="card-premium p-5 flex items-center gap-3">
        <TrendingUp className="text-amber-400" />
        <div>
          <p className="text-xs text-neutral-300">Receita</p>
          <p className="text-2xl font-semibold text-emerald-400">{formatBRL(income)}</p>
        </div>
      </div>
      <div className="card-premium p-5 flex items-center gap-3">
        <ArrowDownCircle className="text-amber-400" />
        <div>
          <p className="text-xs text-neutral-300">Despesas</p>
          <p className="text-2xl font-semibold text-rose-400">{formatBRL(expense)}</p>
        </div>
      </div>
    </div>
  );
}

