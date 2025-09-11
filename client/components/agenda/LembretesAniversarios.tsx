import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Gift, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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

interface AniversarioProximo {
  aniversario: Aniversario;
  diasRestantes: number;
  proximaData: Date;
}

export function LembretesAniversarios() {
  const [aniversariosProximos, setAniversariosProximos] = useState<AniversarioProximo[]>([]);
  const [lembretesDismissed, setLembretesDismissed] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarAniversariosProximos();
    
    // Carregar lembretes dismissed do localStorage
    const dismissed = localStorage.getItem('lembretes_dismissed');
    if (dismissed) {
      setLembretesDismissed(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const carregarAniversariosProximos = async () => {
    try {
      setCarregando(true);
      const aniversarios = await api.listarAniversarios();
      
      const hoje = new Date();
      const proximos: AniversarioProximo[] = [];

      aniversarios.forEach(aniversario => {
        const anoAtual = hoje.getFullYear();
        
        // Próximo aniversário este ano
        let proximaData = new Date(anoAtual, aniversario.mes - 1, aniversario.dia);
        
        // Se já passou este ano, será no próximo ano
        if (proximaData < hoje) {
          proximaData = new Date(anoAtual + 1, aniversario.mes - 1, aniversario.dia);
        }
        
        const diasRestantes = differenceInDays(proximaData, hoje);
        
        // Mostrar lembretes para aniversários nos próximos 7 dias
        if (diasRestantes <= 7) {
          proximos.push({
            aniversario,
            diasRestantes,
            proximaData
          });
        }
      });

      // Ordenar por dias restantes
      proximos.sort((a, b) => a.diasRestantes - b.diasRestantes);
      
      setAniversariosProximos(proximos);
    } catch (error) {
      console.error("Erro ao carregar aniversários próximos:", error);
    } finally {
      setCarregando(false);
    }
  };

  const dismissLembrete = (aniversarioId: string) => {
    const newDismissed = new Set(lembretesDismissed);
    newDismissed.add(aniversarioId);
    setLembretesDismissed(newDismissed);
    
    // Salvar no localStorage
    localStorage.setItem('lembretes_dismissed', JSON.stringify(Array.from(newDismissed)));
  };

  // Filtrar lembretes que não foram dismissed
  const lembretesAtivos = aniversariosProximos.filter(
    aniv => !lembretesDismissed.has(aniv.aniversario.id)
  );

  if (carregando || lembretesAtivos.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bell className="h-5 w-5" />
          Aniversários Próximos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lembretesAtivos.map((item) => {
          const { aniversario, diasRestantes, proximaData } = item;
          
          return (
            <div
              key={aniversario.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
            >
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {aniversario.nome}
                  </div>
                  <div className="text-sm text-gray-600">
                    {diasRestantes === 0 && "🎉 Aniversário hoje!"}
                    {diasRestantes === 1 && "🎂 Aniversário amanhã"}
                    {diasRestantes > 1 && `Aniversário em ${diasRestantes} dias`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(proximaData, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  {aniversario.observacoes && (
                    <div className="text-xs text-gray-400 mt-1">
                      {aniversario.observacoes}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {diasRestantes === 0 && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    Hoje
                  </Badge>
                )}
                {diasRestantes === 1 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Amanhã
                  </Badge>
                )}
                {diasRestantes > 1 && (
                  <Badge variant="secondary">
                    {diasRestantes} dias
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissLembrete(aniversario.id)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="text-xs text-gray-500 pt-2 border-t border-orange-200">
          💡 Dica: Não se esqueça de parabenizar os aniversariantes!
        </div>
      </CardContent>
    </Card>
  );
}
