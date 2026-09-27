import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import type { Bot } from "../../lib/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

export function CreateBotModal({ onClose }: { onClose: () => void }) {
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
      const data = await api<{ bot: Bot }>("/api/bots", { method: "POST", body: { name } });
      navigate(`/bots/${data.bot.id}/sources`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create bot");
      setPlanLimit(err instanceof ApiError && err.code === "plan_limit");
      setBusy(false);
    }
  };

  return (
    <Modal title="New bot" onClose={onClose}>
      {error && (
        <div className="form-error">
          {error} {planLimit && <Link to="/billing">View plans</Link>}
        </div>
      )}
      <form onSubmit={submit}>
        <Field label="Name" hint="Shown to visitors in the chat header">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Support"
            autoFocus
            required
          />
        </Field>
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create bot
          </Button>
        </div>
      </form>
    </Modal>
  );
}
