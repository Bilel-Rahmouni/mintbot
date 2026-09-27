export const formCss = `
:host {
  all: initial;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.mf-root {
  --mf-accent: #10b981;
  --mf-ink: #101614;
  --mf-muted: #6b7671;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--mf-ink);
  background: #fff;
  border: 1px solid #e4ebe7;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  padding: 26px;
  max-width: 480px;
}

.mf-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.mf-desc {
  color: var(--mf-muted);
  margin-top: 5px;
  font-size: 14px;
}

.mf-form {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mf-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mf-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--mf-ink);
}
.mf-label span {
  color: #dc2626;
}

.mf-input,
.mf-textarea,
.mf-select {
  font: inherit;
  color: var(--mf-ink);
  border: 1px solid #dbe4df;
  border-radius: 10px;
  padding: 10px 13px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}
.mf-input:focus,
.mf-textarea:focus,
.mf-select:focus {
  border-color: var(--mf-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mf-accent) 18%, transparent);
}
.mf-textarea {
  resize: vertical;
  min-height: 92px;
}

.mf-check {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  cursor: pointer;
}
.mf-check input {
  width: 17px;
  height: 17px;
  accent-color: var(--mf-accent);
}

.mf-error {
  font-size: 12.5px;
  color: #dc2626;
}
.mf-form-error {
  font-size: 13.5px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 13px;
}

.mf-submit {
  font: inherit;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: var(--mf-accent);
  color: #fff;
  padding: 12px 18px;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.mf-submit:hover:not(:disabled) {
  filter: brightness(1.08);
}
.mf-submit:active:not(:disabled) {
  transform: scale(0.98);
}
.mf-submit:disabled {
  opacity: 0.55;
  cursor: default;
}

.mf-success {
  text-align: center;
  padding: 26px 8px;
  animation: mf-pop 0.25s ease;
}
@keyframes mf-pop {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.mf-success-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--mf-accent) 14%, white);
  color: var(--mf-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 12px;
}
.mf-success-text {
  font-size: 15px;
  color: var(--mf-ink);
}

.mf-footer {
  margin-top: 14px;
  text-align: center;
  font-size: 11px;
  color: var(--mf-muted);
}
.mf-footer a {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}
`;
