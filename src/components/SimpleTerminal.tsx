import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface SimpleTerminalProps {
  onClose: () => void;
}

const SimpleTerminal: React.FC<SimpleTerminalProps> = ({ onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [terminalId, setTerminalId] = useState<string>('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal with minimal configuration
    const term = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    // Mount terminal
    term.open(terminalRef.current);
    fit.fit();

    setTerminal(term);
    setFitAddon(fit);

    // Create backend terminal with unique ID to avoid caching
    const id = `clean-powershell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTerminalId(id);

    // Simple input handling - send everything to backend
    term.onData((data) => {
      if (window.api) {
        window.api.sendTerminalInput(id, data);
      }
    });

    // Create terminal process
    if (window.api) {
      window.api.createTerminal('powershell', id).then((result: any) => {
        if (!result.success) {
          term.write(`\x1b[31mFailed to create terminal: ${result.error}\x1b[0m\r\n`);
        }
        // Don't show success message - let PowerShell start naturally
      });
    }

    return () => {
      if (window.api) {
        window.api.closeTerminal(id);
      }
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!window.api || !terminal) return;

    // Handle output from backend
    const handleOutput = (id: string, data: string) => {
      if (id === terminalId) {
        terminal.write(data);
      }
    };

    const handleError = (id: string, data: string) => {
      if (id === terminalId) {
        terminal.write(`\r\n\x1b[31mError: ${data}\x1b[0m\r\n`);
      }
    };

    window.api.onTerminalOutput(handleOutput);
    window.api.onTerminalError(handleError);

    return () => {
      if (window.api) {
        window.api.removeAllListeners('terminal-output');
        window.api.removeAllListeners('terminal-error');
      }
    };
  }, [terminal, terminalId]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon && terminal) {
        fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitAddon, terminal]);

  return (
    <div style={{ width: '100%', height: '400px', backgroundColor: '#1e1e1e' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: '#2d2d2d' }}>
        <span style={{ color: '#ffffff', marginRight: 'auto' }}>PowerShell</span>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#ffffff', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
      <div 
        ref={terminalRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 40px)',
          padding: '0',
          margin: '0'
        }} 
      />
    </div>
  );
};

export default SimpleTerminal;
