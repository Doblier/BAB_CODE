import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface ProperTerminalProps {
  onClose: () => void;
}

const ProperTerminal: React.FC<ProperTerminalProps> = ({ onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [terminalId, setTerminalId] = useState<string>('');
  
  // Terminal state
  const [currentLine, setCurrentLine] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('PS D:\\code\\test01> ');
  const [isWaitingForCommand, setIsWaitingForCommand] = useState<boolean>(true);

  // Redraw current line
  const redrawLine = useCallback((term: XTerm, line: string, cursor: number, promptText: string) => {
    // Move to beginning of line and clear it
    term.write('\r\x1b[K');
    // Write prompt and current line
    term.write(promptText + line);
    // Position cursor
    const targetPos = promptText.length + cursor;
    const currentPos = promptText.length + line.length;
    const diff = currentPos - targetPos;
    if (diff > 0) {
      term.write(`\x1b[${diff}D`); // Move cursor left
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!terminal) return;

    // Copy - Ctrl+C (when text is selected)
    if (e.ctrlKey && e.key === 'c') {
      const selection = terminal.getSelection();
      if (selection && selection.length > 0) {
        e.preventDefault();
        navigator.clipboard.writeText(selection).then(() => {
          console.log('Text copied:', selection);
        }).catch(err => {
          console.error('Failed to copy:', err);
        });
        return;
      }
    }

    // Paste - Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        if (text && isWaitingForCommand) {
          const newLine = currentLine.substring(0, cursorPosition) + text + currentLine.substring(cursorPosition);
          const newCursor = cursorPosition + text.length;
          setCurrentLine(newLine);
          setCursorPosition(newCursor);
          redrawLine(terminal, newLine, newCursor, prompt);
        }
      }).catch(err => {
        console.error('Failed to paste:', err);
      });
      return;
    }

    // Clear terminal - Ctrl+L
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      terminal.clear();
      redrawLine(terminal, currentLine, cursorPosition, prompt);
      return;
    }
  }, [terminal, currentLine, cursorPosition, prompt, isWaitingForCommand, redrawLine]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal
    const term = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowTransparency: false,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    // Mount terminal
    term.open(terminalRef.current);
    fit.fit();
    term.focus();

    setTerminal(term);
    setFitAddon(fit);

    // Create backend terminal
    const id = `proper-terminal-${Date.now()}`;
    setTerminalId(id);

    // Handle input with proper terminal discipline
    term.onData((data) => {
      if (!isWaitingForCommand) {
        // If not waiting for command, send directly to backend
        if (window.api) {
          window.api.sendTerminalInput(id, data).catch((error: any) => {
            console.error('Failed to send input to terminal:', error);
            term.write('\r\n\x1b[31mTerminal connection error\x1b[0m\r\n');
          });
        }
        return;
      }

      const code = data.charCodeAt(0);
      
      switch (code) {
        case 13: // Enter
          // Execute command
          term.write('\r\n');
          
          if (currentLine.trim()) {
            // Add to history
            setCommandHistory(prev => [...prev, currentLine]);
            setHistoryIndex(-1);
            
            // Send to backend
            if (window.api) {
              window.api.sendTerminalInput(id, currentLine + '\r\n').catch((error: any) => {
                console.error('Failed to send command to terminal:', error);
                term.write('\x1b[31mFailed to execute command\x1b[0m\r\n');
                setIsWaitingForCommand(true); // Reset to waiting state
              });
            }
          } else {
            // Empty command
            if (window.api) {
              window.api.sendTerminalInput(id, '\r\n');
            }
          }
          
          // Reset line state
          setCurrentLine('');
          setCursorPosition(0);
          setIsWaitingForCommand(false); // Wait for backend response
          break;
          
        case 8: // Backspace
        case 127: // Delete
          if (cursorPosition > 0) {
            const newLine = currentLine.substring(0, cursorPosition - 1) + currentLine.substring(cursorPosition);
            const newCursor = cursorPosition - 1;
            setCurrentLine(newLine);
            setCursorPosition(newCursor);
            redrawLine(term, newLine, newCursor, prompt);
          }
          break;
          
        case 9: // Tab - send for completion
          if (window.api) {
            window.api.sendTerminalInput(id, currentLine + '\t');
          }
          break;
          
        case 3: // Ctrl+C
          // Interrupt current command
          term.write('^C\r\n');
          if (window.api) {
            window.api.sendTerminalInput(id, '\x03');
          }
          setCurrentLine('');
          setCursorPosition(0);
          break;
          
        case 27: // Escape sequences (arrow keys)
          if (data.length === 3 && data[1] === '[') {
            switch (data[2]) {
              case 'A': // Up arrow
                if (commandHistory.length > 0) {
                  const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                  const command = commandHistory[newIndex];
                  setHistoryIndex(newIndex);
                  setCurrentLine(command);
                  setCursorPosition(command.length);
                  redrawLine(term, command, command.length, prompt);
                }
                break;
                
              case 'B': // Down arrow
                if (historyIndex !== -1) {
                  if (historyIndex < commandHistory.length - 1) {
                    const newIndex = historyIndex + 1;
                    const command = commandHistory[newIndex];
                    setHistoryIndex(newIndex);
                    setCurrentLine(command);
                    setCursorPosition(command.length);
                    redrawLine(term, command, command.length, prompt);
                  } else {
                    setHistoryIndex(-1);
                    setCurrentLine('');
                    setCursorPosition(0);
                    redrawLine(term, '', 0, prompt);
                  }
                }
                break;
                
              case 'C': // Right arrow
                if (cursorPosition < currentLine.length) {
                  const newCursor = cursorPosition + 1;
                  setCursorPosition(newCursor);
                  term.write('\x1b[C');
                }
                break;
                
              case 'D': // Left arrow
                if (cursorPosition > 0) {
                  const newCursor = cursorPosition - 1;
                  setCursorPosition(newCursor);
                  term.write('\x1b[D');
                }
                break;
            }
          }
          break;
          
        default:
          // Regular character
          if (code >= 32 && code <= 126) {
            const newLine = currentLine.substring(0, cursorPosition) + data + currentLine.substring(cursorPosition);
            const newCursor = cursorPosition + 1;
            setCurrentLine(newLine);
            setCursorPosition(newCursor);
            redrawLine(term, newLine, newCursor, prompt);
          }
          break;
      }
    });

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Create terminal process
    if (window.api) {
      window.api.createTerminal('powershell', id).then((result: any) => {
        if (!result.success) {
          term.write(`\x1b[31mFailed to create terminal: ${result.error}\x1b[0m\r\n`);
          term.write(prompt);
        }
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (window.api) {
        window.api.closeTerminal(id);
      }
      term.dispose();
    };
  }, [handleKeyDown, redrawLine]);

  useEffect(() => {
    if (!window.api || !terminal) return;

    // Handle output from backend
    const handleOutput = (id: string, data: string) => {
      if (id === terminalId) {
        terminal.write(data);
        
        // Check if this contains a new prompt
        const lines = data.split(/\r?\n/);
        const lastLine = lines[lines.length - 1];
        
        if (lastLine.match(/PS\s+[^>]*>\s*$/)) {
          // New prompt detected
          setPrompt(lastLine);
          setIsWaitingForCommand(true);
          setCurrentLine('');
          setCursorPosition(0);
        }
      }
    };

    const handleError = (id: string, data: string) => {
      if (id === terminalId) {
        terminal.write(`\r\n\x1b[31mError: ${data}\x1b[0m\r\n`);
      }
    };

    const handleClosed = (id: string) => {
      if (id === terminalId) {
        terminal.write('\r\n\x1b[31mTerminal session ended\x1b[0m\r\n');
      }
    };

    window.api.onTerminalOutput(handleOutput);
    window.api.onTerminalError(handleError);
    window.api.onTerminalClosed(handleClosed);

    return () => {
      if (window.api) {
        window.api.removeAllListeners('terminal-output');
        window.api.removeAllListeners('terminal-error');
        window.api.removeAllListeners('terminal-closed');
      }
    };
  }, [terminal, terminalId]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon && terminal) {
        fitAddon.fit();
        if (window.api) {
          window.api.resizeTerminal(terminalId, terminal.cols, terminal.rows);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitAddon, terminal, terminalId]);

  return (
    <div style={{ width: '100%', height: '400px', backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px 12px', 
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #333'
      }}>
        <span style={{ color: '#ffffff', marginRight: 'auto', fontSize: '14px' }}>
          PowerShell Terminal
        </span>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#ffffff', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px 8px',
            borderRadius: '3px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ×
        </button>
      </div>
      <div 
        ref={terminalRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 41px)',
          padding: '8px',
          boxSizing: 'border-box'
        }} 
      />
    </div>
  );
};

export default ProperTerminal;
