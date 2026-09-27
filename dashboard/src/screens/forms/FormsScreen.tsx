import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { FormDef } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { PageSpinner } from "../../components/ui/Spinner";
import { CreateFormModal } from "./CreateFormModal";

export function FormsScreen() {
  const [forms, setForms] = useState<FormDef[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api<{ forms: FormDef[] }>("/api/forms").then((data) => setForms(data.forms));
  }, []);

  if (!forms) return <PageSpinner />;

  return (
    <>
      <div className="page-head">
        <h1>Forms</h1>
        <Button onClick={() => setShowCreate(true)}>New form</Button>
      </div>

      {forms.length === 0 ? (
        <div className="empty">
          <h3>Create your first form</h3>
          <Button onClick={() => setShowCreate(true)}>New form</Button>
        </div>
      ) : (
        <div className="bot-grid">
          {forms.map((form) => (
            <Link key={form.id} to={`/forms/${form.id}`} className="card bot-card">
              <div className="bot-card-head">
                <span className="bot-chip" style={{ background: form.themeColor }}>
                  {form.name[0]?.toUpperCase()}
                </span>
                <h3>{form.name}</h3>
              </div>
              <div className="bot-card-meta">
                <span>
                  <strong>{form.fields.length}</strong> fields
                </span>
                <span>
                  <strong>{form._count?.submissions ?? 0}</strong> submissions
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateFormModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
