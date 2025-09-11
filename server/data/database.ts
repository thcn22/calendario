import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import type { Evento, Igreja, Recurso, Usuario, Aniversario } from '@shared/api';

// Caminho do banco de dados (portável)
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_PATH = path.join(DATA_DIR, 'vibe-landing.db');

let db: Database.Database;

function garantirDiretorio() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function inicializarDatabase() {
  garantirDiretorio();
  
  db = new Database(DB_PATH);
  
  // Configurações para melhor performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000000');
  db.pragma('temp_store = memory');
  
  criarTabelas();
  semearDados();
  
  return db;
}

function criarTabelas() {
  // Tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senhaHash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK (perfil IN ('administrador', 'lider', 'membro')),
      igrejaId TEXT NOT NULL,
      dataNascimento TEXT,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (igrejaId) REFERENCES igrejas(id)
    )
  `);

  // Tabela de igrejas
  db.exec(`
    CREATE TABLE IF NOT EXISTS igrejas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      endereco TEXT,
      codigoCor TEXT DEFAULT '#8b5e3b',
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de recursos
  db.exec(`
    CREATE TABLE IF NOT EXISTS recursos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('equipamento', 'espaco')),
      estaDisponivel INTEGER DEFAULT 1,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de eventos
  db.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT,
      dataHoraInicio TEXT NOT NULL,
      dataHoraFim TEXT NOT NULL,
      igrejaId TEXT NOT NULL,
      criadoPor TEXT NOT NULL,
      recursoId TEXT,
      diaInteiro INTEGER DEFAULT 0,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (igrejaId) REFERENCES igrejas(id),
      FOREIGN KEY (criadoPor) REFERENCES usuarios(id),
      FOREIGN KEY (recursoId) REFERENCES recursos(id)
    )
  `);

  // Tabela de aniversários
  db.exec(`
    CREATE TABLE IF NOT EXISTS aniversarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 31),
      mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
      ano INTEGER,
      observacoes TEXT,
      criadoPor TEXT NOT NULL,
      igrejaId TEXT NOT NULL,
      criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (criadoPor) REFERENCES usuarios(id),
      FOREIGN KEY (igrejaId) REFERENCES igrejas(id)
    )
  `);

  // Índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_eventos_igreja ON eventos(igrejaId);
    CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(dataHoraInicio, dataHoraFim);
    CREATE INDEX IF NOT EXISTS idx_aniversarios_igreja ON aniversarios(igrejaId);
    CREATE INDEX IF NOT EXISTS idx_aniversarios_mes ON aniversarios(mes);
  `);
}

function semearDados() {
  // Verificar se já existem dados
  const igrejaCount = db.prepare('SELECT COUNT(*) as count FROM igrejas').get() as { count: number };
  if (igrejaCount.count > 0) return; // Já tem dados

  console.log('Semeando dados iniciais...');

  const transaction = db.transaction(() => {
    // Igreja padrão
    const igrejaCentral = {
      id: randomUUID(),
      nome: 'Igreja Central',
      endereco: 'Rua Principal, 100',
      codigoCor: '#8b5e3b'
    };

    db.prepare(`
      INSERT INTO igrejas (id, nome, endereco, codigoCor)
      VALUES (?, ?, ?, ?)
    `).run(igrejaCentral.id, igrejaCentral.nome, igrejaCentral.endereco, igrejaCentral.codigoCor);

    // Recursos padrão
    const recursos = [
      { id: randomUUID(), nome: 'Projetor Multimidia', tipo: 'equipamento', estaDisponivel: 1 },
      { id: randomUUID(), nome: 'Salao Principal', tipo: 'espaco', estaDisponivel: 1 },
      { id: randomUUID(), nome: 'Sala Juventude', tipo: 'espaco', estaDisponivel: 1 }
    ];

    const insertRecurso = db.prepare(`
      INSERT INTO recursos (id, nome, tipo, estaDisponivel)
      VALUES (?, ?, ?, ?)
    `);

    recursos.forEach(recurso => {
      insertRecurso.run(recurso.id, recurso.nome, recurso.tipo, recurso.estaDisponivel);
    });

    // Usuários padrão
    const senhaAdmin = bcrypt.hashSync('admin123', 10);
    const senhaLider = bcrypt.hashSync('lider123', 10);
    const senhaMembro = bcrypt.hashSync('membro123', 10);

    const usuarios = [
      {
        id: randomUUID(),
        nome: 'Administrador',
        email: 'admin@agendaviva.app',
        senhaHash: senhaAdmin,
        perfil: 'administrador',
        igrejaId: igrejaCentral.id
      },
      {
        id: randomUUID(),
        nome: 'Líder Central',
        email: 'lider@central.app',
        senhaHash: senhaLider,
        perfil: 'lider',
        igrejaId: igrejaCentral.id
      },
      {
        id: randomUUID(),
        nome: 'Membro Central',
        email: 'membro@central.app',
        senhaHash: senhaMembro,
        perfil: 'membro',
        igrejaId: igrejaCentral.id
      }
    ];

    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (id, nome, email, senhaHash, perfil, igrejaId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    usuarios.forEach(usuario => {
      insertUsuario.run(
        usuario.id,
        usuario.nome,
        usuario.email,
        usuario.senhaHash,
        usuario.perfil,
        usuario.igrejaId
      );
    });
  });

  transaction();
  console.log('Dados iniciais semeados com sucesso!');
}

// Funções CRUD para Usuários
export const usuariosDb = {
  buscarTodos: () => {
    return db.prepare('SELECT * FROM usuarios ORDER BY nome').all() as Usuario[];
  },

  buscarPorId: (id: string) => {
    return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as Usuario | undefined;
  },

  buscarPorEmail: (email: string) => {
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email) as Usuario | undefined;
  },

  criar: (usuario: Omit<Usuario, 'id'> & { id?: string }) => {
    const id = usuario.id || randomUUID();
    const stmt = db.prepare(`
      INSERT INTO usuarios (id, nome, email, senhaHash, perfil, igrejaId, dataNascimento)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      usuario.nome,
      usuario.email,
      usuario.senhaHash,
      usuario.perfil,
      usuario.igrejaId,
      usuario.dataNascimento || null
    );
    
    return usuariosDb.buscarPorId(id)!;
  },

  atualizar: (id: string, usuario: Partial<Usuario>) => {
    const campos = [];
    const valores = [];
    
    if (usuario.nome !== undefined) { campos.push('nome = ?'); valores.push(usuario.nome); }
    if (usuario.email !== undefined) { campos.push('email = ?'); valores.push(usuario.email); }
    if (usuario.senhaHash !== undefined) { campos.push('senhaHash = ?'); valores.push(usuario.senhaHash); }
    if (usuario.perfil !== undefined) { campos.push('perfil = ?'); valores.push(usuario.perfil); }
    if (usuario.igrejaId !== undefined) { campos.push('igrejaId = ?'); valores.push(usuario.igrejaId); }
    if (usuario.dataNascimento !== undefined) { campos.push('dataNascimento = ?'); valores.push(usuario.dataNascimento); }
    
    campos.push('atualizadoEm = CURRENT_TIMESTAMP');
    valores.push(id);
    
    const stmt = db.prepare(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`);
    stmt.run(...valores);
    
    return usuariosDb.buscarPorId(id)!;
  },

  deletar: (id: string) => {
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funções CRUD para Igrejas
export const igrejasDb = {
  buscarTodas: () => {
    return db.prepare('SELECT * FROM igrejas ORDER BY nome').all() as Igreja[];
  },

  buscarPorId: (id: string) => {
    return db.prepare('SELECT * FROM igrejas WHERE id = ?').get(id) as Igreja | undefined;
  },

  criar: (igreja: Omit<Igreja, 'id'> & { id?: string }) => {
    const id = igreja.id || randomUUID();
    const stmt = db.prepare(`
      INSERT INTO igrejas (id, nome, endereco, codigoCor)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, igreja.nome, igreja.endereco || '', igreja.codigoCor || '#8b5e3b');
    return igrejasDb.buscarPorId(id)!;
  },

  atualizar: (id: string, igreja: Partial<Igreja>) => {
    const campos = [];
    const valores = [];
    
    if (igreja.nome !== undefined) { campos.push('nome = ?'); valores.push(igreja.nome); }
    if (igreja.endereco !== undefined) { campos.push('endereco = ?'); valores.push(igreja.endereco); }
    if (igreja.codigoCor !== undefined) { campos.push('codigoCor = ?'); valores.push(igreja.codigoCor); }
    
    campos.push('atualizadoEm = CURRENT_TIMESTAMP');
    valores.push(id);
    
    const stmt = db.prepare(`UPDATE igrejas SET ${campos.join(', ')} WHERE id = ?`);
    stmt.run(...valores);
    
    return igrejasDb.buscarPorId(id)!;
  },

  deletar: (id: string) => {
    const stmt = db.prepare('DELETE FROM igrejas WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funções CRUD para Recursos
export const recursosDb = {
  buscarTodos: () => {
    return db.prepare('SELECT * FROM recursos ORDER BY nome').all() as Recurso[];
  },

  buscarPorId: (id: string) => {
    return db.prepare('SELECT * FROM recursos WHERE id = ?').get(id) as Recurso | undefined;
  },

  criar: (recurso: Omit<Recurso, 'id'> & { id?: string }) => {
    const id = recurso.id || randomUUID();
    const stmt = db.prepare(`
      INSERT INTO recursos (id, nome, tipo, estaDisponivel)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, recurso.nome, recurso.tipo, recurso.estaDisponivel ? 1 : 0);
    return recursosDb.buscarPorId(id)!;
  },

  atualizar: (id: string, recurso: Partial<Recurso>) => {
    const campos = [];
    const valores = [];
    
    if (recurso.nome !== undefined) { campos.push('nome = ?'); valores.push(recurso.nome); }
    if (recurso.tipo !== undefined) { campos.push('tipo = ?'); valores.push(recurso.tipo); }
    if (recurso.estaDisponivel !== undefined) { campos.push('estaDisponivel = ?'); valores.push(recurso.estaDisponivel ? 1 : 0); }
    
    campos.push('atualizadoEm = CURRENT_TIMESTAMP');
    valores.push(id);
    
    const stmt = db.prepare(`UPDATE recursos SET ${campos.join(', ')} WHERE id = ?`);
    stmt.run(...valores);
    
    return recursosDb.buscarPorId(id)!;
  },

  deletar: (id: string) => {
    const stmt = db.prepare('DELETE FROM recursos WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funções CRUD para Eventos
export const eventosDb = {
  buscarTodos: () => {
    return db.prepare('SELECT * FROM eventos ORDER BY dataHoraInicio').all() as Evento[];
  },

  buscarPorId: (id: string) => {
    return db.prepare('SELECT * FROM eventos WHERE id = ?').get(id) as Evento | undefined;
  },

  buscarPorIgreja: (igrejaId: string) => {
    return db.prepare('SELECT * FROM eventos WHERE igrejaId = ? ORDER BY dataHoraInicio').all(igrejaId) as Evento[];
  },

  buscarPorPeriodo: (inicio: string, fim: string) => {
    return db.prepare(`
      SELECT * FROM eventos 
      WHERE dataHoraInicio >= ? AND dataHoraInicio <= ?
      ORDER BY dataHoraInicio
    `).all(inicio, fim) as Evento[];
  },

  criar: (evento: Omit<Evento, 'id'> & { id?: string }) => {
    const id = evento.id || randomUUID();
    const stmt = db.prepare(`
      INSERT INTO eventos (id, titulo, descricao, dataHoraInicio, dataHoraFim, igrejaId, criadoPor, recursoId, diaInteiro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      evento.titulo,
      evento.descricao || '',
      evento.dataHoraInicio,
      evento.dataHoraFim,
      evento.igrejaId,
      evento.criadoPor,
      evento.recursoId || null,
      evento.diaInteiro ? 1 : 0
    );
    
    return eventosDb.buscarPorId(id)!;
  },

  atualizar: (id: string, evento: Partial<Evento>) => {
    const campos = [];
    const valores = [];
    
    if (evento.titulo !== undefined) { campos.push('titulo = ?'); valores.push(evento.titulo); }
    if (evento.descricao !== undefined) { campos.push('descricao = ?'); valores.push(evento.descricao); }
    if (evento.dataHoraInicio !== undefined) { campos.push('dataHoraInicio = ?'); valores.push(evento.dataHoraInicio); }
    if (evento.dataHoraFim !== undefined) { campos.push('dataHoraFim = ?'); valores.push(evento.dataHoraFim); }
    if (evento.igrejaId !== undefined) { campos.push('igrejaId = ?'); valores.push(evento.igrejaId); }
    if (evento.criadoPor !== undefined) { campos.push('criadoPor = ?'); valores.push(evento.criadoPor); }
    if (evento.recursoId !== undefined) { campos.push('recursoId = ?'); valores.push(evento.recursoId); }
    if (evento.diaInteiro !== undefined) { campos.push('diaInteiro = ?'); valores.push(evento.diaInteiro ? 1 : 0); }
    
    campos.push('atualizadoEm = CURRENT_TIMESTAMP');
    valores.push(id);
    
    const stmt = db.prepare(`UPDATE eventos SET ${campos.join(', ')} WHERE id = ?`);
    stmt.run(...valores);
    
    return eventosDb.buscarPorId(id)!;
  },

  deletar: (id: string) => {
    const stmt = db.prepare('DELETE FROM eventos WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

// Funções CRUD para Aniversários
export const aniversariosDb = {
  buscarTodos: () => {
    return db.prepare('SELECT * FROM aniversarios ORDER BY mes, dia, nome').all() as Aniversario[];
  },

  buscarPorId: (id: string) => {
    return db.prepare('SELECT * FROM aniversarios WHERE id = ?').get(id) as Aniversario | undefined;
  },

  buscarPorIgreja: (igrejaId: string) => {
    return db.prepare('SELECT * FROM aniversarios WHERE igrejaId = ? ORDER BY mes, dia, nome').all(igrejaId) as Aniversario[];
  },

  buscarPorMes: (mes: number) => {
    return db.prepare('SELECT * FROM aniversarios WHERE mes = ? ORDER BY dia, nome').all(mes) as Aniversario[];
  },

  criar: (aniversario: Omit<Aniversario, 'id'> & { id?: string }) => {
    const id = aniversario.id || randomUUID();
    const stmt = db.prepare(`
      INSERT INTO aniversarios (id, nome, dia, mes, ano, observacoes, criadoPor, igrejaId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      aniversario.nome,
      aniversario.dia,
      aniversario.mes,
      aniversario.ano || null,
      aniversario.observacoes || '',
      aniversario.criadoPor,
      aniversario.igrejaId
    );
    
    return aniversariosDb.buscarPorId(id)!;
  },

  atualizar: (id: string, aniversario: Partial<Aniversario>) => {
    const campos = [];
    const valores = [];
    
    if (aniversario.nome !== undefined) { campos.push('nome = ?'); valores.push(aniversario.nome); }
    if (aniversario.dia !== undefined) { campos.push('dia = ?'); valores.push(aniversario.dia); }
    if (aniversario.mes !== undefined) { campos.push('mes = ?'); valores.push(aniversario.mes); }
    if (aniversario.ano !== undefined) { campos.push('ano = ?'); valores.push(aniversario.ano); }
    if (aniversario.observacoes !== undefined) { campos.push('observacoes = ?'); valores.push(aniversario.observacoes); }
    if (aniversario.criadoPor !== undefined) { campos.push('criadoPor = ?'); valores.push(aniversario.criadoPor); }
    if (aniversario.igrejaId !== undefined) { campos.push('igrejaId = ?'); valores.push(aniversario.igrejaId); }
    
    campos.push('atualizadoEm = CURRENT_TIMESTAMP');
    valores.push(id);
    
    const stmt = db.prepare(`UPDATE aniversarios SET ${campos.join(', ')} WHERE id = ?`);
    stmt.run(...valores);
    
    return aniversariosDb.buscarPorId(id)!;
  },

  deletar: (id: string) => {
    const stmt = db.prepare('DELETE FROM aniversarios WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

export function fecharDatabase() {
  if (db) {
    db.close();
  }
}

export { db };