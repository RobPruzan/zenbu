import React from "react";
import ReactDOM from "react-dom/client";
import { SidebarApp } from "./sidebar";
import { TRPCProvider } from "./providers/trpc-provider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <TRPCProvider>
    <SidebarApp />
  </TRPCProvider>
);
