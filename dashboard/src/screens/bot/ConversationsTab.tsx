import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import type { ConversationSummary } from "../../lib/types";
import type { BotContext } from "./BotScreen";
import { PageSpinner } from "../../components/ui/Spinner";

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationsTab() {
  const { bot } = useOutletContext<BotContext>();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    api<{ conversations: ConversationSummary[] }>(`/api/bots/${bot.id}/conversations`).then(
      (data) => setConversations(data.conversations)
    );
  }, [bot.id]);

  if (!conversations) return <PageSpinner />;

  if (conversations.length === 0) {
    return (
      <div className="empty">
        <h3>No conversations yet</h3>
      </div>
    );
  }

  return (
    <div className="source-list">
      {conversations.map((c) => (
        <Link key={c.id} to={c.id} className="card convo-row">
          <span className="convo-preview">
            {c.lastMessage
              ? `${c.lastMessage.role === "USER" ? "Visitor: " : ""}${c.lastMessage.content}`
              : "—"}
          </span>
          <span className="convo-meta">{c.messageCount} messages</span>
          <span className="convo-meta">{formatDate(c.updatedAt)}</span>
        </Link>
      ))}
    </div>
  );
}
