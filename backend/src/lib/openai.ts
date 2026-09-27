import OpenAI from "openai";
import { env } from "../env";

export const openai = new OpenAI({ apiKey: env.openaiApiKey });

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const CHAT_MODEL = "gpt-4o-mini";
