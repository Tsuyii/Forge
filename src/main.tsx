import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MemoryApp } from "./components/memory/MemoryApp";
import "./styles/globals.css";

const isMemoryWindow = window.location.hash === "#/memory" ||
  new URLSearchParams(window.location.search).get("route") === "memory"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isMemoryWindow ? <MemoryApp /> : <App />}
  </React.StrictMode>,
);
