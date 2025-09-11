import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import type { Aniversario, Evento, Igreja } from '@shared/api';

// Registrar fontes (opcional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
// });

// Registrar fontes (opcional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  month: {
    width: '48%',
    marginBottom: 20,
    border: '1pt solid #e5e7eb',
    borderRadius: 4,
  },
  monthHeader: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  monthBody: {
    padding: 10,
  },
  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    width: 20,
  },
  eventText: {
    fontSize: 9,
    color: '#6b7280',
    flex: 1,
    marginLeft: 5,
  },
  birthdayText: {
    fontSize: 9,
    color: '#dc2626',
    flex: 1,
    marginLeft: 5,
  },
  legend: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#6b7280',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    paddingHorizontal: 4,
    color: '#6b7280',
  },
  tableCellDate: {
    width: 80,
    fontSize: 10,
    paddingHorizontal: 4,
    color: '#374151',
    fontWeight: 'bold',
  },
  tableCellName: {
    flex: 2,
    fontSize: 10,
    paddingHorizontal: 4,
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  compactCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactMonth: {
    width: '30%',
    marginBottom: 15,
    border: '1pt solid #e5e7eb',
    borderRadius: 4,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  compactDay: {
    width: '14.28%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
  },
  dayWithEvent: {
    width: '14.28%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontWeight: 'bold',
  },
  dayWithBirthday: {
    width: '14.28%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontWeight: 'bold',
  },
  dayWithBoth: {
    width: '14.28%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    backgroundColor: '#a855f7',
    color: 'white',
    fontWeight: 'bold',
  },
});

interface CalendarioMensalPDFProps {
  ano: number;
  mes: number;
  eventos: Evento[];
  aniversarios: Aniversario[];
  igreja?: Igreja;
}

export const CalendarioMensalPDF = ({ ano, mes, eventos, aniversarios, igreja }: CalendarioMensalPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);
  const diasNoMes = fimMes.getDate();

  // Filtrar eventos e aniversários do mês
  const eventosDoMes = eventos.filter(evento => {
    const dataEvento = new Date(evento.dataHoraInicio);
    return dataEvento.getMonth() === mes - 1 && dataEvento.getFullYear() === ano;
  });

  const aniversariosDoMes = aniversarios.filter(a => a.mes === mes);

  // Organizar por dias
  const diasComEventos: { [key: number]: { eventos: any[]; aniversarios: any[] } } = {};
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    diasComEventos[dia] = { eventos: [], aniversarios: [] };
  }

  eventosDoMes.forEach(evento => {
    const dataEvento = new Date(evento.dataHoraInicio);
    if (dataEvento.getMonth() === mes - 1 && dataEvento.getFullYear() === ano) {
      const dia = dataEvento.getDate();
      if (diasComEventos[dia]) {
        diasComEventos[dia].eventos.push(evento);
      }
    }
  });

  aniversariosDoMes.forEach(aniversario => {
    if (diasComEventos[aniversario.dia]) {
      diasComEventos[aniversario.dia].aniversarios.push(aniversario);
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Calendário - {nomesMeses[mes - 1]} {ano}
          </Text>
          {igreja && (
            <Text style={styles.subtitle}>
              {igreja.nome}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Calendário Compacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral do Mês</Text>
          <View style={styles.compactMonth}>
            <Text style={styles.monthHeader}>{nomesMeses[mes - 1]}</Text>
            <View style={styles.compactGrid}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, index) => (
                <Text key={index} style={[styles.compactDay, { fontWeight: 'bold', backgroundColor: '#f3f4f6' }]}>
                  {dia}
                </Text>
              ))}
              
              {/* Dias vazios no início */}
              {Array.from({ length: inicioMes.getDay() }, (_, i) => (
                <Text key={`empty-${i}`} style={styles.compactDay}></Text>
              ))}
              
              {/* Dias do mês */}
              {Array.from({ length: diasNoMes }, (_, i) => {
                const dia = i + 1;
                const temEvento = diasComEventos[dia]?.eventos.length > 0;
                const temAniversario = diasComEventos[dia]?.aniversarios.length > 0;
                
                let estilo = styles.compactDay;
                if (temEvento && temAniversario) {
                  estilo = styles.dayWithBoth;
                } else if (temEvento) {
                  estilo = styles.dayWithEvent;
                } else if (temAniversario) {
                  estilo = styles.dayWithBirthday;
                }
                
                return (
                  <Text key={dia} style={estilo}>
                    {dia}
                  </Text>
                );
              })}
            </View>
          </View>
        </View>

        {/* Lista de Eventos e Aniversários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos e Aniversários por Dia</Text>
          {Object.entries(diasComEventos)
            .filter(([_, dados]) => dados.eventos.length > 0 || dados.aniversarios.length > 0)
            .map(([dia, dados]) => (
              <View key={dia} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 4 }}>
                  Dia {dia}
                </Text>
                
                {dados.eventos.map((evento, index) => (
                  <Text key={`evento-${index}`} style={styles.eventText}>
                    • {evento.titulo} ({new Date(evento.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                  </Text>
                ))}
                
                {dados.aniversarios.map((aniversario, index) => (
                  <Text key={`aniversario-${index}`} style={styles.birthdayText}>
                    🎂 {aniversario.nome}
                  </Text>
                ))}
              </View>
            ))}
        </View>

        {/* Legenda */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legenda:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#dbeafe' }]}></View>
            <Text style={styles.legendText}>Dias com eventos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fef2f2' }]}></View>
            <Text style={styles.legendText}>Dias com aniversários</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#a855f7' }]}></View>
            <Text style={styles.legendText}>Dias com eventos e aniversários</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Sistema de Agenda da Igreja • Relatório gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
};

interface CalendarioAnualPDFProps {
  ano: number;
  eventos: Evento[];
  aniversarios: Aniversario[];
  igreja?: Igreja;
}

export const CalendarioAnualPDF = ({ ano, eventos, aniversarios, igreja }: CalendarioAnualPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Buscar todos os eventos e aniversários do ano
  const inicioAno = new Date(ano, 0, 1);
  const fimAno = new Date(ano + 1, 0, 1);
  
  const eventos = eventosDb.buscarPorPeriodo(
    inicioAno.toISOString(),
    fimAno.toISOString()
  ).filter(e => !igrejaId || e.igrejaId === igrejaId);

  const todosAniversarios = aniversariosDb.buscarTodos()
    .filter(a => !igrejaId || a.igrejaId === igrejaId);

  const igreja = igrejaId ? igrejasDb.buscarPorId(igrejaId) : null;

  // Organizar por mês
  const dadosPorMes: { [mes: string]: { eventos: any[]; aniversarios: any[] } } = {};
  
  nomesMeses.forEach((nomeMes, index) => {
    dadosPorMes[nomeMes] = { eventos: [], aniversarios: [] };
    
    // Eventos do mês
    eventos.forEach(evento => {
      const dataEvento = new Date(evento.dataHoraInicio);
      if (dataEvento.getMonth() === index) {
        dadosPorMes[nomeMes].eventos.push({
          ...evento,
          data: dataEvento
        });
      }
    });
    
    // Aniversários do mês
    todosAniversarios.forEach(aniversario => {
      if (aniversario.mes === index + 1) {
        dadosPorMes[nomeMes].aniversarios.push(aniversario);
      }
    });
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Calendário Anual - {ano}
          </Text>
          {igreja && (
            <Text style={styles.subtitle}>
              {igreja.nome}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Tabela Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo por Mês</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Mês</Text>
              <Text style={styles.tableCell}>Eventos</Text>
              <Text style={styles.tableCell}>Aniversários</Text>
              <Text style={styles.tableCell}>Total</Text>
            </View>
            
            {nomesMeses.map((mes) => {
              const dados = dadosPorMes[mes];
              const totalEventos = dados.eventos.length;
              const totalAniversarios = dados.aniversarios.length;
              const total = totalEventos + totalAniversarios;
              
              if (total === 0) return null;
              
              return (
                <View key={mes} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{mes}</Text>
                  <Text style={styles.tableCell}>{totalEventos}</Text>
                  <Text style={styles.tableCell}>{totalAniversarios}</Text>
                  <Text style={styles.tableCell}>{total}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Detalhes por Mês */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datas Importantes do Ano</Text>
          {nomesMeses.map((mes) => {
            const dados = dadosPorMes[mes];
            const hasData = dados.eventos.length > 0 || dados.aniversarios.length > 0;
            
            if (!hasData) return null;
            
            return (
              <View key={mes} style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 }}>
                  {mes}
                </Text>
                
                {dados.eventos.map((evento, index) => (
                  <Text key={`evento-${index}`} style={styles.eventText}>
                    • {evento.data.getDate()}/{evento.data.getMonth() + 1} - {evento.titulo}
                  </Text>
                ))}
                
                {dados.aniversarios.map((aniversario, index) => (
                  <Text key={`aniversario-${index}`} style={styles.birthdayText}>
                    🎂 {aniversario.dia}/{aniversario.mes} - {aniversario.nome}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Sistema de Agenda da Igreja • Relatório gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
};

interface RelatorioAniversariosPDFProps {
  igrejaId?: string;
}

export const RelatorioAniversariosPDF = ({ igrejaId }: RelatorioAniversariosPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const aniversarios = aniversariosDb.buscarTodos()
    .filter(a => !igrejaId || a.igrejaId === igrejaId)
    .sort((a, b) => {
      if (a.mes !== b.mes) return a.mes - b.mes;
      return a.dia - b.dia;
    });

  const igreja = igrejaId ? igrejasDb.buscarPorId(igrejaId) : null;

  // Organizar por mês
  const aniversariosPorMes: { [mes: number]: any[] } = {};
  for (let i = 1; i <= 12; i++) {
    aniversariosPorMes[i] = aniversarios.filter(a => a.mes === i);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Relatório de Aniversários
          </Text>
          {igreja && (
            <Text style={styles.subtitle}>
              {igreja.nome}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Total de aniversariantes: {aniversarios.length} • Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Calendário de Aniversários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendário de Aniversários por Mês</Text>
          <View style={styles.calendar}>
            {nomesMeses.map((nomeMes, index) => {
              const mes = index + 1;
              const aniversariosDoMes = aniversariosPorMes[mes] || [];
              
              return (
                <View key={mes} style={styles.month}>
                  <Text style={styles.monthHeader}>
                    {nomeMes} ({aniversariosDoMes.length})
                  </Text>
                  <View style={styles.monthBody}>
                    {aniversariosDoMes.length === 0 ? (
                      <Text style={styles.eventText}>Nenhum aniversário</Text>
                    ) : (
                      aniversariosDoMes.map((aniversario, idx) => (
                        <View key={idx} style={styles.dayItem}>
                          <Text style={styles.dayNumber}>{aniversario.dia}</Text>
                          <Text style={styles.birthdayText}>{aniversario.nome}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tabela Completa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lista Completa por Ordem Cronológica</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellDate}>Data</Text>
              <Text style={styles.tableCellName}>Nome</Text>
              <Text style={styles.tableCell}>Observações</Text>
            </View>
            
            {aniversarios.map((aniversario, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellDate}>
                  {aniversario.dia.toString().padStart(2, '0')}/{aniversario.mes.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.tableCellName}>{aniversario.nome}</Text>
                <Text style={styles.tableCell}>{aniversario.observacoes || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Estatísticas:</Text>
          <Text style={styles.legendText}>• Total de aniversariantes: {aniversarios.length}</Text>
          <Text style={styles.legendText}>
            • Mês com mais aniversários: {
              nomesMeses[
                Object.entries(aniversariosPorMes)
                  .reduce((a, b) => a[1].length > b[1].length ? a : b)[0] as any - 1
              ]
            } ({Math.max(...Object.values(aniversariosPorMes).map(arr => arr.length))} aniversários)
          </Text>
          <Text style={styles.legendText}>
            • Média por mês: {(aniversarios.length / 12).toFixed(1)} aniversários
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Sistema de Agenda da Igreja • Relatório gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
};

// Funções para gerar os PDFs
export async function gerarCalendarioMensalPDF(ano: number, mes: number, igrejaId?: string): Promise<Blob> {
  const doc = <CalendarioMensalPDF ano={ano} mes={mes} igrejaId={igrejaId} />;
  return await pdf(doc).toBlob();
}

export async function gerarCalendarioAnualPDF(ano: number, igrejaId?: string): Promise<Blob> {
  const doc = <CalendarioAnualPDF ano={ano} igrejaId={igrejaId} />;
  return await pdf(doc).toBlob();
}

export async function gerarRelatorioAniversariosPDF(igrejaId?: string): Promise<Blob> {
  const doc = <RelatorioAniversariosPDF igrejaId={igrejaId} />;
  return await pdf(doc).toBlob();
}