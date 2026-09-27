import { render } from "preact";
import { Widget } from "./Widget";
import { widgetCss } from "./styles";

// document.currentScript is only available during initial script evaluation.
const scriptEl = document.currentScript as HTMLScriptElement | null;

function init() {
  const script =
    scriptEl ?? document.querySelector<HTMLScriptElement>("script[data-bot-id]");
  const botKey = script?.dataset.botId;
  if (!botKey) {
    console.error("[MintBot] Missing data-bot-id attribute on the widget script tag");
    return;
  }
  const apiBase =
    script?.dataset.api || (script?.src ? new URL(script.src).origin : window.location.origin);

  if (document.getElementById("mintbot-widget")) return;

  const host = document.createElement("div");
  host.id = "mintbot-widget";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = widgetCss;
  shadow.appendChild(style);

  const mount = document.createElement("div");
  shadow.appendChild(mount);
  render(<Widget botKey={botKey} apiBase={apiBase} />, mount);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
