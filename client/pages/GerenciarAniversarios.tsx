import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AniversariantesLista } from "@/components/agenda/AniversariantesLista";
import { Calendar, Gift, Users, Bell, FileText } from "lucide-react";
import { gerarRelatorioPDF } from "@/lib/relatorio-pdf";
import { useToast } from "@/hooks/use-toast";

export default function GerenciarAniversarios() {
  const [mesAtual] = useState(new Date().getMonth() + 1);
  const [exportando, setExportando] = useState(false);
  const { toast } = useToast();
  
  const meses = [
    { valor: 1, nome: "Janeiro" },
    { valor: 2, nome: "Fevereiro" },
    { valor: 3, nome: "Março" },
    { valor: 4, nome: "Abril" },
    { valor: 5, nome: "Maio" },
    { valor: 6, nome: "Junho" },
    { valor: 7, nome: "Julho" },
    { valor: 8, nome: "Agosto" },
    { valor: 9, nome: "Setembro" },
    { valor: 10, nome: "Outubro" },
    { valor: 11, nome: "Novembro" },
    { valor: 12, nome: "Dezembro" },
  ];

  const gerarRelatorio = () => {
    setExportando(true);
    try {
      const ok = gerarRelatorioPDF();
      if (ok) {
        toast({
          title: "Relatório gerado",
          description: "PDF baixado com sucesso.",
        });
      } else {
        toast({
          title: "Falha ao gerar",
          description: "Não foi possível gerar o PDF.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Gerenciar Aniversários</h1>
          <p className="text-muted-foreground">
            Adicione, visualize e gerencie aniversários da sua comunidade
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={gerarRelatorio}
            disabled={exportando}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Gerar Relatório PDF
          </Button>
        </div>
      </div>

      {/* (Estatísticas e lembretes temporariamente desativados até restauro completo) */}

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="mes-atual" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Este Mês
          </TabsTrigger>
          <TabsTrigger value="por-mes" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Por Mês
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <AniversariantesLista />
        </TabsContent>

        <TabsContent value="mes-atual">
          <AniversariantesLista mesAtual={mesAtual} />
        </TabsContent>

        <TabsContent value="por-mes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meses.map((mes) => (
              <Card key={mes.valor}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{mes.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AniversariantesLista mesAtual={mes.valor} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

  {/* Aba de lembretes removida temporariamente */}
      </Tabs>
    </div>
  );
}
