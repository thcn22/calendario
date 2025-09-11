import CalendarioPrincipal from "@/components/agenda/CalendarioPrincipal";
import { useAuth } from "@/hooks/use-auth";

export default function Index() {
  const { estaAutenticado } = useAuth();
  return (
    <div className="space-y-4 fade-in">
      {!estaAutenticado && (
        <div className="alert-creme alert-creme-warn">
          <span className="font-medium">Modo visitante:</span>
          <span> entre para criar e gerenciar atividades.</span>
        </div>
      )}
      <CalendarioPrincipal />
    </div>
  );
}
