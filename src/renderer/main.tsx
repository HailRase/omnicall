import "@shared/ipc/PreloadApi.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./styles/globals.css";
import "./styles.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Renderer root element was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
