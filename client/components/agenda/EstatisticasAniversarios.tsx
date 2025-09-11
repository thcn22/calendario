import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Gift, TrendingUp } from "lucide-react";
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

interface EstatisticasAniversarios {
  totalAniversariantes: number;
  aniversariosEsteMes: number;
  aniversariosProximoMes: number;
  aniversariosProximos7Dias: number;
  mesComMaisAniversarios: { mes: number; quantidade: number; nome: string };
}

export function EstatisticasAniversarios() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasAniversarios | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      setCarregando(true);
      const usuarios = await api.listarUsuarios();
      const usuariosComAniversario = usuarios.filter(u => u.dataNascimento);
      
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const proximoMes = mesAtual === 12 ? 1 : mesAtual + 1;
      
      // Contadores por mês
      const contadorPorMes: Record<number, number> = {};
      for (let i = 1; i <= 12; i++) {
        contadorPorMes[i] = 0;
      }

      let aniversariosEsteMes = 0;
      let aniversariosProximoMes = 0;
      let aniversariosProximos7Dias = 0;

      usuariosComAniversario.forEach(usuario => {
        if (!usuario.dataNascimento) return;
        
        const nascimento = parseISO(usuario.dataNascimento);
        const mesNascimento = nascimento.getMonth() + 1;
        
        contadorPorMes[mesNascimento]++;
        
        if (mesNascimento === mesAtual) {
          aniversariosEsteMes++;
        }
        
        if (mesNascimento === proximoMes) {
          aniversariosProximoMes++;
        }
        
        // Verificar se está nos próximos 7 dias
        const anoAtual = hoje.getFullYear();
        let proximaData = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
        
        if (proximaData < hoje) {
          proximaData = new Date(anoAtual + 1, nascimento.getMonth(), nascimento.getDate());
        }
        
        const diasRestantes = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 7) {
          aniversariosProximos7Dias++;
        }
      });

      // Encontrar mês com mais aniversários
      let mesComMaisAniversarios = { mes: 1, quantidade: 0, nome: "Janeiro" };
      const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      Object.entries(contadorPorMes).forEach(([mes, quantidade]) => {
        if (quantidade > mesComMaisAniversarios.quantidade) {
          mesComMaisAniversarios = {
            mes: parseInt(mes),
            quantidade,
            nome: nomesMeses[parseInt(mes) - 1]
          };
        }
      });

      setEstatisticas({
        totalAniversariantes: usuariosComAniversario.length,
        aniversariosEsteMes,
        aniversariosProximoMes,
        aniversariosProximos7Dias,
        mesComMaisAniversarios
      });

    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-1"></div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!estatisticas) {
    return null;
  }

  const mesAtualNome = format(new Date(), "MMMM", { locale: ptBR });
  const proximoMesNome = format(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1),
    "MMMM",
    { locale: ptBR }
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Aniversariantes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estatisticas.totalAniversariantes}</div>
          <p className="text-xs text-muted-foreground">
            pessoas cadastradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estatisticas.aniversariosEsteMes}</div>
          <p className="text-xs text-muted-foreground capitalize">
            aniversários em {mesAtualNome}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {estatisticas.aniversariosProximos7Dias}
          </div>
          <p className="text-xs text-muted-foreground">
            lembretes ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mês Popular</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estatisticas.mesComMaisAniversarios.quantidade}</div>
          <p className="text-xs text-muted-foreground">
            em {estatisticas.mesComMaisAniversarios.nome}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
