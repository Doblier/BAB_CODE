import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => "pong",
  
  // Terminal APIs
  createTerminal: (terminalType: string, terminalId: string) => 
    ipcRenderer.invoke('create-terminal', terminalType, terminalId),
  
  sendTerminalInput: (terminalId: string, input: string) => 
    ipcRenderer.invoke('terminal-input', terminalId, input),
  
  resizeTerminal: (terminalId: string, cols: number, rows: number) => 
    ipcRenderer.invoke('terminal-resize', terminalId, cols, rows),
  
  closeTerminal: (terminalId: string) => 
    ipcRenderer.invoke('close-terminal', terminalId),
  
  // Terminal event listeners
  onTerminalOutput: (callback: (terminalId: string, data: string) => void) => 
    ipcRenderer.on('terminal-output', (_, terminalId, data) => callback(terminalId, data)),
  
  onTerminalError: (callback: (terminalId: string, data: string) => void) => 
    ipcRenderer.on('terminal-error', (_, terminalId, data) => callback(terminalId, data)),
  
  onTerminalClosed: (callback: (terminalId: string, code: number) => void) => 
    ipcRenderer.on('terminal-closed', (_, terminalId, code) => callback(terminalId, code)),
  
  // Menu action listener
  onMenuAction: (callback: (action: string) => void) => 
    ipcRenderer.on('menu-action', (_, action) => callback(action)),
  
  // Remove listeners
  removeAllListeners: (channel: string) => 
    ipcRenderer.removeAllListeners(channel),

  // Folder dialog
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  readDirTree: (rootPath: string) => ipcRenderer.invoke('read-dir-tree', rootPath),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  createFile: (dirPath: string, fileName: string) => ipcRenderer.invoke('create-file', dirPath, fileName),
  createFolder: (dirPath: string, folderName: string) => ipcRenderer.invoke('create-folder', dirPath, folderName),
  renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path)
  

}); 