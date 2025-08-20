// Shell detection moved to main process - this file now contains only types and interfaces

export interface ShellInfo {
  id: string;
  name: string;
  path: string;
  args?: string[];
  icon: string;
  priority: number;
  available: boolean;
  version?: string;
  description: string;
}

// Shell detection logic moved to electron/main.ts to avoid Node.js module issues in renderer process
// This file now only contains type definitions for use in the renderer

// Default shells available on most systems
export const DEFAULT_SHELLS: ShellInfo[] = [
  {
    id: 'powershell',
    name: 'PowerShell',
    path: 'powershell.exe',
    args: ['-NoExit', '-NoLogo', '-ExecutionPolicy', 'Bypass'],
    icon: '🔷',
    priority: 1,
    available: true,
    description: 'Windows PowerShell'
  },
  {
    id: 'cmd',
    name: 'Command Prompt',
    path: 'cmd.exe',
    args: ['/Q', '/K'],
    icon: '⬛',
    priority: 2,
    available: true,
    description: 'Windows Command Prompt'
  },
  {
    id: 'git-bash',
    name: 'Git Bash',
    path: 'bash.exe',
    args: ['--login', '-i'],
    icon: '🐙',
    priority: 3,
    available: true,
    description: 'Git for Windows Bash'
  },
  {
    id: 'wsl',
    name: 'WSL',
    path: 'wsl.exe',
    args: [],
    icon: '🐧',
    priority: 4,
    available: true,
    description: 'Windows Subsystem for Linux'
  },
  {
    id: 'node',
    name: 'Node.js REPL',
    path: 'node.exe',
    args: ['-i'],
    icon: '🟢',
    priority: 5,
    available: true,
    description: 'Node.js Interactive Shell'
  },
  {
    id: 'python',
    name: 'Python REPL',
    path: 'python.exe',
    args: ['-i'],
    icon: '🐍',
    priority: 6,
    available: true,
    description: 'Python Interactive Shell'
  }
];
