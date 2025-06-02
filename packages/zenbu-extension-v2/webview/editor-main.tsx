import React from "react";
import ReactDOM from "react-dom/client";
import { EditorApp } from "./editor";
import { TRPCProvider } from "./providers/trpc-provider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <TRPCProvider>
    <EditorApp />
  </TRPCProvider>
);
