import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dark, setDark] = useState(() => {
    const t = localStorage.getItem("theme");
    return t ? t === "dark" : true;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user?.name || "");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn(dark ? "dark" : "light", "min-h-screen login-hero")}>
      <div className="min-h-screen flex items-center justify-center px-4">
        <button className="btn-secondary fixed top-4 right-4" aria-label="Alternar tema" onClick={() => {
          const next = !dark;
          setDark(next);
          const root = document.documentElement;
          if (next) {
            root.classList.add("dark");
            root.classList.remove("light");
            localStorage.setItem("theme", "dark");
          } else {
            root.classList.remove("dark");
            root.classList.add("light");
            localStorage.setItem("theme", "light");
          }
        }}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="w-full max-w-md card-premium p-6">
          <div className="mb-4 text-center flex items-center justify-center gap-2">
            <img src="/logo-apice.png" alt="Ápice" className="h-10 w-10 rounded border border-amber-500/40 object-cover" />
            <h1 className="text-xl font-semibold">Ápice</h1>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite seu email" className="w-full input-premium" />
            </div>
            <div>
              <label className="block text-sm mb-1">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className="w-full input-premium" />
            </div>
            {error && <p className="text-rose-400 text-sm" aria-live="assertive">{error}</p>}
            <div className="flex justify-center">
              <button type="submit" disabled={loading} className="btn-premium w-full sm:w-36 justify-center">{loading ? "Entrando..." : "Entrar"}</button>
            </div>
          </form>
          <p className="mt-4 text-sm text-gray-300 text-center">
            Não tem conta? <Link to="/register" className="text-indigo-400 hover:underline">Registre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
