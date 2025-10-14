import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { api } from "@/lib/api";
import type { Evento, Igreja, AniversarianteOcorrencia } from "@shared/api";
import { useAuth } from "@/hooks/use-auth";
import { EventoModal } from "./EventoModal";
import { IgrejaModal } from "./IgrejaModal";
import { AniversarioModal } from "./AniversarioModal";
import { LembretesAniversarios } from "./LembretesAniversarios";
import { ExportarCalendarioPDF } from "./ExportarCalendarioPDF";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDown } from "lucide-react";

type EventResource = { kind: 'evento'; data: Evento } | { kind: 'aniversario'; nome: string };

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function CalendarioPrincipal() {
  const { usuario } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [dataInicialModal, setDataInicialModal] = useState<Date | null>(null);
  const [intervalo, setIntervalo] = useState<{ inicio: Date; fim: Date }>(() => {
    const hoje = new Date();
    return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) } as any;
  });
  const [modalIgreja, setModalIgreja] = useState(false);
  const [igrejaEdicao, setIgrejaEdicao] = useState<Igreja | null>(null);
  const [modalAniversario, setModalAniversario] = useState(false);
  const [modalExportarPDF, setModalExportarPDF] = useState(false);
  const [modo, setModo] = useState<"mes" | "anual">("mes");
  const [anoVisao, setAnoVisao] = useState<number>(new Date().getFullYear());
  const [mostrarApenasAniversarios, setMostrarApenasAniversarios] = useState(false);
  const [aniversariosMes, setAniversariosMes] = useState<AniversarianteOcorrencia[]>([]);
  const [aniversariosAno, setAniversariosAno] = useState<Record<number, AniversarianteOcorrencia[]>>({});

  const calendarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listarIgrejas().then((igs) => {
      // Filtra igrejas de exemplo
      setIgrejas(igs.filter(i => i.nome !== "Igreja Central" && i.nome !== "Igreja Jardim"));
    });
  }, []);

  async function carregarEventos(i?: Date, f?: Date) {
    const ini = (i ?? intervalo.inicio).toISOString();
    const fim = (f ?? intervalo.fim).toISOString();
    const dados = await api.listarEventos(ini, fim);
    // Filtra eventos de exemplo
    setEventos(dados.filter(e => e.titulo !== "Culto de Domingo" && e.titulo !== "Ensaio Louvor"));
  }

  useEffect(() => { carregarEventos(); }, [intervalo.inicio.getTime(), intervalo.fim.getTime()]);

  // Aniversários do mês atual
  useEffect(() => {
    const mes = intervalo.inicio.getMonth() + 1;
    api.aniversariosPorMes(mes).then(setAniversariosMes);
  }, [intervalo.inicio.getTime()]);

  // Carregar aniversários de todos os meses quando estiver na visão anual
  useEffect(() => {
    if (modo !== 'anual') return;
    (async () => {
      const mapa: Record<number, AniversarianteOcorrencia[]> = {};
      for (let m = 1; m <= 12; m++) {
        mapa[m] = await api.aniversariosPorMes(m);
      }
      setAniversariosAno(mapa);
    })();
  }, [modo]);

  const eventosRbcEventos = useMemo(() => eventos.map((e) => ({
    id: e.id,
    // evitar tooltip nativo do browser: não definir title aqui
    title: undefined,
    start: new Date(e.dataHoraInicio),
    end: new Date(e.dataHoraFim),
    allDay: Boolean(e.diaInteiro),
    resource: { kind: 'evento', data: e } as EventResource,
  })), [eventos]);

  const eventosRbcAniversarios = useMemo(() => {
    const anoAtual = intervalo.inicio.getFullYear();
    return aniversariosMes.map((a) => ({
      id: `bday-${a.id}-${anoAtual}-${a.mes}-${a.dia}`,
      title: undefined,
      start: new Date(anoAtual, a.mes - 1, a.dia, 0, 0, 0),
      end: new Date(anoAtual, a.mes - 1, a.dia, 23, 59, 59, 999),
      allDay: true,
      resource: { kind: 'aniversario', nome: a.nome } as EventResource,
    }));
  }, [aniversariosMes, intervalo.inicio]);

  const eventosRbc = useMemo(() => {
    if (mostrarApenasAniversarios) return eventosRbcAniversarios;
    return [...eventosRbcEventos, ...eventosRbcAniversarios];
  }, [mostrarApenasAniversarios, eventosRbcEventos, eventosRbcAniversarios]);

  const maxEventosEmUmDia = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const e of eventos) {
      const d = startOfDay(new Date(e.dataHoraInicio));
      const chave = d.toISOString().slice(0, 10);
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    }
    let max = 0; mapa.forEach((v) => { if (v > max) max = v; });
    return max;
  }, [eventos]);

  const estilosEvento = (event: any) => {
    const res: EventResource = event.resource;
    if (res.kind === 'aniversario') {
      return { style: { backgroundColor: '#f97316', borderRadius: 12, color: "white", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 8px 24px rgba(0,0,0,.15)" } };
    }
    const ev = res.data;
    const igreja = igrejas.find((i) => i.id === ev.igrejaId);
    const cor = igreja?.codigoCor || "#16a34a";
    return { style: { backgroundColor: cor, backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,.18), rgba(0,0,0,.06))", borderRadius: 12, color: "white", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 8px 24px rgba(0,0,0,.15)" } };
  };

  function abrirCriacaoNaData(date: Date) {
    setEventoSelecionado(null);
    setDataInicialModal(date);
    setModalAberto(true);
  }

  function onSelectEventRbc(ev: any) {
    const res: EventResource = ev.resource;
    if (res.kind === 'evento') {
      setEventoSelecionado(res.data);
      setDataInicialModal(null);
      setModalAberto(true);
    }
  }

  async function aoSalvar() {
    await carregarEventos();
    // Recarregar aniversários do mês
    const mes = intervalo.inicio.getMonth() + 1;
    api.aniversariosPorMes(mes).then(setAniversariosMes);
    // Se estiver na visão anual, recarregar todos os meses
    if (modo === 'anual') {
      const mapa: Record<number, AniversarianteOcorrencia[]> = {};
      for (let m = 1; m <= 12; m++) {
        // eslint-disable-next-line no-await-in-loop
        mapa[m] = await api.aniversariosPorMes(m);
      }
      setAniversariosAno(mapa);
    }
  }

  const tituloMes = format(intervalo.inicio, "MMMM 'de' yyyy", { locale: ptBR });
  const rotuloCentro = modo === 'mes' ? format(intervalo.inicio, "MMMM yyyy", { locale: ptBR }) : String(anoVisao);
  const titulo = modo === "mes" ? tituloMes : `Ano ${anoVisao}`;

  // Navegação dos botões: apenas atualiza o estado, o useEffect já carrega os eventos
  function irHoje() {
    if (modo === 'mes') {
      const hoje = new Date();
      setIntervalo({ inicio: startOfMonth(hoje), fim: endOfMonth(hoje) });
    } else {
      setAnoVisao(new Date().getFullYear());
    }
  }
  function irAnterior() {
    if (modo === 'mes') {
      const novo = addMonths(intervalo.inicio, -1);
      setIntervalo({ inicio: startOfMonth(novo), fim: endOfMonth(novo) });
    } else {
      setAnoVisao(a => a - 1);
    }
  }
  function irProximo() {
    if (modo === 'mes') {
      const novo = addMonths(intervalo.inicio, 1);
      setIntervalo({ inicio: startOfMonth(novo), fim: endOfMonth(novo) });
    } else {
      setAnoVisao(a => a + 1);
    }
  }

  return (
  <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setModalExportarPDF(true)} className="btn-premium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <FileDown className="h-4 w-4 mr-2 inline" />
            Exportar PDF
          </button>
          <button onClick={() => setModalIgreja(true)} className="btn-premium">Nova Igreja</button>
          <>
            <button onClick={() => abrirCriacaoNaData(new Date())} className="btn-premium">Adicionar Atividade</button>
            <button onClick={() => setModalAniversario(true)} className="btn-premium">Adicionar Aniversário</button>
          </>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div ref={calendarioRef} className="gradient-border rounded-2xl bg-card/85 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-md overflow-hidden transition-colors">
            <div className="flex items-center gap-4 px-2 pb-3">
              <div className="btn-nav-cal-group">
                <button onClick={irHoje} className="btn-nav-cal" aria-label="Ir para hoje">Hoje</button>
                <button onClick={irAnterior} className="btn-nav-cal" aria-label="Anterior">Anterior</button>
                <button onClick={irProximo} className="btn-nav-cal" aria-label="Próximo">Próximo</button>
              </div>
              <h2 className="flex-1 text-center text-lg font-semibold capitalize tracking-tight">{rotuloCentro}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setModo('mes')} className={`px-3 py-1.5 rounded-md text-sm border transition ${modo==='mes' ? 'bg-primary text-primary-foreground border-primary/50 shadow' : 'bg-secondary hover:bg-secondary/80 border-border'}`}>Mês</button>
                <button onClick={() => setModo('anual')} className={`px-3 py-1.5 rounded-md text-sm border transition ${modo==='anual' ? 'bg-primary text-primary-foreground border-primary/50 shadow' : 'bg-secondary hover:bg-secondary/80 border-border'}`}>Anual</button>
              </div>
            </div>
            {modo === 'mes' ? (
              <Calendar
                key={intervalo.inicio.toISOString() + intervalo.fim.toISOString()}
                date={intervalo.inicio}
                localizer={localizer}
                culture="pt-BR"
                events={eventosRbc}
                startAccessor="start"
                endAccessor="end"
                style={{ minHeight: 680 + Math.max(0, maxEventosEmUmDia - 2) * 48 }}
                views={[Views.MONTH]}
                messages={{ month: "Mês", week: "Semana", day: "Dia", today: "Hoje", previous: "Anterior", next: "Próximo", noEventsInRange: "Sem eventos" }}
                toolbar={false}
                onNavigate={(date) => {
                  const ini = startOfMonth(date);
                  const fim = endOfMonth(date);
                  setIntervalo({ inicio: ini, fim });
                }}
                selectable
                onSelectSlot={(slot) => abrirCriacaoNaData(slot.start)}
                onSelectEvent={onSelectEventRbc}
                eventPropGetter={estilosEvento}
                dayPropGetter={() => ({ className: "agv-day shadow-inner-day transition-all" })}
                showAllEvents
                components={{
                  event: ({ event }: any) => <ItemCalendario event={event} igrejas={igrejas} />, 
                }}
              />
            ) : (
              <CalendarioAnual ano={anoVisao} eventos={eventos} igrejas={igrejas} aniversariosAno={aniversariosAno} mostrarApenasAniversarios={mostrarApenasAniversarios} onClickDia={abrirCriacaoNaData} />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <LembretesAniversarios />
          <AniversariantesWidget listaMes={aniversariosMes} mostrarApenasAniversarios={mostrarApenasAniversarios} onToggle={() => setMostrarApenasAniversarios(v=>!v)} />
          <Igrejas 
            igrejas={igrejas} 
            onRecarregar={() => api.listarIgrejas().then(setIgrejas)}
            podeEditar={true}
            onEditarIgreja={(igreja) => {
              console.log('[DEBUG] CalendarioPrincipal - editando igreja:', igreja);
              setIgrejaEdicao(igreja);
              setModalIgreja(true);
            }}
          />
        </div>
      </div>

      <EventoModal aberto={modalAberto} onFechar={() => setModalAberto(false)} evento={eventoSelecionado} dataInicial={dataInicialModal ?? undefined} onSalvo={aoSalvar} />
      <IgrejaModal 
        aberto={modalIgreja} 
        onFechar={() => {
          setModalIgreja(false);
          setIgrejaEdicao(null);
        }} 
        onCriada={() => api.listarIgrejas().then(setIgrejas)} 
        igreja={igrejaEdicao}
      />
      <AniversarioModal aberto={modalAniversario} onFechar={() => setModalAniversario(false)} onSalvo={aoSalvar} />
      <ExportarCalendarioPDF 
        aberto={modalExportarPDF} 
        onFechar={() => setModalExportarPDF(false)} 
        igrejas={igrejas}
      />
    </div>
  );
}

function ItemCalendario({ event, igrejas }: { event: any; igrejas: Igreja[] }) {
  const res: EventResource = event.resource;
  if (res.kind === 'aniversario') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-pointer">
            <div className="flex items-start gap-1.5 leading-tight">
              <div className="text-[11px]">
                <div className="font-semibold truncate pr-2">Aniversário de {res.nome}</div>
                <div className="opacity-90">dia inteiro</div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm font-medium mb-1">Aniversário</div>
          <div className="text-xs text-muted-foreground">{res.nome}</div>
        </TooltipContent>
      </Tooltip>
    );
  }
  const ev = res.data;
  const igreja = igrejas.find((i) => i.id === ev.igrejaId);
  const cor = igreja?.codigoCor || '#16a34a';
  const horaIni = format(new Date(ev.dataHoraInicio), 'HH:mm');
  const horaFim = format(new Date(ev.dataHoraFim), 'HH:mm');
  const horarioComIgreja = igreja?.nome ? `${horaIni}–${horaFim} - ${igreja.nome}` : `${horaIni}–${horaFim}`;
  
  // Buscar departamento ou órgão vinculado
  const departamento = ev.departamentoId && igreja?.departamentos?.find(d => d.id === ev.departamentoId);
  const orgao = ev.orgaoId && igreja?.orgaos?.find(o => o.id === ev.orgaoId);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative group cursor-pointer">
          <div className="flex items-start gap-1.5 leading-tight transition-transform duration-200 group-hover:scale-[1.02]">
            <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
            <div className="text-[11px]">
              <div className="font-semibold truncate pr-2">{ev.titulo}</div>
              <div className="opacity-90">{horarioComIgreja}</div>
              {(departamento || orgao) && (
                <div className="opacity-75 text-[10px] truncate">
                  {departamento ? `${departamento.nome}` : `${orgao!.nome}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
  <div className="text-sm font-medium mb-1" style={{ color: cor }}>{ev.titulo}</div>
  <div className="text-xs text-muted-foreground mb-1">{horarioComIgreja}{ev.diaInteiro ? ' • dia inteiro' : ''}</div>
        {igreja?.nome && <div className="text-xs">Igreja: {igreja.nome}</div>}
  {departamento && <div className="text-xs">Departamento: {departamento.nome}</div>}
  {orgao && <div className="text-xs">Órgão: {orgao.nome}</div>}
        {ev.descricao && <div className="mt-1 text-xs leading-snug">{ev.descricao}</div>}
      </TooltipContent>
    </Tooltip>
  );
}

function AniversariantesWidget({ listaMes, mostrarApenasAniversarios, onToggle }: { listaMes: { id: string; nome: string; dia: number; mes: number }[]; mostrarApenasAniversarios: boolean; onToggle: () => void; }) {
  const mesRef = listaMes[0]?.mes ?? (new Date().getMonth()+1);
  const mesNome = format(new Date(2000, mesRef - 1, 1), 'MMMM', { locale: ptBR });
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onToggle} className={`font-medium ${mostrarApenasAniversarios ? 'text-primary' : ''}`}>Aniversariantes do mês</button>
        <span className="text-xs text-muted-foreground capitalize">{mesNome}</span>
      </div>
      {listaMes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aniversariante neste mês.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {listaMes.sort((a,b)=>a.dia-b.dia).slice(0, 5).map((a) => (<li key={`${a.id}-${a.dia}`}>🎉 {String(a.dia).padStart(2,'0')}/{String(a.mes).padStart(2,'0')} — {a.nome}</li>))}
          {listaMes.length > 5 && (
            <li className="text-xs text-muted-foreground">
              +{listaMes.length - 5} aniversariantes...
            </li>
          )}
        </ul>
      )}
      <div className="mt-3 space-y-2">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={mostrarApenasAniversarios} onChange={onToggle} />
          Mostrar apenas aniversários
        </label>
        {listaMes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <a 
              href="/gerenciar-aniversarios" 
              className="text-xs text-primary hover:underline"
            >
              Ver todos os aniversariantes →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Igrejas({ igrejas, onRecarregar, podeEditar, onEditarIgreja }: { 
  igrejas: Igreja[];
  onRecarregar?: () => void;
  podeEditar?: boolean;
  onEditarIgreja?: (igreja: Igreja) => void;
}) {
  async function editarIgreja(igreja: Igreja) {
    if (!podeEditar) return;
    if (onEditarIgreja) {
      onEditarIgreja(igreja);
    } else {
      const novoNome = prompt("Novo nome da igreja:", igreja.nome);
      if (!novoNome || novoNome === igreja.nome) return;
      
      try {
        await api.atualizarIgreja(igreja.id, { nome: novoNome });
        onRecarregar?.();
      } catch (err: any) {
        alert("Erro ao atualizar igreja: " + err.message);
      }
    }
  }

  async function excluirIgreja(igreja: Igreja) {
    if (!podeEditar) return;
    if (!confirm(`Deseja excluir a igreja "${igreja.nome}"?`)) return;
    
    try {
      await api.removerIgreja(igreja.id);
      onRecarregar?.();
    } catch (err: any) {
      alert("Erro ao excluir igreja: " + err.message);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-lg ring-1 ring-black/5">
  <h3 className="font-medium mb-2">Igrejas</h3>
      <ul className="space-y-2 text-sm">
        {igrejas.map((i) => (
          <li key={i.id} className="flex items-center gap-2 group">
            <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: i.codigoCor || "#16a34a" }} />
            <span className="flex-1">{i.nome}</span>
            {podeEditar && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => editarIgreja(i)}
                  className="p-1 rounded hover:bg-muted text-xs"
                  title="Editar igreja"
                >
                  ✏️
                </button>
                <button
                  onClick={() => excluirIgreja(i)}
                  className="p-1 rounded hover:bg-muted text-xs"
                  title="Excluir igreja"
                >
                  🗑️
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarioAnual({ ano, eventos, igrejas, aniversariosAno, mostrarApenasAniversarios, onClickDia }: { ano: number; eventos: Evento[]; igrejas: Igreja[]; aniversariosAno: Record<number, AniversarianteOcorrencia[]>; mostrarApenasAniversarios: boolean; onClickDia: (d: Date) => void }) {
  const meses = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {meses.map((m) => (
        <MiniMes
          key={m}
          ano={ano}
          mes={m}
          eventos={eventos}
          igrejas={igrejas}
          aniversarios={(aniversariosAno[m+1] ?? [])}
          mostrarApenasAniversarios={mostrarApenasAniversarios}
          onClickDia={onClickDia}
        />
      ))}
    </div>
  );
}

function MiniMes({ ano, mes, eventos, igrejas, aniversarios, mostrarApenasAniversarios, onClickDia }: { ano: number; mes: number; eventos: Evento[]; igrejas: Igreja[]; aniversarios: AniversarianteOcorrencia[]; mostrarApenasAniversarios: boolean; onClickDia: (d: Date) => void }) {
  const primeiro = startOfMonth(new Date(ano, mes, 1));
  const inicio = startOfWeek(primeiro, { weekStartsOn: 0 });
  const dias: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio); d.setDate(inicio.getDate() + i); dias.push(d);
  }
  const titulo = format(primeiro, "MMMM", { locale: ptBR });
  const nomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return (
    <div className="rounded-xl border border-border bg-card/80 p-3 shadow ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium capitalize">{titulo}</div>
      </div>
      <div className="grid grid-cols-7 text-[11px] text-muted-foreground mb-1">
        {nomes.map((n) => (<div key={n} className="text-center">{n}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {dias.map((d, i) => {
          const inMonth = d.getMonth() === mes;
          const doDiaEventos = eventos.filter((e) => new Date(e.dataHoraInicio) < endOfDay(d) && new Date(e.dataHoraFim) > startOfDay(d));
          const nb = aniversarios.filter((a)=> a.dia === d.getDate()).length;
          const items: ('ev'|'bd')[] = mostrarApenasAniversarios ? Array(nb).fill('bd') : [...doDiaEventos.map(()=> 'ev'), ...Array(nb).fill('bd')];
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button onClick={() => onClickDia(d)} className={`relative h-16 rounded-md p-1 text-left transition ${inMonth ? 'bg-background hover:bg-muted/60' : 'bg-muted/40 text-muted-foreground'}`}>
                  <span className="absolute top-1 right-1 text-[10px] opacity-70">{d.getDate()}</span>
                  <div className="mt-4 space-y-0.5 overflow-hidden">
                    {items.slice(0,3).map((tipo, idx) => {
                      if (tipo === 'ev') {
                        const ev = doDiaEventos[idx] || doDiaEventos[doDiaEventos.length-1];
                        const cor = ev ? (igrejas.find((i)=> i.id === ev.igrejaId)?.codigoCor || '#16a34a') : '#16a34a';
                        return <div key={`ev-${idx}`} className="h-1.5 rounded-full" style={{ backgroundColor: cor }} />;
                      }
                      return <div key={`bd-${idx}`} className="h-1.5 rounded-full" style={{ backgroundColor: '#f97316' }} />;
                    })}
                    {items.length > 3 && <div className="text-[10px] opacity-70">+{items.length-3}</div>}
                  </div>
                </button>
              </TooltipTrigger>
              {(doDiaEventos.length > 0 || nb > 0) && (
                <TooltipContent className="max-w-xs">
                  <div className="text-xs font-medium mb-1">{format(d,'dd/MM')}</div>
                  <ul className="text-xs space-y-1">
                    {doDiaEventos.map((ev) => {
                      const igr = igrejas.find((i)=> i.id === ev.igrejaId);
                      const dep = ev.departamentoId && igr?.departamentos?.find(d => d.id === ev.departamentoId);
                      const org = ev.orgaoId && igr?.orgaos?.find(o => o.id === ev.orgaoId);
                      return (
                        <li key={ev.id}>
                          <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ backgroundColor: igr?.codigoCor || '#16a34a' }} />
                          {format(new Date(ev.dataHoraInicio),'HH:mm')} – {ev.titulo}
                          {(dep || org) && <span className="text-[10px] opacity-70"> • {dep ? dep.nome : org!.nome}</span>}
                        </li>
                      );
                    })}
                    {nb > 0 && (
                      <li>
                        <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ backgroundColor: '#f97316' }} />
                        {nb} aniversário(s)
                      </li>
                    )}
                  </ul>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
