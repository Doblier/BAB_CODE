import React, { useState, useEffect } from 'react';
import './EditorArea.css';
import { 
  FileText, FileCode, FileJson, FileImage, FileVideo, FileAudio, 
  FileArchive, File, Folder, FolderOpen, Settings, Package,
  Type, Code, Database, FileText as MarkdownIcon, GitBranch, Search, RefreshCw,
  Plus, X, Save, ChevronRight, ChevronDown
} from 'lucide-react';

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



  // Listen for file deletion events
  React.useEffect(() => {
    const handleFileDeleted = (event: CustomEvent) => {
      const deletedFilePath = event.detail;
      // Close the tab if it exists
      if (tabs.find(tab => tab.path === deletedFilePath)) {
        closeTab(deletedFilePath);
      }
    };

    document.addEventListener('file-deleted', handleFileDeleted as EventListener);

    return () => {
      document.removeEventListener('file-deleted', handleFileDeleted as EventListener);
    };
  }, [tabs]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W to close active tab
      if (e.ctrlKey && e.key === 'w' && activeTab) {
        e.preventDefault();
        closeTab(activeTab);
      }
      // Ctrl+S to save active tab
      if (e.ctrlKey && e.key === 's' && activeTab) {
        e.preventDefault();
        saveFile(activeTab);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

    useEffect(() => {
    if (activeFile && !tabs.find(tab => tab.path === activeFile)) {
      // Read actual file content from filesystem
      const readFileContent = async () => {
        try {
          console.log('Reading file:', activeFile);
          if ((window as any).api?.readFile) {
            const result = await (window as any).api.readFile(activeFile);
            console.log('File read result:', result);
            const fileName = activeFile.split(/[\\/]/).pop() || activeFile;
            
            const newTab: Tab = {
              path: activeFile,
              name: fileName,
              content: result.ok ? (result.content || '') : '',
              modified: false
            };
            
                         console.log('Created new tab with content length:', newTab.content.length);
             console.log('Tab content preview:', newTab.content.substring(0, 100));
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
     } else if (activeFile && activeTab !== activeFile) {
       // Only update active tab if it's different from current
       setActiveTab(activeFile);
     }
   }, [activeFile]); // Remove tabs dependency to prevent infinite loops

  const closeTab = (tabPath: string) => {
    // Calculate remaining tabs first
    const remainingTabs = tabs.filter(tab => tab.path !== tabPath);
    
    // Update tabs state
    setTabs(remainingTabs);
    
    // Update active tab
    if (activeTab === tabPath || remainingTabs.length === 0) {
      const newActiveTab = remainingTabs.length > 0 ? remainingTabs[0].path : null;
      setActiveTab(newActiveTab);
      
      // Also notify parent component if no tabs left
      if (remainingTabs.length === 0) {
        onFileChange(''); // Clear active file in parent
      }
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
  
  // Focus management - ensure focus stays on current tab
  useEffect(() => {
    if (activeTab && currentTab) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        const textarea = document.querySelector('.code-textarea') as HTMLTextAreaElement;
        if (textarea && document.activeElement !== textarea) {
          textarea.focus();
          // Preserve cursor position if possible
          const savedSelection = sessionStorage.getItem(`cursor-${activeTab}`);
          if (savedSelection) {
            try {
              const { start, end } = JSON.parse(savedSelection);
              textarea.setSelectionRange(start, end);
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentTab]);
  
  // Get file icon based on extension (VS Code style)
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconSize = 16;
    const iconColor = '#cccccc';
    
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileCode size={iconSize} color="#e34c26" />;
      case 'css':
        return <FileCode size={iconSize} color="#1572b6" />;
      case 'js':
      case 'jsx':
        return <FileCode size={iconSize} color="#f7df1e" />;
      case 'ts':
      case 'tsx':
        return <Type size={iconSize} color="#3178c6" />;
      case 'json':
        return <FileJson size={iconSize} color="#f7df1e" />;
      case 'py':
        return <FileCode size={iconSize} color="#3776ab" />;
      case 'java':
        return <FileCode size={iconSize} color="#ed8b00" />;
      case 'cpp':
      case 'c':
        return <FileCode size={iconSize} color="#00599c" />;
      case 'php':
        return <FileCode size={iconSize} color="#777bb4" />;
      case 'rb':
        return <FileCode size={iconSize} color="#cc342d" />;
      case 'go':
        return <FileCode size={iconSize} color="#00add8" />;
      case 'rs':
        return <FileCode size={iconSize} color="#ce422b" />;
      case 'sql':
        return <Database size={iconSize} color="#336791" />;
      case 'md':
        return <MarkdownIcon size={iconSize} color="#000000" />;
      case 'txt':
        return <FileText size={iconSize} color={iconColor} />;
      case 'xml':
        return <FileCode size={iconSize} color="#f05032" />;
      case 'yaml':
      case 'yml':
        return <Settings size={iconSize} color="#cb171e" />;
      case 'sh':
      case 'bat':
      case 'cmd':
        return <FileCode size={iconSize} color="#4d4d4d" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <FileImage size={iconSize} color="#4d4d4d" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo size={iconSize} color="#4d4d4d" />;
      case 'mp3':
      case 'wav':
        return <FileAudio size={iconSize} color="#4d4d4d" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive size={iconSize} color="#4d4d4d" />;
      case 'gitignore':
        return <GitBranch size={iconSize} color="#f05032" />;
      case 'package.json':
      case 'package-lock.json':
        return <Package size={iconSize} color="#cb3837" />;
      case 'tsconfig.json':
      case 'vite.config.ts':
        return <Settings size={iconSize} color="#3178c6" />;
      case 'license':
        return <FileText size={iconSize} color="#d73a49" />;
      case 'readme.md':
        return <MarkdownIcon size={iconSize} color="#0366d6" />;
      default:
        return <File size={iconSize} color={iconColor} />;
    }
  };
  




  return (
    <div className="editor-area">
      <div className="tabs">
                 {tabs.map(tab => (
           <div 
             key={tab.path} 
             className={`tab ${activeTab === tab.path ? 'active' : ''}`}
             onClick={() => {
               setActiveTab(tab.path);
               // Focus the editor after tab switch
               setTimeout(() => {
                 const textarea = document.querySelector('.code-textarea') as HTMLTextAreaElement;
                 if (textarea) {
                   textarea.focus();
                 }
               }, 50);
             }}
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
                <Save size={14} />
              </button>
              <button 
                className="close-tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
                title="Close (Ctrl+W)"
              >
                <X size={14} />
              </button>
           </div>
         ))}
      </div>
      <div className="editor-split">
        <div className="work-area">
                                                                                                                           {currentTab ? (
                                                    <textarea
                   className="code-editor"
                   value={currentTab.content}
                   onChange={(e) => updateTabContent(currentTab.path, e.target.value)}
                   placeholder="Start typing your code here..."
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
                                 <div className="feature"
                   onClick={() => {
                     // Dispatch event to toggle terminal
                     document.dispatchEvent(new CustomEvent('show-terminal'));
                   }}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { 
                     if (e.key === 'Enter' || e.key === ' ') {
                       document.dispatchEvent(new CustomEvent('show-terminal'));
                     }
                   }}
                 >
                   <h3>💻 Terminal</h3>
                   <p>Toggle terminal panel</p>
                 </div>
                                 <div className="feature ai"
                   onClick={() => {
                     // Dispatch event to toggle AI Assistant
                     document.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                   }}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { 
                     if (e.key === 'Enter' || e.key === ' ') {
                       document.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                     }
                   }}
                 >
                   <h3>🤖 AI Assistant</h3>
                   <p>Toggle AI Assistant panel</p>
                 </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default EditorArea; 