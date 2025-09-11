import type { RequestHandler } from "express";
import { db, gerarId, salvarDb } from "../data/store";
import type { CriarAniversarioDTO } from "@shared/api";

export const listarAniversarios: RequestHandler = (_req, res) => {
  return res.json(db.aniversarios || []);
};

export const criarAniversario: RequestHandler = (req, res) => {
  const { nome, dia, mes, ano, observacoes } = req.body as CriarAniversarioDTO;
  const usuario = (req as any).usuario;
  
  if (!nome || !dia || !mes) {
    return res.status(400).json({ erro: "Nome, dia e mês são obrigatórios" });
  }
  
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "Dia deve estar entre 1-31 e mês entre 1-12" });
  }
  
  const novo = {
    id: gerarId(),
    nome: nome.trim(),
    dia,
    mes,
    ano: ano || null,
    observacoes: observacoes?.trim() || null,
    criadoPor: usuario.id
  };
  
  if (!db.aniversarios) {
    db.aniversarios = [];
  }
  
  db.aniversarios.push(novo);
  salvarDb();
  return res.status(201).json(novo);
};

export const atualizarAniversario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { nome, dia, mes, ano, observacoes } = req.body as Partial<CriarAniversarioDTO>;
  
  if (!db.aniversarios) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  const idx = db.aniversarios.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  const atual = db.aniversarios[idx];
  
  if (dia && (dia < 1 || dia > 31)) {
    return res.status(400).json({ erro: "Dia deve estar entre 1-31" });
  }
  
  if (mes && (mes < 1 || mes > 12)) {
    return res.status(400).json({ erro: "Mês deve estar entre 1-12" });
  }
  
  db.aniversarios[idx] = {
    ...atual,
    nome: nome?.trim() ?? atual.nome,
    dia: dia ?? atual.dia,
    mes: mes ?? atual.mes,
    ano: ano ?? atual.ano,
    observacoes: observacoes?.trim() ?? atual.observacoes,
  };
  salvarDb();
  return res.json(db.aniversarios[idx]);
};

export const removerAniversario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  
  if (!db.aniversarios) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  const existe = db.aniversarios.some((a) => a.id === id);
  if (!existe) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  db.aniversarios = db.aniversarios.filter((a) => a.id !== id);
  salvarDb();
  return res.status(204).send();
};

export const aniversariosPorMes: RequestHandler = (req, res) => {
  const mes = Number(req.query.mes as string);
  
  if (!mes || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "Mês deve estar entre 1-12" });
  }
  
  if (!db.aniversarios) {
    return res.json([]);
  }
  
  const aniversariosDoMes = db.aniversarios
    .filter((a) => a.mes === mes)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      dia: a.dia,
      mes: a.mes
    }));
  
  return res.json(aniversariosDoMes);
};
