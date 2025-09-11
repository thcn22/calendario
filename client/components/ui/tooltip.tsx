import * as React from "react";
// import * as TooltipPrimitive from "@radix-ui/react-tooltip"; // pacote removido / não instalado

import { cn } from "@/lib/utils";

// Fallback simples se radix tooltip não estiver disponível
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => <>{children}</>;
const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function TooltipContent(
  { className, ...props }, ref) {
  return <div ref={ref} className={cn("hidden", className)} {...props} />; // oculto se fallback
});

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
