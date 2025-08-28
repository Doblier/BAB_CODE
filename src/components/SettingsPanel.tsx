import React, { useState, useEffect } from 'react';
import { 
  X, Search, ChevronRight, ChevronDown, Settings, 
  Monitor, Terminal, Bot, Layout, Palette, Shield, Bell,
  Save, RotateCcw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsManager, AppSettings, DEFAULT_SETTINGS } from '../utils/settingsManager';
import { TerminalSettingsManager } from '../utils/terminalSettings';
import { DEFAULT_SHELLS } from '../utils/shellDetector';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const settingsManager = SettingsManager.getInstance();
  const terminalSettingsManager = TerminalSettingsManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const currentSettings = settingsManager.getSettings();
    const terminalSettings = terminalSettingsManager.getSettings();
    
    // Sync the current theme with the settings
    const updatedSettings = {
      ...currentSettings,
      appearance: {
        ...currentSettings.appearance,
        theme: currentTheme.id
      },
      terminal: {
        ...currentSettings.terminal,
        ...terminalSettings
      }
    };
    
    setSettings(updatedSettings);
    setOriginalSettings(updatedSettings);
    setHasChanges(false);
  };

  const handleSettingChange = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setSettings(newSettings);
    setHasChanges(true);

    // Apply theme changes immediately
    if (path === 'appearance.theme') {
      console.log('Applying theme change:', value);
      applyThemeChange(value);
      // Save settings in background (don't wait for it)
      settingsManager.saveSettings(newSettings).catch(error => {
        console.error('Failed to save settings:', error);
      });
    }

    // Apply terminal settings immediately
    if (path.startsWith('terminal.')) {
      console.log('Applying terminal setting:', path, value);
      applyTerminalSetting(path, value);
      // Save settings in background (don't wait for it)
      settingsManager.saveSettings(newSettings).catch(error => {
        console.error('Failed to save settings:', error);
      });
    }
  };

  const applyThemeChange = (themeId: string) => {
    console.log('Theme change requested:', themeId);
    
    // Update the theme context immediately
    if (setTheme) {
      setTheme(themeId);
      console.log('setTheme called with:', themeId);
      
      // Also save to localStorage as backup
      localStorage.setItem('editor-theme', themeId);
      console.log('Theme saved to localStorage:', themeId);
    } else {
      console.error('setTheme is not available');
    }
  };

  const applyTerminalSetting = (path: string, value: any) => {
    console.log('Terminal setting change requested:', path, value);
    
    // Map the setting path to terminal settings manager methods
    switch (path) {
      case 'terminal.defaultShell':
        terminalSettingsManager.setDefaultShell(value);
        break;
      case 'terminal.fontSize':
        terminalSettingsManager.setFontSize(Number(value));
        break;
      case 'terminal.fontFamily':
        terminalSettingsManager.setFontFamily(value);
        break;
      case 'terminal.theme':
        terminalSettingsManager.setTheme(value);
        break;
      case 'terminal.cursorStyle':
        terminalSettingsManager.setCursorStyle(value);
        break;
      case 'terminal.cursorBlink':
        terminalSettingsManager.setCursorBlink(value);
        break;
      case 'terminal.scrollback':
        terminalSettingsManager.setScrollback(Number(value));
        break;
      case 'terminal.copyOnSelect':
        terminalSettingsManager.setCopyOnSelect(value);
        break;
      case 'terminal.pasteOnRightClick':
        terminalSettingsManager.setPasteOnRightClick(value);
        break;
      case 'terminal.confirmOnExit':
        terminalSettingsManager.setConfirmOnExit(value);
        break;
      case 'terminal.enableBell':
        terminalSettingsManager.setEnableBell(value);
        break;
      default:
        console.log('Unknown terminal setting:', path);
    }
  };

  const handleSave = async () => {
    const success = await settingsManager.saveSettings(settings);
    if (success) {
      setOriginalSettings(settings);
      setHasChanges(false);
      
      // Force apply theme if it was changed
      if (settings.appearance?.theme) {
        applyThemeChange(settings.appearance.theme);
      }
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const categories: SettingsCategory[] = [
    {
      id: 'general',
      label: 'General',
      icon: <Settings size={16} />,
      description: 'Basic application settings'
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: <Monitor size={16} />,
      description: 'Code editor configuration'
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal size={16} />,
      description: 'Terminal and shell settings'
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: <Bot size={16} />,
      description: 'AI model and completion settings'
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: <Layout size={16} />,
      description: 'Interface layout and panels'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Palette size={16} />,
      description: 'Theme and visual settings'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: <Shield size={16} />,
      description: 'Privacy and data settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={16} />,
      description: 'Notification preferences'
    }
  ];

  const renderSettingField = (path: string, label: string, type: 'text' | 'number' | 'boolean' | 'select', options?: string[]) => {
    const keys = path.split('.');
    let value: any = settings;
    for (const key of keys) {
      value = value[key];
    }

    const handleChange = (newValue: any) => {
      handleSettingChange(path, newValue);
    };

    switch (type) {
      case 'boolean':
        return (
          <div className="setting-field">
            <label className="setting-label">{label}</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleChange(e.target.checked)}
                className="toggle-switch"
              />
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="setting-field">
            <label className="setting-label">{label}</label>
            <div className="setting-control">
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(Number(e.target.value))}
                className="setting-input"
              />
            </div>
          </div>
        );

             case 'select':
         return (
           <div className="setting-field">
             <label className="setting-label">{label}</label>
             <div className="setting-control">
               <select
                 value={value}
                 onChange={(e) => handleChange(e.target.value)}
                 className="setting-select"
               >
                                   {options?.map(option => {
                    // For theme selection, show theme names instead of IDs
                    if (path === 'appearance.theme') {
                      const theme = availableThemes.find(t => t.id === option);
                      return (
                        <option key={option} value={option}>
                          {theme ? theme.name : option}
                        </option>
                      );
                    }
                    // For terminal shell selection, show shell names instead of IDs
                    if (path === 'terminal.defaultShell') {
                      if (option === 'auto') {
                        return (
                          <option key={option} value={option}>
                            Auto (Detect automatically)
                          </option>
                        );
                      }
                      const shell = DEFAULT_SHELLS.find(s => s.id === option);
                      return (
                        <option key={option} value={option}>
                          {shell ? shell.name : option}
                        </option>
                      );
                    }
                    return (
                      <option key={option} value={option}>{option}</option>
                    );
                  })}
               </select>
             </div>
           </div>
         );

      default:
        return (
          <div className="setting-field">
            <label className="setting-label">{label}</label>
            <div className="setting-control">
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className="setting-input"
              />
            </div>
          </div>
        );
    }
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
             case 'general':
         return (
           <div className="settings-content">
             <h3>General Settings</h3>
             <div className="settings-section">
               <h4>Application</h4>
               {renderSettingField('appearance.theme', 'Theme', 'select', availableThemes.map(theme => theme.id))}
               {renderSettingField('appearance.animations', 'Enable Animations', 'boolean')}
               {renderSettingField('appearance.borderRadius', 'Border Radius', 'number')}
             </div>
           </div>
         );

             case 'editor':
         return (
           <div className="settings-content">
             <h3>Editor Settings</h3>
             <div className="settings-section">
               <h4>Text Editor</h4>
               {renderSettingField('appearance.theme', 'Theme', 'select', availableThemes.map(theme => theme.id))}
               {renderSettingField('editor.fontSize', 'Font Size', 'number')}
               {renderSettingField('editor.fontFamily', 'Font Family', 'text')}
               {renderSettingField('editor.tabSize', 'Tab Size', 'number')}
               {renderSettingField('editor.insertSpaces', 'Insert Spaces', 'boolean')}
               {renderSettingField('editor.wordWrap', 'Word Wrap', 'select', ['on', 'off'])}
               {renderSettingField('editor.lineNumbers', 'Line Numbers', 'select', ['on', 'off'])}
               {renderSettingField('editor.autoSave', 'Auto Save', 'boolean')}
               {renderSettingField('editor.formatOnSave', 'Format on Save', 'boolean')}
             </div>
             <div className="settings-section">
               <h4>Minimap</h4>
               {renderSettingField('editor.minimap.enabled', 'Enable Minimap', 'boolean')}
               {renderSettingField('editor.minimap.side', 'Minimap Side', 'select', ['left', 'right'])}
             </div>
           </div>
         );

             case 'terminal':
         return (
           <div className="settings-content">
             <h3>Terminal Settings</h3>
             <div className="settings-section">
               <h4>Terminal</h4>
               {renderSettingField('terminal.defaultShell', 'Default Shell', 'select', ['auto', ...DEFAULT_SHELLS.map(shell => shell.id)])}
               {renderSettingField('terminal.fontSize', 'Font Size', 'number')}
               {renderSettingField('terminal.fontFamily', 'Font Family', 'text')}
               {renderSettingField('terminal.theme', 'Theme', 'select', ['dark', 'light'])}
               {renderSettingField('terminal.cursorStyle', 'Cursor Style', 'select', ['block', 'underline', 'bar'])}
               {renderSettingField('terminal.cursorBlink', 'Cursor Blink', 'boolean')}
               {renderSettingField('terminal.scrollback', 'Scrollback Lines', 'number')}
               {renderSettingField('terminal.copyOnSelect', 'Copy on Select', 'boolean')}
               {renderSettingField('terminal.pasteOnRightClick', 'Paste on Right Click', 'boolean')}
               {renderSettingField('terminal.confirmOnExit', 'Confirm on Exit', 'boolean')}
               {renderSettingField('terminal.enableBell', 'Enable Bell', 'boolean')}
             </div>
           </div>
         );

      case 'ai':
        return (
          <div className="settings-content">
            <h3>AI Assistant Settings</h3>
            <div className="settings-section">
              <h4>Model Configuration</h4>
              {renderSettingField('ai.defaultModel', 'Default Model', 'select', ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro'])}
              {renderSettingField('ai.apiEndpoint', 'API Endpoint', 'text')}
              {renderSettingField('ai.maxTokens', 'Max Tokens', 'number')}
              {renderSettingField('ai.temperature', 'Temperature', 'number')}
            </div>
            <div className="settings-section">
              <h4>Features</h4>
              {renderSettingField('ai.enableAutoComplete', 'Enable Auto Complete', 'boolean')}
              {renderSettingField('ai.enableCodeGeneration', 'Enable Code Generation', 'boolean')}
            </div>
          </div>
        );

      case 'layout':
        return (
          <div className="settings-content">
            <h3>Layout Settings</h3>
            <div className="settings-section">
              <h4>Panel Sizes</h4>
              {renderSettingField('layout.sidebarWidth', 'Sidebar Width', 'number')}
              {renderSettingField('layout.terminalHeight', 'Terminal Height', 'number')}
              {renderSettingField('layout.assistantWidth', 'Assistant Width', 'number')}
            </div>
            <div className="settings-section">
              <h4>Panel Visibility</h4>
              {renderSettingField('layout.showSidebar', 'Show Sidebar', 'boolean')}
              {renderSettingField('layout.showTerminal', 'Show Terminal', 'boolean')}
              {renderSettingField('layout.showAssistant', 'Show AI Assistant', 'boolean')}
            </div>
          </div>
        );

             case 'appearance':
         return (
           <div className="settings-content">
             <h3>Appearance Settings</h3>
             <div className="settings-section">
               <h4>Theme</h4>
               {renderSettingField('appearance.theme', 'Theme', 'select', availableThemes.map(theme => theme.id))}
               {renderSettingField('appearance.accentColor', 'Accent Color', 'text')}
               {renderSettingField('appearance.borderRadius', 'Border Radius', 'number')}
               {renderSettingField('appearance.animations', 'Enable Animations', 'boolean')}
             </div>
           </div>
         );

      case 'privacy':
        return (
          <div className="settings-content">
            <h3>Privacy Settings</h3>
            <div className="settings-section">
              <h4>Data Collection</h4>
              {renderSettingField('privacy.dataSharing', 'Data Sharing', 'boolean')}
              {renderSettingField('privacy.telemetry', 'Telemetry', 'boolean')}
              {renderSettingField('privacy.crashReports', 'Crash Reports', 'boolean')}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-content">
            <h3>Notification Settings</h3>
            <div className="settings-section">
              <h4>Notifications</h4>
              {renderSettingField('notifications.systemNotifications', 'System Notifications', 'boolean')}
              {renderSettingField('notifications.soundNotifications', 'Sound Notifications', 'boolean')}
              {renderSettingField('notifications.updateNotifications', 'Update Notifications', 'boolean')}
            </div>
          </div>
        );

      default:
        return <div>Select a category</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div 
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: currentTheme.colors.background,
          color: currentTheme.colors.foreground,
          border: `1px solid ${currentTheme.colors.border}`
        }}
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title">
            <Settings size={20} />
            <span>Settings</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="settings-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="settings-body">
          {/* Categories Sidebar */}
          <div className="settings-sidebar">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-info">
                  <div className="category-label">{category.label}</div>
                  <div className="category-description">{category.description}</div>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="settings-main">
            {renderCategoryContent()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="settings-footer">
          <div className="footer-actions">
            <button 
              className="action-button secondary"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button 
              className="action-button secondary"
              onClick={handleResetToDefaults}
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          </div>
          <div className="footer-actions">
            <button 
              className="action-button primary"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
