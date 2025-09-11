import type { RequestHandler } from "express";
import { recursosDb, eventosDb } from "../data/database-temp";

export const listarRecursos: RequestHandler = (_req, res) => {
  const recursos = recursosDb.buscarTodos();
  return res.json(recursos);
};

export const criarRecurso: RequestHandler = (req, res) => {
  const { nome, tipo, estaDisponivel } = req.body as { nome?: string; tipo?: "espaco" | "equipamento"; estaDisponivel?: boolean };
  if (!nome) return res.status(400).json({ erro: "Nome é obrigatório" });
  
  // Verificar se já existe recurso com esse nome
  const recursos = recursosDb.buscarTodos();
  if (recursos.some((r) => r.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(409).json({ erro: "Recurso com esse nome já existe" });
  }
  
  const novo = recursosDb.criar({
    nome: nome.trim(),
    tipo: tipo || "equipamento",
    estaDisponivel: estaDisponivel ?? true
  });
  
  return res.status(201).json(novo);
};

export const atualizarRecurso: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const recurso = recursosDb.buscarPorId(id);
  if (!recurso) return res.status(404).json({ erro: "Recurso não encontrado" });
  
  const { nome, tipo, estaDisponivel } = req.body as { nome?: string; tipo?: "espaco" | "equipamento"; estaDisponivel?: boolean };
  
  const dadosAtualizacao: any = {};
  if (nome !== undefined) dadosAtualizacao.nome = nome.trim();
  if (tipo !== undefined) dadosAtualizacao.tipo = tipo;
  if (estaDisponivel !== undefined) dadosAtualizacao.estaDisponivel = estaDisponivel;
  
  const atualizado = recursosDb.atualizar(id, dadosAtualizacao);
  return res.json(atualizado);
};

export const removerRecurso: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const recurso = recursosDb.buscarPorId(id);
  if (!recurso) return res.status(404).json({ erro: "Recurso não encontrado" });
  
  // Remover associação com eventos (tornar recursoId null)
  const eventos = eventosDb.buscarTodos().filter(e => e.recursoId === id);
  eventos.forEach(evento => {
    eventosDb.atualizar(evento.id, { recursoId: null });
  });
  
  recursosDb.deletar(id);
  return res.status(204).send();
};
