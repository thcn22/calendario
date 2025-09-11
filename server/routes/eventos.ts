import type { RequestHandler } from "express";
import { db, ehConflito, gerarId, salvarDb } from "../data/store";
import type { AtualizarEventoDTO, CriarEventoDTO, Evento } from "@shared/api";

function validarConflitos(evento: Evento, ignorarId?: string) {
  for (const ev of db.eventos) {
    if (ignorarId && ev.id === ignorarId) continue;
    if (ehConflito(evento, ev)) {
      return `Conflito de agendamento com o evento "${ev.titulo}"`;
    }
  }
  return null;
}

export const listarEventos: RequestHandler = (req, res) => {
  const { inicio, fim } = req.query as { inicio?: string; fim?: string };
  let eventos = db.eventos;
  if (inicio && fim) {
    const i = new Date(inicio);
    const f = new Date(fim);
    eventos = eventos.filter((e) => new Date(e.dataHoraInicio) < f && new Date(e.dataHoraFim) > i);
  }
  return res.json(eventos);
};

export const criarEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const dados = req.body as CriarEventoDTO;
  if (!dados?.titulo || !dados?.dataHoraInicio || !dados?.dataHoraFim || !dados?.igrejaId) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }
  if (usuario.perfil === "membro") return res.status(403).json({ erro: "Permissão negada" });
  if (usuario.perfil === "lider" && usuario.igrejaId && usuario.igrejaId !== dados.igrejaId) {
    return res.status(403).json({ erro: "Líder só pode criar eventos da sua igreja" });
  }
  const novo: Evento = {
    id: gerarId(),
    titulo: dados.titulo,
    descricao: dados.descricao ?? null,
    dataHoraInicio: new Date(dados.dataHoraInicio).toISOString(),
    dataHoraFim: new Date(dados.dataHoraFim).toISOString(),
    criadoPor: usuario.id,
    igrejaId: dados.igrejaId,
    recursoId: dados.recursoId ?? null,
    diaInteiro: Boolean(dados.diaInteiro),
  };
  const erro = validarConflitos(novo);
  if (erro) return res.status(409).json({ erro });
  db.eventos.push(novo);
  salvarDb();
  return res.status(201).json(novo);
};

export const atualizarEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const { id } = req.params as { id: string };
  const dados = req.body as AtualizarEventoDTO;
  const idx = db.eventos.findIndex((e) => e.id === id);
  if (idx === -1) return res.status(404).json({ erro: "Evento não encontrado" });
  const atual = db.eventos[idx];
  if (usuario.perfil === "membro") return res.status(403).json({ erro: "Permissão negada" });
  if (usuario.perfil === "lider" && usuario.igrejaId && usuario.igrejaId !== (dados.igrejaId ?? atual.igrejaId)) {
    return res.status(403).json({ erro: "Líder só pode editar eventos da sua igreja" });
  }
  const editado: Evento = {
    ...atual,
    ...dados,
    dataHoraInicio: dados.dataHoraInicio ? new Date(dados.dataHoraInicio).toISOString() : atual.dataHoraInicio,
    dataHoraFim: dados.dataHoraFim ? new Date(dados.dataHoraFim).toISOString() : atual.dataHoraFim,
  };
  const erro = validarConflitos(editado, id);
  if (erro) return res.status(409).json({ erro });
  db.eventos[idx] = editado;
  salvarDb();
  return res.json(editado);
};

export const removerEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const { id } = req.params as { id: string };
  const atual = db.eventos.find((e) => e.id === id);
  if (!atual) return res.status(404).json({ erro: "Evento não encontrado" });
  if (usuario.perfil === "membro") return res.status(403).json({ erro: "Permissão negada" });
  if (usuario.perfil === "lider" && usuario.igrejaId && usuario.igrejaId !== atual.igrejaId) {
    return res.status(403).json({ erro: "Líder só pode excluir eventos da sua igreja" });
  }
  db.eventos = db.eventos.filter((e) => e.id !== id);
  salvarDb();
  return res.status(204).send();
};
