import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { obterTodosAniversariantes, obterAniversariantesPorMes } from '@/components/agenda/aniversariantes';

// Extender o tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function gerarRelatorioPDF() {
  try {
    const doc = new jsPDF();
    const aniversariantes = obterTodosAniversariantes();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Aniversários', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
    doc.text(`Total de aniversariantes: ${aniversariantes.length}`, 20, 55);
    
    // Criar dados por mês
    const dadosPorMes = [];
    
    for (let mes = 1; mes <= 12; mes++) {
      const aniversariantesMes = obterAniversariantesPorMes(mes);
      const nomesMeses = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      if (aniversariantesMes.length > 0) {
        dadosPorMes.push([
          nomesMeses[mes],
          aniversariantesMes.length.toString(),
          aniversariantesMes.map(a => `${a.nome} (${a.dia}/${mes})`).join(', ')
        ]);
      } else {
        dadosPorMes.push([
          nomesMeses[mes],
          '0',
          'Nenhum aniversário'
        ]);
      }
    }
    
    // Tabela principal
    doc.autoTable({
      head: [['Mês', 'Quantidade', 'Aniversariantes']],
      body: dadosPorMes,
      startY: 70,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 135 }
      },
      margin: { left: 20, right: 20 },
    });
    
    // Estatísticas no final
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Estatísticas:', 20, finalY);
    
    doc.setFontSize(10);
    const estatisticas = [
      `• Total de aniversariantes: ${aniversariantes.length}`,
      `• Mês atual: ${obterAniversariantesPorMes(new Date().getMonth() + 1).length} aniversários`,
      `• Próximo mês: ${obterAniversariantesPorMes(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2).length} aniversários`
    ];
    
    estatisticas.forEach((stat, index) => {
      doc.text(stat, 20, finalY + 15 + (index * 10));
    });
    
    // Salvar o PDF
    doc.save(`relatorio-aniversarios-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return false;
  }
}
