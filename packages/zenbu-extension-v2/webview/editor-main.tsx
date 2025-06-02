import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { EditorApp } from "./editor";
import { GlobalProviders } from "./providers/global-providers";
import { ErrorBoundary } from "./components/error-boundary";
import "./styles.css";
import "./utils/init-colors";
import { ChatInstanceContext } from "~/components/chat-store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <GlobalProviders>
      <Suspense fallback={<>loading project...</>}>

      <EditorApp />
      </Suspense>
    </GlobalProviders>
  </ErrorBoundary>
);
