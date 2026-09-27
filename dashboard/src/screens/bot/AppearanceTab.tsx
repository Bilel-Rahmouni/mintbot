import { useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import type { BotContext } from "./BotScreen";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

export function AppearanceTab() {
  const { bot, refreshBot } = useOutletContext<BotContext>();
  const navigate = useNavigate();
  const [name, setName] = useState(bot.name);
  const [greeting, setGreeting] = useState(bot.greeting);
  const [themeColor, setThemeColor] = useState(bot.themeColor);
  const [persona, setPersona] = useState(bot.persona);
  const [domains, setDomains] = useState(bot.allowedDomains.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await api(`/api/bots/${bot.id}`, {
        method: "PATCH",
        body: {
          name,
          greeting,
          themeColor,
          persona,
          allowedDomains: domains
            .split("\n")
            .map((d) => d.trim())
            .filter(Boolean),
        },
      });
      await refreshBot();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const deleteBot = async () => {
    await api(`/api/bots/${bot.id}`, { method: "DELETE" });
    navigate("/bots");
  };

  return (
    <>
      <form className="card" style={{ maxWidth: 640 }} onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Greeting" hint="First message visitors see">
          <input
            className="input"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
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
          label="Persona"
          hint="Tone, role, and rules for the bot, e.g. 'You are Acme's support assistant…'"
        >
          <textarea
            className="textarea"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={5}
          />
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
        <Button type="submit" loading={busy}>
          {saved ? "Saved" : "Save changes"}
        </Button>
      </form>

      <div className="card danger-zone" style={{ maxWidth: 640 }}>
        <div>
          <h3>Delete this bot</h3>
          <p>Removes its sources, training data, and conversations permanently.</p>
        </div>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete bot
        </Button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete bot"
          message={`"${bot.name}" and all of its data will be permanently deleted. Any embedded widgets will stop working.`}
          confirmLabel="Delete permanently"
          onConfirm={deleteBot}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
