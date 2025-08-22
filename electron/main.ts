import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import * as pty from "node-pty";
import { spawn, ChildProcess } from "child_process";
import * as os from "os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Store terminal processes and main window (hybrid: node-pty or child_process)
const terminalProcesses = new Map<string, pty.IPty | ChildProcess>();
let mainWindow: BrowserWindow | null = null;

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
         {
       label: 'File',
       submenu: [
         {
           label: 'New Text File',
           accelerator: 'Ctrl+N',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'new-text-file');
           }
         },
         {
           label: 'New Folder',
           accelerator: 'Ctrl+Shift+N',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'new-folder');
           }
         },
         { type: 'separator' },
         {
           label: 'New Window',
           accelerator: 'Ctrl+Shift+N',
           click: () => {
             createWindow();
           }
         },
         { type: 'separator' },
         {
           label: 'Exit',
           accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
           click: () => {
             app.quit();
           }
         }
       ]
     },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
                 { role: 'selectAll' }
      ]
    },
         {
       label: 'View',
       submenu: [
         { role: 'reload' },
         { role: 'forceReload' },
         { role: 'toggleDevTools' },
         { type: 'separator' },
         { role: 'resetZoom' },
         { role: 'zoomIn' },
         { role: 'zoomOut' },
         { type: 'separator' },
         { role: 'togglefullscreen' }
       ]
     },
     {
       label: 'Layout',
       submenu: [
         {
           label: 'Toggle Left Sidebar',
           accelerator: 'Ctrl+B',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'toggle-left-sidebar');
           }
         },
         {
           label: 'Toggle Bottom Panel',
           accelerator: 'Ctrl+J',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'toggle-bottom-panel');
           }
         },
         {
           label: 'Toggle Right Sidebar',
           accelerator: 'Ctrl+Shift+B',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'toggle-right-sidebar');
           }
         },
         { type: 'separator' },
         {
           label: 'Settings',
           accelerator: 'Ctrl+,',
           click: () => {
             mainWindow?.webContents.send('menu-action', 'open-settings');
           }
         }
       ]
     },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'Ctrl+`',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-terminal');
          }
        },
        {
          label: 'AI Terminal',
          accelerator: 'Ctrl+Shift+`',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'ai-terminal');
          }
        }
      ]
    },
         {
       label: 'Window',
       submenu: [
         { role: 'minimize' },
         { role: 'close' },
         { type: 'separator' },
         {
           label: 'Maximize/Restore',
           accelerator: 'F11',
           click: () => {
             if (mainWindow?.isMaximized()) {
               mainWindow.unmaximize();
             } else {
               mainWindow?.maximize();
             }
           }
         }
       ]
     },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BAB Code Editor',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About BAB Code Editor',
              message: 'BAB Code Editor',
              detail: 'A modern code editor built with Electron and React'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    title: "BAB Code Editor",
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  // Auto-detect Vite dev server port
  const findViteServer = async () => {
    const ports = [5173, 5174, 5175, 5176];
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          return `http://localhost:${port}`;
        }
      } catch (error) {
        // Port not available, try next
      }
    }
    return null;
  };

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  
  if (devUrl) {
    mainWindow.loadURL(devUrl).catch(err => {
      mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  } else {
    findViteServer().then(url => {
      if (url) {
        mainWindow?.loadURL(url);
      } else {
        mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
      }
    }).catch(err => {
      mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  }

  // Open DevTools for debugging
  if (process.env.NODE_ENV === 'development') {
    // mainWindow.webContents.openDevTools(); // Disabled to prevent autofill errors
  }
}

// Open folder dialog (default to Desktop on Windows)
ipcMain.handle('open-folder-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { ok: true, path: result.filePaths[0] };
    } else {
      return { ok: false, error: 'No folder selected' };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('get-current-directory', async () => {
  try {
    return { ok: true, path: process.cwd() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Read directory tree for sidebar
ipcMain.handle('read-dir-tree', async (_evt, rootPath: string) => {
  type FileNode = { name: string; path: string; type: 'file' | 'folder'; children?: FileNode[] };

  const maxDepth = 4;
  const maxEntriesPerDir = 200;

  const readDir = async (dirPath: string, depth: number): Promise<FileNode[]> => {
    if (depth > maxDepth) return [];
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return [];
    }
    const limited = entries.slice(0, maxEntriesPerDir);
    const nodes: FileNode[] = [];
    for (const ent of limited) {
      if (ent.name.startsWith('.')) continue; // hide dot-files
      const full = path.join(dirPath, ent.name);
      if (ent.isDirectory()) {
        nodes.push({
          name: ent.name,
          path: full,
          type: 'folder',
          children: await readDir(full, depth + 1)
        });
      } else {
        nodes.push({ name: ent.name, path: full, type: 'file' });
      }
    }
    // folders first then files
    nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
    return nodes;
  };

  try {
    const stat = fs.statSync(rootPath);
    if (!stat.isDirectory()) return { ok: false, error: 'Not a directory' };
    const tree = await readDir(rootPath, 1);
    return { ok: true, root: rootPath, tree };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Create file in directory
ipcMain.handle('create-file', async (_evt, dirPath: string, fileName: string) => {
  try {
    if (!fileName || /[\\/:*?"<>|]/.test(fileName)) {
      return { ok: false, error: 'Invalid file name' };
    }
    const target = path.join(dirPath, fileName);
    if (fs.existsSync(target)) {
      return { ok: false, error: 'File already exists' };
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '');
    return { ok: true, path: target };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Create folder in directory
ipcMain.handle('create-folder', async (_evt, dirPath: string, folderName: string) => {
  try {
    if (!folderName || /[\\/:*?"<>|]/.test(folderName)) {
      return { ok: false, error: 'Invalid folder name' };
    }
    const target = path.join(dirPath, folderName);
    if (fs.existsSync(target)) {
      return { ok: false, error: 'Folder already exists' };
    }
    fs.mkdirSync(target, { recursive: true });
    return { ok: true, path: target };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Read file content
ipcMain.handle('read-file', async (_evt, filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'File does not exist' };
    }
    
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return { ok: false, error: 'Not a file' };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return { ok: true, content };
  } catch (e) {
    console.error('Error reading file:', e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Write file content
ipcMain.handle('write-file', async (_evt, filePath: string, content: string) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Rename file or folder
ipcMain.handle('rename-file', async (_evt, oldPath: string, newPath: string) => {
  try {
    if (!fs.existsSync(oldPath)) {
      return { ok: false, error: 'File or folder does not exist' };
    }
    
    if (fs.existsSync(newPath)) {
      return { ok: false, error: 'Target already exists' };
    }
    
    fs.renameSync(oldPath, newPath);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Delete file or folder
ipcMain.handle('delete-file', async (_evt, filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'File or folder does not exist' };
    }
    
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// Handle terminal creation using hybrid approach: node-pty with child_process fallback
ipcMain.handle('create-terminal', async (event, terminalType: string, terminalId: string) => {
  try {
    let shell: string;
    let args: string[] = [];
    let cwd = process.cwd();
    

    
    switch (terminalType) {
      case 'powershell':
        shell = 'powershell.exe';
        args = [
          '-NoExit', 
          '-NoProfile', 
          '-NoLogo', 
          '-ExecutionPolicy', 'Bypass'
        ];
        break;
      case 'cmd':
        shell = 'cmd.exe';
        args = ['/Q', '/K']; // /Q = quiet mode, /K = keep open
        break;
      case 'git-bash':
        // Try to find Git Bash installation
        const gitBashPaths = [
          'C:\\Program Files\\Git\\bin\\bash.exe',
          'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
          'C:\\Git\\bin\\bash.exe'
        ];
        
        shell = 'bash.exe'; // Default fallback
        args = ['--login', '-i'];
        
        for (const gitPath of gitBashPaths) {
          try {
            if (require('fs').existsSync(gitPath)) {
              shell = gitPath;
              break;
            }
          } catch (e) {
            // Continue with fallback
          }
        }
        break;
      case 'wsl':
        shell = 'wsl.exe';
        args = [];
        break;
      case 'node':
        shell = 'node.exe';
        args = ['-i'];
        break;
      case 'python':
        shell = 'python.exe';
        args = ['-i'];
        break;
      default:
        shell = 'powershell.exe';
        args = [
          '-NoExit', 
          '-NoProfile', 
          '-NoLogo',
          '-ExecutionPolicy', 'Bypass',
          '-Interactive'
        ];
    }

    // Try node-pty first, fallback to child_process if it fails
    let terminalProcess: any;
    let isNodePty = false;

    try {
      // Attempt node-pty (corporate-grade PTY)
      terminalProcess = pty.spawn(shell, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          FORCE_COLOR: '1',
          COLUMNS: '80',
          LINES: '24',
          // Performance/UX tweaks
          POWERSHELL_TELEMETRY_OPTOUT: '1',
        },
        // Use modern Windows ConPTY so backspace and line editing work properly
        useConpty: true,
        conptyInheritCursor: true,
        handleFlowControl: true,
      });
      
             isNodePty = true;
      
         } catch (ptyError) {
      
      // Fallback to child_process (reliable but less features)
      terminalProcess = spawn(shell, args, {
        cwd: cwd,
                  env: { 
            ...process.env, 
            FORCE_COLOR: '1', 
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            COLUMNS: '80',
            LINES: '24',
            // PowerShell optimizations
            POWERSHELL_TELEMETRY_OPTOUT: '1',
            // Enable proper console mode
            ENABLE_VIRTUAL_TERMINAL_PROCESSING: '1',
          },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: false,
        detached: false
      });
      
             isNodePty = false;
    }

    // Store the terminal process
    terminalProcesses.set(terminalId, terminalProcess);

    if (isNodePty) {
      // node-pty event handlers with performance optimization
      let outputBuffer = '';
      let outputTimer: NodeJS.Timeout | null = null;
      
      terminalProcess.onData((data: string) => {
        // Buffer output for better performance
        outputBuffer += data;
        
        // Clear existing timer
        if (outputTimer) {
          clearTimeout(outputTimer);
        }
        
        // Send buffered output after a short delay or if buffer is large
        if (outputBuffer.length > 1000) {
          // Send immediately for large chunks
          mainWindow?.webContents.send('terminal-output', terminalId, outputBuffer);
          outputBuffer = '';
        } else {
          // Throttle small chunks
          outputTimer = setTimeout(() => {
            if (outputBuffer) {
              mainWindow?.webContents.send('terminal-output', terminalId, outputBuffer);
              outputBuffer = '';
            }
            outputTimer = null;
          }, 16); // ~60fps
        }
      });

             terminalProcess.onExit((e: { exitCode: number; signal?: number }) => {
         mainWindow?.webContents.send('terminal-closed', terminalId, e.exitCode);
         terminalProcesses.delete(terminalId);
       });

      // No welcome message - start clean

      return { 
        success: true, 
        pid: terminalProcess.pid,
        cols: terminalProcess.cols,
        rows: terminalProcess.rows,
        backend: 'node-pty'
      };

    } else {
      // child_process event handlers with performance optimization
      let outputBuffer = '';
      let outputTimer: NodeJS.Timeout | null = null;
      
      const sendBufferedOutput = () => {
        if (outputBuffer) {
          mainWindow?.webContents.send('terminal-output', terminalId, outputBuffer);
          outputBuffer = '';
        }
        outputTimer = null;
      };
      
      const handleOutput = (data: Buffer) => {
        let output = data.toString('utf8');
        // Basic output filtering
        output = output.replace(/[\x7f]/g, '');
        
        if (output.length > 0) {
          // Buffer output for better performance
          outputBuffer += output;
          
          // Clear existing timer
          if (outputTimer) {
            clearTimeout(outputTimer);
          }
          
          // Send buffered output after a short delay or if buffer is large
          if (outputBuffer.length > 1000) {
            // Send immediately for large chunks
            sendBufferedOutput();
          } else {
            // Throttle small chunks
            outputTimer = setTimeout(sendBufferedOutput, 16); // ~60fps
          }
        }
      };
      
      terminalProcess.stdout?.on('data', handleOutput);
      terminalProcess.stderr?.on('data', handleOutput);

             terminalProcess.on('exit', (code: number | null, signal: string | null) => {
         mainWindow?.webContents.send('terminal-closed', terminalId, code || 0);
         terminalProcesses.delete(terminalId);
       });

       terminalProcess.on('error', (error: Error) => {
         mainWindow?.webContents.send('terminal-output', terminalId, `\r\n\x1b[31mTerminal Error: ${error.message}\x1b[0m\r\n`);
       });

      // No initialization - let PowerShell start naturally

      return { 
        success: true, 
        pid: terminalProcess.pid,
        cols: 80,
        rows: 24,
        backend: 'child_process'
      };
    }
     } catch (error: unknown) {
     return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
   }
});

// Handle terminal input - simple passthrough
ipcMain.handle('terminal-input', async (event, terminalId: string, input: string) => {
  const terminalProcess = terminalProcesses.get(terminalId);
  if (terminalProcess) {
    try {
      if ('write' in terminalProcess) {
        terminalProcess.write(input);
      } else {
        terminalProcess.stdin?.write(input);
      }
      return { success: true };
         } catch (error) {
       return { success: false, error: error instanceof Error ? error.message : 'Write failed' };
     }
  }
  return { success: false, error: 'Terminal not found' };
});

// Handle terminal resize (hybrid: node-pty supports resize, child_process doesn't)
ipcMain.handle('terminal-resize', async (event, terminalId: string, cols: number, rows: number) => {
  const terminalProcess = terminalProcesses.get(terminalId);
  if (terminalProcess) {
    try {
             // Check if it's node-pty (has resize method)
       if ('resize' in terminalProcess) {
         // node-pty
         terminalProcess.resize(cols, rows);
       }
      return { success: true };
         } catch (error) {
       return { success: false, error: error instanceof Error ? error.message : 'Resize failed' };
     }
  }
  return { success: false, error: 'Terminal not found' };
});

// Handle terminal close
ipcMain.handle('close-terminal', async (event, terminalId: string) => {
  const terminalProcess = terminalProcesses.get(terminalId);
  if (terminalProcess) {
         try {
       terminalProcess.kill('SIGTERM');
       terminalProcesses.delete(terminalId);
       return { success: true };
     } catch (error) {
       return { success: false, error: error instanceof Error ? error.message : 'Close failed' };
     }
  }
  return { success: false, error: 'Terminal not found' };
});





app.whenReady().then(() => {
  createMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Kill all terminal processes
  terminalProcesses.forEach((process, terminalId) => {
    try {
      process.kill('SIGTERM');
    } catch (error) {
      // Silent cleanup
    }
  });
  terminalProcesses.clear();
  
  if (process.platform !== "darwin") app.quit();
}); 