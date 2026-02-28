import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const rootEl = document.getElementById("root");

const renderFatal = (message: string) => {
  if (!rootEl) return;
  rootEl.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;">' +
    '<div style="max-width:760px;width:100%;border:1px solid #fecaca;background:#fff;padding:16px;border-radius:8px;">' +
    "<h1 style='margin:0 0 8px;color:#b91c1c;font-size:18px;'>Startup Error</h1>" +
    "<p style='margin:0 0 8px;color:#374151;'>The app failed to start. Refresh once. If it still fails, share this message:</p>" +
    `<pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:12px;color:#111827;">${message}</pre>` +
    "</div></div>";
};

window.addEventListener("error", (event) => {
  if (event.error?.message) renderFatal(event.error.message);
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = (event.reason && (event.reason.message || String(event.reason))) || "Unhandled promise rejection";
  renderFatal(reason);
});

if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
