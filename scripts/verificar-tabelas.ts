import Database from 'better-sqlite3';
import path from 'path';

// Script para visualizar as tabelas do banco SQLite
const DB_PATH = path.join(process.cwd(), 'server', 'data', 'vibe-landing.db');

console.log('🗃️  TABELAS DO BANCO DE DADOS VIBE LANDING');
console.log('==========================================\n');

try {
  const db = new Database(DB_PATH);
  
  // Listar todas as tabelas
  const tabelas = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  console.log('📋 TABELAS EXISTENTES:');
  tabelas.forEach((tabela, index) => {
    console.log(`${index + 1}. ${tabela.name}`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Mostrar estrutura de cada tabela
  for (const tabela of tabelas) {
    console.log(`🏗️  ESTRUTURA DA TABELA: ${tabela.name.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    const colunas = db.prepare(`PRAGMA table_info(${tabela.name})`).all() as any[];
    
    colunas.forEach(col => {
      const pk = col.pk ? ' (PK)' : '';
      const notNull = col.notnull ? ' NOT NULL' : '';
      const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
      console.log(`  ${col.name}: ${col.type}${pk}${notNull}${defaultVal}`);
    });
    
    // Mostrar contagem de registros
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tabela.name}`).get() as { count: number };
    console.log(`  📊 Registros: ${count.count}`);
    
    console.log(''); // Linha em branco
  }

  // Mostrar índices
  console.log('📇 ÍNDICES CRIADOS:');
  console.log('-'.repeat(20));
  
  const indices = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string; sql: string }[];

  indices.forEach(indice => {
    console.log(`  ${indice.name}`);
  });

  db.close();
  
} catch (error) {
  console.error('❌ Erro ao acessar banco:', error);
  console.log('\n💡 NOTA: O banco SQLite ainda não foi criado.');
  console.log('Execute primeiro: pnpm dev (para criar as tabelas)');
}

console.log('\n' + '='.repeat(50));
console.log('✅ Verificação concluída!');