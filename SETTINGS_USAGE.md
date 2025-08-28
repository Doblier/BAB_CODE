# Settings Functionality

## Overview

The application now includes a comprehensive settings system that allows you to configure various aspects of the editor, terminal, AI assistant, and application appearance. Settings are managed through a modern, user-friendly settings panel interface similar to VS Code.

## How to Access Settings

1. **Click the Settings Icon**: Look for the gear icon (⚙️) in the top-right corner of the application
2. **Settings Panel Opens**: A modern settings panel will appear as a modal overlay
3. **Navigate Categories**: Use the left sidebar to navigate between different settings categories
4. **Edit Settings**: Use form controls, toggles, and dropdowns to modify settings
5. **Save Changes**: Click "Save Changes" button to apply your settings
6. **Close Panel**: Click the X button or click outside the panel to close

## Settings Categories

### Editor Settings
- **theme**: Editor theme ("dark" or "light")
- **fontSize**: Font size in pixels
- **fontFamily**: Font family for code
- **tabSize**: Number of spaces for indentation
- **insertSpaces**: Use spaces instead of tabs
- **wordWrap**: Enable word wrapping
- **lineNumbers**: Show line numbers
- **minimap**: Minimap configuration
- **autoSave**: Enable automatic saving
- **formatOnSave**: Format code on save

### Terminal Settings
- **defaultShell**: Default terminal shell ("auto", "powershell", "cmd", etc.)
- **fontSize**: Terminal font size
- **fontFamily**: Terminal font family
- **theme**: Terminal color theme
- **cursorStyle**: Cursor style ("block", "underline", "bar")
- **cursorBlink**: Enable cursor blinking
- **scrollback**: Number of lines to keep in history
- **copyOnSelect**: Copy text when selected
- **pasteOnRightClick**: Paste on right-click
- **confirmOnExit**: Confirm before closing terminal
- **shellArgs**: Command line arguments for different shells

### AI Settings
- **defaultModel**: Default AI model ("gpt-3.5-turbo", "gpt-4", etc.)
- **apiEndpoint**: API endpoint URL
- **maxTokens**: Maximum tokens for AI responses
- **temperature**: AI response creativity (0.0-1.0)
- **enableAutoComplete**: Enable AI code completion
- **enableCodeGeneration**: Enable AI code generation

### Layout Settings
- **sidebarWidth**: Width of the sidebar in pixels
- **terminalHeight**: Height of the terminal panel
- **assistantWidth**: Width of the AI assistant panel
- **showSidebar**: Show/hide the sidebar
- **showTerminal**: Show/hide the terminal
- **showAssistant**: Show/hide the AI assistant

### Appearance Settings
- **colorScheme**: Overall color scheme ("dark" or "light")
- **accentColor**: Primary accent color
- **borderRadius**: Border radius for UI elements
- **animations**: Enable UI animations

### Privacy Settings
- **dataSharing**: Allow data sharing for improvements
- **telemetry**: Enable telemetry collection
- **crashReports**: Send crash reports

### Notification Settings
- **systemNotifications**: Show system notifications
- **soundNotifications**: Play sound notifications
- **updateNotifications**: Show update notifications

## Example Settings

```json
{
  "editor": {
    "theme": "dark",
    "fontSize": 16,
    "fontFamily": "\"JetBrains Mono\", monospace",
    "tabSize": 2,
    "autoSave": true
  },
  "terminal": {
    "defaultShell": "powershell",
    "fontSize": 14,
    "theme": "dark"
  },
  "ai": {
    "defaultModel": "gpt-4",
    "temperature": 0.8
  },
  "layout": {
    "sidebarWidth": 300,
    "terminalHeight": 400
  }
}
```

## Settings Panel Features

- **Search**: Use the search bar to quickly find specific settings
- **Categories**: Organized settings into logical categories for easy navigation
- **Form Controls**: Use toggles, dropdowns, and text inputs for different setting types
- **Real-time Preview**: See changes applied immediately in the interface
- **Save/Revert**: Save changes or revert to previous values
- **Reset to Defaults**: Reset all settings to their default values

## Keyboard Shortcuts

- **Escape**: Close settings panel
- **Ctrl+F**: Focus search bar
- **Tab**: Navigate between form controls

## Validation

The application validates the settings file when it loads. If there are any JSON syntax errors, the application will use default settings and show an error message.

## Troubleshooting

1. **Settings not applying**: Make sure to click "Save Changes" button
2. **Panel not opening**: Check if the settings icon is visible in the top bar
3. **Changes not persisting**: Ensure you have write permissions to the settings file
4. **Panel not responding**: Try refreshing the application

## Default Settings

If the settings file is missing or corrupted, the application will use default settings. You can always reset to defaults by deleting the `settings.json` file and restarting the application.
