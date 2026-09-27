import { useOutletContext } from "react-router-dom";
import { API_URL } from "../../lib/api";
import type { FormContext } from "./FormScreen";
import { CopyBlock } from "../../components/ui/CopyBlock";

export function FormEmbedTab() {
  const { form } = useOutletContext<FormContext>();

  const snippet = [
    `<div data-mintbot-form="${form.publicKey}"></div>`,
    `<script src="${API_URL}/form.js" defer></script>`,
  ].join("\n");

  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: 14.5 }}>
        Paste this where the form should appear on the page.
      </p>
      <CopyBlock code={snippet} />
    </div>
  );
}
