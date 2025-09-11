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
  const [token, setToken] = useState<string | null>(localStorage.getItem("agenda_viva_token"));
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(() => {
    const salvo = localStorage.getItem("agenda_viva_usuario");
    return salvo ? JSON.parse(salvo) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("agenda_viva_token", token);
    else localStorage.removeItem("agenda_viva_token");
  }, [token]);

  useEffect(() => {
    if (usuario) localStorage.setItem("agenda_viva_usuario", JSON.stringify(usuario));
    else localStorage.removeItem("agenda_viva_usuario");
  }, [usuario]);

  async function entrar(email: string, senha: string) {
    const resp = await api.login({ email, senha });
    setToken(resp.token);
    setUsuario(resp.usuario);
  }
  function sair() {
    setToken(null);
    setUsuario(null);
  }

  const value = useMemo(() => ({ token, usuario, estaAutenticado: !!token, entrar, sair }), [token, usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de ProvedorAuth");
  return ctx;
}
