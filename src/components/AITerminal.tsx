import React, { useState, useRef, useEffect } from 'react';
import './AITerminal.css';
import { useTheme } from '../contexts/ThemeContext';

interface AITerminalProps {
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  currentWidth?: number;
}

interface Message {
  type: 'user' | 'ai';
  content: string;
}

const AITerminal: React.FC<AITerminalProps> = ({ onClose, onWidthChange, currentWidth }) => {
  const { currentTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [widthInput, setWidthInput] = useState(currentWidth ? Math.round(currentWidth) : 800);
  const [messages, setMessages] = useState<Message[]>([
    { type: 'ai', content: 'Hello! I\'m your AI assistant. How can I help you today?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus management - prevent focus conflicts with bottom terminal
  const handleInputFocus = () => {
    console.log('AI Terminal input focused');
  };

  const handleInputBlur = () => {
    console.log('AI Terminal input blurred');
  };

  const handleInputClick = () => {
    // Ensure input gets focus when clicked
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiResponse = `I understand you said: "${userMessage}". This is a placeholder response. In a real implementation, this would connect to an AI service like OpenAI, Claude, or a local AI model.`;
      
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      setIsLoading(false);
      
      // Refocus input after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }, 1000);
  };

  const clearMessages = () => {
    setMessages([{ type: 'ai', content: 'Hello! I\'m your AI assistant. How can I help you today?' }]);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value);
    if (!isNaN(newWidth) && newWidth > 0) {
      setWidthInput(newWidth);
      onWidthChange?.(newWidth);
    }
  };

  return (
    <div className="ai-terminal" onClick={() => {
      // When clicking anywhere in the AI terminal, focus the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }}>
      {/* Simple Header */}
      <div className="ai-terminal-header">
        <span className="ai-terminal-title">AI Assistant</span>
        <div className="ai-terminal-controls">
          <div className="width-control">
            <label htmlFor="width-input">Width:</label>
            <input
              id="width-input"
              type="number"
              value={widthInput}
              onChange={handleWidthChange}
              min="200"
              max="2000"
              step="10"
              className="width-input"
              title="Set panel width in pixels"
            />
            <span>px</span>
          </div>
          <button className="ai-terminal-close" onClick={onClose} title="Close AI Terminal">
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="ai-messages">
        {messages.map((message, index) => (
          <div key={index} className={`ai-message ${message.type}`}>
            <div className="ai-message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-message ai">
            <div className="ai-message-content">
              <div className="ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="ai-input-area" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="ai-input"
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()} className="ai-send-btn">
          Send
        </button>
        <button 
          type="button"
          onClick={clearMessages}
          className="ai-clear-btn"
          title="Clear messages"
        >
          🗑️
        </button>
      </form>
    </div>
  );
};

export default AITerminal;
