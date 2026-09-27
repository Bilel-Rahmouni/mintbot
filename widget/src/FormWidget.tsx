import { useEffect, useState } from "preact/hooks";

export interface FormFieldDef {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormConfig {
  title: string;
  description: string;
  submitLabel: string;
  themeColor: string;
  fields: FormFieldDef[];
}

interface Props {
  formKey: string;
  apiBase: string;
}

export function FormWidget({ formKey, apiBase }: Props) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/public/forms/${encodeURIComponent(formKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setConfig(data?.form ?? null))
      .catch(() => setConfig(null));
  }, [apiBase, formKey]);

  if (!config) return null;

  const setValue = (id: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};
    for (const field of config.fields) {
      const value = values[field.id];
      const empty = field.type === "checkbox" ? value !== true : !String(value ?? "").trim();
      if (field.required && empty) errors[field.id] = "Required";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/public/forms/${encodeURIComponent(formKey)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(data.successMessage || "Thanks!");
    } catch {
      setFormError("Connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mf-root" style={{ "--mf-accent": config.themeColor } as never}>
      {success ? (
        <div className="mf-success">
          <div className="mf-success-icon">✓</div>
          <div className="mf-success-text">{success}</div>
        </div>
      ) : (
        <>
          <div className="mf-title">{config.title}</div>
          {config.description && <div className="mf-desc">{config.description}</div>}
          <form className="mf-form" onSubmit={submit} noValidate>
            {config.fields.map((field) => (
              <div key={field.id} className="mf-field">
                {field.type === "checkbox" ? (
                  <label className="mf-check">
                    <input
                      type="checkbox"
                      checked={values[field.id] === true}
                      onChange={(e) => setValue(field.id, (e.target as HTMLInputElement).checked)}
                    />
                    {field.label}
                    {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                  </label>
                ) : (
                  <>
                    <span className="mf-label">
                      {field.label}
                      {field.required && <span> *</span>}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        className="mf-textarea"
                        value={String(values[field.id] ?? "")}
                        onInput={(e) =>
                          setValue(field.id, (e.target as HTMLTextAreaElement).value)
                        }
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="mf-select"
                        value={String(values[field.id] ?? "")}
                        onChange={(e) => setValue(field.id, (e.target as HTMLSelectElement).value)}
                      >
                        <option value="">—</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="mf-input"
                        type={field.type === "phone" ? "tel" : field.type}
                        value={String(values[field.id] ?? "")}
                        onInput={(e) => setValue(field.id, (e.target as HTMLInputElement).value)}
                      />
                    )}
                  </>
                )}
                {fieldErrors[field.id] && <span className="mf-error">{fieldErrors[field.id]}</span>}
              </div>
            ))}
            {formError && <div className="mf-form-error">{formError}</div>}
            <button className="mf-submit" type="submit" disabled={busy}>
              {busy ? "…" : config.submitLabel}
            </button>
          </form>
          <div className="mf-footer">
            Powered by <a href="https://mintbot.app" target="_blank" rel="noreferrer">MintBot</a>
          </div>
        </>
      )}
    </div>
  );
}
