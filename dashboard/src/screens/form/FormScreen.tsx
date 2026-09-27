import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { FormDef } from "../../lib/types";
import { PageSpinner } from "../../components/ui/Spinner";

export interface FormContext {
  form: FormDef;
  refreshForm: () => Promise<void>;
}

const TABS = [
  { to: "builder", label: "Builder" },
  { to: "embed", label: "Embed" },
  { to: "submissions", label: "Submissions" },
  { to: "insights", label: "Insights" },
];

export function FormScreen() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDef | null>(null);

  const refreshForm = useCallback(async () => {
    try {
      const data = await api<{ form: FormDef }>(`/api/forms/${formId}`);
      setForm(data.form);
    } catch {
      navigate("/forms", { replace: true });
    }
  }, [formId, navigate]);

  useEffect(() => {
    refreshForm();
  }, [refreshForm]);

  if (!form) return <PageSpinner />;

  return (
    <>
      <div className="bot-head">
        <span className="bot-chip" style={{ background: form.themeColor }}>
          {form.name[0]?.toUpperCase()}
        </span>
        <div>
          <h1>{form.name}</h1>
          <span className="bot-key">{form.publicKey}</span>
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
      <Outlet context={{ form, refreshForm } satisfies FormContext} />
    </>
  );
}
