import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListOrdered, Bot } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="glass-sidebar p-4 md:p-6 md:static md:w-auto fixed left-0 top-0 h-full w-72 z-50 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="h-8 w-8 rounded bg-gradient-to-br from-red-800 to-red-600 border border-amber-500/40" />
        <span className="font-semibold tracking-wide">Ápice</span>
      </div>
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${isActive ? "bg-black/40 border border-amber-500/30" : "hover:bg-black/30"}` }>
          <LayoutDashboard size={16} className="text-amber-400" />
          <span>Dashboard</span>
        </NavLink>
        <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/30 transition-all duration-300">
          <ListOrdered size={16} className="text-amber-400" />
          <span>Transações</span>
        </button>
        <button onClick={() => { navigate('/dashboard'); window.dispatchEvent(new CustomEvent('open-ai-advisor')); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/30 transition-all duration-300">
          <Bot size={16} className="text-amber-400" />
          <span>Conselhos da AI</span>
        </button>
      </nav>
    </aside>
  );
}
