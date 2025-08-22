import React, { useState, useRef, useEffect } from 'react';
import './CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language = 'typescript',
  onFocus,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [highlightedContent, setHighlightedContent] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Basic syntax highlighting
  const highlightSyntax = (content: string): string => {
    if (!content) return content;
    
    return content
      // Comments
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
      
      // HTML tags - simple approach
      .replace(/(<[^>]*>)/g, '<span class="keyword">$1</span>')
      
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|import|export|default|class|interface|type|enum|namespace|module|declare|async|await|try|catch|finally|throw|new|delete|typeof|instanceof|in|of|extends|implements|public|private|protected|static|readonly|abstract|override|super|this|null|undefined|true|false|void|any|unknown|never|object|string|number|boolean|symbol|bigint)\b/g, '<span class="keyword">$1</span>')
      
      // Numbers
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      
      // Function calls
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="function">$1</span>(');
  };

  // Generate line numbers
  const generateLineNumbers = (content: string) => {
    const lines = content.split('\n');
    const numbers = lines.map((_, index) => (index + 1).toString());
    setLineNumbers(numbers);
  };

  // Simulate TypeScript errors for demonstration
  const simulateErrors = (content: string) => {
    const lines = content.split('\n');
    const newErrors: { line: number; message: string }[] = [];
    
    lines.forEach((line, index) => {
      // Simulate some common TypeScript errors
      if (line.includes('const') && line.includes('let')) {
        newErrors.push({ line: index + 1, message: "Cannot redeclare block-scoped variable" });
      }
      if (line.includes('console.log') && !line.includes(';')) {
        newErrors.push({ line: index + 1, message: "Missing semicolon" });
      }
      if (line.includes('import') && line.includes('from') && !line.includes("'") && !line.includes('"')) {
        newErrors.push({ line: index + 1, message: "Module not found" });
      }
      if (line.includes('useState') && !line.includes('import')) {
        newErrors.push({ line: index + 1, message: "Cannot find name 'useState'" });
      }
    });
    
    setErrors(newErrors);
  };

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Handle input changes
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    generateLineNumbers(newValue);
    simulateErrors(newValue);
    setHighlightedContent(highlightSyntax(newValue));
    
    // Save cursor position
    const selection = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    };
    sessionStorage.setItem('cursor-position', JSON.stringify(selection));
  };

  // Handle focus events
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Update line numbers when value changes
  useEffect(() => {
    generateLineNumbers(value);
    simulateErrors(value);
    setHighlightedContent(highlightSyntax(value));
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className="code-editor-container">
      {/* Line Numbers */}
      <div className="line-numbers" ref={lineNumbersRef}>
        {lineNumbers.map((number, index) => {
          const hasError = errors.some(error => error.line === index + 1);
          return (
            <div 
              key={index} 
              className={`line-number ${hasError ? 'error-line' : ''}`}
              title={hasError ? errors.find(error => error.line === index + 1)?.message : ''}
            >
              {number}
            </div>
          );
        })}
      </div>

      {/* Code Textarea */}
                   <textarea
               ref={textareaRef}
               className="code-textarea"
               value={value}
               onChange={handleInput}
               onKeyDown={handleKeyDown}
               onScroll={handleScroll}
               onFocus={handleFocus}
               onBlur={handleBlur}
               spellCheck={false}
               autoFocus={!isFocused}
               placeholder="Start typing..."
             />

      {/* Syntax Highlighting Overlay - Temporarily disabled for clean text display */}
      {/* <div 
        className="syntax-highlight"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      /> */}

      {/* Error Indicators */}
      <div className="error-indicators">
        {errors.map((error, index) => (
          <div 
            key={index}
            className="error-indicator"
            style={{ top: `${(error.line - 1) * 20}px` }}
            title={error.message}
          >
            <div className="error-dot"></div>
          </div>
        ))}
      </div>

      {/* Error Messages Panel */}
      {errors.length > 0 && (
        <div className="error-panel">
          <div className="error-panel-header">
            <span className="error-count">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
          </div>
          <div className="error-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-line-number">Line {error.line}:</span>
                <span className="error-message">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
