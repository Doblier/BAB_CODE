import React, { useState, useRef, useEffect } from 'react';
import './AITerminal.css';
import { useTheme } from '../contexts/ThemeContext';
import { Send, X, Undo2, Check, Copy, MoreHorizontal, Bot, User, Upload, ChevronDown, ChevronRight, AtSign, Infinity, Settings } from 'lucide-react';

interface AITerminalProps {
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  currentWidth?: number;
  selectedModel?: string;
}

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp?: Date;
  model?: string;
}

interface AIModel {
  id: string;
  name: string;
}

const AITerminal: React.FC<AITerminalProps> = ({ onClose, onWidthChange, currentWidth, selectedModel = 'gpt-3.5-turbo' }) => {
  const { currentTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [widthInput, setWidthInput] = useState(currentWidth ? Math.round(currentWidth) : 800);
  const [activeTab, setActiveTab] = useState('chat');
  const [progress, setProgress] = useState(34.7);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [conversationId] = useState(`conv_${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'ai', 
      content: 'Hello! I\'m your AI assistant. I can help you with coding, debugging, and programming questions. What would you like to work on?',
      timestamp: new Date(),
      model: selectedModel
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when selectedModel changes
  useEffect(() => {
    setMessages(prev => prev.map(msg => 
      msg.type === 'ai' ? { ...msg, model: selectedModel } : msg
    ));
  }, [selectedModel]);

  const loadAvailableModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      const data = await response.json();
      
      const models: AIModel[] = Object.entries(data.models).map(([id, name]) => ({
        id,
        name: name as string
      }));
      
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback models
      setAvailableModels([
        { id: 'gpt-4', name: 'GPT-4 (OpenAI)' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku (Anthropic)' },
        { id: 'gemini-pro', name: 'Gemini Pro (Google)' }
      ]);
    }
  };

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const handleInputFocus = () => {
    console.log('AI Terminal input focused');
  };

  const handleInputBlur = () => {
    console.log('AI Terminal input blurred');
  };

  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const sendMessageToAPI = async (message: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model: selectedModel,
          conversation_id: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    setIsLoading(true);

    try {
      // Send message to Python backend
      const result = await sendMessageToAPI(userMessage);
      
      if (result.success) {
        // Add AI response
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: result.response,
          timestamp: new Date(),
          model: selectedModel
        }]);
      } else {
        // Handle error
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: `Error: ${result.error || 'Failed to get response from AI'}`,
          timestamp: new Date(),
          model: selectedModel
        }]);
      }
    } catch (error) {
      // Handle network/API errors
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `Connection error: ${error instanceof Error ? error.message : 'Failed to connect to AI service'}`,
        timestamp: new Date(),
        model: selectedModel
      }]);
    } finally {
      setIsLoading(false);
      
      // Refocus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const clearMessages = () => {
    setMessages([{ 
      type: 'ai', 
      content: 'Hello! I\'m your AI assistant. I can help you with coding, debugging, and programming questions. What would you like to work on?',
      timestamp: new Date(),
      model: selectedModel
    }]);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value);
    if (!isNaN(newWidth) && newWidth > 0) {
      setWidthInput(newWidth);
      onWidthChange?.(newWidth);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File uploaded:', file.name);
      // TODO: Implement file upload to AI service
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="ai-terminal" onClick={() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }}>
      {/* VS Code Style Header */}
      <div className="ai-terminal-header">
        <div className="ai-tabs">
          <button 
            className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`ai-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
          <button 
            className={`ai-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        <div className="ai-terminal-controls">
          <button className="ai-terminal-close" onClick={onClose} title="Close AI Terminal">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ai-main-content">
        {activeTab === 'chat' && (
          <>
            {/* Messages Area */}
            <div className="ai-messages">
              {messages.map((message, index) => (
                <div key={index} className={`ai-message ${message.type}`}>
                  <div className="ai-message-content">
                    <div className="ai-message-text">{message.content}</div>
                    {message.model && (
                      <div className="ai-message-model">
                        {message.model}
                      </div>
                    )}
                    <div className="ai-message-actions">
                      <button 
                        className="ai-action-btn"
                        onClick={() => copyToClipboard(message.content)}
                        title="Copy message"
                      >
                        <Copy size={12} />
                      </button>
                      <button className="ai-action-btn" title="More options">
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
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

            {/* New Input Area Design */}
            <div className="ai-input-container">
              {/* Top Section */}
              <div className="ai-input-top-section">
                <div className="ai-files-section">
                  <button className="ai-files-btn">
                    <ChevronRight size={12} />
                    2 Files
                  </button>
                </div>
                <div className="ai-top-controls">
                  <button className="ai-control-btn" onClick={clearMessages} title="Undo All">
                    Undo All
                  </button>
                  <button className="ai-control-btn primary" title="Keep All">
                    <Check size={12} />
                    Keep All
                  </button>
                </div>
              </div>

              {/* Middle Section */}
              <div className="ai-input-middle-section">
                <button className="ai-add-context-btn">
                  <AtSign size={12} />
                  Add Context
                </button>
                <div className="ai-progress-section">
                  <span className="ai-progress-text">{progress}%</span>
                  <div className="ai-progress-circle">
                    <div className="ai-progress-fill" style={{ transform: `rotate(${progress * 3.6}deg)` }}></div>
                  </div>
                </div>
              </div>

              {/* Main Input Area */}
              <div className="ai-input-main-area">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onClick={handleInputClick}
                  onKeyDown={handleKeyDown}
                  placeholder="I'll give you clear picture"
                  disabled={isLoading}
                  className="ai-textarea"
                  rows={3}
                />
              </div>

              {/* Bottom Controls - Model selector removed */}
              <div className="ai-bottom-controls">
                <div className="ai-left-controls">
                  <button className="ai-auto-btn">
                    Auto
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="ai-right-controls">
                  <button className="ai-send-btn" onClick={handleSubmit} disabled={isLoading || !inputValue.trim()}>
                    Send
                    <Send size={12} />
                  </button>
                  <button className="ai-upload-btn" onClick={triggerFileUpload} title="Upload">
                    <Upload size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'files' && (
          <div className="ai-files-tab">
            <div className="ai-files-header">
              <h3>Files</h3>
              <span>3 Files</span>
            </div>
            <div className="ai-files-list">
              <div className="ai-file-item">
                <span className="ai-file-name">index.html</span>
                <span className="ai-file-status">Modified</span>
              </div>
              <div className="ai-file-item">
                <span className="ai-file-name">style.css</span>
                <span className="ai-file-status">Untracked</span>
              </div>
              <div className="ai-file-item">
                <span className="ai-file-name">script.js</span>
                <span className="ai-file-status">Modified</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="ai-settings-tab">
            <div className="ai-settings-header">
              <h3>Settings</h3>
            </div>
            <div className="ai-settings-content">
              <div className="ai-setting-item">
                <label>Panel Width:</label>
                <input
                  type="number"
                  value={widthInput}
                  onChange={handleWidthChange}
                  min="200"
                  max="2000"
                  step="10"
                  className="ai-width-input"
                />
                <span>px</span>
              </div>
              <div className="ai-setting-item">
                <label>Current Model:</label>
                <span className="ai-current-model">{selectedModel}</span>
              </div>
              <div className="ai-setting-item">
                <label>Auto-save:</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="ai-setting-item">
                <label>Dark Mode:</label>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AITerminal;
