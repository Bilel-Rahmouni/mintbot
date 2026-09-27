import { useOutletContext } from "react-router-dom";
import { API_URL } from "../../lib/api";
import type { BotContext } from "./BotScreen";
import { CopyBlock } from "../../components/ui/CopyBlock";

export function EmbedTab() {
  const { bot } = useOutletContext<BotContext>();

  const snippet = [
    `<script`,
    `  src="${API_URL}/widget.js"`,
    `  data-bot-id="${bot.publicKey}"`,
    `  defer`,
    `></script>`,
  ].join("\n");

  return (
    <div style={{ maxWidth: 640 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: 14.5 }}>
        Paste this before the closing <code style={{ fontFamily: "var(--font-mono)" }}>&lt;/body&gt;</code> tag.
      </p>
      <CopyBlock code={snippet} />
    </div>
  );
}
