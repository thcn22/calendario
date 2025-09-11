import type { RequestHandler } from "express";
import { eventosDb } from "../data/database-temp";
import type { AtualizarEventoDTO, CriarEventoDTO, Evento } from "@shared/api";

function validarConflitos(evento: Evento, ignorarId?: string) {
  const eventos = eventosDb.buscarTodos();
  for (const ev of eventos) {
    if (ignorarId && ev.id === ignorarId) continue;
    if (ehConflito(evento, ev)) {
      return `Conflito de agendamento com o evento "${ev.titulo}"`;
    }
  }
  return null;
}

function ehConflito(evento: Evento, outro: Evento) {
  if (evento.igrejaId !== outro.igrejaId) return false;
  const mesmoRecursoOuEspacoPrincipal = (evento.recursoId ?? "__principal__") === (outro.recursoId ?? "__principal__");
  if (!mesmoRecursoOuEspacoPrincipal) return false;
  return sobrepoeIntervalo(new Date(evento.dataHoraInicio), new Date(evento.dataHoraFim), new Date(outro.dataHoraInicio), new Date(outro.dataHoraFim));
}

function sobrepoeIntervalo(aInicio: Date, aFim: Date, bInicio: Date, bFim: Date) {
  return aInicio < bFim && aFim > bInicio;
}

export const listarEventos: RequestHandler = (req, res) => {
  const { inicio, fim } = req.query as { inicio?: string; fim?: string };
  
  if (inicio && fim) {
    const eventos = eventosDb.buscarPorPeriodo(inicio, fim);
    return res.json(eventos);
  }
  
  const eventos = eventosDb.buscarTodos();
  return res.json(eventos);
};

export const criarEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const dados = req.body as CriarEventoDTO;
  
  if (!dados?.titulo || !dados?.dataHoraInicio || !dados?.dataHoraFim || !dados?.igrejaId) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }
  
  if (usuario.perfil === "membro") {
    return res.status(403).json({ erro: "Permissão negada" });
  }
  
  if (usuario.perfil === "lider" && usuario.igrejaId && usuario.igrejaId !== dados.igrejaId) {
    return res.status(403).json({ erro: "Líder só pode criar eventos da sua igreja" });
  }
  
  const novo: Evento = {
    id: '', // será gerado automaticamente
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
  
  const criado = eventosDb.criar(novo);
  return res.status(201).json(criado);
};

export const atualizarEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const { id } = req.params as { id: string };
  const dados = req.body as AtualizarEventoDTO;
  
  const atual = eventosDb.buscarPorId(id);
  if (!atual) return res.status(404).json({ erro: "Evento não encontrado" });
  
  if (usuario.perfil === "membro") {
    return res.status(403).json({ erro: "Permissão negada" });
  }
  
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
  
  const atualizado = eventosDb.atualizar(id, dados);
  return res.json(atualizado);
};

export const removerEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario!;
  const { id } = req.params as { id: string };
  
  const atual = eventosDb.buscarPorId(id);
  if (!atual) return res.status(404).json({ erro: "Evento não encontrado" });
  
  if (usuario.perfil === "membro") {
    return res.status(403).json({ erro: "Permissão negada" });
  }
  
  if (usuario.perfil === "lider" && usuario.igrejaId && usuario.igrejaId !== atual.igrejaId) {
    return res.status(403).json({ erro: "Líder só pode excluir eventos da sua igreja" });
  }
  
  eventosDb.deletar(id);
  return res.status(204).send();
};
