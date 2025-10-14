// Banco de dados temporário usando JSON até resolver o better-sqlite3
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db-temp.json');

interface DatabaseData {
  usuarios: any[];
  eventos: any[];
  aniversarios: any[];
  igrejas: any[];
  recursos: any[];
  departamentos: any[];
  orgaos: any[];
}

// Dados padrão
const dadosIniciais: DatabaseData = {
  usuarios: [],
  eventos: [],
  aniversarios: [],
  igrejas: [],
  recursos: [],
  departamentos: [],
  orgaos: []
};

// Carregar dados do arquivo
function carregarDados(): DatabaseData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      return { ...dadosIniciais, ...dados };
    }
  } catch (error) {
    console.warn('Erro ao carregar dados:', error);
  }
  return dadosIniciais;
}

// Salvar dados no arquivo
function salvarDados(dados: DatabaseData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

let dados = carregarDados();

// Função para inicializar o banco (compatível com a interface SQLite)
export function inicializarDatabase() {
  console.log('Database temporário inicializado (JSON)');
  
  // Inicializar usuários de teste se não existirem
  if (dados.usuarios.length === 0) {
    inicializarUsuariosTeste();
  }
  
  return true;
}

// Função para criar usuários de teste
async function inicializarUsuariosTeste() {
  try {
    // Não criar igreja padrão automaticamente
    let igrejaId = null;
    
    // Se não há igrejas, criar uma igreja de exemplo (opcional)
    if (dados.igrejas.length === 0) {
      const igrejaPadrao = {
        id: Date.now().toString(),
        nome: "Primeira Igreja",
        endereco: "Endereço da Primeira Igreja",
        codigoCor: "#16a34a",
        criadoEm: new Date().toISOString()
      };
      dados.igrejas.push(igrejaPadrao);
      igrejaId = igrejaPadrao.id;
    } else {
      igrejaId = dados.igrejas[0].id;
    }

    // Usuários de teste
    const usuariosTeste = [
      {
        nome: "Administrador",
        email: "admin@agendaviva.app",
        senha: "admin123",
        perfil: "administrador",
        igrejaId: igrejaId,
        dataNascimento: null
      },
      {
        nome: "Líder Central",
        email: "lider@central.app",
        senha: "lider123",
        perfil: "lider",
        igrejaId: igrejaId,
        dataNascimento: "1980-05-15"
      },
      {
        nome: "Membro Jardim",
        email: "membro@jardim.app",
        senha: "membro123",
        perfil: "membro",
        igrejaId: igrejaId,
        dataNascimento: "1990-08-20"
      }
    ];

    for (const usuario of usuariosTeste) {
      await usuariosDb.criar(usuario);
    }

    console.log('Usuários de teste criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar usuários de teste:', error);
  }
}

// Usuários
export const usuariosDb = {
  todos: () => dados.usuarios,
  buscarTodos: () => dados.usuarios,
  
  buscarPorId: (id: string) => 
    dados.usuarios.find(u => u.id === id),
  
  buscarPorEmail: (email: string) => 
    dados.usuarios.find(u => u.email === email),
  
  criar: async (usuario: any) => {
    const id = Date.now().toString();
    const senhaHash = await bcrypt.hash(usuario.senha, 10);
    const novoUsuario = {
      ...usuario,
      id,
      senhaHash,
      criadoEm: new Date().toISOString()
    };
    delete novoUsuario.senha; // Remove senha não hash
    dados.usuarios.push(novoUsuario);
    salvarDados(dados);
    return novoUsuario;
  },
  
  atualizar: async (id: string, dadosUpdate: any) => {
    const index = dados.usuarios.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    if (dadosUpdate.senha) {
      dadosUpdate.senhaHash = await bcrypt.hash(dadosUpdate.senha, 10);
      delete dadosUpdate.senha;
    }
    
    dados.usuarios[index] = { ...dados.usuarios[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.usuarios[index];
  },
  
  deletar: (id: string) => {
    const index = dados.usuarios.findIndex(u => u.id === id);
    if (index === -1) return false;
    dados.usuarios.splice(index, 1);
    salvarDados(dados);
    return true;
  }
};

// Eventos
export const eventosDb = {
  todos: () => dados.eventos,
  buscarTodos: () => dados.eventos,
  
  buscarPorId: (id: string) =>
    dados.eventos.find(e => e.id === id),
  
  buscarPorPeriodo: (inicio: string, fim: string) =>
    dados.eventos.filter(e => {
      const eventoInicio = new Date(e.dataHoraInicio);
      const eventoFim = new Date(e.dataHoraFim);
      const periodoInicio = new Date(inicio);
      const periodoFim = new Date(fim);
      return eventoInicio < periodoFim && eventoFim > periodoInicio;
    }),
  
  criar: (evento: any) => {
    const id = Date.now().toString();
    const novoEvento = {
      ...evento,
      responsavel: evento.responsavel ?? null,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.eventos.push(novoEvento);
    salvarDados(dados);
    return novoEvento;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.eventos.findIndex(e => e.id === id);
    if (index === -1) return null;
    dados.eventos[index] = { ...dados.eventos[index], ...dadosUpdate };
    if (dadosUpdate.responsavel !== undefined) {
      dados.eventos[index].responsavel = dadosUpdate.responsavel;
    }
    salvarDados(dados);
    return dados.eventos[index];
  },
  
  deletar: (id: string) => {
    const index = dados.eventos.findIndex(e => e.id === id);
    if (index === -1) return false;
    dados.eventos.splice(index, 1);
    salvarDados(dados);
    return true;
  }
};

// Aniversários
export const aniversariosDb = {
  todos: () => dados.aniversarios,
  buscarTodos: () => dados.aniversarios,
  
  buscarPorId: (id: string) =>
    dados.aniversarios.find(a => a.id === id),
  
  buscarPorMes: (mes: number) =>
    dados.aniversarios.filter(a => a.mes === mes),
  
  criar: (aniversario: any) => {
    const id = Date.now().toString();
    const novoAniversario = {
      ...aniversario,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.aniversarios.push(novoAniversario);
    salvarDados(dados);
    return novoAniversario;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.aniversarios.findIndex(a => a.id === id);
    if (index === -1) return null;
    dados.aniversarios[index] = { ...dados.aniversarios[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.aniversarios[index];
  },
  
  deletar: (id: string) => {
    const index = dados.aniversarios.findIndex(a => a.id === id);
    if (index === -1) return false;
    dados.aniversarios.splice(index, 1);
    salvarDados(dados);
    return true;
  }
};

// Igrejas
export const igrejasDb = {
  todos: () => dados.igrejas,
  buscarTodos: () => dados.igrejas,
  
  buscarPorId: (id: string) =>
    dados.igrejas.find(i => i.id === id),
  
  criar: (igreja: any) => {
    const id = Date.now().toString();
    const novaIgreja = {
      ...igreja,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.igrejas.push(novaIgreja);
    salvarDados(dados);
    return novaIgreja;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.igrejas.findIndex(i => i.id === id);
    if (index === -1) return null;
    dados.igrejas[index] = { ...dados.igrejas[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.igrejas[index];
  },
  
  deletar: (id: string) => {
    const index = dados.igrejas.findIndex(i => i.id === id);
    if (index === -1) return false;
    dados.igrejas.splice(index, 1);
    salvarDados(dados);
    return true;
  }
};

// Recursos
export const recursosDb = {
  todos: () => dados.recursos,
  buscarTodos: () => dados.recursos,
  
  buscarPorId: (id: string) =>
    dados.recursos.find(r => r.id === id),
  
  criar: (recurso: any) => {
    const id = Date.now().toString();
    const novoRecurso = {
      ...recurso,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.recursos.push(novoRecurso);
    salvarDados(dados);
    return novoRecurso;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.recursos.findIndex(r => r.id === id);
    if (index === -1) return null;
    dados.recursos[index] = { ...dados.recursos[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.recursos[index];
  },
  
  deletar: (id: string) => {
    const index = dados.recursos.findIndex(r => r.id === id);
    if (index === -1) return false;
    dados.recursos.splice(index, 1);
    salvarDados(dados);
    return true;
  }
};

// Departamentos
export const departamentosDb = {
  todos: () => dados.departamentos,
  buscarTodos: () => dados.departamentos,
  
  buscarPorId: (id: string) =>
    dados.departamentos.find(d => d.id === id),
  
  buscarPorIgreja: (igrejaId: string) =>
    dados.departamentos.filter(d => d.igrejaId === igrejaId),
  
  criar: (departamento: any) => {
    const id = Date.now().toString() + Math.random();
    const novoDepartamento = {
      ...departamento,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.departamentos.push(novoDepartamento);
    salvarDados(dados);
    return novoDepartamento;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.departamentos.findIndex(d => d.id === id);
    if (index === -1) return null;
    dados.departamentos[index] = { ...dados.departamentos[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.departamentos[index];
  },
  
  deletar: (id: string) => {
    const index = dados.departamentos.findIndex(d => d.id === id);
    if (index === -1) return false;
    dados.departamentos.splice(index, 1);
    salvarDados(dados);
    return true;
  },
  
  deletarPorIgreja: (igrejaId: string) => {
    dados.departamentos = dados.departamentos.filter(d => d.igrejaId !== igrejaId);
    salvarDados(dados);
  }
};

// Órgãos
export const orgaosDb = {
  todos: () => dados.orgaos,
  buscarTodos: () => dados.orgaos,
  
  buscarPorId: (id: string) =>
    dados.orgaos.find(o => o.id === id),
  
  buscarPorIgreja: (igrejaId: string) =>
    dados.orgaos.filter(o => o.igrejaId === igrejaId),
  
  criar: (orgao: any) => {
    const id = Date.now().toString() + Math.random();
    const novoOrgao = {
      ...orgao,
      id,
      criadoEm: new Date().toISOString()
    };
    dados.orgaos.push(novoOrgao);
    salvarDados(dados);
    return novoOrgao;
  },
  
  atualizar: (id: string, dadosUpdate: any) => {
    const index = dados.orgaos.findIndex(o => o.id === id);
    if (index === -1) return null;
    dados.orgaos[index] = { ...dados.orgaos[index], ...dadosUpdate };
    salvarDados(dados);
    return dados.orgaos[index];
  },
  
  deletar: (id: string) => {
    const index = dados.orgaos.findIndex(o => o.id === id);
    if (index === -1) return false;
    dados.orgaos.splice(index, 1);
    salvarDados(dados);
    return true;
  },
  
  deletarPorIgreja: (igrejaId: string) => {
    dados.orgaos = dados.orgaos.filter(o => o.igrejaId !== igrejaId);
    salvarDados(dados);
  }
};