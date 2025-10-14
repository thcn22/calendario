import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PerfilUsuario } from "@shared/api";
import { api } from "@/lib/api";

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  igrejaId?: string | null;
}

interface AuthContextType {
  token: string | null;
  usuario: UsuarioLogado | null;
  estaAutenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ProvedorAuth({ children }: { children: React.ReactNode }) {
  // Sem autenticação: não expor perfis. Retornamos usuario=null e funções no-op.
  const entrar = async (_email: string, _senha: string) => { /* no-op */ };
  const sair = () => { /* no-op */ };

  const value = useMemo(() => ({ token: null, usuario: null, estaAutenticado: true, entrar, sair }), []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de ProvedorAuth");
  return ctx;
}
