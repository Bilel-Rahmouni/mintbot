import type { ReactNode } from "react";
import { Logo } from "../../components/Logo";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <Logo />
        <div>
          <h1 className="auth-brand-title">
            A chatbot that knows <em>your</em> website.
          </h1>
          <p className="auth-brand-sub">
            Train it on your pages and docs, drop one script tag on your site, and let it answer
            your visitors around the clock.
          </p>
        </div>
        <span />
      </div>
      <div className="auth-panel">
        <div className="auth-box">{children}</div>
      </div>
    </div>
  );
}
