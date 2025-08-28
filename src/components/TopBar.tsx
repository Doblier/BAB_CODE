import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ChevronLeft, ChevronRight, Search, Settings, 
  PanelLeft, PanelBottom, PanelRight, X, Minus, Square
} from 'lucide-react';
import './TopBar.css';

interface AIModel {
  id: string;
  name: string;
  configured: boolean;
  provider: string;
}

interface MenuItem {
  label: string;
  submenu?: { label: string; action: string; accelerator?: string }[];
}

interface TopBarProps {
  onMenuAction: (action: string) => void;
  sidebarCollapsed?: boolean;
  showTerminal?: boolean;
  showAssistant?: boolean;
  selectedModel?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuAction, sidebarCollapsed = false, showTerminal = false, showAssistant = false, selectedModel = 'gpt-3.5-turbo' }) => {
  const { currentTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('BAB_CODE');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/models');
        const data = await response.json();
        
        const models: AIModel[] = Object.entries(data.models).map(([id, modelData]: [string, any]) => ({
          id,
          name: modelData.name,
          configured: modelData.configured,
          provider: modelData.provider
        }));
        
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback models
        setAvailableModels([
          { id: 'gpt-4', name: 'GPT-4 (OpenAI)', configured: false, provider: 'openai' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)', configured: false, provider: 'openai' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)', configured: false, provider: 'anthropic' },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku (Anthropic)', configured: false, provider: 'anthropic' },
          { id: 'gemini-pro', name: 'Gemini Pro (Google)', configured: false, provider: 'google' }
        ]);
      }
    };

    loadModels();
  }, []);

  const menuItems: MenuItem[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New File', action: 'new-text-file', accelerator: 'Ctrl+N' },
        { label: 'New Folder', action: 'new-folder', accelerator: 'Ctrl+Shift+N' },
        { label: 'Open...', action: 'open-folder', accelerator: 'Ctrl+O' },
        { label: 'Save', action: 'save', accelerator: 'Ctrl+S' },
        { label: 'Exit', action: 'exit', accelerator: 'Ctrl+Q' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', action: 'undo', accelerator: 'Ctrl+Z' },
        { label: 'Redo', action: 'redo', accelerator: 'Ctrl+Y' },
        { label: 'Cut', action: 'cut', accelerator: 'Ctrl+X' },
        { label: 'Copy', action: 'copy', accelerator: 'Ctrl+C' },
        { label: 'Paste', action: 'paste', accelerator: 'Ctrl+V' },
        { label: 'Select All', action: 'selectAll', accelerator: 'Ctrl+A' }
      ]
    },
    {
      label: 'Selection',
      submenu: [
        { label: 'Select All', action: 'selectAll', accelerator: 'Ctrl+A' },
        { label: 'Expand Selection', action: 'expandSelection', accelerator: 'Shift+Alt+→' },
        { label: 'Shrink Selection', action: 'shrinkSelection', accelerator: 'Shift+Alt+←' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Left Sidebar', action: 'toggle-left-sidebar', accelerator: 'Ctrl+B' },
        { label: 'Toggle Bottom Panel', action: 'toggle-bottom-panel', accelerator: 'Ctrl+J' },
        { label: 'Toggle AI Assistant', action: 'toggle-ai-terminal', accelerator: 'Ctrl+Shift+A' },
        { label: 'Reload', action: 'reload', accelerator: 'Ctrl+R' },
        { label: 'Toggle Developer Tools', action: 'toggleDevTools', accelerator: 'Ctrl+Shift+I' },
        { label: 'Toggle Full Screen', action: 'toggleFullScreen', accelerator: 'F11' }
      ]
    },
    {
      label: 'Go',
      submenu: [
        { label: 'Back', action: 'goBack', accelerator: 'Alt+←' },
        { label: 'Forward', action: 'goForward', accelerator: 'Alt+→' },
        { label: 'Go to File...', action: 'goToFile', accelerator: 'Ctrl+P' }
      ]
    },
    {
      label: 'Run',
      submenu: [
        { label: 'Start Debugging', action: 'startDebug', accelerator: 'F5' },
        { label: 'Run Without Debugging', action: 'runWithoutDebug', accelerator: 'Ctrl+F5' },
        { label: 'Stop', action: 'stop', accelerator: 'Shift+F5' }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        { label: 'New Terminal', action: 'new-terminal', accelerator: 'Ctrl+`' },
        { label: 'AI Terminal', action: 'toggle-ai-terminal', accelerator: 'Ctrl+Shift+A' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About', action: 'about' },
        { label: 'Documentation', action: 'documentation' }
      ]
    },
    {
      label: 'Models',
      submenu: availableModels.map(model => ({
        label: `${model.name}${model.id === selectedModel ? ' ✓' : ''}${model.configured ? ' 🔑' : ' ⚠️'}`,
        action: `select-model-${model.id}`
      }))
    }
  ];

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  const handleMenuItemClick = (action: string) => {
    onMenuAction(action);
    setActiveMenu(null);
  };

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
         <div 
       className="top-bar"
                                                                                               style={{
                                  backgroundColor: currentTheme.colors.menuBackground,
                                  color: currentTheme.colors.menuForeground,
                                  borderBottom: `1px solid ${currentTheme.colors.menuBorder}`
                                }}
     >
             {/* Left Section - Menu Bar */}
       <div className="menu-section">
        {menuItems.map((item) => (
          <div key={item.label} className="menu-item-container">
                         <button
               className={`menu-button ${activeMenu === item.label ? 'active' : ''}`}
               onClick={(e) => {
                 e.stopPropagation();
                 handleMenuClick(item.label);
               }}
                                                                                                                                                                                                                                                                                   style={{
                      color: currentTheme.colors.menuForeground,
                      border: 'none',
                      outline: 'none'
                    }}
             >
              {item.label}
            </button>
            {activeMenu === item.label && item.submenu && (
                                                           <div 
                  className="menu-dropdown"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  style={{
                     backgroundColor: currentTheme.colors.menuBackground,
                     border: `1px solid ${currentTheme.colors.menuBorder}`,
                     boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`
                   }}
                  onClick={(e) => e.stopPropagation()}
                >
                {item.submenu.map((subItem, index) => (
                  <button
                    key={index}
                    className="dropdown-item"
                    onClick={() => handleMenuItemClick(subItem.action)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    style={{
                       color: currentTheme.colors.menuForeground,
                       backgroundColor: 'transparent'
                     }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.menuHoverBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="item-label">{subItem.label}</span>
                    {subItem.accelerator && (
                      <span 
                        className="item-accelerator"
                        style={{ color: currentTheme.colors.lineNumbers }}
                      >
                        {subItem.accelerator}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

             {/* Middle Section - Navigation and Search */}
       <div className="center-section">
         <div className="navigation-arrows">
           <button className="nav-button">
             <ChevronLeft size={16} />
           </button>
           <button className="nav-button">
             <ChevronRight size={16} />
           </button>
         </div>
                   <div className="search-bar">
                                                                                               <input
                 type="text"
                 value={searchValue}
                 onChange={(e) => setSearchValue(e.target.value)}
                 placeholder="Search or type a command..."
               />
            <Search size={14} />
          </div>
       </div>

      {/* Right Section - Layout and Window Controls */}
      <div className="right-section">
        <div className="layout-controls">
          <button 
            className={`layout-button ${!sidebarCollapsed ? 'sidebar-open' : ''}`}
            onClick={() => onMenuAction('toggle-left-sidebar')}
            title={sidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
          >
            <PanelLeft size={18} />
          </button>
          <button 
            className={`layout-button ${showTerminal ? 'terminal-open' : ''}`}
            onClick={() => onMenuAction('toggle-bottom-panel')}
            title={showTerminal ? "Close Terminal" : "Open Terminal"}
          >
            <PanelBottom size={18} />
          </button>
          <button 
            className={`layout-button ${showAssistant ? 'assistant-open' : ''}`}
            onClick={() => onMenuAction('toggle-ai-terminal')}
            title={showAssistant ? "Close AI Assistant" : "Open AI Assistant"}
          >
            <PanelRight size={18} />
          </button>
        </div>
        <button 
          className="settings-button"
          onClick={() => onMenuAction('open-settings')}
          title="Open Settings"
        >
          <Settings size={18} />
        </button>
        <div className="window-controls">
          <button 
            className="window-button minimize"
            onClick={() => {
              if ((window as any).api?.minimize) {
                (window as any).api.minimize();
              }
            }}
          >
            <Minus size={14} />
          </button>
          <button 
            className="window-button maximize"
            onClick={() => {
              if ((window as any).api?.maximize) {
                (window as any).api.maximize();
              }
            }}
          >
            <Square size={12} />
          </button>
          <button 
            className="window-button close"
            onClick={() => {
              if ((window as any).api?.close) {
                (window as any).api.close();
              }
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
