import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const { entrar } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(email, senha);
      nav("/");
    } catch (err: any) {
      setErro(err.message || "Falha no login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md bg-card/90 border border-border rounded-2xl p-8 shadow-xl backdrop-blur-md fade-in relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 blur-3xl" />
      <h1 className="text-2xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)))]">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-5 relative">
        <div>
          <label className="block text-xs font-medium mb-1 uppercase tracking-wide text-foreground/70" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-input bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/60 focus:bg-background transition" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 uppercase tracking-wide text-foreground/70" htmlFor="senha">Senha</label>
          <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full rounded-md border border-input bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/60 focus:bg-background transition" />
        </div>
        {erro && <p className="text-destructive text-sm">{erro}</p>}
        <button disabled={carregando} className="w-full btn-premium justify-center flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Dicas para testes: admin@agendaviva.app / admin123 | lider@central.app / lider123 | membro@jardim.app / membro123
      </div>
    </div>
  );
}
