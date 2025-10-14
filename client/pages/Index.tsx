import CalendarioPrincipal from "@/components/agenda/CalendarioPrincipal";
import { useAuth } from "@/hooks/use-auth";

export default function Index() {
  return (
    <div className="space-y-4 fade-in">
      <CalendarioPrincipal />
    </div>
  );
}
