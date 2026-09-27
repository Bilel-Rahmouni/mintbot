import { openai, CHAT_MODEL } from "../lib/openai";
import type { RetrievedChunk } from "./retrieval";

export interface HistoryMessage {
  role: "USER" | "ASSISTANT";
  content: string;
}

function buildSystemPrompt(botName: string, persona: string, chunks: RetrievedChunk[]): string {
  const context =
    chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")
      : "(no relevant knowledge found)";

  return [
    `You are "${botName}", a helpful assistant embedded on a website.`,
    persona ? `Persona and instructions from the site owner:\n${persona}` : "",
    `Answer the visitor's questions using the knowledge base excerpts below.`,
    `If the answer is not in the excerpts and you are not confident, say you don't know and suggest contacting the site's team. Never invent facts, prices, or policies.`,
    `Keep answers concise and friendly. Answer in the language the visitor writes in.`,
    ``,
    `Knowledge base excerpts:`,
    context,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function* streamAnswer(
  botName: string,
  persona: string,
  history: HistoryMessage[],
  question: string,
  chunks: RetrievedChunk[]
): AsyncGenerator<string> {
  const messages = [
    { role: "system" as const, content: buildSystemPrompt(botName, persona, chunks) },
    ...history.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: question },
  ];

  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 700,
  });

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
