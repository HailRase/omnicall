import "@shared/ipc/PreloadApi.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Renderer root element was not found");
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

queueMicrotask(() => {
  document.getElementById("boot-splash")?.remove();
});
