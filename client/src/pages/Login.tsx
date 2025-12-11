import { useState } from "react";
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
    <div className={cn(dark ? "dark" : "light", "min-h-screen")}>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md card-premium p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-semibold">FinanceFlow</h1>
            <button className="btn-secondary" onClick={() => {
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
            }}>Tema</button>
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
          <p className="mt-4 text-sm text-gray-300">
            Não tem conta? <Link to="/register" className="text-indigo-400 hover:underline">Registre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
