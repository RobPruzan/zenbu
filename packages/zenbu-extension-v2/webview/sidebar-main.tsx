import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { SidebarApp } from "./sidebar";
import { GlobalProviders } from "./providers/global-providers";
import { ErrorBoundary } from "./components/error-boundary";
import "./styles.css";
import "./utils/init-colors";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <GlobalProviders>
      <Suspense fallback={<>loading...</>}>

      <SidebarApp />
      </Suspense>
    </GlobalProviders>
  </ErrorBoundary>
);
