import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Aniversario {
  id: string;
  nome: string;
  dia: number;
  mes: number;
  ano?: number | null;
  observacoes?: string | null;
  criadoPor: string;
}

interface NotificacaoAniversario {
  id: string;
  aniversario: Aniversario;
  tipo: "hoje" | "amanha" | "semana";
  diasRestantes: number;
}

export function useNotificacaoAniversarios() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoAniversario[]>([]);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<string | null>(null);
  const { toast } = useToast();

  // Verificar notificações a cada 1 hora
  useEffect(() => {
    const verificarNotificacoes = async () => {
      try {
        const aniversarios = await api.listarAniversarios();
        
        const hoje = new Date();
        const dataHoje = format(hoje, "yyyy-MM-dd");
        
        // Se já verificamos hoje, não verificar novamente
        if (ultimaVerificacao === dataHoje) {
          return;
        }

        const novasNotificacoes: NotificacaoAniversario[] = [];

        aniversarios.forEach(aniversario => {
          const anoAtual = hoje.getFullYear();
          
          // Próximo aniversário este ano
          let proximaData = new Date(anoAtual, aniversario.mes - 1, aniversario.dia);
          
          // Se já passou este ano, será no próximo ano
          if (proximaData < hoje) {
            proximaData = new Date(anoAtual + 1, aniversario.mes - 1, aniversario.dia);
          }
          
          const diasRestantes = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          
          // Criar notificações baseadas nos dias restantes
          if (diasRestantes === 0) {
            novasNotificacoes.push({
              id: `hoje-${aniversario.id}`,
              aniversario,
              tipo: "hoje",
              diasRestantes: 0
            });
          } else if (diasRestantes === 1) {
            novasNotificacoes.push({
              id: `amanha-${aniversario.id}`,
              aniversario,
              tipo: "amanha",
              diasRestantes: 1
            });
          } else if (diasRestantes === 7) {
            novasNotificacoes.push({
              id: `semana-${aniversario.id}`,
              aniversario,
              tipo: "semana",
              diasRestantes: 7
            });
          }
        });

        // Verificar se há notificações não vistas do localStorage
        const notificacoesVisualizadas = JSON.parse(
          localStorage.getItem("notificacoes_aniversario_vistas") || "[]"
        );

        const notificacoesNovas = novasNotificacoes.filter(
          notif => !notificacoesVisualizadas.includes(notif.id)
        );

        // Mostrar toasts para novas notificações
        notificacoesNovas.forEach(notif => {
          const getNotificationContent = (tipo: string, nome: string) => {
            switch (tipo) {
              case "hoje":
                return {
                  title: "🎉 Aniversário hoje!",
                  description: `${nome} está fazendo aniversário hoje!`
                };
              case "amanha":
                return {
                  title: "🎂 Aniversário amanhã",
                  description: `${nome} fará aniversário amanhã. Não se esqueça de parabenizar!`
                };
              case "semana":
                return {
                  title: "📅 Aniversário na próxima semana",
                  description: `${nome} fará aniversário em uma semana (${format(new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000), "dd/MM", { locale: ptBR })})`
                };
              default:
                return { title: "", description: "" };
            }
          };

          const { title, description } = getNotificationContent(notif.tipo, notif.aniversario.nome);

          toast({
            title,
            description,
            duration: notif.tipo === "hoje" ? 10000 : 5000, // Aniversário de hoje fica mais tempo
          });
        });

        // Marcar notificações como visualizadas
        if (notificacoesNovas.length > 0) {
          const todasVisualizadas = [
            ...notificacoesVisualizadas,
            ...notificacoesNovas.map(n => n.id)
          ];
          localStorage.setItem(
            "notificacoes_aniversario_vistas",
            JSON.stringify(todasVisualizadas)
          );
        }

        setNotificacoes(novasNotificacoes);
        setUltimaVerificacao(dataHoje);
        
        // Salvar no localStorage para não verificar novamente hoje
        localStorage.setItem("ultima_verificacao_aniversarios", dataHoje);

      } catch (error) {
        console.error("Erro ao verificar notificações de aniversário:", error);
      }
    };

    // Carregar última verificação do localStorage
    const ultimaVerificacaoSalva = localStorage.getItem("ultima_verificacao_aniversarios");
    setUltimaVerificacao(ultimaVerificacaoSalva);

    // Verificar imediatamente se não verificou hoje
    const hoje = format(new Date(), "yyyy-MM-dd");
    if (ultimaVerificacaoSalva !== hoje) {
      verificarNotificacoes();
    }

    // Configurar verificação periódica (a cada hora)
    const intervalo = setInterval(verificarNotificacoes, 60 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [ultimaVerificacao, toast]);

  // Função para limpar notificações antigas do localStorage (executar semanalmente)
  const limparNotificacoesAntigas = () => {
    const hoje = new Date();
    const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Limpar notificações mais antigas que uma semana
    localStorage.removeItem("notificacoes_aniversario_vistas");
  };

  return {
    notificacoes,
    limparNotificacoesAntigas
  };
}
