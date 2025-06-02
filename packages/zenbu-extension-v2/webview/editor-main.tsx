import React from "react";
import ReactDOM from "react-dom/client";
import { EditorApp } from "./editor";
import { GlobalProviders } from "./providers/global-providers";
import { ErrorBoundary } from "./components/error-boundary";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <GlobalProviders>
      <EditorApp />
    </GlobalProviders>
  </ErrorBoundary>
);
