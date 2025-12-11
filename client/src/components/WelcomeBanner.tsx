type Props = { name: string; onClose: () => void };

export default function WelcomeBanner({ name, onClose }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="mt-4 mb-2 rounded-2xl bg-gradient-to-b from-black to-red-900 text-white p-4 shadow-md shadow-black/30 border border-amber-500/30 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">Bem-vindo ao Ápice</p>
          <p className="text-xl font-semibold">{name}</p>
        </div>
        <button className="btn-secondary" onClick={onClose} aria-label="Fechar boas-vindas">Fechar</button>
      </div>
    </div>
  );
}
