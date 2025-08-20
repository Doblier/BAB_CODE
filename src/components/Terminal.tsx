import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

interface TerminalProps {
  onClose: () => void;
}

interface TerminalTab {
  id: string;
  name: string;
  type: 'powershell' | 'cmd' | 'git-bash' | 'wsl' | 'node' | 'python' | 'npm';
  terminal: XTerm | null;
  fitAddon: FitAddon | null;
  processId: string | null;
  isInitialized: boolean;
}

// Global API declaration moved to EnhancedTerminal.tsx

const Terminal: React.FC<TerminalProps> = ({ onClose }) => {
  console.log('Terminal component rendering...');
  const terminalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('powershell');
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'powershell', name: 'PowerShell', type: 'powershell', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'cmd', name: 'Command Prompt', type: 'cmd', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'git-bash', name: 'Git Bash', type: 'git-bash', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'wsl', name: 'WSL', type: 'wsl', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'node', name: 'Node.js REPL', type: 'node', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'python', name: 'Python REPL', type: 'python', terminal: null, fitAddon: null, processId: null, isInitialized: false },
    { id: 'npm', name: 'NPM Scripts', type: 'npm', terminal: null, fitAddon: null, processId: null, isInitialized: false }
  ]);

  // Set up global terminal event listeners once
  useEffect(() => {
    console.log('Setting up global terminal event listeners');
    
    const handleTerminalOutput = (terminalId: string, data: string) => {
      console.log(`Terminal output for ${terminalId}:`, data.substring(0, 50) + '...');
      setTabs(prevTabs => {
        const tab = prevTabs.find(t => t.id === terminalId);
        if (tab?.terminal) {
          // Write the command output
          tab.terminal.write(data);
          
          // After output, show a new prompt
          setTimeout(() => {
            if (tab.terminal) {
              if (tab.type === 'cmd') {
                tab.terminal.write(`\r\n${process.cwd()}>`);
              } else if (tab.type === 'powershell') {
                tab.terminal.write(`\r\nPS ${process.cwd()}> `);
              }
            }
          }, 100);
        }
        return prevTabs;
      });
    };

    const handleTerminalError = (terminalId: string, data: string) => {
      console.log(`Terminal error for ${terminalId}:`, data);
      setTabs(prevTabs => {
        const tab = prevTabs.find(t => t.id === terminalId);
        if (tab?.terminal) {
          tab.terminal.write(data);
        }
        return prevTabs;
      });
    };

    const handleTerminalClosed = (terminalId: string, code: number) => {
      console.log(`Terminal ${terminalId} closed with code:`, code);
      setTabs(prevTabs => {
        const tab = prevTabs.find(t => t.id === terminalId);
        if (tab?.terminal) {
          tab.terminal.write(`\r\n\x1b[31mProcess exited with code ${code}\x1b[0m\r\n`);
        }
        return prevTabs.map(t => 
          t.id === terminalId ? { ...t, isInitialized: false, processId: null } : t
        );
      });
    };

    window.api.onTerminalOutput(handleTerminalOutput);
    window.api.onTerminalError(handleTerminalError);
    window.api.onTerminalClosed(handleTerminalClosed);

    return () => {
      console.log('Cleaning up global terminal event listeners');
      window.api.removeAllListeners('terminal-output');
      window.api.removeAllListeners('terminal-error');
      window.api.removeAllListeners('terminal-closed');
    };
  }, []);

  const createTerminal = (tab: TerminalTab): XTerm => {
    console.log('Creating terminal for tab:', tab.id);
    try {
      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#ffffff'
        },
        cols: 80,
        rows: 24,
        allowTransparency: true,
        scrollback: 1000
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      return term;
    } catch (error) {
      console.error('Error creating XTerm:', error);
      throw error;
    }
  };

  const setupNativeTerminal = async (term: XTerm, tab: TerminalTab) => {
    console.log('Setting up native terminal for:', tab.id);
    
    try {
      // Create native terminal process
      const result = await window.api.createTerminal(tab.type, tab.id);
      
      if (result.success) {
        console.log('Native terminal created successfully:', tab.id);
        term.write(`\x1b[32m✓ Native ${tab.type} terminal initialized successfully!\x1b[0m\r\n`);
        
        // Implement local line editing for better terminal experience
        let currentLine = '';
        let cursorPosition = 0;
        
        const writePrompt = () => {
          if (tab.type === 'cmd') {
            term.write(`\r\n${process.cwd()}>`);
          } else if (tab.type === 'powershell') {
            term.write(`\r\nPS ${process.cwd()}> `);
          }
        };

        // Set up input handling with local line editing
        term.onData((data: string) => {
          const code = data.charCodeAt(0);
          
          // Handle special characters
          if (code === 13) { // Enter
            if (currentLine.trim()) {
              term.write('\r\n');
              // Send command to process
              window.api.sendTerminalInput(tab.id, currentLine + '\r\n');
              currentLine = '';
              cursorPosition = 0;
            } else {
              writePrompt();
            }
          } else if (code === 8 || code === 127) { // Backspace or DEL
            if (cursorPosition > 0) {
              currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition);
              cursorPosition--;
              term.write('\b \b'); // Move back, write space, move back again
            }
          } else if (code === 12) { // Ctrl+L (clear screen)
            term.clear();
            writePrompt();
          } else if (code === 3) { // Ctrl+C
            term.write('^C\r\n');
            window.api.sendTerminalInput(tab.id, '\x03');
            currentLine = '';
            cursorPosition = 0;
            writePrompt();
          } else if (code >= 32 && code < 127) { // Printable characters
            currentLine = currentLine.slice(0, cursorPosition) + data + currentLine.slice(cursorPosition);
            cursorPosition++;
            term.write(data);
          }
        });

        // Set up key handling for additional features
        term.onKey(({ key, domEvent }) => {
          // Handle arrow keys for command history (future enhancement)
          if (domEvent.key === 'ArrowLeft' && cursorPosition > 0) {
            cursorPosition--;
            term.write('\x1b[D'); // Move cursor left
          } else if (domEvent.key === 'ArrowRight' && cursorPosition < currentLine.length) {
            cursorPosition++;
            term.write('\x1b[C'); // Move cursor right
          }
        });

        // Show initial prompt after connection
        setTimeout(() => {
          writePrompt();
        }, 500);

        // Set up resize handling
        term.onResize(({ cols, rows }) => {
          window.api.resizeTerminal(tab.id, cols, rows);
        });

        // Update tab with process ID
        setTabs(prev => prev.map(t => 
          t.id === tab.id 
            ? { ...t, processId: tab.id, isInitialized: true }
            : t
        ));

        // Note: Event listeners are set up globally, not per terminal

      } else {
        console.error('Failed to create native terminal:', result.error);
        term.write(`\x1b[31mFailed to create ${tab.type} terminal: ${result.error}\x1b[0m\r\n`);
        term.write(`\x1b[33mFalling back to simulated terminal...\x1b[0m\r\n`);
        setupSimulatedTerminal(term, tab);
      }
    } catch (error) {
      console.error('Error setting up native terminal:', error);
      term.write(`\x1b[31mError setting up ${tab.type} terminal: ${error}\x1b[0m\r\n`);
      term.write(`\x1b[33mFalling back to simulated terminal...\x1b[0m\r\n`);
      setupSimulatedTerminal(term, tab);
    }
  };

  const setupSimulatedTerminal = (term: XTerm, tab: TerminalTab) => {
    console.log('Setting up simulated terminal for:', tab.id);
    const getPrompt = (type: TerminalTab['type']): string => {
      const currentDir = 'D:\\code\\test01';
      switch (type) {
        case 'powershell':
          return '\x1b[1;33mPS\x1b[0m \x1b[1;36m' + currentDir + '\x1b[0m \x1b[1;33m>\x1b[0m ';
        case 'cmd':
          return '\x1b[1;33m' + currentDir + '\x1b[0m\x1b[1;33m>\x1b[0m ';
        case 'git-bash':
          return '\x1b[1;32muser\x1b[0m@\x1b[1;34mhost\x1b[0m \x1b[1;33m' + currentDir.split('\\').pop() + '\x1b[0m \x1b[1;32m$\x1b[0m ';
        case 'wsl':
          return '\x1b[1;32muser\x1b[0m@\x1b[1;34mWSL\x1b[0m:\x1b[1;33m~$\x1b[0m ';
        case 'node':
          return '\x1b[1;33m>\x1b[0m ';
        case 'python':
          return '\x1b[1;33m>>>\x1b[0m ';
        case 'npm':
          return '\x1b[1;33mnpm\x1b[0m \x1b[1;33m>\x1b[0m ';
        default:
          return '\x1b[1;33m>\x1b[0m ';
      }
    };

    // Write initial prompt
    term.write(getPrompt(tab.type));

    // Set up input handling for simulated terminal
    let currentLine = '';
    term.onKey(({ key, domEvent }) => {
      const code = domEvent.keyCode;
      
      if (code === 13) { // Enter
        const command = currentLine.trim();
        if (command) {
          term.write('\r\n');
          // Handle simulated commands
          handleSimulatedCommand(command, term, tab.type);
        }
        currentLine = '';
        term.write(getPrompt(tab.type));
      } else if (code === 8) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (key.length === 1) {
        currentLine += key;
        term.write(key);
      }
    });
  };

  const handleSimulatedCommand = (command: string, term: XTerm, type: TerminalTab['type']) => {
    const cmd = command.toLowerCase();
    const originalCmd = command; // Keep original case for some commands
    
    switch (type) {
      case 'powershell':
        if (cmd === 'help') {
          term.writeln('\x1b[1;33mPowerShell Commands:\x1b[0m');
          term.writeln('  Get-Process          - List running processes');
          term.writeln('  Get-ChildItem        - List files and folders');
          term.writeln('  Set-Location         - Change directory');
          term.writeln('  Clear-Host           - Clear screen');
          term.writeln('  Get-Date             - Show current date/time');
          term.writeln('  Write-Host           - Write text to console');
          term.writeln('  npm run dev          - Start development server');
          term.writeln('  cd                   - Change directory (alias)');
          term.writeln('  cls                  - Clear screen (alias)');
          term.writeln('  ls                   - List files (alias)');
          term.writeln('  dir                  - List files (alias)');
        } else if (cmd === 'get-childitem' || cmd === 'ls' || cmd === 'dir') {
          term.writeln('\x1b[1;34mMode\x1b[0m                 \x1b[1;34mLastWriteTime\x1b[0m         \x1b[1;34mLength\x1b[0m \x1b[1;34mName\x1b[0m');
          term.writeln('----                 -------------         ------ ----');
          term.writeln('d-----         8/18/2025  12:20 AM                \x1b[1;34msrc\x1b[0m');
          term.writeln('d-----         8/18/2025  12:20 AM                \x1b[1;34melectron\x1b[0m');
          term.writeln('d-----         8/18/2025  12:20 AM                \x1b[1;34mnode_modules\x1b[0m');
          term.writeln('-a----         8/18/2025  12:20 AM           1.9KB \x1b[0mpackage.json');
          term.writeln('-a----         8/18/2025  12:20 AM           285B \x1b[0mtsconfig.json');
          term.writeln('-a----         8/18/2025  12:20 AM           208B \x1b[0mvite.config.ts');
        } else if (cmd.startsWith('set-location') || cmd.startsWith('cd ')) {
          const path = originalCmd.replace(/^(set-location|cd)\s+/i, '').trim();
          if (path === '..') {
            term.writeln('\x1b[33mChanged directory to: D:\\code\x1b[0m');
          } else if (path === 'D:\\' || path === 'D:') {
            term.writeln('\x1b[33mChanged directory to: D:\\\x1b[0m');
          } else if (path === 'D:\\code\\test01' || path === '.') {
            term.writeln('\x1b[33mChanged directory to: D:\\code\\test01\x1b[0m');
          } else {
            term.writeln(`\x1b[33mChanged directory to: ${path}\x1b[0m`);
          }
        } else if (cmd === 'clear-host' || cmd === 'cls') {
          term.clear();
        } else if (cmd === 'get-date') {
          term.writeln(new Date().toString());
        } else if (originalCmd.startsWith('Write-Host')) {
          const text = originalCmd.replace(/^Write-Host\s+/i, '').trim();
          term.writeln(text);
        } else if (cmd === 'npm run dev') {
          term.writeln('\x1b[1;33mStarting development server...\x1b[0m');
          term.writeln('\x1b[32m✓ Vite server running on http://localhost:5173\x1b[0m');
          term.writeln('\x1b[32m✓ Electron app launched\x1b[0m');
        } else if (cmd === 'get-process') {
          term.writeln('\x1b[1;34mHandles\x1b[0m  \x1b[1;34mNPM(K)\x1b[0m    \x1b[1;34mPM(K)\x1b[0m      \x1b[1;34mWS(K)\x1b[0m     \x1b[1;34mVM(M)\x1b[0m   \x1b[1;34mCPU(s)\x1b[0m     \x1b[1;34mId\x1b[0m  \x1b[1;34mProcessName\x1b[0m');
          term.writeln('-------  ------    ------      -----     ------   ------     --  -----------');
          term.writeln('    123      12.5       8.2       1.2      45.2     0.05   1234 \x1b[0mnode');
          term.writeln('    456      15.8      12.1       2.1      67.8     0.12   5678 \x1b[0mvite');
        } else {
          term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
          term.writeln('Type "help" for available commands');
        }
        break;
      case 'cmd':
        if (cmd === 'help') {
          term.writeln('\x1b[1;33mCommand Prompt Commands:\x1b[0m');
          term.writeln('  dir                  - List files and folders');
          term.writeln('  cd                   - Change directory');
          term.writeln('  cls                  - Clear screen');
          term.writeln('  date                 - Show current date/time');
          term.writeln('  time                 - Show current time');
          term.writeln('  npm run dev          - Start development server');
        } else if (cmd === 'dir') {
          term.writeln(' Volume in drive C: is Windows');
          term.writeln(' Directory of D:\\code\\test01');
          term.writeln('');
          term.writeln('08/18/2025  12:20 AM    <DIR>          \x1b[1;34msrc\x1b[0m');
          term.writeln('08/18/2025  12:20 AM    <DIR>          \x1b[1;34melectron\x1b[0m');
          term.writeln('08/18/2025  12:20 AM    <DIR>          \x1b[1;34mnode_modules\x1b[0m');
          term.writeln('08/18/2025  12:20 AM             1,900 \x1b[0mpackage.json');
          term.writeln('08/18/2025  12:20 AM               285 \x1b[0mtsconfig.json');
          term.writeln('08/18/2025  12:20 AM               208 \x1b[0mvite.config.ts');
        } else if (cmd.startsWith('cd ')) {
          const path = originalCmd.replace(/^cd\s+/i, '').trim();
          if (path === '..') {
            term.writeln('\x1b[33mChanged directory to: D:\\code\x1b[0m');
          } else if (path === 'D:\\' || path === 'D:') {
            term.writeln('\x1b[33mChanged directory to: D:\\\x1b[0m');
          } else {
            term.writeln(`\x1b[33mChanged directory to: ${path}\x1b[0m`);
          }
        } else if (cmd === 'cls') {
          term.clear();
        } else if (cmd === 'date') {
          term.writeln(new Date().toDateString());
        } else if (cmd === 'time') {
          term.writeln(new Date().toTimeString());
        } else if (cmd === 'npm run dev') {
          term.writeln('\x1b[1;33mStarting development server...\x1b[0m');
          term.writeln('\x1b[32m✓ Vite server running on http://localhost:5173\x1b[0m');
          term.writeln('\x1b[32m✓ Electron app launched\x1b[0m');
        } else {
          term.writeln(`\x1b[31m\'${command}\' is not recognized as an internal or external command\x1b[0m`);
          term.writeln('Type "help" for available commands');
        }
        break;
      case 'git-bash':
      case 'wsl':
        if (cmd === 'help') {
          term.writeln('\x1b[1;33mBash Commands:\x1b[0m');
          term.writeln('  ls                   - List files and folders');
          term.writeln('  cd                   - Change directory');
          term.writeln('  pwd                  - Show current directory');
          term.writeln('  clear                - Clear screen');
          term.writeln('  date                 - Show current date/time');
          term.writeln('  npm run dev          - Start development server');
        } else if (cmd === 'clear') {
          term.clear();
        } else if (cmd === 'date') {
          term.writeln(new Date().toString());
        } else if (cmd === 'pwd') {
          term.writeln('/c/Users/User');
        } else if (cmd === 'ls') {
          term.writeln('\x1b[1;34msrc\x1b[0m/');
          term.writeln('\x1b[1;34melectron\x1b[0m/');
          term.writeln('\x1b[1;34mnode_modules\x1b[0m/');
          term.writeln('\x1b[0mpackage.json');
          term.writeln('\x1b[0mtsconfig.json');
          term.writeln('\x1b[0mvite.config.ts');
        } else if (cmd.startsWith('cd ')) {
          const path = originalCmd.replace(/^cd\s+/i, '').trim();
          if (path === '..') {
            term.writeln('\x1b[33mChanged directory to: /c/Users\x1b[0m');
          } else if (path === '/') {
            term.writeln('\x1b[33mChanged directory to: /\x1b[0m');
          } else {
            term.writeln(`\x1b[33mChanged directory to: ${path}\x1b[0m`);
          }
        } else if (cmd === 'npm run dev') {
          term.writeln('\x1b[1;33mStarting development server...\x1b[0m');
          term.writeln('\x1b[32m✓ Vite server running on http://localhost:5173\x1b[0m');
          term.writeln('\x1b[32m✓ Electron app launched\x1b[0m');
        } else {
          term.writeln(`\x1b[31m-bash: ${command}: command not found\x1b[0m`);
          term.writeln('Type "help" for available commands');
        }
        break;
      case 'node':
        try {
          const result = eval(command);
          if (result !== undefined) {
            term.writeln(result.toString());
          }
        } catch (error) {
          term.writeln(`\x1b[31m${error}\x1b[0m`);
        }
        break;
      case 'python':
        if (command.includes('print(') || command.includes('=')) {
          term.writeln(`\x1b[33m>>> ${command}\x1b[0m`);
          if (command.includes('print(')) {
            const content = command.match(/print\(['"](.*?)['"]\)/);
            if (content) {
              term.writeln(content[1]);
            }
          }
        } else {
          term.writeln(`\x1b[31mNameError: name '${command}' is not defined\x1b[0m`);
        }
        break;
      case 'npm':
        if (cmd === 'help') {
          term.writeln('\x1b[1;33mNPM Commands:\x1b[0m');
          term.writeln('  install              - Install dependencies');
          term.writeln('  run dev              - Start development server');
          term.writeln('  run build            - Build for production');
          term.writeln('  run test             - Run tests');
          term.writeln('  list                 - List installed packages');
        } else if (cmd === 'run dev') {
          term.writeln('\x1b[1;33m> electron-vite-react@0.1.0 dev\x1b[0m');
          term.writeln('\x1b[1;33m> tsc -p tsconfig.json --outDir dist-electron && concurrently -k -r "npm:dev:electron" "npm:dev:vite"\x1b[0m');
          term.writeln('\x1b[32m✓ Vite server running on http://localhost:5173\x1b[0m');
          term.writeln('\x1b[32m✓ Electron app launched\x1b[0m');
        } else if (cmd === 'list') {
          term.writeln('\x1b[1;33m├── electron@37.3.0\x1b[0m');
          term.writeln('\x1b[1;33m├── react@19.1.1\x1b[0m');
          term.writeln('\x1b[1;33m├── react-dom@19.1.1\x1b[0m');
          term.writeln('\x1b[1;33m├── @xterm/xterm@5.3.0\x1b[0m');
          term.writeln('\x1b[1;33m└── vite@7.1.2\x1b[0m');
        } else {
          term.writeln(`\x1b[31mnpm ERR! Unknown command: ${command}\x1b[0m`);
          term.writeln('Type "help" for available commands');
        }
        break;
      default:
        term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
        term.writeln('Type "help" for available commands');
    }
  };

  const initializeTerminal = async (tab: TerminalTab) => {
    console.log('Initializing terminal for tab:', tab.id);
    if (tab.terminal || tab.isInitialized || tab.processId) {
      console.log('Terminal already initialized or in progress for:', tab.id);
      return;
    }

    const term = createTerminal(tab);
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Update tabs with terminal instance and mark as in progress
    setTabs(prev => prev.map(t => 
      t.id === tab.id 
        ? { ...t, terminal: term, fitAddon, processId: 'initializing', isInitialized: false }
        : t
    ));

    // Open terminal in the DOM element
    setTimeout(async () => {
      const element = document.querySelector(`[data-terminal-id="${tab.id}"]`);
      console.log('Terminal element found:', element);
      if (element) {
        term.open(element as HTMLElement);
        fitAddon.fit();
        
        // Try to set up native terminal first, fall back to simulated if it fails
        try {
          await setupNativeTerminal(term, tab);
        } catch (error) {
          console.error('Failed to set up native terminal, using simulated:', error);
          setupSimulatedTerminal(term, tab);
        }
      } else {
        console.error('Terminal element not found for:', tab.id);
      }
    }, 100);
  };

  useEffect(() => {
    console.log('Terminal useEffect triggered, activeTab:', activeTab);
    if (!terminalRef.current) {
      console.log('Terminal ref not available');
      return;
    }

    // Initialize the active terminal
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData && !activeTabData.terminal) {
      console.log('Initializing terminal for active tab:', activeTab);
      initializeTerminal(activeTabData);
    }

    // Handle window resize
    const handleResize = () => {
      const activeTabData = tabs.find(tab => tab.id === activeTab);
      if (activeTabData?.fitAddon) {
        activeTabData.fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, tabs]);

  const switchTab = (tabId: string) => {
    console.log('Switching to tab:', tabId);
    setActiveTab(tabId);
    
    // Initialize terminal if not already done
    const tabData = tabs.find(tab => tab.id === tabId);
    if (tabData && !tabData.terminal && !tabData.isInitialized && !tabData.processId) {
      console.log('Need to initialize terminal for:', tabId);
      setTimeout(() => initializeTerminal(tabData), 100);
    } else {
      console.log('Terminal already exists for:', tabId, 'terminal:', !!tabData?.terminal, 'initialized:', tabData?.isInitialized, 'processId:', tabData?.processId);
    }
  };

  const closeTab = async (tabId: string) => {
    console.log('Closing tab:', tabId);
    const tabData = tabs.find(tab => tab.id === tabId);
    
    // Close native terminal process first
    if (tabData?.processId && tabData.isInitialized) {
      try {
        await window.api.closeTerminal(tabData.processId);
      } catch (error) {
        console.error('Error closing terminal process:', error);
      }
    }
    
    // Dispose of XTerm instance
    if (tabData?.terminal) {
      tabData.terminal.dispose();
    }
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // Switch to first available tab
    const remainingTabs = tabs.filter(tab => tab.id !== tabId);
    if (remainingTabs.length > 0 && activeTab === tabId) {
      setActiveTab(remainingTabs[0].id);
    }
  };

  const addTab = () => {
    console.log('Adding new tab');
    const newTab: TerminalTab = {
      id: `terminal-${Date.now()}`,
      name: 'New Terminal',
      type: 'powershell',
      terminal: null,
      fitAddon: null,
      processId: null,
      isInitialized: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  // Cleanup terminal processes on unmount ONLY
  useEffect(() => {
    return () => {
      // Close all terminal processes on component unmount only
      tabs.forEach(async (tab) => {
        if (tab.processId && tab.isInitialized) {
          try {
            console.log('Cleanup: closing terminal', tab.processId);
            await window.api.closeTerminal(tab.processId);
          } catch (error) {
            console.error('Error closing terminal on cleanup:', error);
          }
        }
      });
    };
  }, []); // Empty dependency array - only run on unmount

  console.log('Rendering terminal with tabs:', tabs.length, 'activeTab:', activeTab);
  const currentTab = tabs.find(tab => tab.id === activeTab);
  console.log('Current tab:', currentTab);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-tabs">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`terminal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
            >
              <span className="tab-name">
                {tab.name}
                {tab.isInitialized && (
                  <span style={{ color: '#4CAF50', fontSize: '10px', marginLeft: '5px' }}>●</span>
                )}
              </span>
              <button 
                className="close-tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button className="add-tab" onClick={addTab}>
            +
          </button>
        </div>
        <button className="terminal-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="terminal-content">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            ref={activeTab === tab.id ? terminalRef : null}
            data-terminal-id={tab.id}
            className={`terminal-instance ${activeTab === tab.id ? 'active' : 'hidden'}`}
          >
            {activeTab === tab.id && !tab.terminal && (
              <div style={{ 
                color: '#ffffff', 
                padding: '20px', 
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                <div>Initializing {tab.name} terminal...</div>
                <div style={{ color: '#cccccc', fontSize: '12px', marginTop: '10px' }}>
                  If terminal doesn't appear, check browser console for errors.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal; 