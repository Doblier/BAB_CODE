import React, { useState, useRef, useEffect } from 'react';
import './RightTerminal.css';

interface RightTerminalProps {
  onClose: () => void;
}

const RightTerminal: React.FC<RightTerminalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ type: 'system' | 'user' | 'output', content: string }>>([
    { type: 'system', content: 'Right Terminal Ready - Type commands to get started' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentPath, setCurrentPath] = useState('E:\\BAB_CODE');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeCommand = (command: string) => {
    // Simulate command execution
    const cmd = command.toLowerCase().trim();
    
    if (cmd === 'clear' || cmd === 'cls') {
      setMessages([{ type: 'system', content: 'Right Terminal Ready - Type commands to get started' }]);
      return;
    }
    
    if (cmd === 'help') {
      setMessages(prev => [...prev, 
        { type: 'output', content: 'Available commands: clear, help, pwd, ls, dir, echo, date' }
      ]);
      return;
    }
    
    if (cmd === 'pwd') {
      setMessages(prev => [...prev, { type: 'output', content: currentPath }]);
      return;
    }
    
    if (cmd === 'ls' || cmd === 'dir') {
      setMessages(prev => [...prev, { type: 'output', content: 'debug.txt\nindex.html\npackage.json\nREADME.md' }]);
      return;
    }
    
    if (cmd.startsWith('echo ')) {
      const text = command.substring(5);
      setMessages(prev => [...prev, { type: 'output', content: text }]);
      return;
    }
    
    if (cmd === 'date') {
      const now = new Date();
      setMessages(prev => [...prev, { type: 'output', content: now.toString() }]);
      return;
    }
    
    // Default response for unknown commands
    setMessages(prev => [...prev, { type: 'output', content: `Command not found: ${command}` }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userCommand = inputValue.trim();
    setInputValue('');
    
    // Add user command to messages
    setMessages(prev => [...prev, { type: 'user', content: userCommand }]);
    
    // Execute command
    executeCommand(userCommand);
  };

  return (
    <div className="right-terminal">
      {/* Right Terminal Header */}
      <div className="right-terminal-header">
        <div className="right-terminal-title">
          <span className="terminal-icon">⚡</span>
          Right Terminal
        </div>
        <button className="right-terminal-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div className="right-terminal-messages">
        {messages.map((message, index) => (
          <div key={index} className={`right-terminal-message ${message.type}`}>
            {message.type === 'user' && (
              <div className="command-prompt">
                <span className="prompt-symbol">$</span>
                <span className="command-text">{message.content}</span>
              </div>
            )}
            {message.type === 'output' && (
              <div className="command-output">
                {message.content}
              </div>
            )}
            {message.type === 'system' && (
              <div className="system-message">
                {message.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="right-terminal-input-area" onSubmit={handleSubmit}>
        <div className="input-prompt">
          <span className="prompt-symbol">$</span>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter command..."
          className="right-terminal-input"
          autoFocus
        />
      </form>
    </div>
  );
};

export default RightTerminal;
