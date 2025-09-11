import type { RequestHandler } from "express";
import { db, salvarDb } from "../data/store";
import { gerarId } from "../data/store";

export const listarIgrejas: RequestHandler = (_req, res) => {
  return res.json(db.igrejas);
};

export const criarIgreja: RequestHandler = (req, res) => {
  const { nome, endereco, codigoCor } = req.body as { nome?: string; endereco?: string; codigoCor?: string };
  if (!nome) return res.status(400).json({ erro: "Nome é obrigatório" });
  if (db.igrejas.some((i) => i.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(409).json({ erro: "Igreja com esse nome já existe" });
  }
  const novo = { id: gerarId(), nome, endereco: endereco ?? null, codigoCor: codigoCor ?? null };
  db.igrejas.push(novo);
  salvarDb();
  return res.status(201).json(novo);
};

export const atualizarIgreja: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const idx = db.igrejas.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ erro: "Igreja não encontrada" });
  const { nome, endereco, codigoCor } = req.body as { nome?: string; endereco?: string; codigoCor?: string };
  const atual = db.igrejas[idx];
  db.igrejas[idx] = { ...atual, nome: nome ?? atual.nome, endereco: endereco ?? atual.endereco, codigoCor: codigoCor ?? atual.codigoCor };
  salvarDb();
  return res.json(db.igrejas[idx]);
};

export const removerIgreja: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const existe = db.igrejas.some((i) => i.id === id);
  if (!existe) return res.status(404).json({ erro: "Igreja não encontrada" });
  db.igrejas = db.igrejas.filter((i) => i.id !== id);
  // Remover relacionamentos simples
  db.eventos = db.eventos.filter((e) => e.igrejaId !== id);
  salvarDb();
  return res.status(204).send();
};
