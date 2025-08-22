import React, { useState, useRef, useEffect } from 'react';
import './AITerminal.css';

interface AITerminalProps {
  onClose: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

const AITerminal: React.FC<AITerminalProps> = ({ onClose, onDragStart }) => {
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([
    { type: 'ai', content: 'Hello! I\'m your AI assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiResponse = `I understand you said: "${userMessage}". This is a placeholder response. In a real implementation, this would connect to an AI service like OpenAI, Claude, or a local AI model.`;
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="ai-terminal">
      {/* AI Terminal Header */}
      <div className="ai-terminal-header">
        <div className="ai-terminal-title">
          <span className="ai-icon">🤖</span>
          AI Assistant
        </div>
        <button className="ai-terminal-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* AI Terminal Drag Handle */}
      {onDragStart && (
        <div 
          className="ai-terminal-drag-handle"
          onMouseDown={onDragStart}
          title="Drag to move AI terminal"
        >
          <div className="drag-handle-icon">
            <span>⋮</span>
            <span>⋮</span>
            <span>⋮</span>
          </div>
        </div>
      )}

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
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="ai-input"
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()} className="ai-send-btn">
          Send
        </button>
      </form>
    </div>
  );
};

export default AITerminal;
