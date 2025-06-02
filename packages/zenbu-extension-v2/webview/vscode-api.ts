// VSCode API wrapper
declare global {
  const vscode: {
    postMessage: (message: any) => void;
  };
}

export function getVSCodeAPI() {
  return vscode;
}
