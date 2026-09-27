export interface BotConfig {
  name: string;
  greeting: string;
  themeColor: string;
}

export interface ChatEvent {
  conversationId?: string;
  delta?: string;
  done?: boolean;
  error?: string;
  message?: string;
}

export async function fetchBotConfig(apiBase: string, botKey: string): Promise<BotConfig | null> {
  try {
    const res = await fetch(`${apiBase}/api/public/bots/${encodeURIComponent(botKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.bot as BotConfig;
  } catch {
    return null;
  }
}

export async function streamChat(
  apiBase: string,
  payload: { botKey: string; message: string; conversationId?: string; visitorId?: string },
  onEvent: (event: ChatEvent) => void
): Promise<void> {
  const res = await fetch(`${apiBase}/api/public/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* keep default message */
    }
    onEvent({ error: "request_failed", message });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const line = raw.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as ChatEvent);
      } catch {
        /* ignore malformed frames */
      }
    }
  }
}
