import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (activeFile && !tabs.find(tab => tab.path === activeFile)) {
      // Simulate file content - in a real app, you'd read from the filesystem
      const fileName = activeFile.split('/').pop() || activeFile;
      const newTab: Tab = {
        path: activeFile,
        name: fileName,
        content: `// ${fileName}\n// This is a placeholder content for ${activeFile}\n\nimport React from 'react';\n\nexport default function ${fileName.replace('.tsx', '').replace('.ts', '')}() {\n  return (\n    <div>\n      <h1>${fileName}</h1>\n      <p>Edit this file to see changes!</p>\n    </div>\n  );\n}`,
        modified: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(activeFile);
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

  const currentTab = tabs.find(tab => tab.path === activeTab);

  return (
    <div className="editor-area">
      <div className="tabs">
        {tabs.map(tab => (
          <div 
            key={tab.path} 
            className={`tab ${activeTab === tab.path ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.path)}
          >
            <span className="tab-name">{tab.name}</span>
            {tab.modified && <span className="modified-indicator">•</span>}
            <button 
              className="close-tab"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
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
              placeholder="Start typing..."
              className="code-editor"
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