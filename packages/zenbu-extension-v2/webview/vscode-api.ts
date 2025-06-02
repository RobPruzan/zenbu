// VSCode API wrapper
declare global {
  function acquireVsCodeApi(): {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | undefined;

export function getVSCodeAPI() {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}
