import type { RequestHandler } from "express";
import { aniversariosDb } from "../data/database-temp";
import type { CriarAniversarioDTO } from "@shared/api";

export const listarAniversarios: RequestHandler = (_req, res) => {
  const aniversarios = aniversariosDb.buscarTodos();
  return res.json(aniversarios);
};

export const criarAniversario: RequestHandler = (req, res) => {
  const { nome, dia, mes, ano, igrejaId, observacoes } = req.body as CriarAniversarioDTO;
  const usuario = (req as any).usuario;
  // Permitir criar mesmo sem autenticação
  const criadoPor = usuario?.id || "anon";
  const igrejaIdFinal = igrejaId || usuario?.igrejaId || "default";

  if (!nome || !dia || !mes) {
    return res.status(400).json({ erro: "Nome, dia e mês são obrigatórios" });
  }

  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "Dia deve estar entre 1-31 e mês entre 1-12" });
  }

  const novo = aniversariosDb.criar({
    nome: nome.trim(),
    dia,
    mes,
    ano: ano || null,
    observacoes: observacoes?.trim() || null,
    criadoPor,
    igrejaId: igrejaIdFinal
  });

  return res.status(201).json(novo);
};

export const atualizarAniversario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const { nome, dia, mes, ano, igrejaId, observacoes } = req.body as Partial<CriarAniversarioDTO>;
  
  const atual = aniversariosDb.buscarPorId(id);
  if (!atual) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  if (dia && (dia < 1 || dia > 31)) {
    return res.status(400).json({ erro: "Dia deve estar entre 1-31" });
  }
  
  if (mes && (mes < 1 || mes > 12)) {
    return res.status(400).json({ erro: "Mês deve estar entre 1-12" });
  }
  
  const dadosAtualizacao: any = {};
  if (nome !== undefined) dadosAtualizacao.nome = nome.trim();
  if (dia !== undefined) dadosAtualizacao.dia = dia;
  if (mes !== undefined) dadosAtualizacao.mes = mes;
  if (ano !== undefined) dadosAtualizacao.ano = ano;
  if (igrejaId !== undefined) dadosAtualizacao.igrejaId = igrejaId;
  if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes?.trim();
  
  const atualizado = aniversariosDb.atualizar(id, dadosAtualizacao);
  return res.json(atualizado);
};

export const removerAniversario: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  
  const existe = aniversariosDb.buscarPorId(id);
  if (!existe) {
    return res.status(404).json({ erro: "Aniversário não encontrado" });
  }
  
  aniversariosDb.deletar(id);
  return res.status(204).send();
};

export const aniversariosPorMes: RequestHandler = (req, res) => {
  const mes = Number(req.query.mes as string);
  
  if (!mes || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "Mês deve estar entre 1-12" });
  }
  
  const aniversarios = aniversariosDb.buscarPorMes(mes)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      dia: a.dia,
      mes: a.mes,
      igrejaId: a.igrejaId,
      departamentoId: a.departamentoId || null,
      orgaoId: a.orgaoId || null
    }));
  
  return res.json(aniversarios);
};
