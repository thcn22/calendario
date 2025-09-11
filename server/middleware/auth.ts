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
  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SEGREDO) as UsuarioToken;
    req.usuario = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ erro: "Token inválido" });
  }
}

export function exigirPerfil(...perfis: PerfilUsuario[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const usuario = req.usuario;
    if (!usuario) return res.status(401).json({ erro: "Não autenticado" });
    if (!perfis.includes(usuario.perfil)) {
      return res.status(403).json({ erro: "Permissão negada" });
    }
    return next();
  };
}
