import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ReactNode, useState, useEffect } from "react";

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  const [dark, setDark] = useState(() => {
    const t = localStorage.getItem("theme");
    return t ? t === "dark" : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);
  return (
    <div className={sidebarOpen ? "grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]" : "grid min-h-screen grid-cols-1"}>
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-col min-h-screen">
        <Navbar dark={dark} onToggleDark={() => setDark((d) => !d)} onOpenAI={() => { window.dispatchEvent(new CustomEvent('open-ai-advisor')); }} onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full fade-in-up">
          {children}
        </main>
      </div>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden" />
      )}
    </div>
  );
}
