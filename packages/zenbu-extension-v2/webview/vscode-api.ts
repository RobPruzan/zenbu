// VSCode API wrapper
declare global {
  function acquireVsCodeApi(): {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };

  interface Window {
    __vscodeApi?: ReturnType<typeof acquireVsCodeApi>;
  }
}

export function getVSCodeAPI() {
  if (!window.__vscodeApi) {
    window.__vscodeApi = acquireVsCodeApi();
  }
  return window.__vscodeApi;
}
