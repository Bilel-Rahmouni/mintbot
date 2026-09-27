import { render } from "preact";
import { FormWidget } from "./FormWidget";
import { formCss } from "./form-styles";

// document.currentScript is only available during initial script evaluation.
const scriptEl = document.currentScript as HTMLScriptElement | null;

function mountForm(container: HTMLElement, apiBase: string) {
  const formKey = container.dataset.mintbotForm;
  if (!formKey || container.shadowRoot) return;

  const shadow = container.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = formCss;
  shadow.appendChild(style);

  const mount = document.createElement("div");
  shadow.appendChild(mount);
  render(<FormWidget formKey={formKey} apiBase={apiBase} />, mount);
}

function init() {
  const apiBase =
    scriptEl?.dataset.api ||
    (scriptEl?.src ? new URL(scriptEl.src).origin : window.location.origin);

  const containers = document.querySelectorAll<HTMLElement>("[data-mintbot-form]");
  if (containers.length === 0) {
    console.error('[MintBot] No <div data-mintbot-form="..."> element found on this page');
    return;
  }
  containers.forEach((container) => mountForm(container, apiBase));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
