import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// scripts/prerender.mjs stamps each page with the route it was built for. Hydrate
// when that matches; otherwise (dev server, or index.html served as the fallback for
// an unknown path) discard the static markup and render from scratch.
const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
if (container.dataset.prerenderedPath === currentPath) {
  ReactDOM.hydrateRoot(container, app);
} else {
  container.replaceChildren();
  ReactDOM.createRoot(container).render(app);
}
