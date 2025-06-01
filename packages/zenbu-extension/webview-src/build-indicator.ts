// Standalone build indicator - not coupled to React app
export function initBuildIndicator() {
  let indicatorElement: HTMLDivElement | null = null;

  function createIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "build-indicator";
    indicator.innerHTML = `
      <div class="build-spinner"></div>
      <span>Building...</span>
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  function showIndicator() {
    if (!indicatorElement) {
      indicatorElement = createIndicator();
    }
  }

  // Listen for build status messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "buildStatus" && message.building) {
      showIndicator();
    }
  });
}

// Auto-initialize when imported
initBuildIndicator();
