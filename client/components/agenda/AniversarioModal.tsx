import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AniversarioModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}

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

const dias = Array.from({ length: 31 }, (_, i) => i + 1);

export function AniversarioModal({ aberto, onFechar, onSalvo }: AniversarioModalProps) {
  const [nome, setNome] = useState("");
  const [dia, setDia] = useState<number | null>(null);
  const [mes, setMes] = useState<number | null>(null);
  const [ano, setAno] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setNome("");
    setDia(null);
    setMes(null);
    setAno(null);
    setObservacoes("");
  };

  const handleFechar = () => {
    resetForm();
    onFechar();
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!dia || !mes) {
      toast({
        title: "Erro",
        description: "Dia e mês são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar dia do mês
    const diasNoMes = new Date(2024, mes, 0).getDate(); // Usar 2024 (ano bissexto) para validação
    if (dia > diasNoMes) {
      toast({
        title: "Erro",
        description: `O mês ${meses.find(m => m.valor === mes)?.nome} não tem ${dia} dias`,
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);

    try {
      await api.criarAniversario({
        nome: nome.trim(),
        dia,
        mes,
        ano: ano || null,
        observacoes: observacoes.trim() || null,
      });

      toast({
        title: "Sucesso",
        description: "Aniversário adicionado com sucesso!",
      });

      handleFechar();
      onSalvo();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar aniversário",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const anoAtual = new Date().getFullYear();
  const anosDisponiveis = Array.from({ length: 100 }, (_, i) => anoAtual - i);

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Aniversário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome*</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da pessoa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Dia*</Label>
              <Select value={dia?.toString() || ""} onValueChange={(value) => setDia(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {dias.map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Mês*</Label>
              <Select value={mes?.toString() || ""} onValueChange={(value) => setMes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.valor} value={m.valor.toString()}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Ano de nascimento (opcional)</Label>
            <Select value={ano?.toString() || "nao-informar"} onValueChange={(value) => setAno(value === "nao-informar" ? null : parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao-informar">Não informar</SelectItem>
                {anosDisponiveis.map((a) => (
                  <SelectItem key={a} value={a.toString()}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas adicionais sobre o aniversário..."
              rows={3}
            />
          </div>

          {dia && mes && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              📅 <strong>Data:</strong> {dia.toString().padStart(2, '0')}/{mes.toString().padStart(2, '0')}
              {ano && ` de ${ano}`}
              <br />
              🎂 Será celebrado todos os anos nesta data
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
