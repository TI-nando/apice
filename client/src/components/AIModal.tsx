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
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-black/50 text-neutral-100 border border-amber-500/30 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="font-semibold">Conselhos da AI</h3>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
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
        </div>
      </div>
    </div>
  );
}
