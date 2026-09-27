import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Bot } from "../../lib/types";
import { PageSpinner } from "../../components/ui/Spinner";

export interface BotContext {
  bot: Bot;
  refreshBot: () => Promise<void>;
}

const TABS = [
  { to: "sources", label: "Sources" },
  { to: "appearance", label: "Appearance" },
  { to: "embed", label: "Embed" },
  { to: "conversations", label: "Conversations" },
  { to: "playground", label: "Playground" },
];

export function BotScreen() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);

  const refreshBot = useCallback(async () => {
    try {
      const data = await api<{ bot: Bot }>(`/api/bots/${botId}`);
      setBot(data.bot);
    } catch {
      navigate("/bots", { replace: true });
    }
  }, [botId, navigate]);

  useEffect(() => {
    refreshBot();
  }, [refreshBot]);

  if (!bot) return <PageSpinner />;

  return (
    <>
      <div className="bot-head">
        <span className="bot-chip" style={{ background: bot.themeColor }}>
          {bot.name[0]?.toUpperCase()}
        </span>
        <div>
          <h1>{bot.name}</h1>
          <span className="bot-key">{bot.publicKey}</span>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab${isActive ? " active" : ""}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ bot, refreshBot } satisfies BotContext} />
    </>
  );
}
