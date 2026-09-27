import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Bot } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { PageSpinner } from "../../components/ui/Spinner";
import { CreateBotModal } from "./CreateBotModal";

export function BotsScreen() {
  const [bots, setBots] = useState<Bot[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api<{ bots: Bot[] }>("/api/bots").then((data) => setBots(data.bots));
  }, []);

  if (!bots) return <PageSpinner />;

  return (
    <>
      <div className="page-head">
        <h1>Bots</h1>
        <Button onClick={() => setShowCreate(true)}>New bot</Button>
      </div>

      {bots.length === 0 ? (
        <div className="empty">
          <h3>Create your first bot</h3>
          <Button onClick={() => setShowCreate(true)}>New bot</Button>
        </div>
      ) : (
        <div className="bot-grid">
          {bots.map((bot) => (
            <Link key={bot.id} to={`/bots/${bot.id}`} className="card bot-card">
              <div className="bot-card-head">
                <span className="bot-chip" style={{ background: bot.themeColor }}>
                  {bot.name[0]?.toUpperCase()}
                </span>
                <h3>{bot.name}</h3>
              </div>
              <div className="bot-card-meta">
                <span>
                  <strong>{bot._count?.sources ?? 0}</strong> sources
                </span>
                <span>
                  <strong>{bot._count?.conversations ?? 0}</strong> conversations
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateBotModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
