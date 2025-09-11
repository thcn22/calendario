import type { RequestHandler } from "express";
import { db, gerarId, salvarDb } from "../data/store";

export const listarRecursos: RequestHandler = (_req, res) => {
  return res.json(db.recursos);
};

export const criarRecurso: RequestHandler = (req, res) => {
  const { nome, tipo, estaDisponivel } = req.body as { nome?: string; tipo?: "espaco" | "equipamento"; estaDisponivel?: boolean };
  if (!nome) return res.status(400).json({ erro: "Nome é obrigatório" });
  if (db.recursos.some((r) => r.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(409).json({ erro: "Recurso com esse nome já existe" });
  }
  const novo = { id: gerarId(), nome, tipo: tipo ?? null, estaDisponivel: estaDisponivel ?? true };
  db.recursos.push(novo);
  salvarDb();
  return res.status(201).json(novo);
};

export const atualizarRecurso: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const idx = db.recursos.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ erro: "Recurso não encontrado" });
  const { nome, tipo, estaDisponivel } = req.body as { nome?: string; tipo?: "espaco" | "equipamento"; estaDisponivel?: boolean };
  const atual = db.recursos[idx];
  db.recursos[idx] = { ...atual, nome: nome ?? atual.nome, tipo: (tipo ?? atual.tipo) as any, estaDisponivel: estaDisponivel ?? atual.estaDisponivel };
  salvarDb();
  return res.json(db.recursos[idx]);
};

export const removerRecurso: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const existe = db.recursos.some((r) => r.id === id);
  if (!existe) return res.status(404).json({ erro: "Recurso não encontrado" });
  db.recursos = db.recursos.filter((r) => r.id !== id);
  db.eventos = db.eventos.map((e) => (e.recursoId === id ? { ...e, recursoId: null } : e));
  salvarDb();
  return res.status(204).send();
};
