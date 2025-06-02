// VSCode theme utilities
export function getVSCodeTheme() {
  const bodyElement = document.body;
  const themeKind = bodyElement.getAttribute('data-vscode-theme-kind');
  
  return {
    isDark: themeKind === 'vscode-dark',
    isLight: themeKind === 'vscode-light',
    isHighContrast: themeKind === 'vscode-high-contrast',
    isHighContrastLight: themeKind === 'vscode-high-contrast-light',
    kind: themeKind
  };
}

// Get computed VSCode CSS variable value
export function getVSCodeVariable(variableName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// Map of common VSCode theme variables
export const vscodeThemeVars = {
  // Editor colors
  background: '--vscode-editor-background',
  foreground: '--vscode-editor-foreground',
  
  // Button colors
  buttonBackground: '--vscode-button-background',
  buttonForeground: '--vscode-button-foreground',
  buttonHoverBackground: '--vscode-button-hoverBackground',
  buttonSecondaryBackground: '--vscode-button-secondaryBackground',
  buttonSecondaryForeground: '--vscode-button-secondaryForeground',
  
  // Input colors
  inputBackground: '--vscode-input-background',
  inputForeground: '--vscode-input-foreground',
  inputBorder: '--vscode-input-border',
  
  // Focus colors
  focusBorder: '--vscode-focusBorder',
  
  // Widget colors
  widgetBackground: '--vscode-editorWidget-background',
  widgetForeground: '--vscode-editorWidget-foreground',
  widgetBorder: '--vscode-editorWidget-border',
  
  // Status colors
  errorForeground: '--vscode-errorForeground',
  warningForeground: '--vscode-editorWarning-foreground',
  infoForeground: '--vscode-editorInfo-foreground',
  
  // List/tree colors
  listActiveSelectionBackground: '--vscode-list-activeSelectionBackground',
  listActiveSelectionForeground: '--vscode-list-activeSelectionForeground',
  listHoverBackground: '--vscode-list-hoverBackground',
  listHoverForeground: '--vscode-list-hoverForeground',
} as const; 