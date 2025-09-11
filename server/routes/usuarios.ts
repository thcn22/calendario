import type { RequestHandler } from "express";
import { usuariosDb, eventosDb, aniversariosDb } from "../data/database-temp";
import bcrypt from "bcryptjs";
import type { PerfilUsuario } from "@shared/api";

export const listarUsuarios: RequestHandler = (_req, res) => {
  const usuarios = usuariosDb.buscarTodos();
  // Nunca expor senhaHash
  return res.json(usuarios.map(({ senhaHash, ...u }) => u));
};

export const criarUsuario: RequestHandler = (req, res) => {
  const { nome, email, senha, perfil, igrejaId, dataNascimento } = req.body as { 
    nome?: string; 
    email?: string; 
    senha?: string; 
    perfil?: PerfilUsuario; 
    igrejaId?: string | null; 
    dataNascimento?: string | null 
  };
  
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }
  
  const usuarioExistente = usuariosDb.buscarPorEmail(email.toLowerCase());
  if (usuarioExistente) {
    return res.status(409).json({ erro: "Email já cadastrado" });
  }
  
  const senhaHash = bcrypt.hashSync(senha, 10);
  const novo = usuariosDb.criar({
    nome,
    email: email.toLowerCase(),
    senhaHash,
    perfil,
    igrejaId: igrejaId ?? null,
    dataNascimento: dataNascimento ?? null
  });
  
  const { senhaHash: _, ...ret } = novo;
  return res.status(201).json(ret);
};

export const atualizarUsuario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const usuario = usuariosDb.buscarPorId(id);
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
  
  const { nome, email, senha, perfil, igrejaId, dataNascimento } = req.body as { 
    nome?: string; 
    email?: string; 
    senha?: string; 
    perfil?: PerfilUsuario; 
    igrejaId?: string | null; 
    dataNascimento?: string | null 
  };
  
  if (email) {
    const emailJaExiste = usuariosDb.buscarPorEmail(email.toLowerCase());
    if (emailJaExiste && emailJaExiste.id !== id) {
      return res.status(409).json({ erro: "Email já cadastrado" });
    }
  }
  
  const dadosAtualizacao: any = {};
  if (nome !== undefined) dadosAtualizacao.nome = nome;
  if (email !== undefined) dadosAtualizacao.email = email.toLowerCase();
  if (senha !== undefined) dadosAtualizacao.senhaHash = bcrypt.hashSync(senha, 10);
  if (perfil !== undefined) dadosAtualizacao.perfil = perfil;
  if (igrejaId !== undefined) dadosAtualizacao.igrejaId = igrejaId;
  if (dataNascimento !== undefined) dadosAtualizacao.dataNascimento = dataNascimento;
  
  const atualizado = usuariosDb.atualizar(id, dadosAtualizacao);
  const { senhaHash: _, ...ret } = atualizado;
  return res.json(ret);
};

export const removerUsuario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const usuario = usuariosDb.buscarPorId(id);
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
  
  // Remover eventos criados pelo usuário
  const eventos = eventosDb.buscarTodos().filter(e => e.criadoPor === id);
  eventos.forEach(evento => eventosDb.deletar(evento.id));
  
  usuariosDb.deletar(id);
  return res.status(204).send();
};

export const aniversariantesDoDia: RequestHandler = (req, res) => {
  const agora = new Date();
  const dia = Number((req.query.dia as string) ?? agora.getDate());
  const mes = Number((req.query.mes as string) ?? agora.getMonth() + 1);
  
  // Buscar aniversários no dia e mês específicos
  const aniversarios = aniversariosDb.buscarPorMes(mes)
    .filter(a => a.dia === dia)
    .map(a => ({ id: a.id, nome: a.nome, dia: a.dia, mes: a.mes }));
  
  return res.json(aniversarios);
};

export const aniversariantesDoMes: RequestHandler = (req, res) => {
  const agora = new Date();
  const mes = Number((req.query.mes as string) ?? agora.getMonth() + 1);
  
  const aniversarios = aniversariosDb.buscarPorMes(mes)
    .map(a => ({ id: a.id, nome: a.nome, dia: a.dia, mes: a.mes }));
  
  return res.json(aniversarios);
};
