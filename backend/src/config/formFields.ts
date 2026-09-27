import { z } from "zod";

export const FIELD_TYPES = ["text", "email", "phone", "textarea", "select", "checkbox"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FormFieldDef {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export const formFieldSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1).max(120),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

export const formFieldsSchema = z.array(formFieldSchema).max(20);

export function parseFields(json: unknown): FormFieldDef[] {
  const result = formFieldsSchema.safeParse(json);
  return result.success ? result.data : [];
}
