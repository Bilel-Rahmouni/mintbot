import { useEffect, useRef, useState } from "preact/hooks";
import { fetchBotConfig, streamChat, type BotConfig } from "./api";

interface Props {
  botKey: string;
  apiBase: string;
}

interface UiMessage {
  role: "user" | "bot" | "error";
  content: string;
}

function getVisitorId(): string {
  const key = "mintbot_visitor";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "v_anonymous";
  }
}

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export function Widget({ botKey, apiBase }: Props) {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitingFirstToken, setWaitingFirstToken] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBotConfig(apiBase, botKey).then(setConfig);
    try {
      conversationIdRef.current =
        sessionStorage.getItem(`mintbot_convo_${botKey}`) ?? undefined;
    } catch {
      /* storage unavailable */
    }
  }, [apiBase, botKey]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, waitingFirstToken, open]);

  if (!config) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setWaitingFirstToken(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    let botIndex = -1;
    try {
      await streamChat(
        apiBase,
        {
          botKey,
          message: text,
          conversationId: conversationIdRef.current,
          visitorId: getVisitorId(),
        },
        (event) => {
          if (event.conversationId) {
            conversationIdRef.current = event.conversationId;
            try {
              sessionStorage.setItem(`mintbot_convo_${botKey}`, event.conversationId);
            } catch {
              /* storage unavailable */
            }
          }
          if (event.error) {
            setWaitingFirstToken(false);
            setMessages((prev) => [
              ...prev,
              { role: "error", content: event.message || "Something went wrong." },
            ]);
          }
          if (event.delta) {
            setWaitingFirstToken(false);
            setMessages((prev) => {
              const next = [...prev];
              if (botIndex === -1 || next[botIndex]?.role !== "bot") {
                botIndex = next.length;
                next.push({ role: "bot", content: event.delta! });
              } else {
                next[botIndex] = {
                  role: "bot",
                  content: next[botIndex].content + event.delta,
                };
              }
              return next;
            });
          }
        }
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Connection lost. Please try again." },
      ]);
    } finally {
      setBusy(false);
      setWaitingFirstToken(false);
    }
  };

  return (
    <div className="mb-root" style={{ "--mb-accent": config.themeColor } as never}>
      {open && (
        <div className="mb-panel">
          <div className="mb-header">
            <span className="mb-header-dot" />
            <span className="mb-header-name">{config.name}</span>
            <button className="mb-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>
          <div className="mb-messages" ref={listRef}>
            <div className="mb-msg mb-msg-bot">{config.greeting}</div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-msg ${
                  m.role === "user" ? "mb-msg-user" : m.role === "error" ? "mb-msg-error" : "mb-msg-bot"
                }`}
              >
                {m.content}
              </div>
            ))}
            {waitingFirstToken && (
              <div className="mb-typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="mb-input-row">
            <input
              className="mb-input"
              value={input}
              placeholder="Type a message…"
              onInput={(e) => setInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="mb-send"
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <div className="mb-footer">
            Powered by <a href="https://mintbot.app" target="_blank" rel="noreferrer">MintBot</a>
          </div>
        </div>
      )}
      <button className="mb-bubble" onClick={() => setOpen((v) => !v)} aria-label="Open chat">
        <ChatIcon />
      </button>
    </div>
  );
}
