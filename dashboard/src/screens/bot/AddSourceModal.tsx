import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

interface Props {
  botId: string;
  onAdded: () => void;
  onClose: () => void;
}

export function AddSourceModal({ botId, onAdded, onClose }: Props) {
  const [type, setType] = useState<"URL" | "TEXT">("URL");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api(`/api/bots/${botId}/sources`, {
        method: "POST",
        body: type === "URL" ? { type, url } : { type, title, content },
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add source");
      setBusy(false);
    }
  };

  return (
    <Modal title="Add source" onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Button
          type="button"
          size="sm"
          variant={type === "URL" ? "primary" : "ghost"}
          onClick={() => setType("URL")}
        >
          Website
        </Button>
        <Button
          type="button"
          size="sm"
          variant={type === "TEXT" ? "primary" : "ghost"}
          onClick={() => setType("TEXT")}
        >
          Text
        </Button>
      </div>
      <form onSubmit={submit}>
        {type === "URL" ? (
          <Field label="Website URL" hint="Pages on this domain will be crawled and indexed">
            <input
              className="input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </Field>
        ) : (
          <>
            <Field label="Title">
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Shipping policy"
                required
              />
            </Field>
            <Field label="Content">
              <textarea
                className="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                minLength={20}
                required
              />
            </Field>
          </>
        )}
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Add source
          </Button>
        </div>
      </form>
    </Modal>
  );
}
