import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, ChevronDown, Check, Palette } from 'lucide-react';
import './ThemeSelector.css';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-selector">
      <button
        className="theme-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Color Theme"
      >
        <Palette size={16} />
        <span className="theme-name">{currentTheme.name}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="theme-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="theme-selector-dropdown">
            <div className="theme-selector-header">
              <Palette size={16} />
              <span>Color Theme</span>
            </div>
            <div className="theme-list">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-item ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className="theme-preview">
                    <div 
                      className="preview-color" 
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <div 
                      className="preview-color" 
                      style={{ backgroundColor: theme.colors.keyword }}
                    />
                    <div 
                      className="preview-color" 
                      style={{ backgroundColor: theme.colors.string }}
                    />
                    <div 
                      className="preview-color" 
                      style={{ backgroundColor: theme.colors.comment }}
                    />
                  </div>
                  <span className="theme-item-name">{theme.name}</span>
                  {currentTheme.id === theme.id && (
                    <Check size={14} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
