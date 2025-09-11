import type { RequestHandler } from "express";
import { db, gerarId, salvarDb } from "../data/store";
import bcrypt from "bcryptjs";
import type { PerfilUsuario } from "@shared/api";

export const listarUsuarios: RequestHandler = (_req, res) => {
  // Nunca expor senhaHash
  return res.json(db.usuarios.map(({ senhaHash, ...u }) => u));
};

export const criarUsuario: RequestHandler = (req, res) => {
  const { nome, email, senha, perfil, igrejaId, dataNascimento } = req.body as { nome?: string; email?: string; senha?: string; perfil?: PerfilUsuario; igrejaId?: string | null; dataNascimento?: string | null };
  if (!nome || !email || !senha || !perfil) return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  if (db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ erro: "Email já cadastrado" });
  const senhaHash = bcrypt.hashSync(senha, 10);
  const novo = { id: gerarId(), nome, email, senhaHash, perfil, igrejaId: igrejaId ?? null, dataNascimento: dataNascimento ?? null };
  db.usuarios.push(novo);
  salvarDb();
  const { senhaHash: _, ...ret } = novo;
  return res.status(201).json(ret);
};

export const atualizarUsuario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const idx = db.usuarios.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ erro: "Usuário não encontrado" });
  const { nome, email, senha, perfil, igrejaId, dataNascimento } = req.body as { nome?: string; email?: string; senha?: string; perfil?: PerfilUsuario; igrejaId?: string | null; dataNascimento?: string | null };
  const atual = db.usuarios[idx];
  const emailJaExiste = email && db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
  if (emailJaExiste) return res.status(409).json({ erro: "Email já cadastrado" });
  db.usuarios[idx] = {
    ...atual,
    nome: nome ?? atual.nome,
    email: email ?? atual.email,
    senhaHash: senha ? bcrypt.hashSync(senha, 10) : atual.senhaHash,
    perfil: (perfil ?? atual.perfil) as any,
    igrejaId: igrejaId ?? atual.igrejaId,
    dataNascimento: dataNascimento ?? atual.dataNascimento,
  };
  const { senhaHash: _, ...ret } = db.usuarios[idx];
  salvarDb();
  return res.json(ret);
};

export const removerUsuario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const existe = db.usuarios.some((u) => u.id === id);
  if (!existe) return res.status(404).json({ erro: "Usuário não encontrado" });
  db.usuarios = db.usuarios.filter((u) => u.id !== id);
  db.eventos = db.eventos.filter((e) => e.criadoPor !== id);
  salvarDb();
  return res.status(204).send();
};

export const aniversariantesDoDia: RequestHandler = (req, res) => {
  const agora = new Date();
  const dia = Number((req.query.dia as string) ?? agora.getDate());
  const mes = Number((req.query.mes as string) ?? agora.getMonth() + 1);
  const lista = db.usuarios
    .filter((u) => !!u.dataNascimento)
    .map((u) => ({ u, data: new Date(u.dataNascimento!) }))
    .filter(({ data }) => data.getDate() === dia && data.getMonth() + 1 === mes)
    .map(({ u }) => ({ id: u.id, nome: u.nome, dataNascimento: u.dataNascimento! }));
  return res.json(lista);
};

export const aniversariantesDoMes: RequestHandler = (req, res) => {
  const agora = new Date();
  const mes = Number((req.query.mes as string) ?? agora.getMonth() + 1);
  const lista = db.usuarios
    .filter((u) => !!u.dataNascimento)
    .map((u) => ({ u, data: new Date(u.dataNascimento!) }))
    .filter(({ data }) => data.getMonth() + 1 === mes)
    .map(({ u, data }) => ({ id: u.id, nome: u.nome, dia: data.getDate(), mes: data.getMonth() + 1 }));
  return res.json(lista);
};
