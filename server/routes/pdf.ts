import { RequestHandler } from "express";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface para os parâmetros de geração do PDF
interface GerarPDFRequest {
  tipo: "mensal" | "anual";
  formato: "lista" | "calendario";
  mes?: number;
  ano: number;
  eventos: any[];
  aniversarios: any[];
  igrejas: any[];
  filtros?: {
    igrejas?: string[];
    departamentos?: string[];
    orgaos?: string[];
  };
}

export const gerarPDFCalendario: RequestHandler = async (req, res) => {
  try {
    const dados: GerarPDFRequest = req.body;

    if (!dados || !dados.tipo || !dados.formato) {
      return res.status(400).json({ erro: "Dados inválidos para geração do PDF" });
    }

    const html = dados.formato === "lista"
      ? gerarHTMLLista(dados)
      : gerarHTMLCalendario(dados);

    // Retornar HTML para o cliente processar
    const nomeArquivo = `calendario_${dados.tipo}_${dados.ano}${dados.tipo === "mensal" ? `_${String(dados.mes).padStart(2, "0")}` : ""}.html`;

    res.setHeader("Content-Type", "application/json");
    res.json({ html, nomeArquivo });
  } catch (erro: any) {
    console.error("Erro ao gerar PDF:", erro);
    res.status(500).json({ erro: "Erro ao gerar PDF: " + erro.message });
  }
};

function gerarHTMLLista(dados: GerarPDFRequest): string {
  const { tipo, mes, ano, eventos, aniversarios, igrejas } = dados;
  const titulo =
    tipo === "mensal"
      ? `Agenda ${format(new Date(ano, (mes || 1) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })}`
      : `Agenda Anual ${ano}`;

  const eventosHTML = eventos
    .map((e) => {
      const igreja = igrejas.find((i: any) => i.id === e.igrejaId);
      const dep = e.departamentoId && igreja?.departamentos?.find((d: any) => d.id === e.departamentoId);
      const org = e.orgaoId && igreja?.orgaos?.find((o: any) => o.id === e.orgaoId);

      return `
      <tr>
        <td>${format(new Date(e.dataHoraInicio), "dd/MM/yyyy", { locale: ptBR })}</td>
        <td>${e.diaInteiro ? "Dia inteiro" : `${format(new Date(e.dataHoraInicio), "HH:mm")} - ${format(new Date(e.dataHoraFim), "HH:mm")}`}</td>
        <td><strong>${e.titulo}</strong>${e.descricao ? `<br><small>${e.descricao}</small>` : ""}</td>
        <td>
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${igreja?.codigoCor || "#16a34a"}; vertical-align: middle; margin-right: 4px;"></span>
          ${igreja?.nome || ""}
        </td>
        <td>${dep?.nome || org?.nome || "-"}</td>
      </tr>
    `;
    })
    .join("");

  const aniversariosHTML = aniversarios
    .sort((a: any, b: any) => {
      if (a.mes !== b.mes) return a.mes - b.mes;
      return a.dia - b.dia;
    })
    .map(
      (a: any) => `
      <tr>
        <td>${String(a.dia).padStart(2, "0")}/${String(a.mes).padStart(2, "0")}</td>
        <td>🎂 ${a.nome}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 32pt;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: capitalize;
        }
        
        .header p {
          font-size: 12pt;
          opacity: 0.9;
        }
        
        .content {
          padding: 32px;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 18pt;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 3px solid #667eea;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }
        
        thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        thead th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        tbody tr:hover {
          background-color: #f3f4f6;
        }
        
        tbody td {
          padding: 12px;
          font-size: 10pt;
        }
        
        tbody td:first-child {
          font-weight: 600;
          color: #667eea;
        }
        
        .aniversarios-table tbody td:first-child {
          color: #f97316;
        }
        
        .footer {
          text-align: center;
          padding: 16px;
          background-color: #f9fafb;
          color: #6b7280;
          font-size: 9pt;
          border-top: 1px solid #e5e7eb;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-style: italic;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${titulo}</h1>
          <p>Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        
        <div class="content">
          ${eventos.length > 0 ? `
            <div class="section">
              <h2 class="section-title">📅 Eventos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Título</th>
                    <th>Igreja</th>
                    <th>Dept/Órgão</th>
                  </tr>
                </thead>
                <tbody>
                  ${eventosHTML}
                </tbody>
              </table>
            </div>
          ` : '<div class="no-data">Nenhum evento encontrado</div>'}
          
          ${aniversarios.length > 0 ? `
            <div class="section">
              <h2 class="section-title">🎂 Aniversários</h2>
              <table class="aniversarios-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nome</th>
                  </tr>
                </thead>
                <tbody>
                  ${aniversariosHTML}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          Sistema de Gestão de Agenda para Igrejas
        </div>
      </div>
    </body>
    </html>
  `;
}

function gerarHTMLCalendario(dados: GerarPDFRequest): string {
  const { tipo, mes, ano, eventos, aniversarios, igrejas } = dados;

  if (tipo === "mensal") {
    return gerarHTMLCalendarioMensal(dados);
  } else {
    return gerarHTMLCalendarioAnual(dados);
  }
}

function gerarHTMLCalendarioMensal(dados: GerarPDFRequest): string {
  const { mes, ano, eventos, aniversarios, igrejas } = dados;
  const mesAtual = (mes || 1) - 1;
  const titulo = format(new Date(ano, mesAtual, 1), "MMMM 'de' yyyy", { locale: ptBR });

  // Calcular dias do mês
  const primeiroDia = new Date(ano, mesAtual, 1);
  const ultimoDia = new Date(ano, mesAtual + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const primeiroDiaSemana = primeiroDia.getDay();

  // Gerar células do calendário
  const diasHTML: string[] = [];
  let diaAtual = 1;

  for (let semana = 0; semana < 6; semana++) {
    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      if ((semana === 0 && diaSemana < primeiroDiaSemana) || diaAtual > diasNoMes) {
        diasHTML.push('<div class="calendar-day empty"></div>');
      } else {
        const data = new Date(ano, mesAtual, diaAtual);
        const eventosDoDia = eventos.filter((e: any) => {
          const dataEvento = new Date(e.dataHoraInicio);
          return (
            dataEvento.getDate() === diaAtual &&
            dataEvento.getMonth() === mesAtual &&
            dataEvento.getFullYear() === ano
          );
        });

        const aniversariosDoDia = aniversarios.filter((a: any) => a.dia === diaAtual && a.mes === mes);

        const eventosHTML = eventosDoDia
          .slice(0, 3)
          .map((e: any) => {
            const igreja = igrejas.find((i: any) => i.id === e.igrejaId);
            return `
            <div class="event-item" style="border-left-color: ${igreja?.codigoCor || "#16a34a"}">
              <div class="event-time">${e.diaInteiro ? "📅" : format(new Date(e.dataHoraInicio), "HH:mm")}</div>
              <div class="event-title">${e.titulo}</div>
            </div>
          `;
          })
          .join("");

        const aniversariosHTML = aniversariosDoDia
          .slice(0, 2)
          .map((a: any) => `<div class="event-item birthday">🎂 ${a.nome}</div>`)
          .join("");

        const maisItens =
          eventosDoDia.length + aniversariosDoDia.length > 5
            ? `<div class="more-items">+${eventosDoDia.length + aniversariosDoDia.length - 5} mais</div>`
            : "";

        diasHTML.push(`
          <div class="calendar-day">
            <div class="day-number">${diaAtual}</div>
            <div class="day-events">
              ${eventosHTML}
              ${aniversariosHTML}
              ${maisItens}
            </div>
          </div>
        `);

        diaAtual++;
      }
    }

    if (diaAtual > diasNoMes) break;
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendário ${titulo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28pt;
          font-weight: 700;
          text-transform: capitalize;
        }
        
        .calendar {
          padding: 24px;
        }
        
        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .weekday {
          text-align: center;
          font-weight: 600;
          font-size: 10pt;
          color: #667eea;
          padding: 8px;
        }
        
        .days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        
        .calendar-day {
          min-height: 120px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          background: #ffffff;
          transition: all 0.2s;
        }
        
        .calendar-day:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .calendar-day.empty {
          background: #f9fafb;
          border-color: #f3f4f6;
        }
        
        .day-number {
          font-weight: 700;
          font-size: 14pt;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .day-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .event-item {
          font-size: 7pt;
          padding: 4px 6px;
          border-radius: 4px;
          background: #f3f4f6;
          border-left: 3px solid #667eea;
          line-height: 1.3;
        }
        
        .event-item.birthday {
          background: #fff7ed;
          border-left-color: #f97316;
        }
        
        .event-time {
          font-weight: 600;
          color: #667eea;
        }
        
        .event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .more-items {
          font-size: 7pt;
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 2px;
        }
        
        .footer {
          text-align: center;
          padding: 16px;
          background-color: #f9fafb;
          color: #6b7280;
          font-size: 9pt;
          border-top: 1px solid #e5e7eb;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 ${titulo}</h1>
        </div>
        
        <div class="calendar">
          <div class="weekdays">
            <div class="weekday">Dom</div>
            <div class="weekday">Seg</div>
            <div class="weekday">Ter</div>
            <div class="weekday">Qua</div>
            <div class="weekday">Qui</div>
            <div class="weekday">Sex</div>
            <div class="weekday">Sáb</div>
          </div>
          
          <div class="days">
            ${diasHTML.join("")}
          </div>
        </div>
        
        <div class="footer">
          Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </div>
    </body>
    </html>
  `;
}

function gerarHTMLCalendarioAnual(dados: GerarPDFRequest): string {
  const { ano, eventos, aniversarios, igrejas } = dados;

  const mesesHTML = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const nomeMes = format(new Date(ano, i, 1), "MMMM", { locale: ptBR });

    // Calcular dias do mês
    const primeiroDia = new Date(ano, i, 1);
    const ultimoDia = new Date(ano, i + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const primeiroDiaSemana = primeiroDia.getDay();

    // Gerar mini células
    const diasHTML: string[] = [];
    let diaAtual = 1;

    for (let semana = 0; semana < 6; semana++) {
      for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
        if ((semana === 0 && diaSemana < primeiroDiaSemana) || diaAtual > diasNoMes) {
          diasHTML.push('<div class="mini-day empty"></div>');
        } else {
          const eventosDoDia = eventos.filter((e: any) => {
            const dataEvento = new Date(e.dataHoraInicio);
            return (
              dataEvento.getDate() === diaAtual &&
              dataEvento.getMonth() === i &&
              dataEvento.getFullYear() === ano
            );
          });

          const aniversariosDoDia = aniversarios.filter((a: any) => a.dia === diaAtual && a.mes === mes);
          const temItens = eventosDoDia.length > 0 || aniversariosDoDia.length > 0;

          diasHTML.push(`
            <div class="mini-day ${temItens ? "has-events" : ""}">
              ${diaAtual}
            </div>
          `);

          diaAtual++;
        }
      }

      if (diaAtual > diasNoMes) break;
    }

    return `
      <div class="mini-calendar">
        <h3 class="mini-month-title">${nomeMes}</h3>
        <div class="mini-weekdays">
          <div>D</div>
          <div>S</div>
          <div>T</div>
          <div>Q</div>
          <div>Q</div>
          <div>S</div>
          <div>S</div>
        </div>
        <div class="mini-days">
          ${diasHTML.join("")}
        </div>
      </div>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendário Anual ${ano}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 32pt;
          font-weight: 700;
        }
        
        .year-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 24px;
        }
        
        .mini-calendar {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #ffffff;
        }
        
        .mini-month-title {
          font-size: 12pt;
          font-weight: 700;
          color: #667eea;
          text-align: center;
          margin-bottom: 12px;
          text-transform: capitalize;
        }
        
        .mini-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 4px;
        }
        
        .mini-weekdays div {
          text-align: center;
          font-size: 8pt;
          font-weight: 600;
          color: #6b7280;
        }
        
        .mini-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        .mini-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8pt;
          border-radius: 4px;
          background: #f9fafb;
        }
        
        .mini-day.empty {
          background: transparent;
        }
        
        .mini-day.has-events {
          background: #667eea;
          color: white;
          font-weight: 600;
        }
        
        .footer {
          text-align: center;
          padding: 16px;
          background-color: #f9fafb;
          color: #6b7280;
          font-size: 9pt;
          border-top: 1px solid #e5e7eb;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Calendário ${ano}</h1>
        </div>
        
        <div class="year-grid">
          ${mesesHTML}
        </div>
        
        <div class="footer">
          Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </div>
    </body>
    </html>
  `;
}
