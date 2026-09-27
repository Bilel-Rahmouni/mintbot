import { useState, type FormEvent } from "react";
import type { FieldType, FormFieldDef } from "../../lib/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

const TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  textarea: "Long text",
  select: "Dropdown",
  checkbox: "Checkbox",
};

interface Props {
  initial?: FormFieldDef;
  existingIds: string[];
  onSave: (field: FormFieldDef) => void;
  onClose: () => void;
}

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "field"
  );
}

export function FieldModal({ initial, existingIds, onSave, onClose }: Props) {
  const [type, setType] = useState<FieldType>(initial?.type ?? "text");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [options, setOptions] = useState((initial?.options ?? []).join("\n"));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let id = initial?.id;
    if (!id) {
      const base = slugify(label);
      id = base;
      let n = 2;
      while (existingIds.includes(id)) id = `${base}_${n++}`;
    }
    onSave({
      id,
      type,
      label: label.trim(),
      required,
      options:
        type === "select"
          ? options
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    });
    onClose();
  };

  return (
    <Modal title={initial ? "Edit field" : "Add field"} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Type">
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
            disabled={Boolean(initial)}
          >
            {Object.entries(TYPE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Label">
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={type === "checkbox" ? "I agree to be contacted" : "Your name"}
            autoFocus
            required
          />
        </Field>
        {type === "select" && (
          <Field label="Options" hint="One per line">
            <textarea
              className="textarea"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={4}
              required
            />
          </Field>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
          />
          <span style={{ fontSize: 14 }}>Required</span>
        </label>
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? "Save field" : "Add field"}</Button>
        </div>
      </form>
    </Modal>
  );
}
