console.log('Available VSCode CSS variables:', Array.from(document.documentElement.style).filter(prop => prop.startsWith('--vscode')).sort())
