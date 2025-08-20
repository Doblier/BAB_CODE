import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
// import { SearchAddon } from '@xterm/addon-search'; // TODO: Install addon
import '@xterm/xterm/css/xterm.css';
import { DEFAULT_SHELLS, ShellInfo } from '../utils/shellDetector';
import { TerminalSettingsManager, TerminalSettings } from '../utils/terminalSettings';
import './EnhancedTerminal.css';

interface TerminalProps {
  onClose: () => void;
}

interface TerminalTab {
  id: string;
  name: string;
  shellInfo: ShellInfo;
  terminal: XTerm | null;
  fitAddon: FitAddon | null;
  searchAddon: any | null;
  processId: string | null;
  isInitialized: boolean;
  isActive: boolean;
  backend?: 'node-pty' | 'child_process';
  lastRefresh?: number;
  // Line editing state
  currentLine: string;
  cursorPosition: number;
  commandHistory: string[];
  historyIndex: number;
  prompt: string;
  promptLength: number;
}

declare global {
  interface Window {
    api: {
      createTerminal: (terminalType: string, terminalId: string) => Promise<any>;
      sendTerminalInput: (terminalId: string, input: string) => Promise<any>;
      resizeTerminal: (terminalId: string, cols: number, rows: number) => Promise<any>;
      closeTerminal: (terminalId: string) => Promise<any>;
      onTerminalOutput: (callback: (terminalId: string, data: string) => void) => void;
      onTerminalError: (callback: (terminalId: string, data: string) => void) => void;
      onTerminalClosed: (callback: (terminalId: string, code: number) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

// Helper function to redraw the current line
const redrawLine = (terminal: XTerm, tab: TerminalTab) => {
  // Clear the current line
  terminal.write('\r');
  terminal.write('\x1b[K'); // Clear to end of line
  
  // Write prompt and current line
  terminal.write(tab.prompt);
  terminal.write(tab.currentLine);
  
  // Position cursor correctly
  const targetPosition = tab.promptLength + tab.cursorPosition;
  const currentPosition = tab.promptLength + tab.currentLine.length;
  const diff = currentPosition - targetPosition;
  
  if (diff > 0) {
    terminal.write(`\x1b[${diff}D`); // Move cursor left
  }
};

const EnhancedTerminal: React.FC<TerminalProps> = ({ onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [availableShells, setAvailableShells] = useState<ShellInfo[]>([]);
  const [settings, setSettings] = useState<TerminalSettings>(
    TerminalSettingsManager.getInstance().getSettings()
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const settingsManager = useRef(TerminalSettingsManager.getInstance());

  // Initialize available shells
  useEffect(() => {
    const initializeShells = () => {
      const shells = DEFAULT_SHELLS;
      setAvailableShells(shells);
      
      if (shells.length > 0 && tabs.length === 0) {
        // Create initial tab with default shell
        const defaultShell = settings.defaultShell === 'auto' 
          ? shells[0] 
          : shells.find(s => s.id === settings.defaultShell) || shells[0];
        
        createNewTab(defaultShell);
      }
    };

    initializeShells();
  }, []);

  // Settings change listener
  useEffect(() => {
    const handleSettingsChange = (newSettings: TerminalSettings) => {
      setSettings(newSettings);
      // Apply settings to all active terminals
      tabs.forEach(tab => {
        if (tab.terminal) {
          applySettingsToTerminal(tab.terminal, newSettings);
        }
      });
    };

    settingsManager.current.onSettingsChange(handleSettingsChange);
    
    return () => {
      settingsManager.current.removeSettingsListener(handleSettingsChange);
    };
  }, [tabs]);

  // Terminal event listeners
  useEffect(() => {
    // Listen for external request to open a default terminal
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type?: string } | undefined;
      const type = detail?.type || 'cmd';
      const shell = availableShells.find(s => s.id === type) || availableShells[0];
      if (shell) {
        createNewTab(shell);
      }
    };
    window.addEventListener('open-default-terminal', handler as EventListener);

    const handleTerminalOutput = (terminalId: string, data: string) => {
      console.log(`🔥 Frontend received output for terminal ${terminalId}:`, JSON.stringify(data));
      console.log(`📝 Output char codes:`, Array.from(data).map(c => c.charCodeAt(0)).join(', '));
      
      setTabs(prevTabs => {
        const updatedTabs = prevTabs.map(tab => {
          if (tab.id === terminalId && tab.terminal) {
            console.log(`✍️ Writing to XTerm:`, JSON.stringify(data));
            tab.terminal.write(data);
            
            // Simple prompt detection - only clear line state when new prompt appears
            if (data.includes('PS ') && data.includes('>')) {
              console.log('🎯 PowerShell prompt detected in output');
              tab.currentLine = '';
              tab.cursorPosition = 0;
            }
            
            // Force terminal refresh periodically
            const now = Date.now();
            if (!tab.lastRefresh || (now - tab.lastRefresh) > 200) {
              setTimeout(() => {
                if (tab.terminal) {
                  tab.terminal.refresh(0, tab.terminal.rows - 1);
                }
              }, 16);
              tab.lastRefresh = now;
            }
          }
          return tab;
        });
        return updatedTabs;
      });
    };

    const handleTerminalError = (terminalId: string, data: string) => {
      console.error(`Terminal ${terminalId} error:`, data);
      setTabs(prevTabs => {
        const updatedTabs = prevTabs.map(tab => {
          if (tab.id === terminalId && tab.terminal) {
            tab.terminal.write(`\r\n\x1b[31mError: ${data}\x1b[0m\r\n`);
          }
          return tab;
        });
        return updatedTabs;
      });
    };

    const handleTerminalClosed = (terminalId: string, code: number) => {
      console.log(`Terminal ${terminalId} closed with code:`, code);
      setTabs(prevTabs => {
        const updatedTabs = prevTabs.map(tab => {
          if (tab.id === terminalId && tab.terminal) {
            tab.terminal.write(`\r\n\x1b[33mProcess exited with code: ${code}\x1b[0m\r\n`);
            tab.terminal.write('\x1b[33mPress any key to restart or close this tab\x1b[0m');
          }
          return tab;
        });
        return updatedTabs;
      });
    };

    if (window.api) {
      window.api.onTerminalOutput(handleTerminalOutput);
      window.api.onTerminalError(handleTerminalError);
      window.api.onTerminalClosed(handleTerminalClosed);
    }

    return () => {
      if (window.api) {
        window.api.removeAllListeners('terminal-output');
        window.api.removeAllListeners('terminal-error');
        window.api.removeAllListeners('terminal-closed');
      }
      window.removeEventListener('open-default-terminal', handler as EventListener);
    };
  }, []);

  const createNewTab = useCallback(async (shellInfo: ShellInfo) => {
    const tabId = `${shellInfo.id}-${Date.now()}`;
    
    const newTab: TerminalTab = {
      id: tabId,
      name: shellInfo.name,
      shellInfo,
      terminal: null,
      fitAddon: null,
      searchAddon: null,
      processId: null,
      isInitialized: false,
      isActive: false,
      // Line editing state
      currentLine: '',
      cursorPosition: 0,
      commandHistory: [],
      historyIndex: -1,
      prompt: 'PS > ',
      promptLength: 5,
    };

    console.log(`Creating new tab: ${tabId}, setting as active`);
    
    // Set as active immediately
    setActiveTabId(tabId);
    setTabs(prevTabs => [...prevTabs, newTab]);

    // Initialize terminal after state updates
    setTimeout(() => {
      console.log(`Initializing terminal for tab: ${tabId}`);
      initializeTerminal(tabId, shellInfo);
    }, 150);
  }, []);

  const initializeTerminal = async (tabId: string, shellInfo: ShellInfo) => {
    const terminal = new XTerm({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: getTerminalTheme(settings.theme),
      cursorStyle: settings.cursorStyle,
      cursorBlink: settings.cursorBlink,
      scrollback: settings.scrollback,
      allowTransparency: true,
      // Performance optimizations
      fastScrollModifier: 'alt',
      fastScrollSensitivity: 5,
      scrollSensitivity: 1,
      // Better input handling
      macOptionIsMeta: true,
      macOptionClickForcesSelection: false,
      rightClickSelectsWord: false,
      // Rendering optimizations
      disableStdin: false,
      convertEol: false,
    });

    const fitAddon = new FitAddon();
    const searchAddon = null; // TODO: Implement search addon
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    // terminal.loadAddon(searchAddon); // TODO: Add search addon

    // Apply current settings
    applySettingsToTerminal(terminal, settings);

    // Store terminal in tabs first
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, terminal, fitAddon, searchAddon, isInitialized: true }
          : tab
      )
    );

    // Mount terminal to DOM with proper timing - always mount if it's the active tab
    setTimeout(() => {
      if (terminalRef.current) {
        console.log(`Attempting to mount terminal ${tabId}, activeTabId: ${activeTabId}, isActive: ${tabId === activeTabId}`);
        
        // Always mount if this is the active tab or if there's no content in the terminal container
        if (tabId === activeTabId || terminalRef.current.children.length === 0) {
          terminal.open(terminalRef.current);
          fitAddon.fit();
          terminal.focus();
          
          console.log(`Terminal ${tabId} mounted and focused, rows: ${terminal.rows}, cols: ${terminal.cols}`);
        }
      }
    }, 200); // Increased timeout to ensure DOM is ready

    // Set up terminal event handlers with improved input handling
    let inputBuffer = '';
    let inputTimer: NodeJS.Timeout | null = null;
    
    terminal.onData((data) => {
      console.log(`🔥 Terminal ${tabId} input:`, JSON.stringify(data), 'char code:', data.charCodeAt(0));
      
      // Get current tab state
      setTabs(prevTabs => {
        const currentTab = prevTabs.find(t => t.id === tabId);
        if (!currentTab) return prevTabs;
        
        const code = data.charCodeAt(0);
        let updatedTab = { ...currentTab };
        
        // Handle input with local echo and proper line editing
        switch (code) {
          case 13: // Enter - execute command
            console.log('✅ Enter: Executing command:', updatedTab.currentLine);
            
            // Add to command history if not empty
            if (updatedTab.currentLine.trim()) {
              updatedTab.commandHistory = [...updatedTab.commandHistory, updatedTab.currentLine];
              updatedTab.historyIndex = updatedTab.commandHistory.length;
            }
            
            // Decide newline sequence and local echo based on backend
            const isChildBackendEnter = updatedTab.backend === 'child_process';
            window.api?.sendTerminalInput(tabId, isChildBackendEnter ? '\r\n' : '\r');
            if (isChildBackendEnter && updatedTab.terminal) {
              updatedTab.terminal.write('\r\n');
            }
            
            // Reset line state immediately
            updatedTab.currentLine = '';
            updatedTab.cursorPosition = 0;
            break;
            
          case 8:   // Backspace
          case 127: // Delete
            console.log('🔙 Backspace: sending to backend');
            
            // Send to backend and only update local buffer for history
            window.api?.sendTerminalInput(tabId, data);
            
            if (updatedTab.cursorPosition > 0) {
              const before = updatedTab.currentLine.substring(0, updatedTab.cursorPosition - 1);
              const after = updatedTab.currentLine.substring(updatedTab.cursorPosition);
              updatedTab.currentLine = before + after;
              updatedTab.cursorPosition--;
              console.log('✓ Local buffer updated:', updatedTab.currentLine);
              if (updatedTab.backend === 'child_process' && updatedTab.terminal) {
                updatedTab.terminal.write('\b \b');
              }
            }
            break;
            
          case 27: // Escape sequences (arrow keys) - send to backend
            console.log('🔄 Escape sequence: sending to backend');
            window.api?.sendTerminalInput(tabId, data);
            break;
            
          case 9: // Tab - completion
            console.log('🔍 Tab completion');
            // Send only the Tab key; line content already exists in the shell
            window.api?.sendTerminalInput(tabId, '\t');
            break;
            
          case 12: // Ctrl+L - clear screen
            console.log('🧹 Clear screen');
            terminal.clear();
            terminal.write(updatedTab.prompt);
            terminal.write(updatedTab.currentLine);
            break;
            
          case 3: // Ctrl+C - check if text is selected for copy, otherwise interrupt
            console.log('🛑 Ctrl+C detected');
            
            // Check if there's selected text for copying
            const selection = terminal.getSelection();
            if (selection && selection.length > 0) {
              console.log('📋 Copying selected text:', selection);
              navigator.clipboard.writeText(selection).then(() => {
                console.log('✓ Text copied to clipboard');
              }).catch(err => {
                console.error('Failed to copy text:', err);
              });
            } else {
              // No selection, send interrupt signal to process (not terminal)
              console.log('🛑 Sending interrupt signal to process');
              terminal.write('^C');
              window.api?.sendTerminalInput(tabId, '\x03');
              // Clear current line but don't exit terminal
              updatedTab.currentLine = '';
              updatedTab.cursorPosition = 0;
            }
            break;
            
          default:
            // Send ALL input directly to backend - no local echo
            console.log('📝 Sending all input to backend:', JSON.stringify(data), 'code:', code);
            window.api?.sendTerminalInput(tabId, data);
            
            // Only track printable characters in buffer for history (no display)
            if (code >= 32 && code <= 126) {
              const before = updatedTab.currentLine.substring(0, updatedTab.cursorPosition);
              const after = updatedTab.currentLine.substring(updatedTab.cursorPosition);
              updatedTab.currentLine = before + data + after;
              updatedTab.cursorPosition++;
              console.log('📝 Updated line buffer:', updatedTab.currentLine);
              if (updatedTab.backend === 'child_process' && updatedTab.terminal) {
                updatedTab.terminal.write(data);
              }
            }
            break;
        }
        
        // Return updated tabs
        return prevTabs.map(tab => tab.id === tabId ? updatedTab : tab);
      });
    });

    terminal.onResize(({ cols, rows }) => {
      if (window.api) {
        window.api.resizeTerminal(tabId, cols, rows);
      }
    });

    // Create backend terminal process
    try {
      const result = await window.api.createTerminal(shellInfo.id, tabId);
      if (result.success) {
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === tabId 
              ? { ...tab, processId: result.pid, backend: result.backend }
              : tab
          )
        );
        
        // Start completely clean - no content, no prompts, no messages
        console.log(`Terminal ${tabId} created - waiting for backend prompt`);
        
        console.log(`Terminal ${tabId} backend created successfully:`, result);
      } else {
        terminal.write(`\r\n\x1b[31mFailed to create terminal: ${result.error}\x1b[0m\r\n`);
      }
    } catch (error) {
      terminal.write(`\r\n\x1b[31mError creating terminal: ${error}\x1b[0m\r\n`);
    }
  };

  const switchToTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.terminal && tab.fitAddon && terminalRef.current) {
      console.log(`Switching to tab ${tabId}`);
      
      // Check if this terminal is already mounted
      const isAlreadyMounted = terminalRef.current.querySelector('.xterm');
      
      if (!isAlreadyMounted || terminalRef.current.children.length === 0) {
        // Only clear and mount if not already mounted
        terminalRef.current.innerHTML = '';
        tab.terminal.open(terminalRef.current);
        console.log(`Mounted terminal ${tabId} during tab switch`);
      }
      
      // Always fit and focus
      setTimeout(() => {
        if (tab.fitAddon) {
          tab.fitAddon.fit();
        }
        if (tab.terminal) {
          tab.terminal.focus();
          console.log(`Focused terminal ${tabId}`);
        }
      }, 50);
    }
  }, [tabs]);

  const closeTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      // Close backend process
      if (window.api && tab.processId) {
        await window.api.closeTerminal(tabId);
      }
      
      // Dispose terminal
      if (tab.terminal) {
        tab.terminal.dispose();
      }
      
      // Remove tab
      setTabs(prevTabs => prevTabs.filter(t => t.id !== tabId));
      
      // Switch to another tab or close terminal
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        switchToTab(remainingTabs[0].id);
      } else {
        onClose();
      }
    }
  }, [tabs, switchToTab, onClose]);

  const applySettingsToTerminal = (terminal: XTerm, settings: TerminalSettings) => {
    terminal.options.fontSize = settings.fontSize;
    terminal.options.fontFamily = settings.fontFamily;
    terminal.options.theme = getTerminalTheme(settings.theme);
    terminal.options.cursorStyle = settings.cursorStyle;
    terminal.options.cursorBlink = settings.cursorBlink;
    terminal.options.scrollback = settings.scrollback;
  };

  const getTerminalTheme = (theme: string) => {
    const themes = {
      dark: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selection: '#3a3d41',
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
        brightWhite: '#ffffff',
      },
      light: {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#000000',
        cursorAccent: '#ffffff',
        selection: '#add6ff',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555',
        brightBlack: '#666666',
        brightRed: '#cd3131',
        brightGreen: '#14ce14',
        brightYellow: '#b5ba00',
        brightBlue: '#0451a5',
        brightMagenta: '#bc05bc',
        brightCyan: '#0598bc',
        brightWhite: '#a5a5a5',
      }
    };
    
    return theme === 'light' ? themes.light : themes.dark;
  };

  const handleSearch = (term: string) => {
    // TODO: Implement search functionality
    console.log('Search term:', term);
    // const activeTab = tabs.find(t => t.id === activeTabId);
    // if (activeTab && activeTab.searchAddon) {
    //   if (term) {
    //     activeTab.searchAddon.findNext(term);
    //   }
    // }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    console.log(`Global keydown: ${e.key}, ctrl: ${e.ctrlKey}, shift: ${e.shiftKey}, alt: ${e.altKey}`);
    
    const activeElement = document.activeElement;
    const isTerminalFocused = activeElement?.closest('.terminal-viewport');
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    console.log(`Terminal focused: ${!!isTerminalFocused}, Active tab: ${!!activeTab}`);
    
    // Terminal-specific shortcuts (work when terminal is focused)
    if (isTerminalFocused && activeTab?.terminal) {
      console.log('Processing terminal-focused shortcuts');
      // Ctrl+Shift+C - Copy selected text
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const selection = activeTab.terminal.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection).then(() => {
            console.log('Text copied to clipboard:', selection);
          }).catch(err => {
            console.error('Failed to copy text:', err);
          });
        }
        return;
      }
      
      // Ctrl+Shift+V - Paste from clipboard (terminal standard)
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text && activeTab) {
            console.log('📋 Pasting text:', text);
            // Add pasted text to current line buffer
            setTabs(prevTabs => 
              prevTabs.map(tab => {
                if (tab.id === activeTabId) {
                  const before = tab.currentLine.substring(0, tab.cursorPosition);
                  const after = tab.currentLine.substring(tab.cursorPosition);
                  const newLine = before + text + after;
                  const newCursorPos = tab.cursorPosition + text.length;
                  
                  // Update display
                  if (activeTab.terminal) {
                    redrawLine(activeTab.terminal, { ...tab, currentLine: newLine, cursorPosition: newCursorPos });
                  }
                  
                  return { 
                    ...tab, 
                    currentLine: newLine, 
                    cursorPosition: newCursorPos 
                  };
                }
                return tab;
              })
            );
          }
        }).catch(err => {
          console.error('Failed to paste text:', err);
        });
        return;
      }
      
      // Ctrl+V - Alternative paste (common shortcut)
      if (e.ctrlKey && !e.shiftKey && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text && activeTab) {
            console.log('📋 Pasting text (Ctrl+V):', text);
            // Add pasted text to current line buffer
            setTabs(prevTabs => 
              prevTabs.map(tab => {
                if (tab.id === activeTabId) {
                  const before = tab.currentLine.substring(0, tab.cursorPosition);
                  const after = tab.currentLine.substring(tab.cursorPosition);
                  const newLine = before + text + after;
                  const newCursorPos = tab.cursorPosition + text.length;
                  
                  // Update display
                  if (activeTab.terminal) {
                    redrawLine(activeTab.terminal, { ...tab, currentLine: newLine, cursorPosition: newCursorPos });
                  }
                  
                  return { 
                    ...tab, 
                    currentLine: newLine, 
                    cursorPosition: newCursorPos 
                  };
                }
                return tab;
              })
            );
          }
        }).catch(err => {
          console.error('Failed to paste text:', err);
        });
        return;
      }
      
      // Ctrl+Shift+K - Clear terminal
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        activeTab.terminal.clear();
        activeTab.terminal.write('\x1b[32mTerminal cleared\x1b[0m\r\n$ ');
        console.log('Terminal cleared with Ctrl+Shift+K');
        return;
      }
      
      // Ctrl+A - Select all (in terminal)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        activeTab.terminal.selectAll();
        console.log('Selected all terminal content');
        return;
      }
    }
    
    // Global IDE shortcuts
    // Ctrl+Shift+F - Search
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      setIsSearchVisible(!isSearchVisible);
    }
    
    // Ctrl+Shift+T - New tab
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      if (availableShells.length > 0) {
        createNewTab(availableShells[0]);
      }
    }
    
    // Ctrl+Shift+W - Close tab
    if (e.ctrlKey && e.shiftKey && e.key === 'W') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }
    
    // Ctrl+Tab - Switch tabs
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      if (tabs[nextIndex]) {
        switchToTab(tabs[nextIndex].id);
      }
    }
    
    // Ctrl+Shift+` - Focus terminal (common IDE shortcut)
    if (e.ctrlKey && e.shiftKey && e.key === '`') {
      e.preventDefault();
      if (activeTab && activeTab.terminal) {
        activeTab.terminal.focus();
      }
    }
    
    // F11 - Toggle fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
    
    // Ctrl+Shift+? or F1 - Show keyboard shortcuts help
    if ((e.ctrlKey && e.shiftKey && e.key === '?') || e.key === 'F1') {
      console.log('🔥 F1 or Ctrl+Shift+? detected - toggling shortcuts');
      e.preventDefault();
      setShowShortcuts(!showShortcuts);
      return;
    }
    
    // Test shortcut - Ctrl+Shift+X for debugging
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
      console.log('🔥 Test shortcut Ctrl+Shift+X works!');
      e.preventDefault();
      alert('Keyboard shortcuts are working!');
      return;
    }
    
    // Test backspace simulation - Ctrl+Shift+B
    if (e.ctrlKey && e.shiftKey && e.key === 'B') {
      console.log('🔥 Testing backspace simulation');
      e.preventDefault();
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && activeTab.terminal) {
        // Simulate typing and backspace
        activeTab.terminal.write('test');
        setTimeout(() => {
          if (activeTab.terminal) {
            activeTab.terminal.write('\b \b'); // backspace sequence
            console.log('Simulated backspace sequence sent');
          }
        }, 500);
      }
      return;
    }
  }, [isSearchVisible, availableShells, activeTabId, tabs, createNewTab, closeTab, switchToTab]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mount active terminal when activeTabId changes
  useEffect(() => {
    if (activeTabId && terminalRef.current) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && activeTab.terminal && activeTab.fitAddon) {
        console.log(`Active tab changed to: ${activeTabId}, checking if already mounted`);
        
        // Only mount if not already mounted (check if terminal is already in the DOM)
        const isAlreadyMounted = terminalRef.current.querySelector('.xterm');
        
        if (!isAlreadyMounted) {
          console.log(`Mounting terminal ${activeTabId} for first time`);
          activeTab.terminal.open(terminalRef.current);
          activeTab.fitAddon.fit();
          activeTab.terminal.focus();
        } else {
          console.log(`Terminal ${activeTabId} already mounted, just focusing`);
          activeTab.terminal.focus();
        }
      }
    }
  }, [activeTabId, tabs]);

  // Fit terminal when container resizes
  useEffect(() => {
    const handleResize = () => {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && activeTab.fitAddon) {
        setTimeout(() => activeTab.fitAddon?.fit(), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTabId, tabs]);

  return (
    <div className="enhanced-terminal">
      {/* Terminal Tabs */}
      <div className="terminal-tabs">
        <div className="tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => switchToTab(tab.id)}
            >
              <span className="tab-icon">{tab.shellInfo.icon}</span>
              <span className="tab-name">{tab.name}</span>
              {tab.backend && (
                <span className="tab-backend" title={`Backend: ${tab.backend}`}>
                  {tab.backend === 'node-pty' ? '⚡' : '🔧'}
                </span>
              )}
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {/* New Tab Button */}
        <div className="tab-controls">
          <div className="dropdown">
            <button className="new-tab-btn" title="New Terminal">+</button>
            <div className="dropdown-content">
              {availableShells.map(shell => (
                <div
                  key={shell.id}
                  className="dropdown-item"
                  onClick={() => createNewTab(shell)}
                >
                  <span className="shell-icon">{shell.icon}</span>
                  <div className="shell-info">
                    <div className="shell-name">{shell.name}</div>
                    <div className="shell-description">{shell.description}</div>
                  </div>
                  {shell.version && (
                    <span className="shell-version">{shell.version}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchVisible && (
        <div className="terminal-search">
          <input
            type="text"
            placeholder="Search in terminal..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchVisible(false);
              } else if (e.key === 'Enter') {
                handleSearch(searchTerm);
              }
            }}
            autoFocus
          />
          <button onClick={() => setIsSearchVisible(false)}>×</button>
        </div>
      )}

      {/* Terminal Container */}
      <div className="terminal-container">
        <div 
          ref={terminalRef} 
          className="terminal-viewport"
          onClick={() => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab && activeTab.terminal) {
              activeTab.terminal.focus();
              console.log(`Terminal ${activeTabId} clicked and focused`);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab && activeTab.terminal) {
              // Show browser's context menu for copy/paste
              const selection = activeTab.terminal.getSelection();
              if (selection) {
                // If there's a selection, copy it
                navigator.clipboard.writeText(selection).then(() => {
                  console.log('Right-click: Text copied');
                });
              } else {
                // If no selection, try to paste
                navigator.clipboard.readText().then(text => {
                  if (text && window.api) {
                    window.api.sendTerminalInput(activeTabId, text);
                    console.log('Right-click: Text pasted');
                  }
                });
              }
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="terminal-status">
        {activeTabId && (
          <>
            <span className="status-item">
              {tabs.find(t => t.id === activeTabId)?.shellInfo.name}
            </span>
            <span className="status-item">
              Backend: {tabs.find(t => t.id === activeTabId)?.backend || 'Unknown'}
            </span>
            <span className="status-item">
              PID: {tabs.find(t => t.id === activeTabId)?.processId || 'N/A'}
            </span>
            <span className="status-item">
              <button 
                onClick={() => {
                  console.log('🔥 Help button clicked, current state:', showShortcuts);
                  setShowShortcuts(!showShortcuts);
                }}
                className="help-button"
                title="Show keyboard shortcuts (F1)"
              >
                ?
              </button>
            </span>
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Help Overlay */}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="shortcuts-content">
              <div className="shortcuts-section">
                <h4>Terminal Controls</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>L</kbd> - Clear screen
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>C</kbd> - Interrupt process
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>A</kbd> - Beginning of line
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>E</kbd> - End of line
                </div>
                <div className="shortcut-item">
                  <kbd>↑</kbd> <kbd>↓</kbd> - Command history
                </div>
                <div className="shortcut-item">
                  <kbd>Tab</kbd> - Auto-complete
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Copy & Paste</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> - Copy selection
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> - Paste
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>A</kbd> - Select all
                </div>
                <div className="shortcut-item">
                  <kbd>Right Click</kbd> - Copy/Paste context menu
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Terminal Management</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd> - New terminal
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd> - Close terminal
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Tab</kbd> - Switch terminals
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>`</kbd> - Focus terminal
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> - Clear terminal
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Other</h4>
                <div className="shortcut-item">
                  <kbd>F1</kbd> - Show/hide this help
                </div>
                <div className="shortcut-item">
                  <kbd>F11</kbd> - Toggle fullscreen
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> - Search in terminal
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTerminal;
