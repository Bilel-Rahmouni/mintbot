import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { streamPlaygroundChat } from "../../lib/stream";
import type { BotContext } from "./BotScreen";
import { Button } from "../../components/ui/Button";

interface UiMessage {
  role: "user" | "bot" | "error";
  content: string;
}

export function PlaygroundTab() {
  const { bot } = useOutletContext<BotContext>();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    let botIndex = -1;
    try {
      await streamPlaygroundChat(
        { botKey: bot.publicKey, message: text, conversationId: conversationIdRef.current },
        (event) => {
          if (event.conversationId) conversationIdRef.current = event.conversationId;
          if (event.error) {
            setMessages((prev) => [
              ...prev,
              { role: "error", content: event.message || "Something went wrong." },
            ]);
          }
          if (event.delta) {
            setMessages((prev) => {
              const next = [...prev];
              if (botIndex === -1 || next[botIndex]?.role !== "bot") {
                botIndex = next.length;
                next.push({ role: "bot", content: event.delta! });
              } else {
                next[botIndex] = { role: "bot", content: next[botIndex].content + event.delta };
              }
              return next;
            });
          }
        }
      );
    } catch {
      setMessages((prev) => [...prev, { role: "error", content: "Connection lost." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card playground" style={{ maxWidth: 720 }}>
      <div className="playground-messages" ref={listRef}>
        <div className="transcript-msg transcript-bot">{bot.greeting}</div>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`transcript-msg ${m.role === "user" ? "transcript-user" : "transcript-bot"}`}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              ...(m.role === "error" ? { color: "var(--danger)" } : {}),
            }}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="transcript-msg transcript-bot" style={{ color: "var(--text-faint)" }}>
            …
          </div>
        )}
      </div>
      <div className="playground-input-row">
        <input
          className="input"
          value={input}
          placeholder="Ask your bot something…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={busy || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
