const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

// Variáveis globais
let mainWindow = null;
let serverProcess = null;
let serverPort = 3000;
let isServerReady = false;

// Configuração de caminhos
const isDev = !app.isPackaged;
const resourcesPath = isDev 
  ? path.join(__dirname, '..') 
  : process.resourcesPath;

const serverPath = isDev
  ? path.join(__dirname, 'server.cjs')
  : path.join(resourcesPath, 'server', 'server.cjs');

const spaPath = isDev
  ? path.join(__dirname, '..', 'spa')
  : path.join(resourcesPath, 'spa');

// Logs para debugging
const logFile = path.join(app.getPath('temp'), 'calendario-electron.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Erro ao escrever log:', err);
  }
}

// Função para verificar se uma porta está disponível
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

// Função para encontrar porta disponível
async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error('Nenhuma porta disponível encontrada');
}

// Função para iniciar o servidor Express
async function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      log('Iniciando servidor Express...');
      log(`Caminho do servidor: ${serverPath}`);
      log(`Caminho SPA: ${spaPath}`);
      log(`isDev: ${isDev}`);

      // Verifica se o arquivo do servidor existe
      if (!fs.existsSync(serverPath)) {
        const error = `Arquivo do servidor não encontrado: ${serverPath}`;
        log(error);
        reject(new Error(error));
        return;
      }

      // Encontra porta disponível
      serverPort = await findAvailablePort(3000);
      log(`Porta disponível encontrada: ${serverPort}`);

      // Variáveis de ambiente para o servidor
      const env = {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: isDev ? 'development' : 'production',
        IS_ELECTRON: 'true',
        SPA_PATH: spaPath,
        RESOURCES_PATH: resourcesPath,
        USER_DATA_PATH: app.getPath('userData')
      };

      // Inicia o processo do servidor
      if (isDev) {
        // Em desenvolvimento, usa node diretamente
        serverProcess = spawn('node', [serverPath], {
          env,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Em produção, usa node do electron
        const nodePath = process.execPath.replace('electron.exe', 'node.exe');
        serverProcess = spawn(nodePath, [serverPath], {
          env,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      }

      // Captura logs do servidor
      serverProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        log(`[SERVER] ${message}`);
        
        // Verifica se o servidor está pronto
        if (message.includes('Servidor rodando') || message.includes('Server listening')) {
          isServerReady = true;
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        log(`[SERVER ERROR] ${data.toString().trim()}`);
      });

      serverProcess.on('error', (err) => {
        log(`[SERVER] Erro ao iniciar processo: ${err.message}`);
        reject(err);
      });

      serverProcess.on('exit', (code, signal) => {
        log(`[SERVER] Processo encerrado - código: ${code}, sinal: ${signal}`);
        isServerReady = false;
        
        if (code !== 0 && code !== null) {
          reject(new Error(`Servidor encerrou com código: ${code}`));
        }
      });

      // Timeout de segurança
      setTimeout(() => {
        if (!isServerReady) {
          log('[SERVER] Timeout - assumindo que servidor está pronto');
          resolve();
        }
      }, 5000);

    } catch (err) {
      log(`[SERVER] Erro ao iniciar servidor: ${err.message}`);
      reject(err);
    }
  });
}

// Função para criar a janela principal
function createWindow() {
  log('Criando janela principal...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: '#ffffff',
    show: false, // Não mostrar até estar pronto
    title: 'Sistema de Gestão de Agenda para Igrejas'
  });

  // Remove o menu padrão
  Menu.setApplicationMenu(null);

  // Carrega a aplicação
  const appUrl = `http://localhost:${serverPort}`;
  log(`Carregando aplicação: ${appUrl}`);

  mainWindow.loadURL(appUrl).catch(err => {
    log(`Erro ao carregar URL: ${err.message}`);
    
    // Tenta novamente após 2 segundos
    setTimeout(() => {
      mainWindow.loadURL(appUrl).catch(err2 => {
        log(`Segundo erro ao carregar URL: ${err2.message}`);
        dialog.showErrorBox(
          'Erro ao iniciar aplicação',
          'Não foi possível conectar ao servidor local. Verifique os logs em:\n' + logFile
        );
      });
    }, 2000);
  });

  // Mostra a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    log('Janela pronta para exibição');
    mainWindow.show();
    
    // Abre DevTools em desenvolvimento
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emulador de eventos
  mainWindow.on('closed', () => {
    log('Janela principal fechada');
    mainWindow = null;
  });

  // Intercepta links externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Logs de navegação
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`Falha ao carregar: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('Página carregada com sucesso');
  });
}

// Inicialização do aplicativo
app.whenReady().then(async () => {
  try {
    log('=== Aplicação Electron Iniciando ===');
    log(`Versão Electron: ${process.versions.electron}`);
    log(`Versão Node: ${process.versions.node}`);
    log(`Caminho da aplicação: ${app.getAppPath()}`);
    log(`Caminho de dados do usuário: ${app.getPath('userData')}`);
    log(`Modo de desenvolvimento: ${isDev}`);

    // Inicia o servidor primeiro
    await startServer();
    log('Servidor iniciado com sucesso');

    // Aguarda um pouco para garantir que o servidor está pronto
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cria a janela
    createWindow();

  } catch (err) {
    log(`Erro crítico durante inicialização: ${err.message}`);
    log(`Stack: ${err.stack}`);
    
    dialog.showErrorBox(
      'Erro ao Iniciar Aplicação',
      `Ocorreu um erro ao iniciar a aplicação:\n\n${err.message}\n\nVerifique os logs em:\n${logFile}`
    );
    
    app.quit();
  }
});

// Handler para todas as janelas fechadas
app.on('window-all-closed', () => {
  log('Todas as janelas fechadas');
  
  // Encerra o servidor
  if (serverProcess) {
    log('Encerrando servidor...');
    serverProcess.kill();
  }
  
  app.quit();
});

// Ativa janela no macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handler para antes de sair
app.on('before-quit', () => {
  log('Aplicação encerrando...');
  
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  log(`Exceção não capturada: ${err.message}`);
  log(`Stack: ${err.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Promise rejeitada não tratada: ${reason}`);
});

// IPC Handlers (comunicação com o renderer)
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-path', (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('app:show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('app:show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

log('main.cjs carregado com sucesso');
