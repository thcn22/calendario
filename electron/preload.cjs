const { contextBridge, ipcRenderer } = require('electron');

// Expõe API segura para o renderer process
contextBridge.exposeInMainWorld('electron', {
  // Informações da aplicação
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getPath: (name) => ipcRenderer.invoke('app:get-path', name),
  
  // Diálogos
  showOpenDialog: (options) => ipcRenderer.invoke('app:show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('app:show-save-dialog', options),
  
  // Flag para indicar que está rodando no Electron
  isElectron: true,
  platform: process.platform
});

// Log para confirmar que o preload foi carregado
console.log('Preload script (cjs) carregado com sucesso');
