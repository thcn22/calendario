const fs = require('fs');
const path = require('path');

console.log('Preparando servidor para Electron...');

// Caminhos
const rootDir = path.join(__dirname, '..');
const distServerDir = path.join(rootDir, 'dist-server');
const electronServerFile = path.join(__dirname, 'server.cjs');
const targetServerFile = path.join(distServerDir, 'server.cjs');

// Cria o diretório dist-server se não existir
if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
  console.log('Diretório dist-server criado');
}

// Copia o servidor do Electron para dist-server
if (fs.existsSync(electronServerFile)) {
  fs.copyFileSync(electronServerFile, targetServerFile);
  console.log('Servidor copiado para dist-server');
} else {
  console.error('Arquivo electron/server.cjs não encontrado!');
  process.exit(1);
}

// Cria package.json para dist-server
const packageJson = {
  name: "calendario-server",
  version: "1.0.0",
  description: "Servidor para Sistema de Gestão de Agenda para Igrejas",
  main: "server.cjs",
  type: "commonjs",
  dependencies: {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "better-sqlite3": "^12.2.0",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2"
  }
};

fs.writeFileSync(
  path.join(distServerDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('package.json criado em dist-server');
console.log('Preparação concluída com sucesso!');
