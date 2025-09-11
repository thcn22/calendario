import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AniversarianteModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}

export function AniversarianteModal({ aberto, onFechar, onSalvo }: AniversarianteModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState<Date>();
  const [perfil, setPerfil] = useState<"membro" | "lider" | "administrador">("membro");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setNome("");
    setEmail("");
    setDataNascimento(undefined);
    setPerfil("membro");
    setSenha("");
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

    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "O email é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!senha.trim()) {
      toast({
        title: "Erro",
        description: "A senha é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!dataNascimento) {
      toast({
        title: "Erro",
        description: "A data de nascimento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);

    try {
      await api.criarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        perfil,
        dataNascimento: format(dataNascimento, "yyyy-MM-dd"),
      });

      toast({
        title: "Sucesso",
        description: "Aniversariante adicionado com sucesso!",
      });

      handleFechar();
      onSalvo();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar aniversariante",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Aniversariante</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome*</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senha">Senha*</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha para acesso"
            />
          </div>

          <div className="grid gap-2">
            <Label>Data de Nascimento*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataNascimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataNascimento ? (
                    format(dataNascimento, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione a data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataNascimento}
                  onSelect={setDataNascimento}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Perfil</Label>
            <Select value={perfil} onValueChange={(value: any) => setPerfil(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="membro">Membro</SelectItem>
                <SelectItem value="lider">Líder</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
