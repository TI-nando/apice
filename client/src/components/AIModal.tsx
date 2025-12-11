type Props = {
  open: boolean;
  onClose: () => void;
  content: any;
};

export default function AIModal({ open, onClose, content }: Props) {
  if (!open) return null;
  const resumo = content?.resumo;
  const dicas: string[] = content?.dicas || [];
  const riscos: string[] = content?.riscos || [];
  const oportunidades: string[] = content?.oportunidades || [];
  const metrics = content?.metrics || {};
  const top = (content?.topCategories || []) as Array<{ category: string; total: number }>;
  const budget = content?.budget || {};
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-black/50 text-neutral-100 border border-amber-500/30 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="font-semibold">Conselhos da AI</h3>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card-premium p-3">
                <p className="text-xs">Receita</p>
                <p className="text-lg font-semibold text-emerald-400">R$ {(metrics.income || 0).toFixed?.(2) || Number(metrics.income || 0).toFixed(2)}</p>
              </div>
              <div className="card-premium p-3">
                <p className="text-xs">Despesa</p>
                <p className="text-lg font-semibold text-rose-400">R$ {(metrics.expense || 0).toFixed?.(2) || Number(metrics.expense || 0).toFixed(2)}</p>
              </div>
              <div className="card-premium p-3">
                <p className="text-xs">Saldo</p>
                <p className="text-lg font-semibold">R$ {(metrics.balance || 0).toFixed?.(2) || Number(metrics.balance || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Resumo</h4>
            <p className="text-sm opacity-90">{resumo || "Sem resumo"}</p>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Dicas</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {dicas.length === 0 && <li className="opacity-70">Sem dicas</li>}
              {dicas.map((d, i) => (<li key={i}>{d}</li>))}
            </ul>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Riscos</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-rose-400">
              {riscos.length === 0 && <li className="opacity-70 text-neutral-300">Sem riscos</li>}
              {riscos.map((d, i) => (<li key={i}>{d}</li>))}
            </ul>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Oportunidades</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-300">
              {oportunidades.length === 0 && <li className="opacity-70 text-neutral-300">Sem oportunidades</li>}
              {oportunidades.map((d, i) => (<li key={i}>{d}</li>))}
            </ul>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Top categorias</h4>
            <ul className="space-y-1 text-sm">
              {top.length === 0 && <li className="opacity-70">Sem dados</li>}
              {top.map((c, i) => (
                <li key={i} className="flex items-center justify-between"><span>{c.category}</span><span>R$ {c.total.toFixed(2)}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-black/40 p-4 border border-amber-500/20">
            <h4 className="font-semibold mb-2">Orçamento sugerido</h4>
            <p className="text-sm mb-2">Reserva recomendada: R$ {Number(budget?.recommendedSavings || 0).toFixed(2)}</p>
            <ul className="space-y-1 text-sm">
              {(budget?.budgetTargets || []).length === 0 && <li className="opacity-70">Sem metas</li>}
              {(budget?.budgetTargets || []).map((b: any, i: number) => (
                <li key={i} className="flex items-center justify-between"><span>{b.category}</span><span>R$ {Number(b.target || 0).toFixed(2)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
