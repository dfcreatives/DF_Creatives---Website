import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import type { PublicData } from "./types";
declare global {
  interface Window {
    __DF_DATA__: PublicData;
  }
}
const app = (
  <BrowserRouter>
    <App initialData={window.__DF_DATA__} />
  </BrowserRouter>
);
const root = document.getElementById("root")!;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
