export interface TerminalSettings {
  // Shell Configuration
  defaultShell: string;
  shellArgs: Record<string, string[]>;
  
  // Appearance
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light' | 'auto';
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  
  // Behavior
  scrollback: number;
  fastScrollModifier: 'alt' | 'ctrl' | 'shift';
  copyOnSelect: boolean;
  pasteOnRightClick: boolean;
  confirmOnExit: boolean;
  
  // Performance
  rendererType: 'canvas' | 'dom';
  enableGpu: boolean;
  scrollSensitivity: number;
  
  // Advanced
  environmentVariables: Record<string, string>;
  startupDirectory: string;
  enableBell: boolean;
  bellStyle: 'none' | 'visual' | 'sound';
}

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  // Shell Configuration
  defaultShell: 'auto',
  shellArgs: {
    'powershell': ['-NoExit', '-NoLogo', '-ExecutionPolicy', 'Bypass'],
    'pwsh': ['-NoExit', '-NoLogo'],
    'cmd': ['/Q', '/K'],
    'bash': ['--login', '-i'],
    'zsh': ['-i'],
    'fish': ['-i'],
  },
  
  // Appearance
  fontSize: 14,
  fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace',
  theme: 'dark',
  cursorStyle: 'block',
  cursorBlink: true,
  
  // Behavior
  scrollback: 10000,
  fastScrollModifier: 'alt',
  copyOnSelect: false,
  pasteOnRightClick: true,
  confirmOnExit: true,
  
  // Performance
  rendererType: 'canvas',
  enableGpu: true,
  scrollSensitivity: 1,
  
  // Advanced
  environmentVariables: {},
  startupDirectory: '',
  enableBell: false,
  bellStyle: 'none',
};

export class TerminalSettingsManager {
  private static instance: TerminalSettingsManager;
  private settings: TerminalSettings;
  private listeners: Set<(settings: TerminalSettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): TerminalSettingsManager {
    if (!TerminalSettingsManager.instance) {
      TerminalSettingsManager.instance = new TerminalSettingsManager();
    }
    return TerminalSettingsManager.instance;
  }

  public getSettings(): TerminalSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<TerminalSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.notifyListeners();
  }

  public resetSettings(): void {
    this.settings = { ...DEFAULT_TERMINAL_SETTINGS };
    this.saveSettings();
    this.notifyListeners();
  }

  public onSettingsChange(listener: (settings: TerminalSettings) => void): void {
    this.listeners.add(listener);
  }

  public removeSettingsListener(listener: (settings: TerminalSettings) => void): void {
    this.listeners.delete(listener);
  }

  private loadSettings(): TerminalSettings {
    try {
      const stored = localStorage.getItem('terminal-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_TERMINAL_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load terminal settings:', error);
    }
    return { ...DEFAULT_TERMINAL_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('terminal-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save terminal settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error('Error in settings listener:', error);
      }
    });
  }

  // Convenience methods for common settings
  public setDefaultShell(shellId: string): void {
    this.updateSettings({ defaultShell: shellId });
  }

  public setFontSize(size: number): void {
    if (size >= 8 && size <= 72) {
      this.updateSettings({ fontSize: size });
    }
  }

  public setTheme(theme: 'dark' | 'light' | 'auto'): void {
    this.updateSettings({ theme });
  }

  public getShellArgs(shellId: string): string[] {
    return this.settings.shellArgs[shellId] || [];
  }

  public setShellArgs(shellId: string, args: string[]): void {
    this.updateSettings({
      shellArgs: { ...this.settings.shellArgs, [shellId]: args }
    });
  }
}
