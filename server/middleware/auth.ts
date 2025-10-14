import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { PerfilUsuario } from "@shared/api";

const JWT_SEGREDO = process.env.JWT_SEGREDO || "segredo-desenvolvimento-agenda-viva";

export interface UsuarioToken {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  igrejaId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function assinarToken(payload: UsuarioToken) {
  return jwt.sign(payload, JWT_SEGREDO, { expiresIn: "7d" });
}

export function autenticarToken(req: Request, res: Response, next: NextFunction) {
  // Removida obrigatoriedade de autenticação: este middleware agora popula
  // um usuário padrão quando nenhum token é fornecido, permitindo que
  // rotas funcionem sem login. Mantém compatibilidade com código que
  // espera req.usuario.
  const auth = req.header("authorization") || req.header("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SEGREDO) as UsuarioToken;
      req.usuario = decoded;
      return next();
    } catch (e) {
      // Se token inválido, ignorar e continuar com usuário padrão
    }
  }

  // Usuário padrão (permite todas as ações administrativas)
  req.usuario = {
    id: 'local-dev',
    nome: 'Usuário local',
    email: 'local@local.test',
    perfil: 'administrador',
    igrejaId: null,
  } as UsuarioToken;
  return next();
}

export function exigirPerfil(...perfis: PerfilUsuario[]) {
  // Tornar exigirPerfil um no-op: permissivo para evitar dependências de roles
  return function (_req: Request, _res: Response, next: NextFunction) {
    return next();
  };
}
