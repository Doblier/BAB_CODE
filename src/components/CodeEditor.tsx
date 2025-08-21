import React, { useState, useEffect, useRef } from 'react';
import './CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'text',
  placeholder,
  autoFocus = false
}) => {
  const [lineNumbers, setLineNumbers] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate line numbers
  const generateLineNumbers = (code: string): string => {
    const lines = code.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  // Add line numbers to content
  const addLineNumbers = (content: string): string => {
    console.log('🔢 LINE NUMBERS - Input:', JSON.stringify(content.substring(0, 100)));
    
    if (!content || content.trim() === '') {
      console.log('🔢 LINE NUMBERS - Empty content, returning as is');
      return content;
    }
    
    const lines = content.split('\n');
    const numberedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      return `${lineNumber} ${line}`;
    });
    
    const finalResult = numberedLines.join('\n');
    console.log('🔢 LINE NUMBERS - Output:', JSON.stringify(finalResult.substring(0, 100)));
    return finalResult;
  };

  // Remove line numbers from content
  const removeLineNumbers = (content: string): string => {
    if (!content.trim()) return content;
    
    const lines = content.split('\n');
    const cleanLines = lines.map(line => {
      // Remove line number at the beginning (1-4 digits followed by space)
      return line.replace(/^\d+\s/, '');
    });
    
    return cleanLines.join('\n');
  };

  // Update line numbers
  useEffect(() => {
    const lines = generateLineNumbers(value);
    setLineNumbers(lines);
  }, [value]);

  // Get content with line numbers for display
  const getDisplayContent = (): string => {
    const result = addLineNumbers(value);
    return result;
  };

  // Handle textarea scroll
  const handleScroll = () => {
    // Simple scroll handling for VS Code style
  };

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Ensure textarea is always focused and clickable
  const handleTextareaClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle keydown for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const displayValue = getDisplayContent();
      const newDisplayValue = displayValue.substring(0, start) + '  ' + displayValue.substring(end);
      const newValue = removeLineNumbers(newDisplayValue);
      onChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className="code-editor-container">
      <div className="line-numbers">
        <pre>{lineNumbers}</pre>
      </div>
      <div className="code-content">
        <textarea
          ref={textareaRef}
          value={getDisplayContent()}
          onChange={(e) => {
            const newValue = removeLineNumbers(e.target.value);
            onChange(newValue);
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onClick={handleTextareaClick}
          onFocus={handleTextareaClick}
          placeholder={placeholder}
          autoFocus={autoFocus}
          spellCheck={false}
          className="code-textarea"
        />
      </div>
    </div>
  );
};

export default CodeEditor;
