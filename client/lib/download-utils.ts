// Utilitário para fazer download de arquivos
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utilitário para formatar nomes de arquivos
export function formatarNomeArquivo(tipo: 'mensal' | 'anual' | 'aniversarios', ano?: number, mes?: number): string {
  const data = new Date();
  const timestamp = data.toISOString().split('T')[0]; // YYYY-MM-DD
  
  switch (tipo) {
    case 'mensal':
      const nomesMeses = [
        'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const nomeMes = mes ? nomesMeses[mes - 1] : nomesMeses[data.getMonth()];
      const anoMes = ano || data.getFullYear();
      return `calendario-mensal-${nomeMes}-${anoMes}-${timestamp}.pdf`;
      
    case 'anual':
      const anoAnual = ano || data.getFullYear();
      return `calendario-anual-${anoAnual}-${timestamp}.pdf`;
      
    case 'aniversarios':
      return `relatorio-aniversarios-${timestamp}.pdf`;
      
    default:
      return `relatorio-${timestamp}.pdf`;
  }
}

// Utilitário para mostrar notificações de sucesso/erro
export function mostrarNotificacao(tipo: 'sucesso' | 'erro', mensagem: string) {
  // Se estiver usando algum sistema de toast/notificação
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(tipo === 'sucesso' ? 'Sucesso!' : 'Erro!', {
        body: mensagem,
        icon: tipo === 'sucesso' ? '/favicon.ico' : undefined
      });
    }
  }
  
  // Fallback para console
  console.log(`${tipo.toUpperCase()}: ${mensagem}`);
}