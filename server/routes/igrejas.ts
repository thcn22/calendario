import type { RequestHandler } from "express";
import { igrejasDb, eventosDb, usuariosDb, aniversariosDb } from "../data/database-temp";

export const listarIgrejas: RequestHandler = (_req, res) => {
  const igrejas = igrejasDb.buscarTodos();
  return res.json(igrejas);
};

export const criarIgreja: RequestHandler = (req, res) => {
  const { nome, endereco, codigoCor } = req.body as { nome?: string; endereco?: string; codigoCor?: string };
  if (!nome) return res.status(400).json({ erro: "Nome é obrigatório" });
  
  // Verificar se já existe igreja com esse nome
  const igrejas = igrejasDb.buscarTodos();
  if (igrejas.some((i) => i.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(409).json({ erro: "Igreja com esse nome já existe" });
  }
  
  const nova = igrejasDb.criar({
    nome: nome.trim(),
    endereco: endereco?.trim() || null,
    codigoCor: codigoCor || "#8b5e3b"
  });
  
  return res.status(201).json(nova);
};

export const atualizarIgreja: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const igreja = igrejasDb.buscarPorId(id);
  if (!igreja) return res.status(404).json({ erro: "Igreja não encontrada" });
  
  const { nome, endereco, codigoCor } = req.body as { nome?: string; endereco?: string; codigoCor?: string };
  
  const dadosAtualizacao: any = {};
  if (nome !== undefined) dadosAtualizacao.nome = nome.trim();
  if (endereco !== undefined) dadosAtualizacao.endereco = endereco?.trim();
  if (codigoCor !== undefined) dadosAtualizacao.codigoCor = codigoCor;
  
  const atualizada = igrejasDb.atualizar(id, dadosAtualizacao);
  return res.json(atualizada);
};

export const removerIgreja: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const igreja = igrejasDb.buscarPorId(id);
  if (!igreja) return res.status(404).json({ erro: "Igreja não encontrada" });
  
  // Remover relacionamentos
  const eventos = eventosDb.buscarTodos().filter(e => e.igrejaId === id);
  eventos.forEach(evento => eventosDb.deletar(evento.id));
  
  const usuarios = usuariosDb.buscarTodos().filter(u => u.igrejaId === id);
  usuarios.forEach(usuario => usuariosDb.deletar(usuario.id));
  
  const aniversarios = aniversariosDb.buscarTodos().filter(a => a.igrejaId === id);
  aniversarios.forEach(aniversario => aniversariosDb.deletar(aniversario.id));
  
  igrejasDb.deletar(id);
  return res.status(204).send();
};
