# 📊 ESTRUTURA DAS TABELAS - VIBE LANDING

## 🏗️ ESQUEMA DO BANCO DE DADOS

### 1. **TABELA USUARIOS**
```sql
CREATE TABLE usuarios (
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
```

### 2. **TABELA IGREJAS**
```sql
CREATE TABLE igrejas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  codigoCor TEXT DEFAULT '#8b5e3b',
  criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### 3. **TABELA RECURSOS**
```sql
CREATE TABLE recursos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('equipamento', 'espaco')),
  estaDisponivel INTEGER DEFAULT 1,
  criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### 4. **TABELA EVENTOS**
```sql
CREATE TABLE eventos (
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
```

### 5. **TABELA ANIVERSARIOS**
```sql
CREATE TABLE aniversarios (
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
```

## 📇 ÍNDICES PARA PERFORMANCE
```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_eventos_igreja ON eventos(igrejaId);
CREATE INDEX idx_eventos_data ON eventos(dataHoraInicio, dataHoraFim);
CREATE INDEX idx_aniversarios_igreja ON aniversarios(igrejaId);
CREATE INDEX idx_aniversarios_mes ON aniversarios(mes);
```

## 🔗 RELACIONAMENTOS

```
igrejas (1) ──────── (N) usuarios
  │
  ├─────────────────── (N) eventos
  │
  └─────────────────── (N) aniversarios

usuarios (1) ──────── (N) eventos (criadoPor)
         (1) ──────── (N) aniversarios (criadoPor)

recursos (1) ──────── (N) eventos (recursoId) [OPCIONAL]
```

## 📍 LOCALIZAÇÃO DOS ARQUIVOS

**Definições das Tabelas:**
- `server/data/database.ts` (SQLite - futuro)
- `server/data/database-temp.ts` (JSON - atual)

**Dados Atuais:**
- `server/data/db-temp.json` (criado automaticamente)

**Scripts de Inicialização:**
- Função `criarTabelas()` em `database.ts`
- Função `semearDados()` para dados iniciais