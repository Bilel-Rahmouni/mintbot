export const widgetCss = `
:host {
  all: initial;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.mb-root {
  --mb-accent: #10b981;
  --mb-accent-soft: color-mix(in srgb, var(--mb-accent) 12%, white);
  --mb-ink: #101614;
  --mb-muted: #6b7671;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.mb-bubble {
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 50%;
  background: var(--mb-accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.mb-bubble:hover {
  transform: scale(1.07);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.26), 0 3px 8px rgba(0, 0, 0, 0.14);
}
.mb-bubble:active {
  transform: scale(0.97);
}
.mb-bubble svg {
  width: 26px;
  height: 26px;
}

.mb-panel {
  width: min(380px, calc(100vw - 40px));
  height: min(600px, calc(100vh - 120px));
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24), 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: mb-rise 0.24s cubic-bezier(0.21, 1.02, 0.73, 1);
  transform-origin: bottom right;
}
@keyframes mb-rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mb-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, var(--mb-accent), color-mix(in srgb, var(--mb-accent) 70%, #063));
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mb-header-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #b1ffdd;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}
.mb-header-name {
  font-weight: 600;
  font-size: 16px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mb-close {
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: background 0.15s ease;
}
.mb-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mb-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f7faf8;
}
.mb-msg {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  animation: mb-pop 0.18s ease;
}
@keyframes mb-pop {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.mb-msg-user {
  align-self: flex-end;
  background: var(--mb-accent);
  color: #fff;
  border-bottom-right-radius: 6px;
}
.mb-msg-bot {
  align-self: flex-start;
  background: #fff;
  color: var(--mb-ink);
  border: 1px solid #e4ebe7;
  border-bottom-left-radius: 6px;
}
.mb-msg-error {
  align-self: flex-start;
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  font-size: 13.5px;
}

.mb-typing {
  align-self: flex-start;
  display: flex;
  gap: 5px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4ebe7;
  border-radius: 16px;
  border-bottom-left-radius: 6px;
}
.mb-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mb-accent);
  opacity: 0.4;
  animation: mb-blink 1.2s infinite;
}
.mb-typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.mb-typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes mb-blink {
  0%, 80%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.mb-input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #edf2ef;
}
.mb-input {
  flex: 1;
  border: 1px solid #dbe4df;
  border-radius: 12px;
  padding: 10px 14px;
  font: inherit;
  color: var(--mb-ink);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.mb-input:focus {
  border-color: var(--mb-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mb-accent) 18%, transparent);
}
.mb-send {
  border: none;
  background: var(--mb-accent);
  color: #fff;
  width: 42px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.mb-send:hover:not(:disabled) {
  filter: brightness(1.08);
}
.mb-send:active:not(:disabled) {
  transform: scale(0.95);
}
.mb-send:disabled {
  opacity: 0.5;
  cursor: default;
}
.mb-send svg {
  width: 18px;
  height: 18px;
}

.mb-footer {
  text-align: center;
  padding: 6px 0 9px;
  background: #fff;
  font-size: 11px;
  color: var(--mb-muted);
}
.mb-footer a {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}
`;
