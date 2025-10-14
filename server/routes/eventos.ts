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
  const usuario = req.usuario || null;
  const dados = req.body as CriarEventoDTO;
  
  if (!dados?.titulo || !dados?.dataHoraInicio || !dados?.dataHoraFim || !dados?.igrejaId) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }
  
  // Permitir criação de eventos sem checagem de perfil (aplicação sem login/roles)
  
  const novo: Evento = {
    id: '', // será gerado automaticamente
    titulo: dados.titulo,
    descricao: dados.descricao ?? null,
    responsavel: dados.responsavel ?? null,
    dataHoraInicio: new Date(dados.dataHoraInicio).toISOString(),
    dataHoraFim: new Date(dados.dataHoraFim).toISOString(),
    criadoPor: usuario?.id ?? 'local-dev',
    igrejaId: dados.igrejaId,
    recursoId: dados.recursoId ?? null,
    diaInteiro: Boolean(dados.diaInteiro),
    departamentoId: dados.departamentoId ?? null,
    orgaoId: dados.orgaoId ?? null,
  };
  
  const erro = validarConflitos(novo);
  if (erro) return res.status(409).json({ erro });
  
  const criado = eventosDb.criar(novo);
  return res.status(201).json(criado);
};

export const atualizarEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario || null;
  const { id } = req.params as { id: string };
  const dados = req.body as AtualizarEventoDTO;
  
  const atual = eventosDb.buscarPorId(id);
  if (!atual) return res.status(404).json({ erro: "Evento não encontrado" });
  
  // Sem restrições de perfil para edição
  
  const editado: Evento = {
    ...atual,
    ...dados,
    responsavel: dados.responsavel ?? atual.responsavel ?? null,
    dataHoraInicio: dados.dataHoraInicio ? new Date(dados.dataHoraInicio).toISOString() : atual.dataHoraInicio,
    dataHoraFim: dados.dataHoraFim ? new Date(dados.dataHoraFim).toISOString() : atual.dataHoraFim,
  };
  
  const erro = validarConflitos(editado, id);
  if (erro) return res.status(409).json({ erro });
  
  const atualizado = eventosDb.atualizar(id, dados);
  return res.json(atualizado);
};

export const removerEvento: RequestHandler = (req, res) => {
  const usuario = req.usuario || null;
  const { id } = req.params as { id: string };
  
  console.log(`[DEBUG] Tentativa de exclusão do evento ${id} pelo usuário ${usuario ? usuario.nome : 'anonimo'}`);
  
  const atual = eventosDb.buscarPorId(id);
  if (!atual) {
    console.log(`[DEBUG] Evento ${id} não encontrado`);
    return res.status(404).json({ erro: "Evento não encontrado" });
  }
  
  console.log(`[DEBUG] Evento encontrado: ${atual.titulo} da igreja ${atual.igrejaId}`);
  
  // Sem validações de perfil - exclusão permitida
  
  console.log(`[DEBUG] Excluindo evento ${id}`);
  const resultado = eventosDb.deletar(id);
  console.log(`[DEBUG] Resultado da exclusão: ${resultado}`);
  
  return res.status(204).send();
};
