import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { Aniversario, Evento, Igreja } from '@shared/api';

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
  legend: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  legendText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
});

interface CalendarioMensalPDFProps {
  ano: number;
  mes: number;
  eventosData: Evento[];
  aniversariosData: Aniversario[];
  igreja?: Igreja;
}

export const CalendarioMensalPDF = ({ ano, mes, eventosData, aniversariosData, igreja }: CalendarioMensalPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);
  const diasNoMes = fimMes.getDate();

  // Filtrar eventos e aniversários do mês
  const eventosDoMes = eventosData.filter(evento => {
    const dataEvento = new Date(evento.dataHoraInicio);
    return dataEvento.getMonth() === mes - 1 && dataEvento.getFullYear() === ano;
  });

  const aniversariosDoMes = aniversariosData.filter(a => a.mes === mes);

  // Organizar por dias
  const diasComEventos: { [key: number]: { eventos: Evento[]; aniversarios: Aniversario[] } } = {};
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    diasComEventos[dia] = { eventos: [], aniversarios: [] };
  }

  eventosDoMes.forEach(evento => {
    const dataEvento = new Date(evento.dataHoraInicio);
    const dia = dataEvento.getDate();
    if (diasComEventos[dia]) {
      diasComEventos[dia].eventos.push(evento);
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
  eventosData: Evento[];
  aniversariosData: Aniversario[];
  igreja?: Igreja;
}

export const CalendarioAnualPDF = ({ ano, eventosData, aniversariosData, igreja }: CalendarioAnualPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Organizar por mês
  const dadosPorMes: { [mes: string]: { eventos: any[]; aniversarios: any[] } } = {};
  
  nomesMeses.forEach((nomeMes, index) => {
    dadosPorMes[nomeMes] = { eventos: [], aniversarios: [] };
    
    // Eventos do mês
    eventosData.forEach(evento => {
      const dataEvento = new Date(evento.dataHoraInicio);
      if (dataEvento.getMonth() === index && dataEvento.getFullYear() === ano) {
        dadosPorMes[nomeMes].eventos.push({
          ...evento,
          data: dataEvento
        });
      }
    });
    
    // Aniversários do mês
    aniversariosData.forEach(aniversario => {
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

        {/* Footer */}
        <Text style={styles.footer}>
          Sistema de Agenda da Igreja • Relatório gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
};

interface RelatorioAniversariosPDFProps {
  aniversariosData: Aniversario[];
  igreja?: Igreja;
}

export const RelatorioAniversariosPDF = ({ aniversariosData, igreja }: RelatorioAniversariosPDFProps) => {
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const aniversarios = aniversariosData.sort((a, b) => {
    if (a.mes !== b.mes) return a.mes - b.mes;
    return a.dia - b.dia;
  });

  // Organizar por mês
  const aniversariosPorMes: { [mes: number]: Aniversario[] } = {};
  for (let i = 1; i <= 12; i++) {
    aniversariosPorMes[i] = aniversarios.filter(a => a.mes === i);
  }

  // Função para calcular idade
  const calcularIdade = (ano?: number | null) => {
    if (!ano) return null;
    const hoje = new Date();
    return hoje.getFullYear() - ano;
  };

  // Cabeçalho institucional fixo para todas as páginas
  const HeaderInstitucional = () => (
    <View style={{ marginBottom: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#b45309', flexDirection: 'row', alignItems: 'center' }}>
      {/* Logo (opcional) */}
      <View style={{ width: 60, height: 60, marginRight: 12 }}>
        {/* <Image src="/logo-igreja.png" style={{ width: 60, height: 60 }} /> */}
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b45309' }}>IGREJA EVANGÉLICA ASSEMBLEIA DE DEUS</Text>
        <Text style={{ fontSize: 10, color: '#1d3557' }}>Rua: Jose Alencar, 17, Vila Torres Galvão, Paulista/PE - CEP: 53403-780</Text>
        <Text style={{ fontSize: 10, color: '#1d3557' }}>Presidente PR. Roberto José Dos Santos Lucena</Text>
        <Text style={{ fontSize: 10, color: '#1d3557' }}>Coordenador Da Área PR. Gilmar Ribeiro</Text>
        <Text style={{ fontSize: 10, color: '#1d3557' }}>Coordenadora Da Área IR. Benezoete Ribeiro</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <HeaderInstitucional />
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
              <Text style={styles.tableCell}>Idade</Text>
              <Text style={styles.tableCell}>Observações</Text>
            </View>
            {aniversarios.map((aniversario, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellDate}>
                  {aniversario.dia.toString().padStart(2, '0')}/{aniversario.mes.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.tableCellName}>{aniversario.nome}</Text>
                <Text style={styles.tableCell}>{aniversario.ano ? calcularIdade(aniversario.ano) : '-'}</Text>
                <Text style={styles.tableCell}>{aniversario.observacoes || '-'}</Text>
              </View>
            ))}
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

// Funções para gerar os PDFs (agora precisam receber os dados)
export async function gerarCalendarioMensalPDF(
  ano: number, 
  mes: number, 
  eventos: Evento[], 
  aniversarios: Aniversario[], 
  igreja?: Igreja
): Promise<Blob> {
  const doc = <CalendarioMensalPDF 
    ano={ano} 
    mes={mes} 
    eventosData={eventos} 
    aniversariosData={aniversarios} 
    igreja={igreja} 
  />;
  return await pdf(doc).toBlob();
}

export async function gerarCalendarioAnualPDF(
  ano: number, 
  eventos: Evento[], 
  aniversarios: Aniversario[], 
  igreja?: Igreja
): Promise<Blob> {
  const doc = <CalendarioAnualPDF 
    ano={ano} 
    eventosData={eventos} 
    aniversariosData={aniversarios} 
    igreja={igreja} 
  />;
  return await pdf(doc).toBlob();
}

export async function gerarRelatorioAniversariosPDF(
  aniversarios: Aniversario[], 
  igreja?: Igreja
): Promise<Blob> {
  const doc = <RelatorioAniversariosPDF 
    aniversariosData={aniversarios} 
    igreja={igreja} 
  />;
  return await pdf(doc).toBlob();
}