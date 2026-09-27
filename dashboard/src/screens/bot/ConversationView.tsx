import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Message } from "../../lib/types";
import { PageSpinner } from "../../components/ui/Spinner";

interface ConversationDetail {
  id: string;
  createdAt: string;
  messages: Message[];
}

export function ConversationView() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);

  useEffect(() => {
    api<{ conversation: ConversationDetail }>(`/api/conversations/${conversationId}`).then(
      (data) => setConversation(data.conversation)
    );
  }, [conversationId]);

  if (!conversation) return <PageSpinner />;

  return (
    <>
      <p style={{ marginBottom: 20 }}>
        <Link to=".." relative="path">
          ← All conversations
        </Link>
      </p>
      <div className="transcript">
        {conversation.messages.map((m) => (
          <div key={m.id}>
            <div
              className={`transcript-msg ${m.role === "USER" ? "transcript-user" : "transcript-bot"}`}
              style={m.role === "USER" ? { marginLeft: "auto" } : undefined}
            >
              {m.content}
              <div className="transcript-time">
                {new Date(m.createdAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
