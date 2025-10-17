const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuração de ambiente
const PORT = process.env.PORT || 3000;
const IS_ELECTRON = process.env.IS_ELECTRON === 'true';
const SPA_PATH = process.env.SPA_PATH || path.join(__dirname, '..', 'spa');
const USER_DATA_PATH = process.env.USER_DATA_PATH || path.join(__dirname, '..', 'data');
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-2024';

// Garante que o diretório de dados existe
if (!fs.existsSync(USER_DATA_PATH)) {
  fs.mkdirSync(USER_DATA_PATH, { recursive: true });
}

// Caminho do banco de dados
const DB_PATH = path.join(USER_DATA_PATH, 'calendario.db');

console.log('=== Configuração do Servidor ===');
console.log('PORT:', PORT);
console.log('IS_ELECTRON:', IS_ELECTRON);
console.log('SPA_PATH:', SPA_PATH);
console.log('USER_DATA_PATH:', USER_DATA_PATH);
console.log('DB_PATH:', DB_PATH);

// Inicializa o banco de dados
let db = null;

function inicializarDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    // Cria conexão com o banco
    db = new Database(DB_PATH);
    
    // Habilita foreign keys
    db.pragma('foreign_keys = ON');
    
    // Cria tabelas se não existirem
    db.exec(`
      CREATE TABLE IF NOT EXISTS igrejas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        endereco TEXT,
        telefone TEXT,
        email TEXT,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        telefone TEXT,
        data_nascimento TEXT,
        tipo TEXT DEFAULT 'membro',
        igreja_id INTEGER,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
      );
      CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data_inicio TEXT NOT NULL,
        data_fim TEXT,
        horario TEXT,
        local TEXT,
        tipo TEXT DEFAULT 'evento',
        igreja_id INTEGER,
        responsavel_id INTEGER,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (igreja_id) REFERENCES igrejas(id),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS recursos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        tipo TEXT,
        quantidade INTEGER DEFAULT 1,
        igreja_id INTEGER,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
      );
      CREATE TABLE IF NOT EXISTS aniversarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_aniversario TEXT NOT NULL,
        tipo TEXT DEFAULT 'nascimento',
        observacoes TEXT,
        igreja_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
      );
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_igreja ON usuarios(igreja_id);
      CREATE INDEX IF NOT EXISTS idx_eventos_igreja ON eventos(igreja_id);
      CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_inicio);
      CREATE INDEX IF NOT EXISTS idx_aniversarios_data ON aniversarios(data_aniversario);
    `);

    popularDadosIniciais();

    console.log('Banco de dados inicializado com sucesso');
    return db;
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    throw err;
  }
}

function popularDadosIniciais() {
  try {
    const countIgrejas = db.prepare('SELECT COUNT(*) as count FROM igrejas').get();
    
    if (countIgrejas.count === 0) {
      console.log('Populando dados iniciais...');

      const insertIgreja = db.prepare(`
        INSERT INTO igrejas (nome, endereco, telefone, email)
        VALUES (?, ?, ?, ?)
      `);
      
      const igrejaId = insertIgreja.run(
        'Igreja Exemplo',
        'Rua das Flores, 123 - Centro',
        '(11) 98765-4321',
        'contato@igrejaexemplo.com.br'
      ).lastInsertRowid;

      const senhaHash = bcrypt.hashSync('admin123', 10);

      const insertUsuario = db.prepare(`
        INSERT INTO usuarios (nome, email, senha, telefone, data_nascimento, tipo, igreja_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const adminId = insertUsuario.run(
        'Administrador',
        'admin@exemplo.com',
        senhaHash,
        '(11) 91234-5678',
        '1990-01-15',
        'admin',
        igrejaId
      ).lastInsertRowid;

      const membros = [
        { nome: 'João Silva', email: 'joao@exemplo.com', data: '1985-03-20' },
        { nome: 'Maria Santos', email: 'maria@exemplo.com', data: '1992-07-10' },
        { nome: 'Pedro Oliveira', email: 'pedro@exemplo.com', data: '1988-11-25' },
        { nome: 'Ana Costa', email: 'ana@exemplo.com', data: '1995-05-08' }
      ];

      membros.forEach(membro => {
        const membroId = insertUsuario.run(
          membro.nome,
          membro.email,
          bcrypt.hashSync('123456', 10),
          '',
          membro.data,
          'membro',
          igrejaId
        ).lastInsertRowid;

        db.prepare(`
          INSERT INTO aniversarios (usuario_id, data_aniversario, igreja_id)
          VALUES (?, ?, ?)
        `).run(membroId, membro.data, igrejaId);
      });

      const insertEvento = db.prepare(`
        INSERT INTO eventos (titulo, descricao, data_inicio, horario, local, tipo, igreja_id, responsavel_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertEvento.run(
        'Culto de Celebração',
        'Culto especial de celebração',
        '2025-10-20',
        '19:00',
        'Templo Principal',
        'culto',
        igrejaId,
        adminId
      );

      insertEvento.run(
        'Reunião de Oração',
        'Reunião semanal de oração',
        '2025-10-22',
        '20:00',
        'Sala de Oração',
        'reuniao',
        igrejaId,
        adminId
      );

      console.log('Dados iniciais inseridos com sucesso');
      console.log('Usuário admin criado: admin@exemplo.com / admin123');
    }
  } catch (err) {
    console.error('Erro ao popular dados iniciais:', err);
  }
}

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido' });
  }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

inicializarDatabase();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').get(email);

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaValida = bcrypt.compareSync(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete usuario.senha;

    res.json({ token, usuario });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

app.get('/api/auth/verify', autenticarToken, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

app.get('/api/igrejas', autenticarToken, (req, res) => {
  try {
    const igrejas = db.prepare('SELECT * FROM igrejas WHERE ativo = 1 ORDER BY nome').all();
    res.json(igrejas);
  } catch (err) {
    console.error('Erro ao listar igrejas:', err);
    res.status(500).json({ erro: 'Erro ao listar igrejas' });
  }
});

app.post('/api/igrejas', autenticarToken, (req, res) => {
  try {
    const { nome, endereco, telefone, email } = req.body;
    const stmt = db.prepare('INSERT INTO igrejas (nome, endereco, telefone, email) VALUES (?, ?, ?, ?)');
    const result = stmt.run(nome, endereco, telefone, email);
    res.status(201).json({ id: result.lastInsertRowid, nome, endereco, telefone, email });
  } catch (err) {
    console.error('Erro ao criar igreja:', err);
    res.status(500).json({ erro: 'Erro ao criar igreja' });
  }
});

app.put('/api/igrejas/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, telefone, email } = req.body;
    const stmt = db.prepare('UPDATE igrejas SET nome = ?, endereco = ?, telefone = ?, email = ?, updated_at = datetime("now") WHERE id = ?');
    stmt.run(nome, endereco, telefone, email, id);
    res.json({ id, nome, endereco, telefone, email });
  } catch (err) {
    console.error('Erro ao atualizar igreja:', err);
    res.status(500).json({ erro: 'Erro ao atualizar igreja' });
  }
});

app.delete('/api/igrejas/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE igrejas SET ativo = 0 WHERE id = ?');
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover igreja:', err);
    res.status(500).json({ erro: 'Erro ao remover igreja' });
  }
});

app.get('/api/usuarios', autenticarToken, (req, res) => {
  try {
    const usuarios = db.prepare('SELECT id, nome, email, telefone, data_nascimento, tipo, igreja_id, ativo FROM usuarios WHERE ativo = 1 ORDER BY nome').all();
    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

app.post('/api/usuarios', autenticarToken, (req, res) => {
  try {
    const { nome, email, senha, telefone, data_nascimento, tipo, igreja_id } = req.body;
    const senhaHash = bcrypt.hashSync(senha || '123456', 10);
    const stmt = db.prepare('INSERT INTO usuarios (nome, email, senha, telefone, data_nascimento, tipo, igreja_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(nome, email, senhaHash, telefone, data_nascimento, tipo, igreja_id);
    res.status(201).json({ id: result.lastInsertRowid, nome, email, telefone, data_nascimento, tipo, igreja_id });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

app.put('/api/usuarios/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, data_nascimento, tipo, igreja_id } = req.body;
    const stmt = db.prepare('UPDATE usuarios SET nome = ?, email = ?, telefone = ?, data_nascimento = ?, tipo = ?, igreja_id = ?, updated_at = datetime("now") WHERE id = ?');
    stmt.run(nome, email, telefone, data_nascimento, tipo, igreja_id, id);
    res.json({ id, nome, email, telefone, data_nascimento, tipo, igreja_id });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/usuarios/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?');
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover usuário:', err);
    res.status(500).json({ erro: 'Erro ao remover usuário' });
  }
});

app.get('/api/eventos', autenticarToken, (req, res) => {
  try {
    const eventos = db.prepare('SELECT * FROM eventos WHERE ativo = 1 ORDER BY data_inicio DESC').all();
    res.json(eventos);
  } catch (err) {
    console.error('Erro ao listar eventos:', err);
    res.status(500).json({ erro: 'Erro ao listar eventos' });
  }
});

app.post('/api/eventos', autenticarToken, (req, res) => {
  try {
    const { titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id } = req.body;
    const stmt = db.prepare('INSERT INTO eventos (titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id);
    res.status(201).json({ id: result.lastInsertRowid, titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id });
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ erro: 'Erro ao criar evento' });
  }
});

app.put('/api/eventos/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id } = req.body;
    const stmt = db.prepare('UPDATE eventos SET titulo = ?, descricao = ?, data_inicio = ?, data_fim = ?, horario = ?, local = ?, tipo = ?, igreja_id = ?, responsavel_id = ?, updated_at = datetime("now") WHERE id = ?');
    stmt.run(titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id, id);
    res.json({ id, titulo, descricao, data_inicio, data_fim, horario, local, tipo, igreja_id, responsavel_id });
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).json({ erro: 'Erro ao atualizar evento' });
  }
});

app.delete('/api/eventos/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE eventos SET ativo = 0 WHERE id = ?');
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover evento:', err);
    res.status(500).json({ erro: 'Erro ao remover evento' });
  }
});

app.get('/api/aniversarios', autenticarToken, (req, res) => {
  try {
    const aniversarios = db.prepare(`
      SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
      FROM aniversarios a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE u.ativo = 1
      ORDER BY a.data_aniversario
    `).all();
    res.json(aniversarios);
  } catch (err) {
    console.error('Erro ao listar aniversários:', err);
    res.status(500).json({ erro: 'Erro ao listar aniversários' });
  }
});

app.get('/api/aniversarios/mes/:mes', autenticarToken, (req, res) => {
  try {
    const { mes } = req.params;
    const aniversarios = db.prepare(`
      SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
      FROM aniversarios a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE CAST(strftime('%m', a.data_aniversario) AS INTEGER) = ? AND u.ativo = 1
      ORDER BY CAST(strftime('%d', a.data_aniversario) AS INTEGER)
    `).all(parseInt(mes));
    res.json(aniversarios);
  } catch (err) {
    console.error('Erro ao listar aniversários do mês:', err);
    res.status(500).json({ erro: 'Erro ao listar aniversários do mês' });
  }
});

app.post('/api/aniversarios', autenticarToken, (req, res) => {
  try {
    const { usuario_id, data_aniversario, tipo, observacoes, igreja_id } = req.body;
    const stmt = db.prepare('INSERT INTO aniversarios (usuario_id, data_aniversario, tipo, observacoes, igreja_id) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(usuario_id, data_aniversario, tipo, observacoes, igreja_id);
    res.status(201).json({ id: result.lastInsertRowid, usuario_id, data_aniversario, tipo, observacoes, igreja_id });
  } catch (err) {
    console.error('Erro ao criar aniversário:', err);
    res.status(500).json({ erro: 'Erro ao criar aniversário' });
  }
});

app.put('/api/aniversarios/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, data_aniversario, tipo, observacoes, igreja_id } = req.body;
    const stmt = db.prepare('UPDATE aniversarios SET usuario_id = ?, data_aniversario = ?, tipo = ?, observacoes = ?, igreja_id = ?, updated_at = datetime("now") WHERE id = ?');
    stmt.run(usuario_id, data_aniversario, tipo, observacoes, igreja_id, id);
    res.json({ id, usuario_id, data_aniversario, tipo, observacoes, igreja_id });
  } catch (err) {
    console.error('Erro ao atualizar aniversário:', err);
    res.status(500).json({ erro: 'Erro ao atualizar aniversário' });
  }
});

app.delete('/api/aniversarios/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM aniversarios WHERE id = ?');
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover aniversário:', err);
    res.status(500).json({ erro: 'Erro ao remover aniversário' });
  }
});

app.get('/api/recursos', autenticarToken, (req, res) => {
  try {
    const recursos = db.prepare('SELECT * FROM recursos WHERE ativo = 1 ORDER BY nome').all();
    res.json(recursos);
  } catch (err) {
    console.error('Erro ao listar recursos:', err);
    res.status(500).json({ erro: 'Erro ao listar recursos' });
  }
});

app.post('/api/recursos', autenticarToken, (req, res) => {
  try {
    const { nome, descricao, tipo, quantidade, igreja_id } = req.body;
    const stmt = db.prepare('INSERT INTO recursos (nome, descricao, tipo, quantidade, igreja_id) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(nome, descricao, tipo, quantidade, igreja_id);
    res.status(201).json({ id: result.lastInsertRowid, nome, descricao, tipo, quantidade, igreja_id });
  } catch (err) {
    console.error('Erro ao criar recurso:', err);
    res.status(500).json({ erro: 'Erro ao criar recurso' });
  }
});

app.put('/api/recursos/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, tipo, quantidade, igreja_id } = req.body;
    const stmt = db.prepare('UPDATE recursos SET nome = ?, descricao = ?, tipo = ?, quantidade = ?, igreja_id = ?, updated_at = datetime("now") WHERE id = ?');
    stmt.run(nome, descricao, tipo, quantidade, igreja_id, id);
    res.json({ id, nome, descricao, tipo, quantidade, igreja_id });
  } catch (err) {
    console.error('Erro ao atualizar recurso:', err);
    res.status(500).json({ erro: 'Erro ao atualizar recurso' });
  }
});

app.delete('/api/recursos/:id', autenticarToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE recursos SET ativo = 0 WHERE id = ?');
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover recurso:', err);
    res.status(500).json({ erro: 'Erro ao remover recurso' });
  }
});

app.use(express.static(SPA_PATH));

app.get('*', (req, res) => {
  res.sendFile(path.join(SPA_PATH, 'index.html'));
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${IS_ELECTRON ? 'Electron' : 'Standalone'}`);
  console.log(`SPA servido de: ${SPA_PATH}`);
  console.log(`Banco de dados: ${DB_PATH}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    if (db) {
      db.close();
      console.log('Banco de dados fechado');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    if (db) {
      db.close();
      console.log('Banco de dados fechado');
    }
    process.exit(0);
  });
});

module.exports = app;
