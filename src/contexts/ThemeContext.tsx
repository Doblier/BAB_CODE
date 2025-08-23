import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  colors: {
    // Editor colors
    background: string;
    foreground: string;
    lineNumbers: string;
    lineNumbersBackground: string;
    selection: string;
    cursor: string;
    
    // Syntax highlighting
    keyword: string;
    string: string;
    comment: string;
    number: string;
    function: string;
    variable: string;
    type: string;
    constant: string;
    
    // UI colors
    sidebarBackground: string;
    sidebarForeground: string;
    tabsBackground: string;
    tabActive: string;
    tabInactive: string;
    tabBorder: string;
    
    // Terminal colors
    terminalBackground: string;
    terminalForeground: string;
    terminalCursor: string;
    
    // AI Terminal colors
    aiTerminalBackground: string;
    aiTerminalForeground: string;
    aiMessageUserBackground: string;
    aiMessageUserForeground: string;
    aiMessageAiBackground: string;
    aiMessageAiForeground: string;
    aiInputBackground: string;
    aiInputForeground: string;
    aiInputBorder: string;
    
    // Status colors
    errorForeground: string;
    warningForeground: string;
    infoForeground: string;
    
    // Border colors
    border: string;
    focusBorder: string;
    terminalBorder: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'dark-plus',
    name: 'Dark+ (Default Dark)',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      lineNumbers: '#858585',
      lineNumbersBackground: '#252526',
      selection: '#264f78',
      cursor: '#d4d4d4',
      
      keyword: '#569cd6',
      string: '#ce9178',
      comment: '#6a9955',
      number: '#b5cea8',
      function: '#dcdcaa',
      variable: '#9cdcfe',
      type: '#4ec9b0',
      constant: '#4fc1ff',
      
      sidebarBackground: '#252526',
      sidebarForeground: '#cccccc',
      tabsBackground: '#2d2d30',
      tabActive: '#1e1e1e',
      tabInactive: '#2d2d30',
      tabBorder: '#3c3c3c',
      
      terminalBackground: '#1e1e1e',
      terminalForeground: '#d4d4d4',
      terminalCursor: '#d4d4d4',
      
      aiTerminalBackground: '#1e1e1e',
      aiTerminalForeground: '#d4d4d4',
      aiMessageUserBackground: '#007acc',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#2a2d2e',
      aiMessageAiForeground: '#d4d4d4',
      aiInputBackground: '#3c3c3c',
      aiInputForeground: '#cccccc',
      aiInputBorder: '#3c3c3c',
      
      errorForeground: '#f48771',
      warningForeground: '#ffcc02',
      infoForeground: '#75beff',
      
      border: '#3c3c3c',
      focusBorder: '#007acc',
      terminalBorder: '#3c3c3c',
    },
  },
  {
    id: 'light-plus',
    name: 'Light+ (Default Light)',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      lineNumbers: '#237893',
      lineNumbersBackground: '#f5f5f5',
      selection: '#add6ff',
      cursor: '#000000',
      
      keyword: '#0000ff',
      string: '#a31515',
      comment: '#008000',
      number: '#098658',
      function: '#795e26',
      variable: '#001080',
      type: '#267f99',
      constant: '#0070c1',
      
      sidebarBackground: '#f3f3f3',
      sidebarForeground: '#383838',
      tabsBackground: '#ececec',
      tabActive: '#ffffff',
      tabInactive: '#ececec',
      tabBorder: '#e5e5e5',
      
      terminalBackground: '#ffffff',
      terminalForeground: '#000000',
      terminalCursor: '#000000',
      
      aiTerminalBackground: '#ffffff',
      aiTerminalForeground: '#000000',
      aiMessageUserBackground: '#0078d4',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#f5f5f5',
      aiMessageAiForeground: '#000000',
      aiInputBackground: '#f0f0f0',
      aiInputForeground: '#000000',
      aiInputBorder: '#e5e5e5',
      
      errorForeground: '#e51400',
      warningForeground: '#bf8803',
      infoForeground: '#1976d2',
      
      border: '#e5e5e5',
      focusBorder: '#0078d4',
      terminalBorder: '#e5e5e5',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      background: '#272822',
      foreground: '#f8f8f2',
      lineNumbers: '#90908a',
      lineNumbersBackground: '#3e3d32',
      selection: '#49483e',
      cursor: '#f8f8f0',
      
      keyword: '#f92672',
      string: '#e6db74',
      comment: '#75715e',
      number: '#ae81ff',
      function: '#a6e22e',
      variable: '#f8f8f2',
      type: '#66d9ef',
      constant: '#ae81ff',
      
      sidebarBackground: '#3e3d32',
      sidebarForeground: '#f8f8f2',
      tabsBackground: '#414339',
      tabActive: '#272822',
      tabInactive: '#414339',
      tabBorder: '#90908a',
      
      terminalBackground: '#272822',
      terminalForeground: '#f8f8f2',
      terminalCursor: '#f8f8f0',
      
      aiTerminalBackground: '#272822',
      aiTerminalForeground: '#f8f8f2',
      aiMessageUserBackground: '#f92672',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#3e3d32',
      aiMessageAiForeground: '#f8f8f2',
      aiInputBackground: '#49483e',
      aiInputForeground: '#f8f8f2',
      aiInputBorder: '#90908a',
      
      errorForeground: '#f92672',
      warningForeground: '#fd971f',
      infoForeground: '#66d9ef',
      
      border: '#90908a',
      focusBorder: '#f92672',
      terminalBorder: '#90908a',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      lineNumbers: '#6272a4',
      lineNumbersBackground: '#44475a',
      selection: '#44475a',
      cursor: '#f8f8f2',
      
      keyword: '#ff79c6',
      string: '#f1fa8c',
      comment: '#6272a4',
      number: '#bd93f9',
      function: '#50fa7b',
      variable: '#f8f8f2',
      type: '#8be9fd',
      constant: '#bd93f9',
      
      sidebarBackground: '#44475a',
      sidebarForeground: '#f8f8f2',
      tabsBackground: '#21222c',
      tabActive: '#282a36',
      tabInactive: '#21222c',
      tabBorder: '#6272a4',
      
      terminalBackground: '#282a36',
      terminalForeground: '#f8f8f2',
      terminalCursor: '#f8f8f2',
      
      aiTerminalBackground: '#282a36',
      aiTerminalForeground: '#f8f8f2',
      aiMessageUserBackground: '#ff79c6',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#44475a',
      aiMessageAiForeground: '#f8f8f2',
      aiInputBackground: '#44475a',
      aiInputForeground: '#f8f8f2',
      aiInputBorder: '#6272a4',
      
      errorForeground: '#ff5555',
      warningForeground: '#ffb86c',
      infoForeground: '#8be9fd',
      
      border: '#6272a4',
      focusBorder: '#ff79c6',
      terminalBorder: '#6272a4',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    colors: {
      background: '#0d1117',
      foreground: '#e6edf3',
      lineNumbers: '#7d8590',
      lineNumbersBackground: '#161b22',
      selection: '#264f78',
      cursor: '#e6edf3',
      
      keyword: '#ff7b72',
      string: '#a5d6ff',
      comment: '#8b949e',
      number: '#79c0ff',
      function: '#d2a8ff',
      variable: '#e6edf3',
      type: '#79c0ff',
      constant: '#79c0ff',
      
      sidebarBackground: '#161b22',
      sidebarForeground: '#e6edf3',
      tabsBackground: '#21262d',
      tabActive: '#0d1117',
      tabInactive: '#21262d',
      tabBorder: '#30363d',
      
      terminalBackground: '#0d1117',
      terminalForeground: '#e6edf3',
      terminalCursor: '#e6edf3',
      
      aiTerminalBackground: '#0d1117',
      aiTerminalForeground: '#e6edf3',
      aiMessageUserBackground: '#58a6ff',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#21262d',
      aiMessageAiForeground: '#e6edf3',
      aiInputBackground: '#21262d',
      aiInputForeground: '#e6edf3',
      aiInputBorder: '#30363d',
      
      errorForeground: '#f85149',
      warningForeground: '#d29922',
      infoForeground: '#58a6ff',
      
      border: '#30363d',
      focusBorder: '#58a6ff',
      terminalBorder: '#30363d',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      foreground: '#839496',
      lineNumbers: '#586e75',
      lineNumbersBackground: '#073642',
      selection: '#274642',
      cursor: '#839496',
      
      keyword: '#268bd2',
      string: '#2aa198',
      comment: '#586e75',
      number: '#d33682',
      function: '#b58900',
      variable: '#839496',
      type: '#268bd2',
      constant: '#cb4b16',
      
      sidebarBackground: '#073642',
      sidebarForeground: '#839496',
      tabsBackground: '#094656',
      tabActive: '#002b36',
      tabInactive: '#094656',
      tabBorder: '#586e75',
      
      terminalBackground: '#002b36',
      terminalForeground: '#839496',
      terminalCursor: '#839496',
      
      aiTerminalBackground: '#002b36',
      aiTerminalForeground: '#839496',
      aiMessageUserBackground: '#268bd2',
      aiMessageUserForeground: '#ffffff',
      aiMessageAiBackground: '#073642',
      aiMessageAiForeground: '#839496',
      aiInputBackground: '#073642',
      aiInputForeground: '#839496',
      aiInputBorder: '#586e75',
      
      errorForeground: '#dc322f',
      warningForeground: '#b58900',
      infoForeground: '#268bd2',
      
      border: '#586e75',
      focusBorder: '#268bd2',
      terminalBorder: '#586e75',
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // Default to Dark+

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem('editor-theme');
    if (savedThemeId) {
      const savedTheme = themes.find(theme => theme.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    // Set CSS custom properties
    root.style.setProperty('--editor-background', colors.background);
    root.style.setProperty('--editor-foreground', colors.foreground);
    root.style.setProperty('--line-numbers', colors.lineNumbers);
    root.style.setProperty('--line-numbers-background', colors.lineNumbersBackground);
    root.style.setProperty('--selection', colors.selection);
    root.style.setProperty('--cursor', colors.cursor);
    
    root.style.setProperty('--keyword', colors.keyword);
    root.style.setProperty('--string', colors.string);
    root.style.setProperty('--comment', colors.comment);
    root.style.setProperty('--number', colors.number);
    root.style.setProperty('--function', colors.function);
    root.style.setProperty('--variable', colors.variable);
    root.style.setProperty('--type', colors.type);
    root.style.setProperty('--constant', colors.constant);
    
    root.style.setProperty('--sidebar-background', colors.sidebarBackground);
    root.style.setProperty('--sidebar-foreground', colors.sidebarForeground);
    root.style.setProperty('--tabs-background', colors.tabsBackground);
    root.style.setProperty('--tab-active', colors.tabActive);
    root.style.setProperty('--tab-inactive', colors.tabInactive);
    root.style.setProperty('--tab-border', colors.tabBorder);
    
    root.style.setProperty('--terminal-background', colors.terminalBackground);
    root.style.setProperty('--terminal-foreground', colors.terminalForeground);
    root.style.setProperty('--terminal-cursor', colors.terminalCursor);
    
    root.style.setProperty('--ai-terminal-background', colors.aiTerminalBackground);
    root.style.setProperty('--ai-terminal-foreground', colors.aiTerminalForeground);
    root.style.setProperty('--ai-message-user-background', colors.aiMessageUserBackground);
    root.style.setProperty('--ai-message-user-foreground', colors.aiMessageUserForeground);
    root.style.setProperty('--ai-message-ai-background', colors.aiMessageAiBackground);
    root.style.setProperty('--ai-message-ai-foreground', colors.aiMessageAiForeground);
    root.style.setProperty('--ai-input-background', colors.aiInputBackground);
    root.style.setProperty('--ai-input-foreground', colors.aiInputForeground);
    root.style.setProperty('--ai-input-border', colors.aiInputBorder);
    
    root.style.setProperty('--error-foreground', colors.errorForeground);
    root.style.setProperty('--warning-foreground', colors.warningForeground);
    root.style.setProperty('--info-foreground', colors.infoForeground);
    
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--focus-border', colors.focusBorder);
    root.style.setProperty('--terminal-border', colors.terminalBorder);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('editor-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        availableThemes: themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
