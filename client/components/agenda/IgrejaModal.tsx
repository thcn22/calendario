import { useState } from "react";
import type { Igreja } from "@shared/api";
import { api } from "@/lib/api";

export function IgrejaModal({ aberto, onFechar, onCriada }: { aberto: boolean; onFechar: () => void; onCriada?: (i: Igreja) => void }) {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [codigoCor, setCodigoCor] = useState("#16a34a");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const novo = await api.criarIgreja({ nome, endereco, codigoCor });
      onCriada?.(novo);
      onFechar();
      setNome(""); setEndereco("");
    } catch (err: any) {
      setErro(err.message || "Erro ao criar igreja");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Nova Igreja</h2>
          <button onClick={onFechar} className="rounded-md px-2 py-1 text-sm hover:bg-muted">Fechar</button>
        </div>
        <form onSubmit={salvar} className="p-4 space-y-3">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="grow">
              <label className="block text-sm mb-1">Cor</label>
              <input value={codigoCor} onChange={(e) => setCodigoCor(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <input type="color" value={codigoCor} onChange={(e) => setCodigoCor(e.target.value)} className="h-10 w-16 rounded-md border border-input" />
          </div>
          {erro && <p className="text-destructive text-sm">{erro}</p>}
          <div className="flex justify-end">
            <button disabled={salvando} className="rounded-md px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
