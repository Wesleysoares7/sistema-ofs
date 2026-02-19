import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.js";
import "./index.css";

const parsedSentryTraceSampleRate = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
);
const sentryTraceSampleRate = Number.isFinite(parsedSentryTraceSampleRate)
  ? parsedSentryTraceSampleRate
  : 0.1;

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: sentryTraceSampleRate,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
