// Convert hex color to RGB values
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r} ${g} ${b}`;
}

// Convert rgba to RGB values
function rgbaToRgb(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return "128 128 128"; // fallback
}

// Convert any color format to RGB
function colorToRgb(color: string): string {
  if (!color) return "128 128 128";

  // Handle hex colors
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  // Handle rgba/rgb colors
  if (color.startsWith("rgb")) {
    return rgbaToRgb(color);
  }

  // Fallback
  return "128 128 128";
}

// Initialize color variables for Tailwind opacity support
export function initializeColors() {
  const styles = getComputedStyle(document.documentElement);
  const root = document.documentElement;

  // Get VSCode colors and convert to RGB
  const borderColor =
    styles.getPropertyValue("--vscode-editorWidget-border") ||
    styles.getPropertyValue("--vscode-panel-border") ||
    "rgba(128, 128, 128, 0.35)";

  const inputColor =
    styles.getPropertyValue("--vscode-input-border") ||
    styles.getPropertyValue("--vscode-editorWidget-border") ||
    borderColor;

  const accentColor =
    styles.getPropertyValue("--vscode-list-activeSelectionBackground") ||
    "#3b82f6";

  const mutedColor =
    styles.getPropertyValue("--vscode-input-background") || "#646464";

  // Set RGB values
  root.style.setProperty("--border-rgb", colorToRgb(borderColor));
  root.style.setProperty("--input-rgb", colorToRgb(inputColor));
  root.style.setProperty("--accent-rgb", colorToRgb(accentColor));
  root.style.setProperty("--muted-rgb", colorToRgb(mutedColor));

  // Debug log
  console.log("Initialized RGB colors:", {
    border: colorToRgb(borderColor),
    input: colorToRgb(inputColor),
    accent: colorToRgb(accentColor),
    muted: colorToRgb(mutedColor),
  });
}

// Initialize on load and when theme changes
if (typeof window !== "undefined") {
  // Initialize immediately
  initializeColors();

  // Re-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeColors);
  }

  // Watch for theme changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-vscode-theme-kind"
      ) {
        initializeColors();
      }
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-vscode-theme-kind"],
  });
}
