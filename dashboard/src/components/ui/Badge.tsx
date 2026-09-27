import type { ReactNode } from "react";

interface Props {
  variant?: "default" | "success" | "warning" | "danger";
  pulse?: boolean;
  children: ReactNode;
}

export function Badge({ variant = "default", pulse = false, children }: Props) {
  return (
    <span
      className={[
        "badge",
        variant !== "default" ? `badge-${variant}` : "",
        pulse ? "badge-pulse" : "",
      ].join(" ")}
    >
      <span className="badge-dot" />
      {children}
    </span>
  );
}
