import { useEffect, useMemo, useState } from "react";
import type { Evento, Igreja, Recurso } from "@shared/api";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export interface EventoModalProps {
  aberto: boolean;
  onFechar: () => void;
  evento?: Evento | null;
  dataInicial?: Date | null;
  onSalvo?: (ev: Evento) => void;
}

export function EventoModal({ aberto, onFechar, evento, dataInicial, onSalvo }: EventoModalProps) {
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [igrejaId, setIgrejaId] = useState<string>(usuario?.igrejaId ?? "");
  const [recursoId, setRecursoId] = useState<string>("");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);

  useEffect(() => {
    api.listarIgrejas().then(setIgrejas);
    api.listarRecursos().then(setRecursos);
  }, []);

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo || "");
      setDescricao(evento.descricao || "");
      setInicio(evento.dataHoraInicio.substring(0, 16));
      setFim(evento.dataHoraFim.substring(0, 16));
      setIgrejaId(evento.igrejaId);
      setRecursoId(evento.recursoId || "");
      setDiaInteiro(Boolean(evento.diaInteiro));
    } else {
      const base = dataInicial ?? new Date();
      const a = new Date(base);
      a.setMinutes(0, 0, 0);
      const b = new Date(a);
      b.setHours(a.getHours() + 1);
      setInicio(format(a, "yyyy-MM-dd'T'HH:mm"));
      setFim(format(b, "yyyy-MM-dd'T'HH:mm"));
      setTitulo("");
      setDescricao("");
      setIgrejaId(usuario?.igrejaId ?? "");
      setRecursoId("");
      setDiaInteiro(false);
    }
    setErro(null);
  }, [evento, dataInicial, usuario?.igrejaId]);

  const podeEditar = usuario && (usuario.perfil === "administrador" || usuario.perfil === "lider");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setSalvando(true);
    setErro(null);
    try {
      if (evento) {
        const atualizado = await api.atualizarEvento(evento.id, {
          titulo,
          descricao,
          dataHoraInicio: new Date(inicio).toISOString(),
          dataHoraFim: new Date(fim).toISOString(),
          igrejaId,
          recursoId: recursoId || null,
          diaInteiro,
        });
        onSalvo?.(atualizado);
      } else {
        const criado = await api.criarEvento({
          titulo,
          descricao,
          dataHoraInicio: new Date(inicio).toISOString(),
          dataHoraFim: new Date(fim).toISOString(),
          igrejaId,
          recursoId: recursoId || null,
          diaInteiro,
        });
        onSalvo?.(criado);
      }
      onFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAtual() {
    if (!evento) return;
    if (!confirm("Deseja excluir este evento?")) return;
    try {
      await api.removerEvento(evento.id);
      onSalvo?.({ ...evento, titulo: "" } as any);
      onFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao excluir");
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{evento ? "Editar Evento" : "Novo Evento"}</h2>
          <button onClick={onFechar} className="rounded-md px-2 py-1 text-sm hover:bg-muted">Fechar</button>
        </div>
        <form onSubmit={salvar} className="p-4 space-y-3">
          <div>
            <label className="block text-sm mb-1">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Início</label>
              <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fim</label>
              <input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Igreja</label>
              <select value={igrejaId} onChange={(e) => setIgrejaId(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="" disabled>Selecione</option>
                {igrejas.map((i) => (<option key={i.id} value={i.id}>{i.nome}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Recurso</label>
              <select value={recursoId} onChange={(e) => setRecursoId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="">Sem recurso / Espaço principal</option>
                <option value="nave-do-templo">Nave do templo</option>
                <option value="anexo">Anexo</option>
                <option value="departamento">Departamento</option>
                <option value="andar-superior">Andar superior</option>
                <option value="estacionamento">Estacionamento</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} /> Dia inteiro
          </label>
          {erro && <p className="text-destructive text-sm">{erro}</p>}
          <div className="flex items-center justify-between pt-2">
            {evento && podeEditar && <button type="button" onClick={excluirAtual} className="rounded-md px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90">Excluir</button>}
            <div className="grow" />
            <button disabled={!podeEditar} className="rounded-md px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
