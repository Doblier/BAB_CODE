import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import './EditorArea.css';

interface EditorAreaProps {
  activeFile: string | null;
  onFileChange: (filePath: string) => void;
  onFolderSelect?: (folderPath: string) => void;
}

interface Tab {
  path: string;
  name: string;
  content: string;
  modified: boolean;
}

const EditorArea: React.FC<EditorAreaProps> = ({ activeFile, onFileChange, onFolderSelect }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);

  // Listen for AI assistant trigger from menu
  React.useEffect(() => {
    const handleAIAssistant = () => {
      setShowAssistant(true);
    };

    document.addEventListener('trigger-ai-assistant', handleAIAssistant);

    return () => {
      document.removeEventListener('trigger-ai-assistant', handleAIAssistant);
    };
  }, []);

    useEffect(() => {
    if (activeFile && !tabs.find(tab => tab.path === activeFile)) {
      // Read actual file content from filesystem
      const readFileContent = async () => {
        try {
          if ((window as any).api?.readFile) {
            const result = await (window as any).api.readFile(activeFile);
            const fileName = activeFile.split(/[\\/]/).pop() || activeFile;
            
            const newTab: Tab = {
              path: activeFile,
              name: fileName,
              content: result.ok ? (result.content || '') : '',
              modified: false
            };
            
            setTabs(prev => [...prev, newTab]);
            setActiveTab(activeFile);
           } else {
             // If API not available, create empty tab
             const fileName = activeFile.split(/[\\/]/).pop() || activeFile;
             const newTab: Tab = {
               path: activeFile,
               name: fileName,
               content: '',
               modified: false
             };
             setTabs(prev => [...prev, newTab]);
             setActiveTab(activeFile);
           }
         } catch (error) {
           console.error('Error reading file:', error);
           // If error occurs, create empty tab
           const fileName = activeFile.split(/[\\/]/).pop() || activeFile;
           const newTab: Tab = {
             path: activeFile,
             name: fileName,
             content: '',
             modified: false
           };
           setTabs(prev => [...prev, newTab]);
           setActiveTab(activeFile);
         }
       };
       
       readFileContent();
     } else if (activeFile) {
       setActiveTab(activeFile);
     }
   }, [activeFile, tabs]);

  const closeTab = (tabPath: string) => {
    setTabs(prev => prev.filter(tab => tab.path !== tabPath));
    if (activeTab === tabPath) {
      const remainingTabs = tabs.filter(tab => tab.path !== tabPath);
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].path : null);
    }
  };

  const updateTabContent = (tabPath: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.path === tabPath 
        ? { ...tab, content, modified: true }
        : tab
    ));
  };

  // Auto-save functionality
  const saveFile = async (tabPath: string) => {
    const tab = tabs.find(t => t.path === tabPath);
    if (tab && tab.modified) {
      try {
        if ((window as any).api?.writeFile) {
          const result = await (window as any).api.writeFile(tabPath, tab.content);
          if (result.ok) {
            setTabs(prev => prev.map(t => 
              t.path === tabPath 
                ? { ...t, modified: false }
                : t
            ));
          }
        }
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeTab) {
          saveFile(activeTab);
        }
      }
      
      // Ctrl+W to close tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeTab) {
          closeTab(activeTab);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabs]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (activeTab) {
      const timeoutId = setTimeout(() => {
        saveFile(activeTab);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, tabs.find(t => t.path === activeTab)?.content]);

  const currentTab = tabs.find(tab => tab.path === activeTab);
  
  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return '🌐';
      case 'css':
        return '🎨';
      case 'js':
      case 'jsx':
        return '📜';
      case 'ts':
      case 'tsx':
        return '📘';
      case 'json':
        return '📋';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚙️';
      case 'php':
        return '🐘';
      case 'rb':
        return '💎';
      case 'go':
        return '🐹';
      case 'rs':
        return '🦀';
      case 'sql':
        return '🗄️';
      case 'md':
        return '📝';
      case 'txt':
        return '📄';
      case 'xml':
        return '📄';
      case 'yaml':
      case 'yml':
        return '⚙️';
      case 'sh':
      case 'bat':
      case 'cmd':
        return '💻';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎬';
      case 'mp3':
      case 'wav':
        return '🎵';
      case 'zip':
      case 'rar':
      case '7z':
        return '📦';
      default:
        return '📄';
    }
  };
  




  return (
    <div className="editor-area">
      <div className="tabs">
                 {tabs.map(tab => (
           <div 
             key={tab.path} 
             className={`tab ${activeTab === tab.path ? 'active' : ''}`}
             onClick={() => setActiveTab(tab.path)}
           >
             <span className="tab-icon">{getFileIcon(tab.name)}</span>
             <span className="tab-name">{tab.name}</span>
             {tab.modified && <span className="modified-indicator">•</span>}
             <button 
               className="save-tab"
               onClick={(e) => {
                 e.stopPropagation();
                 saveFile(tab.path);
               }}
               title="Save (Ctrl+S)"
             >
               💾
             </button>
             <button 
               className="close-tab"
               onClick={(e) => {
                 e.stopPropagation();
                 closeTab(tab.path);
               }}
               title="Close (Ctrl+W)"
             >
               ×
             </button>
           </div>
         ))}
      </div>
      <div className="editor-split">
        <div className="work-area">
                                                             {currentTab ? (
                <textarea
                  value={currentTab.content}
                  onChange={(e) => updateTabContent(currentTab.path, e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    border: 'none',
                    outline: 'none',
                    padding: '20px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'none',
                    cursor: 'text'
                  }}
                  autoFocus
                  spellCheck={false}
                />
            ) : (
                           <div className="welcome-screen">
              <h2 onClick={() => {
                // Clicking the title opens a CMD terminal tab in the bottom terminal area
                const event = new CustomEvent('open-default-terminal', { detail: { type: 'cmd' } });
                window.dispatchEvent(event);
              }}
              style={{ cursor: 'pointer' }}
              title="Click to open Command Prompt"
              >Welcome to Your IDE</h2>
              <p>Select a file from the sidebar to start editing</p>
              <div className="features">
                <div className="feature" role="button" tabIndex={0}
                  onClick={async () => {
                    if (window.api && 'openFolder' in window.api) {
                      const result = await (window.api as any).openFolder();
                      if (result && !result.canceled && result.path) {
                        // Use onFolderSelect if available, otherwise fallback to onFileChange
                        if (onFolderSelect) {
                          onFolderSelect(result.path);
                        } else {
                          onFileChange(result.path);
                        }
                      }
                    }
                  }}
                  onKeyDown={async (e) => { if (e.key === 'Enter' || e.key === ' ') {
                    if (window.api && 'openFolder' in window.api) {
                      const result = await (window.api as any).openFolder();
                      if (result && !result.canceled && result.path) {
                        // Use onFolderSelect if available, otherwise fallback to onFileChange
                        if (onFolderSelect) {
                          onFolderSelect(result.path);
                        } else {
                          onFileChange(result.path);
                        }
                      }
                    }
                  }}}
                >
                  <h3>📁 Open Folder</h3>
                  <p>Choose a folder (default E:\ drive)</p>
                </div>
                <div className="feature">
                  <h3>💻 Terminal</h3>
                  <p>Run commands and manage your project</p>
                </div>
                <div className="feature ai"
                  onClick={() => setShowAssistant(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAssistant(true); }}
                >
                  <h3>🤖 AI Assistant</h3>
                  <p>Ask questions, generate code, and get help</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {showAssistant && (
          <div className="assistant-panel">
            <div className="assistant-header">
              <span>AI Assistant</span>
              <button className="assistant-close" onClick={() => setShowAssistant(false)}>×</button>
            </div>
            <div className="assistant-body">
              <div className="assistant-messages">
                <div className="assistant-message assistant-message--bot">
                  Hi! Select code or ask a question to get started.
                </div>
              </div>
              <div className="assistant-input">
                <input type="text" placeholder="Ask something about your code..." />
                <button>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorArea; 