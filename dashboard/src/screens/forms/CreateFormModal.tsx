import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import type { FormDef } from "../../lib/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

export function CreateFormModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [planLimit, setPlanLimit] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ form: FormDef }>("/api/forms", { method: "POST", body: { name } });
      navigate(`/forms/${data.form.id}/builder`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create form");
      setPlanLimit(err instanceof ApiError && err.code === "plan_limit");
      setBusy(false);
    }
  };

  return (
    <Modal title="New form" onClose={onClose}>
      {error && (
        <div className="form-error">
          {error} {planLimit && <Link to="/billing">View plans</Link>}
        </div>
      )}
      <form onSubmit={submit}>
        <Field label="Name" hint="Starts with name, email, and message fields — edit them next">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact form"
            autoFocus
            required
          />
        </Field>
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create form
          </Button>
        </div>
      </form>
    </Modal>
  );
}
