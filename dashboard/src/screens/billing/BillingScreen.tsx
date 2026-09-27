import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { BillingInfo } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";

export function BillingScreen() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    api<BillingInfo>("/api/billing").then(setBilling);
  }, []);

  if (!billing) return <PageSpinner />;

  const { plan, usage, plans } = billing;
  const messageRatio = Math.min(usage.messages / plan.messagesPerMonth, 1);
  const submissionRatio = Math.min(usage.submissions / plan.submissionsPerMonth, 1);

  const checkout = async (planId: string) => {
    setError(null);
    setBusyPlan(planId);
    try {
      const data = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: { plan: planId },
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusyPlan(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    setPortalBusy(true);
    try {
      const data = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal");
      setPortalBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Billing</h1>
        {plan.id !== "free" && (
          <Button variant="ghost" onClick={openPortal} loading={portalBusy}>
            Manage subscription
          </Button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card usage-card">
        <div className="usage-row">
          <span className="usage-big">
            {usage.messages.toLocaleString()}{" "}
            <span>/ {plan.messagesPerMonth.toLocaleString()} chat messages · {usage.period}</span>
          </span>
          <Badge variant="success">{plan.name}</Badge>
        </div>
        <div className="meter">
          <div
            className={`meter-fill${messageRatio >= 0.85 ? " meter-high" : ""}`}
            style={{ width: `${messageRatio * 100}%` }}
          />
        </div>
        <div className="usage-row" style={{ marginTop: 20 }}>
          <span className="usage-big">
            {usage.submissions.toLocaleString()}{" "}
            <span>/ {plan.submissionsPerMonth.toLocaleString()} form submissions · {usage.period}</span>
          </span>
        </div>
        <div className="meter">
          <div
            className={`meter-fill${submissionRatio >= 0.85 ? " meter-high" : ""}`}
            style={{ width: `${submissionRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="plan-grid">
        {plans.map((p) => {
          const isCurrent = p.id === plan.id;
          return (
            <div key={p.id} className={`card plan-card${isCurrent ? " plan-current" : ""}`}>
              <h3 className="plan-name">{p.name}</h3>
              <div className="plan-price">
                ${p.priceMonthly}
                <span>/mo</span>
              </div>
              <ul className="plan-features">
                <li>
                  {p.maxBots} bot{p.maxBots === 1 ? "" : "s"} ·{" "}
                  {p.maxForms} form{p.maxForms === 1 ? "" : "s"}
                </li>
                <li>{p.messagesPerMonth.toLocaleString()} chat messages / month</li>
                <li>{p.submissionsPerMonth.toLocaleString()} form submissions / month</li>
                <li>{p.pagesPerSource.toLocaleString()} crawled pages / source</li>
              </ul>
              {isCurrent ? (
                <Button variant="ghost" disabled>
                  Current plan
                </Button>
              ) : p.id === "free" ? (
                <Button variant="ghost" onClick={openPortal} loading={portalBusy}>
                  Downgrade
                </Button>
              ) : (
                <Button
                  onClick={() => checkout(p.id)}
                  loading={busyPlan === p.id}
                  disabled={!p.available}
                >
                  {p.available ? `Upgrade to ${p.name}` : "Unavailable"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
