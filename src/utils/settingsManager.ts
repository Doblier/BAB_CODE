export interface AppSettings {
  editor: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: string;
    lineNumbers: string;
    minimap: {
      enabled: boolean;
      side: string;
    };
    autoSave: boolean;
    formatOnSave: boolean;
  };
  terminal: {
    defaultShell: string;
    fontSize: number;
    fontFamily: string;
    theme: string;
    cursorStyle: string;
    cursorBlink: boolean;
    scrollback: number;
    copyOnSelect: boolean;
    pasteOnRightClick: boolean;
    confirmOnExit: boolean;
    rendererType: string;
    enableGpu: boolean;
    scrollSensitivity: number;
    enableBell: boolean;
    bellStyle: string;
    shellArgs: Record<string, string[]>;
  };
  ai: {
    defaultModel: string;
    apiEndpoint: string;
    maxTokens: number;
    temperature: number;
    enableAutoComplete: boolean;
    enableCodeGeneration: boolean;
  };
  layout: {
    sidebarWidth: number;
    terminalHeight: number;
    assistantWidth: number;
    showSidebar: boolean;
    showTerminal: boolean;
    showAssistant: boolean;
  };
  appearance: {
    theme: string;
    accentColor: string;
    borderRadius: number;
    animations: boolean;
  };
  privacy: {
    dataSharing: boolean;
    telemetry: boolean;
    crashReports: boolean;
  };
  notifications: {
    systemNotifications: boolean;
    soundNotifications: boolean;
    updateNotifications: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  editor: {
    theme: "dark",
    fontSize: 14,
    fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace',
    tabSize: 4,
    insertSpaces: true,
    wordWrap: "on",
    lineNumbers: "on",
    minimap: {
      enabled: true,
      side: "right"
    },
    autoSave: true,
    formatOnSave: false
  },
  terminal: {
    defaultShell: "auto",
    fontSize: 14,
    fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace',
    theme: "dark",
    cursorStyle: "block",
    cursorBlink: true,
    scrollback: 10000,
    copyOnSelect: false,
    pasteOnRightClick: true,
    confirmOnExit: true,
    rendererType: "canvas",
    enableGpu: true,
    scrollSensitivity: 1,
    enableBell: false,
    bellStyle: "none",
    shellArgs: {
      "powershell": ["-NoExit", "-NoLogo", "-ExecutionPolicy", "Bypass"],
      "pwsh": ["-NoExit", "-NoLogo"],
      "cmd": ["/Q", "/K"],
      "bash": ["--login", "-i"],
      "zsh": ["-i"],
      "fish": ["-i"]
    }
  },
  ai: {
    defaultModel: "gpt-3.5-turbo",
    apiEndpoint: "http://localhost:5000",
    maxTokens: 2048,
    temperature: 0.7,
    enableAutoComplete: true,
    enableCodeGeneration: true
  },
  layout: {
    sidebarWidth: 250,
    terminalHeight: 300,
    assistantWidth: 360,
    showSidebar: true,
    showTerminal: true,
    showAssistant: false
  },
  appearance: {
    theme: "dark-plus",
    accentColor: "#007acc",
    borderRadius: 6,
    animations: true
  },
  privacy: {
    dataSharing: true,
    telemetry: false,
    crashReports: true
  },
  notifications: {
    systemNotifications: true,
    soundNotifications: false,
    updateNotifications: true
  }
};

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: AppSettings = DEFAULT_SETTINGS;
  private listeners: ((settings: AppSettings) => void)[] = [];

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  async loadSettings(): Promise<void> {
    try {
      if ((window as any).api?.readFile) {
        const result = await (window as any).api.readFile('settings.json');
        if (result.ok && result.content) {
          const parsedSettings = JSON.parse(result.content);
          this.settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      this.settings = DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      if ((window as any).api?.writeFile) {
        const result = await (window as any).api.writeFile('settings.json', JSON.stringify(settings, null, 2));
        if (result.ok) {
          this.settings = settings;
          this.notifyListeners();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifyListeners();
  }

  onSettingsChange(callback: (settings: AppSettings) => void): void {
    this.listeners.push(callback);
  }

  removeSettingsListener(callback: (settings: AppSettings) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  validateSettings(settings: any): AppSettings {
    // Deep merge with defaults to ensure all required properties exist
    const merged = this.deepMerge(DEFAULT_SETTINGS, settings);
    return merged as AppSettings;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}
