import { useAuth } from "@/hooks/use-auth";

export default function Admin() {
  // Em modo sem autenticação/roles, exibir o painel de administração para todos
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold mb-2">Painel de Administração</h1>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>CRUD de Usuários, Igrejas e Recursos será configurado aqui.</p>
        <p>Peça para eu completar esta seção quando desejar.</p>
      </div>
    </div>
  );
}
