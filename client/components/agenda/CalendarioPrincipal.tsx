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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [modalAniversario, setModalAniversario] = useState(false);
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
    // Recarregar aniversários também
    const mes = intervalo.inicio.getMonth() + 1;
    api.aniversariosPorMes(mes).then(setAniversariosMes);
  }

  function hexToRgb(hex: string) {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c)=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return { r, g, b };
  }

  async function exportarCalendarioMensal() {
    const pdf = new jsPDF("l", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margem = 12;

    // Título
    pdf.setFontSize(18);
    const titulo = `Calendário • ${format(intervalo.inicio, "MMMM 'de' yyyy", { locale: ptBR })}`;
    pdf.text(titulo, margem, 18);

    // Área do calendário
    const headerH = 10;
    const legendaH = 36; // espaço para legenda e resumo
    const gridH = pageHeight - margem - legendaH - 24; // 24 espaço pós título
    const gridTop = 24;
    const gridLeft = margem;
    const colW = (pageWidth - margem * 2) / 7;
    const rowH = gridH / 6;

    // Cabeçalho dos dias
    pdf.setFillColor(245, 247, 250);
    pdf.setDrawColor(224);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let c = 0; c < 7; c++) {
      const x = gridLeft + c * colW;
      pdf.rect(x, gridTop, colW, headerH, 'F');
      pdf.setFontSize(11);
      pdf.text(dias[c], x + 2, gridTop + 7);
    }

    // Datas
    const inicioMes = startOfMonth(intervalo.inicio);
    const inicioGrade = startOfWeek(inicioMes, { weekStartsOn: 0 });
    const diasNoGrid = 42; // 6x7

    pdf.setFontSize(9);

    for (let i = 0; i < diasNoGrid; i++) {
      const data = new Date(inicioGrade.getTime());
      data.setDate(inicioGrade.getDate() + i);
      const r = Math.floor(i / 7);
      const c = i % 7;
      const x = gridLeft + c * colW;
      const y = gridTop + headerH + r * rowH;

      // célula
      pdf.setDrawColor(230);
      pdf.rect(x, y, colW, rowH);

      const inMonth = data.getMonth() === inicioMes.getMonth();
      pdf.setTextColor(inMonth ? 20 : 160);
      pdf.text(String(data.getDate()).padStart(2, '0'), x + colW - 6, y + 5, { align: 'right' as const });

      // Itens do dia (eventos e aniversários)
      const iniDia = new Date(data); iniDia.setHours(0,0,0,0);
      const fimDia = new Date(data); fimDia.setHours(23,59,59,999);
      const evs = eventos.filter((e) => new Date(e.dataHoraInicio) < fimDia && new Date(e.dataHoraFim) > iniDia);
      const bds = aniversariosMes.filter((a) => a.dia === data.getDate() && a.mes === (data.getMonth()+1));
      const itens: Array<{ tipo: 'ev'|'bd'; texto: string; cor?: {r:number;g:number;b:number} }> = [];
      for (const ev of evs) {
        const cor = igrejas.find((i)=> i.id === ev.igrejaId)?.codigoCor || '#16a34a';
        const { r: rr, g, b } = hexToRgb(cor);
        const hora = format(new Date(ev.dataHoraInicio), 'HH:mm');
        itens.push({ tipo: 'ev', texto: `${hora} ${ev.titulo}`, cor: { r: rr, g, b } });
      }
      for (const bd of bds) {
        itens.push({ tipo: 'bd', texto: `🎂 ${bd.nome}` });
      }

      let ey = y + 10;
      pdf.setFontSize(7.5);
      for (const it of itens.slice(0, 4)) { // máx 4 por célula
        if (it.tipo === 'ev' && it.cor) {
          pdf.setFillColor(it.cor.r, it.cor.g, it.cor.b);
          pdf.circle(x + 3.5, ey - 2.2, 1.5, 'F');
          const lines = pdf.splitTextToSize(it.texto, colW - 10);
          pdf.setTextColor(40);
          pdf.text(lines, x + 7, ey);
          ey += Math.min(lines.length, 2) * 4;
        } else {
          const lines = pdf.splitTextToSize(it.texto, colW - 6);
          pdf.setTextColor(40);
          pdf.text(lines, x + 4, ey);
          ey += 4;
        }
        if (ey > y + rowH - 4) break;
      }
      if (itens.length > 4) {
        pdf.setTextColor(120);
        pdf.text(`+${itens.length - 4} mais`, x + 7, y + rowH - 3);
      }
    }

    // Legenda
    let legendY = gridTop + headerH + 6 * rowH + 8;
    pdf.setFontSize(12);
    pdf.setTextColor(20);
    pdf.text('Legenda', margem, legendY);
    legendY += 6;
    pdf.setFontSize(10);
    for (const ig of igrejas.slice(0, 8)) {
      const { r, g, b } = hexToRgb(ig.codigoCor || '#16a34a');
      pdf.setFillColor(r, g, b);
      pdf.rect(margem, legendY - 4, 4, 4, 'F');
      pdf.setTextColor(50);
      pdf.text(ig.nome, margem + 8, legendY);
      legendY += 6;
    }

    // Resumo
    let y = legendY + 4;
    pdf.setFontSize(12);
    pdf.setTextColor(20);
    pdf.text('Resumo do mês', margem, y);
    y += 6;
    pdf.setFontSize(10);
    const ordenados = [...eventos].sort((a,b)=> new Date(a.dataHoraInicio).getTime()-new Date(b.dataHoraInicio).getTime());
    for (const ev of ordenados) {
      const dataTxt = format(new Date(ev.dataHoraInicio), 'dd/MM HH:mm');
      const linha = `${dataTxt} – ${ev.titulo}${ev.descricao ? `: ${ev.descricao}` : ''}`;
      const linhas = pdf.splitTextToSize(linha, pageWidth - margem*2);
      if (y + linhas.length * 5 > pageHeight - margem) { pdf.addPage(); y = margem; }
      pdf.setTextColor(60);
      pdf.text(linhas, margem, y);
      y += linhas.length * 5 + 2;
    }

    pdf.save('calendario-mensal.pdf');
  }

  async function exportarResumoAnual() {
    const ano = new Date().getFullYear();
    const eventosAno: Evento[] = [];
    const aniversariosMapa: Record<number, { dia: number; nomes: string[] }[]> = {};

    for (let m = 0; m < 12; m++) {
      const ini = new Date(ano, m, 1);
      const fim = endOfMonth(ini);
      const parte = await api.listarEventos(ini.toISOString(), fim.toISOString());
      eventosAno.push(...parte);
      const bds = await api.aniversariosPorMes(m + 1);
      const porDia = new Map<number, string[]>();
      for (const b of bds) {
        porDia.set(b.dia, [...(porDia.get(b.dia) || []), b.nome]);
      }
      aniversariosMapa[m + 1] = Array.from(porDia.entries()).map(([dia, nomes]) => ({ dia, nomes: nomes.sort() })).sort((a,b)=>a.dia-b.dia);
    }

    const porData = new Map<string, { data: Date; qtdEventos: number; qtdBds: number }>();
    for (const e of eventosAno) {
      const d = new Date(e.dataHoraInicio);
      const chave = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);
      const item = porData.get(chave) || { data: new Date(d.getFullYear(), d.getMonth(), d.getDate()), qtdEventos: 0, qtdBds: 0 };
      item.qtdEventos += 1;
      porData.set(chave, item);
    }
    for (let m = 1; m <= 12; m++) {
      for (const b of aniversariosMapa[m] || []) {
        const chave = new Date(ano, m-1, b.dia).toISOString().slice(0,10);
        const item = porData.get(chave) || { data: new Date(ano, m-1, b.dia), qtdEventos: 0, qtdBds: 0 };
        item.qtdBds += b.nomes.length;
        porData.set(chave, item);
      }
    }

    const linhas = Array.from(porData.values())
      .sort((a,b)=>a.data.getTime()-b.data.getTime())
      .map(({ data, qtdEventos, qtdBds }) => [
        format(data, "dd/MM/yyyy"),
        String(qtdBds),
        String(qtdEventos)
      ]);

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFontSize(16);
    pdf.text(`Resumo Anual ${ano} — Datas com eventos e aniversários`, 14, 16);
    (pdf as any).autoTable({
      startY: 22,
      head: [["Data", "Aniversários", "Eventos"]],
      body: linhas,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [24, 100, 171], textColor: 255 },
      theme: 'grid',
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
      margin: { left: 14, right: 14 }
    });
    pdf.save("resumo-anual.pdf");
  }

  async function exportarCalendarioAniversariosPDF() {
    const pdf = new jsPDF("l", "mm", "a4");
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margem = 10;

    pdf.setFontSize(18);
    pdf.text("Calendário de Aniversários", margem, 16);

    // Grid 3x4 de meses
    const cols = 3, rows = 4;
    const cellW = (W - margem * 2 - (cols - 1) * 6) / cols;
    const cellH = (H - 22 - margem - (rows - 1) * 6) / rows; // 22 título

    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    for (let m = 0; m < 12; m++) {
      const r = Math.floor(m / cols);
      const c = m % cols;
      const x = margem + c * (cellW + 6);
      const y = 20 + r * (cellH + 6);

      // Caixa do mês
      pdf.setDrawColor(220);
      pdf.rect(x, y, cellW, cellH);
      pdf.setFontSize(12);
      pdf.text(nomesMeses[m], x + 4, y + 7);

      // Buscar aniversários do mês
      // Usa cache se já tiver em estado anual, senão busca da API
      let lista = aniversariosAno[m+1];
      if (!lista || lista.length === 0) {
        try { lista = await api.aniversariosPorMes(m + 1); } catch { lista = []; }
      }
      const porDia = new Map<number, string[]>();
      for (const a of (lista || [])) {
        porDia.set(a.dia, [...(porDia.get(a.dia) || []), a.nome]);
      }
      const dias = Array.from(porDia.entries()).sort((a,b)=>a[0]-b[0]);

      // Conteúdo: "DD: Nome, Nome"
      pdf.setFontSize(9);
      let yy = y + 12;
      for (const [dia, nomes] of dias) {
        const linha = `${String(dia).padStart(2,'0')}: ${nomes.sort().join(', ')}`;
        const linhas = pdf.splitTextToSize(linha, cellW - 8);
        for (const l of linhas) {
          if (yy > y + cellH - 4) { break; }
          pdf.text(l, x + 4, yy);
          yy += 4;
        }
        if (yy > y + cellH - 4) break;
      }
    }

    pdf.save("calendario-aniversarios.pdf");
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
          <button onClick={exportarCalendarioMensal} className="btn-premium">Exportar Calendário do Mês</button>
          <button onClick={exportarResumoAnual} className="btn-premium">Exportar Resumo Anual</button>
          <button onClick={exportarCalendarioAniversariosPDF} className="btn-premium">Exportar Aniversários (PDF)</button>
          {(usuario?.perfil === "administrador") && (
            <button onClick={() => setModalIgreja(true)} className="btn-premium">Nova Igreja</button>
          )}
          {(usuario?.perfil === "administrador" || usuario?.perfil === "lider") && (
            <>
              <button onClick={() => abrirCriacaoNaData(new Date())} className="btn-premium">Adicionar Atividade</button>
              <button onClick={() => setModalAniversario(true)} className="btn-premium">Adicionar Aniversário</button>
            </>
          )}
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
          <LegendaIgrejas igrejas={igrejas} />
        </div>
      </div>

      <EventoModal aberto={modalAberto} onFechar={() => setModalAberto(false)} evento={eventoSelecionado} dataInicial={dataInicialModal ?? undefined} onSalvo={aoSalvar} />
      <IgrejaModal aberto={modalIgreja} onFechar={() => setModalIgreja(false)} onCriada={() => api.listarIgrejas().then(setIgrejas)} />
      <AniversarioModal aberto={modalAniversario} onFechar={() => setModalAniversario(false)} onSalvo={aoSalvar} />
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
              <span className="mt-1">🎂</span>
              <div className="text-[11px]">
                <div className="font-semibold truncate pr-2">Aniversário de {res.nome}</div>
                <div className="opacity-90">dia inteiro</div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm font-medium mb-1">🎂 Aniversário</div>
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative group cursor-pointer">
          <div className="flex items-start gap-1.5 leading-tight transition-transform duration-200 group-hover:scale-[1.02]">
            <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
            <div className="text-[11px]">
              <div className="font-semibold truncate pr-2">{ev.titulo}</div>
              <div className="opacity-90">{horaIni}–{horaFim}</div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="text-sm font-medium mb-1" style={{ color: cor }}>{ev.titulo}</div>
        <div className="text-xs text-muted-foreground mb-1">{horaIni}–{horaFim}{ev.diaInteiro ? ' • dia inteiro' : ''}</div>
        {igreja?.nome && <div className="text-xs">Igreja: {igreja.nome}</div>}
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

function LegendaIgrejas({ igrejas }: { igrejas: Igreja[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-lg ring-1 ring-black/5">
      <h3 className="font-medium mb-2">Legenda</h3>
      <ul className="space-y-2 text-sm">
        {igrejas.map((i) => (
          <li key={i.id} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: i.codigoCor || "#16a34a" }} />
            <span>{i.nome}</span>
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
                    {doDiaEventos.map((ev) => (
                      <li key={ev.id}>
                        <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ backgroundColor: igrejas.find((i)=> i.id === ev.igrejaId)?.codigoCor || '#16a34a' }} />
                        {format(new Date(ev.dataHoraInicio),'HH:mm')} – {ev.titulo}
                      </li>
                    ))}
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
