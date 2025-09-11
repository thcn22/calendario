import { useAuth } from "@/hooks/use-auth";

export default function Admin() {
  const { usuario } = useAuth();
  const permitido = usuario?.perfil === "administrador";
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold mb-2">Painel de Administração</h1>
      {!permitido ? (
        <p className="text-muted-foreground">Apenas administradores podem acessar esta área.</p>
      ) : (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>CRUD de Usuários, Igrejas e Recursos será configurado aqui.</p>
          <p>Peça para eu completar esta seção quando desejar.</p>
        </div>
      )}
    </div>
  );
}
