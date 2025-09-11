import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { usuariosDb } from "../data/database-temp";
import type { LoginRequisicao, LoginResposta } from "@shared/api";
import { assinarToken } from "../middleware/auth";

export const login: RequestHandler = (req, res) => {
  const { email, senha } = req.body as LoginRequisicao;
  if (!email || !senha) return res.status(400).json({ erro: "Email e senha são obrigatórios" });
  
  const usuario = usuariosDb.buscarPorEmail(email.toLowerCase());
  if (!usuario) return res.status(401).json({ erro: "Credenciais inválidas" });
  
  const ok = bcrypt.compareSync(senha, usuario.senhaHash);
  if (!ok) return res.status(401).json({ erro: "Credenciais inválidas" });
  
  const token = assinarToken({ 
    id: usuario.id, 
    nome: usuario.nome, 
    email: usuario.email, 
    perfil: usuario.perfil, 
    igrejaId: usuario.igrejaId 
  });
  
  const resposta: LoginResposta = { 
    token, 
    usuario: { 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email, 
      perfil: usuario.perfil, 
      igrejaId: usuario.igrejaId ?? null 
    } 
  };
  
  return res.json(resposta);
};
