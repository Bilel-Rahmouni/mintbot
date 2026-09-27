export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Bot {
  id: string;
  name: string;
  publicKey: string;
  persona: string;
  greeting: string;
  themeColor: string;
  allowedDomains: string[];
  createdAt: string;
  _count?: { sources: number; conversations: number };
}

export type SourceStatus = "PENDING" | "PROCESSING" | "READY" | "ERROR";

export interface Source {
  id: string;
  type: "URL" | "TEXT";
  title: string;
  url: string | null;
  status: SourceStatus;
  error: string | null;
  pageCount: number;
  chunkCount: number;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: { content: string; role: "USER" | "ASSISTANT" } | null;
}

export interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface PlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
  maxBots: number;
  messagesPerMonth: number;
  pagesPerSource: number;
  maxForms: number;
  submissionsPerMonth: number;
  available: boolean;
}

export interface BillingInfo {
  plan: PlanInfo & { available?: boolean };
  usage: { messages: number; submissions: number; period: string };
  botCount: number;
  formCount: number;
  plans: PlanInfo[];
}

export type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox";

export interface FormFieldDef {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormDef {
  id: string;
  name: string;
  publicKey: string;
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  themeColor: string;
  allowedDomains: string[];
  fields: FormFieldDef[];
  createdAt: string;
  _count?: { submissions: number };
}

export interface FormSubmissionRow {
  id: string;
  data: Record<string, string | boolean>;
  pageUrl: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface FormStats {
  total: number;
  perDay: Array<{ day: string; count: number }>;
  byCountry: Array<{ country: string | null; count: number }>;
  points: Array<{
    latitude: number;
    longitude: number;
    city: string | null;
    country: string | null;
    createdAt: string;
  }>;
}
