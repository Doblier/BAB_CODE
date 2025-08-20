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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    title: "TEST01 - IDE",
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
    console.log("Loading URL from env:", devUrl);
    mainWindow.loadURL(devUrl).catch(err => {
      console.error("Failed to load URL:", err);
      mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  } else {
    console.log("Auto-detecting Vite server...");
    findViteServer().then(url => {
      if (url) {
        console.log("Found Vite server at:", url);
        mainWindow?.loadURL(url);
      } else {
        console.log("No Vite server found, loading production build");
        mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
      }
    }).catch(err => {
      console.error("Error finding Vite server:", err);
      mainWindow?.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Open folder dialog (default to Desktop on Windows)
ipcMain.handle('open-folder-dialog', async () => {
  try {
    const defaultPath = app.getPath('desktop');
    const result = await dialog.showOpenDialog({
      title: 'Open Folder',
      defaultPath,
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    return { canceled: false, path: result.filePaths[0] };
  } catch (e) {
    return { canceled: true, error: e instanceof Error ? e.message : String(e) };
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

// Handle terminal creation using hybrid approach: node-pty with child_process fallback
ipcMain.handle('create-terminal', async (event, terminalType: string, terminalId: string) => {
  try {
    let shell: string;
    let args: string[] = [];
    let cwd = process.cwd();
    
    console.log(`Creating native terminal: ${terminalType} (${terminalId})`);
    
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
      console.log(`✓ Using node-pty for ${terminalType} terminal (PID: ${terminalProcess.pid})`);
      
    } catch (ptyError) {
      console.warn(`node-pty failed, falling back to child_process:`, ptyError);
      
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
      console.log(`✓ Using child_process fallback for ${terminalType} terminal (PID: ${terminalProcess.pid})`);
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
        console.log(`Terminal ${terminalId} exited with code: ${e.exitCode}, signal: ${e.signal}`);
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
        console.log(`Terminal ${terminalId} exited with code: ${code}, signal: ${signal}`);
        mainWindow?.webContents.send('terminal-closed', terminalId, code || 0);
        terminalProcesses.delete(terminalId);
      });

      terminalProcess.on('error', (error: Error) => {
        console.error(`Terminal ${terminalId} error:`, error);
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
    console.error('Error creating terminal:', error);
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
      console.error(`Error writing to terminal ${terminalId}:`, error);
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
        console.log(`Terminal ${terminalId} resized to: ${cols}x${rows} (node-pty)`);
      } else {
        // child_process - doesn't support resize, but we can log it
        console.log(`Terminal ${terminalId} resize requested: ${cols}x${rows} (child_process - not supported)`);
      }
      return { success: true };
    } catch (error) {
      console.error(`Error resizing terminal ${terminalId}:`, error);
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
      console.log(`Terminal ${terminalId} closed`);
      return { success: true };
    } catch (error) {
      console.error(`Error closing terminal ${terminalId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Close failed' };
    }
  }
  return { success: false, error: 'Terminal not found' };
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Kill all terminal processes
  terminalProcesses.forEach((process, terminalId) => {
    try {
      console.log(`Cleaning up terminal: ${terminalId}`);
      process.kill('SIGTERM');
    } catch (error) {
      console.error(`Error killing terminal ${terminalId}:`, error);
    }
  });
  terminalProcesses.clear();
  
  if (process.platform !== "darwin") app.quit();
}); 