import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import type { Source } from "../../lib/types";
import type { BotContext } from "./BotScreen";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { AddSourceModal } from "./AddSourceModal";

const STATUS_BADGE: Record<
  Source["status"],
  { label: string; variant: "default" | "success" | "warning" | "danger"; pulse?: boolean }
> = {
  PENDING: { label: "Queued", variant: "warning", pulse: true },
  PROCESSING: { label: "Training", variant: "warning", pulse: true },
  READY: { label: "Ready", variant: "success" },
  ERROR: { label: "Failed", variant: "danger" },
};

export function SourcesTab() {
  const { bot } = useOutletContext<BotContext>();
  const [sources, setSources] = useState<Source[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ sources: Source[] }>(`/api/bots/${bot.id}/sources`);
    setSources(data.sources);
    return data.sources;
  }, [bot.id]);

  useEffect(() => {
    load().catch(() => {});
    // Keep statuses fresh while training runs in the background.
    const timer = window.setInterval(() => load().catch(() => {}), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  const reingest = async (id: string) => {
    await api(`/api/sources/${id}/reingest`, { method: "POST" });
    await load();
  };

  const remove = async (id: string) => {
    await api(`/api/sources/${id}`, { method: "DELETE" });
    await load();
  };

  if (!sources) return <PageSpinner />;

  return (
    <>
      <div className="page-head">
        <h2 style={{ fontSize: 18 }}>Sources</h2>
        <Button onClick={() => setShowAdd(true)}>Add source</Button>
      </div>

      {sources.length === 0 ? (
        <div className="empty">
          <h3>Train your bot</h3>
          <Button onClick={() => setShowAdd(true)}>Add source</Button>
        </div>
      ) : (
        <div className="source-list">
          {sources.map((source) => {
            const badge = STATUS_BADGE[source.status];
            return (
              <div key={source.id} className="card source-row">
                <div className="source-main">
                  <div className="source-title">{source.title}</div>
                  <div className="source-sub">
                    {source.type === "URL" ? source.url : "Pasted text"}
                    {source.status === "READY" &&
                      ` · ${source.pageCount} page${source.pageCount === 1 ? "" : "s"} · ${source.chunkCount} chunks`}
                    {source.status === "ERROR" && source.error && ` · ${source.error}`}
                  </div>
                </div>
                <Badge variant={badge.variant} pulse={badge.pulse}>
                  {badge.label}
                </Badge>
                <div className="source-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reingest(source.id)}
                    disabled={source.status === "PROCESSING" || source.status === "PENDING"}
                  >
                    Retrain
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(source.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddSourceModal botId={bot.id} onAdded={load} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
