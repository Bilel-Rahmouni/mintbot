import { API_URL, getToken } from "./api";

export interface ChatStreamEvent {
  conversationId?: string;
  delta?: string;
  done?: boolean;
  error?: string;
  message?: string;
}

export async function streamPlaygroundChat(
  payload: { botKey: string; message: string; conversationId?: string },
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/public/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    onEvent({ error: "request_failed", message: data.error || "Request failed" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as ChatStreamEvent);
      } catch {
        /* ignore malformed frames */
      }
    }
  }
}
