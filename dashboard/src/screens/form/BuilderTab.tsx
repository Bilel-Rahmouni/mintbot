import { useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import type { FormFieldDef } from "../../lib/types";
import type { FormContext } from "./FormScreen";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { FieldModal } from "./FieldModal";

export function BuilderTab() {
  const { form, refreshForm } = useOutletContext<FormContext>();
  const navigate = useNavigate();

  const [name, setName] = useState(form.name);
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [submitLabel, setSubmitLabel] = useState(form.submitLabel);
  const [successMessage, setSuccessMessage] = useState(form.successMessage);
  const [themeColor, setThemeColor] = useState(form.themeColor);
  const [domains, setDomains] = useState(form.allowedDomains.join("\n"));
  const [fields, setFields] = useState<FormFieldDef[]>(form.fields);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldModal, setFieldModal] = useState<{ open: boolean; field?: FormFieldDef }>({
    open: false,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const moveField = (index: number, delta: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveField = (field: FormFieldDef) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === field.id);
      if (index === -1) return [...prev, field];
      const next = [...prev];
      next[index] = field;
      return next;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await api(`/api/forms/${form.id}`, {
        method: "PATCH",
        body: {
          name,
          title,
          description,
          submitLabel,
          successMessage,
          themeColor,
          allowedDomains: domains
            .split("\n")
            .map((d) => d.trim())
            .filter(Boolean),
          fields,
        },
      });
      await refreshForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const deleteForm = async () => {
    await api(`/api/forms/${form.id}`, { method: "DELETE" });
    navigate("/forms");
  };

  return (
    <>
      <form onSubmit={submit} style={{ maxWidth: 680 }} className="stack-24">
        {error && <div className="form-error">{error}</div>}

        <div className="card">
          <div className="page-head" style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 17 }}>Fields</h2>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFieldModal({ open: true })}
            >
              Add field
            </Button>
          </div>
          <div className="source-list">
            {fields.map((field, index) => (
              <div key={field.id} className="field-row">
                <span className="field-row-type">{field.type}</span>
                <span className="field-row-label">
                  {field.label}
                  {field.required && <span style={{ color: "var(--danger)" }}> *</span>}
                </span>
                <div className="source-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveField(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFieldModal({ open: true, field })}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="empty" style={{ padding: "28px 16px" }}>
                <h3>No fields yet</h3>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 17, marginBottom: 18 }}>Settings</h2>
          <Field label="Name" hint="Internal, only visible to you">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Title" hint="Shown above the form on the website">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Description">
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Submit button label">
            <input
              className="input"
              value={submitLabel}
              onChange={(e) => setSubmitLabel(e.target.value)}
              required
            />
          </Field>
          <Field label="Success message">
            <input
              className="input"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              required
            />
          </Field>
          <Field label="Accent color">
            <div className="input-color-row">
              <input
                className="input-color"
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
              />
              <input
                className="input"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                style={{ maxWidth: 140, fontFamily: "var(--font-mono)" }}
              />
            </div>
          </Field>
          <Field
            label="Allowed domains"
            hint="One per line, e.g. example.com. Leave empty to allow any website."
          >
            <textarea
              className="textarea"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              rows={3}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button type="submit" loading={busy}>
              {saved ? "Saved" : "Save changes"}
            </Button>
            {saved && <Badge variant="success">Live</Badge>}
          </div>
        </div>
      </form>

      <div className="card danger-zone" style={{ maxWidth: 680 }}>
        <div>
          <h3>Delete this form</h3>
          <p>Removes the form and all of its submissions permanently.</p>
        </div>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete form
        </Button>
      </div>

      {fieldModal.open && (
        <FieldModal
          initial={fieldModal.field}
          existingIds={fields.map((f) => f.id)}
          onSave={saveField}
          onClose={() => setFieldModal({ open: false })}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete form"
          message={`"${form.name}" and all of its submissions will be permanently deleted. Any embedded forms will stop working.`}
          confirmLabel="Delete permanently"
          onConfirm={deleteForm}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
