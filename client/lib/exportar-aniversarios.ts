import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  dataNascimento?: string | null;
}

export const exportarAniversarios = {
  // Exportar para CSV
  async paraCSV() {
    try {
      const usuarios = await api.listarUsuarios();
      const aniversariantes = usuarios.filter(u => u.dataNascimento);

      // Cabeçalho do CSV
      const cabecalho = "Nome,Email,Data de Nascimento,Idade,Dia,Mês,Perfil\n";
      
      // Dados dos aniversariantes
      const dados = aniversariantes.map(usuario => {
        const nascimento = parseISO(usuario.dataNascimento!);
        const idade = new Date().getFullYear() - nascimento.getFullYear();
        const dia = nascimento.getDate();
        const mes = nascimento.getMonth() + 1;
        const dataFormatada = format(nascimento, "dd/MM/yyyy", { locale: ptBR });
        
          return `"${usuario.nome}","${usuario.email}","${dataFormatada}",${idade},${dia},${mes},"${usuario.perfil || ''}"`;
      }).join("\n");

      const csvContent = cabecalho + dados;
      
      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `aniversariantes_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error("Erro ao exportar para CSV:", error);
      throw error;
    }
  },

  // Exportar para JSON
  async paraJSON() {
    try {
      const usuarios = await api.listarUsuarios();
      const aniversariantes = usuarios
        .filter(u => u.dataNascimento)
        .map(usuario => {
          const nascimento = parseISO(usuario.dataNascimento!);
          const idade = new Date().getFullYear() - nascimento.getFullYear();
          
          return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            dataNascimento: usuario.dataNascimento,
            dataFormatada: format(nascimento, "dd/MM/yyyy", { locale: ptBR }),
            idade,
            dia: nascimento.getDate(),
            mes: nascimento.getMonth() + 1,
            perfil: usuario.perfil
          };
        });

      const jsonContent = JSON.stringify({
        exportadoEm: new Date().toISOString(),
        totalAniversariantes: aniversariantes.length,
        aniversariantes
      }, null, 2);
      
      // Criar e baixar arquivo
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `aniversariantes_${format(new Date(), "yyyy-MM-dd")}.json`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error("Erro ao exportar para JSON:", error);
      throw error;
    }
  },

  // Exportar calendário de aniversários (formato ICS)
  async paraICS() {
    try {
      const usuarios = await api.listarUsuarios();
      const aniversariantes = usuarios.filter(u => u.dataNascimento);
      
      let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Agenda Viva//Aniversários//PT",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Aniversários",
        "X-WR-TIMEZONE:America/Sao_Paulo",
        "X-WR-CALDESC:Calendário de aniversários da comunidade"
      ];

      aniversariantes.forEach(usuario => {
        const nascimento = parseISO(usuario.dataNascimento!);
        const anoAtual = new Date().getFullYear();
        
        // Criar evento recorrente para o aniversário
        const dataEvento = format(new Date(anoAtual, nascimento.getMonth(), nascimento.getDate()), "yyyyMMdd");
        const uid = `aniversario-${usuario.id}@agenda-viva.com`;
        
        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
          `DTSTART;VALUE=DATE:${dataEvento}`,
          `SUMMARY:🎂 Aniversário de ${usuario.nome}`,
          `DESCRIPTION:Aniversário de ${usuario.nome} (${usuario.email})`,
          "RRULE:FREQ=YEARLY",
          "CATEGORIES:ANIVERSÁRIO",
          "END:VEVENT"
        );
      });

      icsContent.push("END:VCALENDAR");
      
      const icsString = icsContent.join("\r\n");
      
      // Criar e baixar arquivo
      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `calendario_aniversarios_${format(new Date(), "yyyy-MM-dd")}.ics`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error("Erro ao exportar para ICS:", error);
      throw error;
    }
  },

  // Gerar relatório de aniversários por mês
  async relatorioMensal() {
    try {
      const usuarios = await api.listarUsuarios();
      const aniversariantes = usuarios.filter(u => u.dataNascimento);
      
      // Agrupar por mês
      const porMes: Record<number, typeof aniversariantes> = {};
      for (let i = 1; i <= 12; i++) {
        porMes[i] = [];
      }
      
      aniversariantes.forEach(usuario => {
        const nascimento = parseISO(usuario.dataNascimento!);
        const mes = nascimento.getMonth() + 1;
        porMes[mes].push(usuario);
      });
      
      // Gerar relatório em texto
      const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      
      let relatorio = `RELATÓRIO DE ANIVERSÁRIOS - ${format(new Date(), "yyyy", { locale: ptBR })}\n`;
      relatorio += `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n`;
      relatorio += `Total de aniversariantes: ${aniversariantes.length}\n\n`;
      relatorio += "=".repeat(60) + "\n\n";
      
      Object.entries(porMes).forEach(([mes, pessoas]) => {
        const numeroMes = parseInt(mes);
        relatorio += `${nomesMeses[numeroMes - 1].toUpperCase()} (${pessoas.length} aniversariantes)\n`;
        relatorio += "-".repeat(40) + "\n";
        
        if (pessoas.length === 0) {
          relatorio += "Nenhum aniversariante neste mês.\n\n";
        } else {
          // Ordenar por dia
          pessoas.sort((a, b) => {
            const diaA = parseISO(a.dataNascimento!).getDate();
            const diaB = parseISO(b.dataNascimento!).getDate();
            return diaA - diaB;
          });
          
          pessoas.forEach(pessoa => {
            const nascimento = parseISO(pessoa.dataNascimento!);
            const dia = nascimento.getDate().toString().padStart(2, '0');
            const idade = new Date().getFullYear() - nascimento.getFullYear();
            relatorio += `${dia}/${numeroMes.toString().padStart(2, '0')} - ${pessoa.nome} (${idade} anos) - ${pessoa.email}\n`;
          });
          relatorio += "\n";
        }
      });
      
      // Criar e baixar arquivo
      const blob = new Blob([relatorio], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_aniversarios_${format(new Date(), "yyyy-MM-dd")}.txt`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      throw error;
    }
  }
};
