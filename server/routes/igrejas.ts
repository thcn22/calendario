import type { RequestHandler } from "express";
import { igrejasDb, eventosDb, usuariosDb, aniversariosDb, departamentosDb, orgaosDb } from "../data/database-temp";

// Departamentos fixos que toda igreja deve ter
const DEPARTAMENTOS_FIXOS = [
  "DEJEADALPE",
  "CRACEADALPE",
  "UMADALPE",
  "CEADALPE",
  "EBD",
  "DISCIPULADO",
  "ORAÇÃO MISSIONÁRIA",
  "CIRCULO DE ORAÇÃO",
  "DEPARTAMENTO INFANTIL"
];

// Gera uma cor hexadecimal aleatória
function gerarCorAleatoria(): string {
  const letras = '0123456789ABCDEF';
  let cor = '#';
  for (let i = 0; i < 6; i++) {
    cor += letras[Math.floor(Math.random() * 16)];
  }
  return cor;
}

export const listarIgrejas: RequestHandler = (_req, res) => {
  const igrejas = igrejasDb.buscarTodos();
  
  // Incluir departamentos e órgãos de cada igreja
  const igrejasComRelacionamentos = igrejas.map(igreja => ({
    ...igreja,
    departamentos: departamentosDb.buscarPorIgreja(igreja.id),
    orgaos: orgaosDb.buscarPorIgreja(igreja.id)
  }));
  
  return res.json(igrejasComRelacionamentos);
};

export const criarIgreja: RequestHandler = (req, res) => {
  const { nome, endereco, codigoCor, orgaos } = req.body as { 
    nome?: string; 
    endereco?: string; 
    codigoCor?: string;
    orgaos?: string[]; // Array de nomes de órgãos
  };
  
  if (!nome) return res.status(400).json({ erro: "Nome é obrigatório" });
  
  // Verificar se já existe igreja com esse nome
  const igrejas = igrejasDb.buscarTodos();
  if (igrejas.some((i) => i.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(409).json({ erro: "Igreja com esse nome já existe" });
  }
  
  // Criar a igreja com cor aleatória se não fornecida
  const corFinal = codigoCor || gerarCorAleatoria();
  const nova = igrejasDb.criar({
    nome: nome.trim(),
    endereco: endereco?.trim() || null,
    codigoCor: corFinal
  });
  
  // Criar departamentos fixos para a igreja
  const departamentosCriados = DEPARTAMENTOS_FIXOS.map(nomeDep => 
    departamentosDb.criar({
      nome: nomeDep,
      igrejaId: nova.id
    })
  );
  
  // Criar órgãos se fornecidos
  const orgaosCriados = (orgaos || []).map(nomeOrgao => 
    orgaosDb.criar({
      nome: nomeOrgao.trim(),
      igrejaId: nova.id
    })
  );
  
  // Retornar igreja com departamentos e órgãos
  return res.status(201).json({
    ...nova,
    departamentos: departamentosCriados,
    orgaos: orgaosCriados
  });
};

export const atualizarIgreja: RequestHandler = (req, res) => {
  const { id } = req.params as { id: string };
  const igreja = igrejasDb.buscarPorId(id);
  if (!igreja) return res.status(404).json({ erro: "Igreja não encontrada" });
  
  const { nome, endereco, codigoCor, orgaos } = req.body as { 
    nome?: string; 
    endereco?: string; 
    codigoCor?: string;
    orgaos?: string[]; // Array de nomes de órgãos
  };
  
  const dadosAtualizacao: any = {};
  if (nome !== undefined) dadosAtualizacao.nome = nome.trim();
  if (endereco !== undefined) dadosAtualizacao.endereco = endereco?.trim();
  if (codigoCor !== undefined) dadosAtualizacao.codigoCor = codigoCor;
  
  const atualizada = igrejasDb.atualizar(id, dadosAtualizacao);
  
  // Se órgãos foram fornecidos, atualizar (remover antigos e criar novos)
  if (orgaos !== undefined) {
    // Remover órgãos antigos
    orgaosDb.deletarPorIgreja(id);
    
    // Criar novos órgãos
    const orgaosCriados = orgaos.map(nomeOrgao => 
      orgaosDb.criar({
        nome: nomeOrgao.trim(),
        igrejaId: id
      })
    );
    
    return res.json({
      ...atualizada,
      departamentos: departamentosDb.buscarPorIgreja(id),
      orgaos: orgaosCriados
    });
  }
  
  return res.json({
    ...atualizada,
    departamentos: departamentosDb.buscarPorIgreja(id),
    orgaos: orgaosDb.buscarPorIgreja(id)
  });
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
  
  // Remover departamentos e órgãos
  departamentosDb.deletarPorIgreja(id);
  orgaosDb.deletarPorIgreja(id);
  
  igrejasDb.deletar(id);
  return res.status(204).send();
};
