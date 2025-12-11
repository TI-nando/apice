import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, Bot, Menu } from "lucide-react";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  onOpenAI: () => void;
  onToggleSidebar: () => void;
};

export default function Navbar({ dark, onToggleDark, onOpenAI, onToggleSidebar }: Props) {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }
  return (
    <header className={dark ? "sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/80 backdrop-blur border-b border-amber-500/20 text-gray-100" : "sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/70 backdrop-blur border-b border-amber-500/20 text-black shadow-lg shadow-black/10"}>
      <div className="flex items-center gap-2">
        <button className="btn-secondary" onClick={onToggleSidebar} aria-label="Abrir menu">
          <Menu size={16} />
        </button>
        <span className={dark ? "h-8 w-8 rounded bg-gradient-to-br from-red-700 to-red-500 border border-amber-500/40" : "h-8 w-8 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-500/40"} />
        <span className="font-semibold tracking-wide">Ápice</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-premium" onClick={onOpenAI} aria-label="Conselhos da AI">
          <Bot className="inline mr-1" size={16} /> Conselhos da AI
        </button>
        <button className="btn-secondary" onClick={onToggleDark} aria-label="Alternar tema">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="btn-secondary" onClick={logout} aria-label="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
