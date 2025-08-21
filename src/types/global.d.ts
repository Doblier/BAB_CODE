declare global {
  interface Window {
    api: {
      ping: () => string;
      
      // Terminal APIs
      createTerminal: (terminalType: string, terminalId: string) => Promise<any>;
      sendTerminalInput: (terminalId: string, input: string) => Promise<any>;
      resizeTerminal: (terminalId: string, cols: number, rows: number) => Promise<any>;
      closeTerminal: (terminalId: string) => Promise<any>;
      
      // Terminal event listeners
      onTerminalOutput: (callback: (terminalId: string, data: string) => void) => void;
      onTerminalError: (callback: (terminalId: string, data: string) => void) => void;
      onTerminalClosed: (callback: (terminalId: string, code: number) => void) => void;
      
      // Menu action listener
      onMenuAction: (callback: (action: string) => void) => void;
      
      // Remove listeners
      removeAllListeners: (channel: string) => void;
      
      // Folder dialog
      openFolder: () => Promise<any>;
      readDirTree: (rootPath: string) => Promise<any>;
      readFile: (filePath: string) => Promise<any>;
      writeFile: (filePath: string, content: string) => Promise<any>;
      createFile: (dirPath: string, fileName: string) => Promise<any>;
      createFolder: (dirPath: string, folderName: string) => Promise<any>;
      renameFile: (oldPath: string, newPath: string) => Promise<any>;
      deleteFile: (path: string) => Promise<any>;
    };
  }
}

export {};
