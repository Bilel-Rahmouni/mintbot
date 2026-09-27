import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import type { FormSubmissionRow } from "../../lib/types";
import type { FormContext } from "./FormScreen";
import { PageSpinner } from "../../components/ui/Spinner";
import { SubmissionModal } from "./SubmissionModal";

export function SubmissionsTab() {
  const { form } = useOutletContext<FormContext>();
  const [submissions, setSubmissions] = useState<FormSubmissionRow[] | null>(null);
  const [selected, setSelected] = useState<FormSubmissionRow | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ submissions: FormSubmissionRow[] }>(
      `/api/forms/${form.id}/submissions`
    );
    setSubmissions(data.submissions);
  }, [form.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!submissions) return <PageSpinner />;

  if (submissions.length === 0) {
    return (
      <div className="empty">
        <h3>No submissions yet</h3>
      </div>
    );
  }

  const columns = form.fields.slice(0, 3);

  const remove = async (id: string) => {
    await api(`/api/forms/${form.id}/submissions/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              {columns.map((f) => (
                <th key={f.id}>{f.label}</th>
              ))}
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} onClick={() => setSelected(s)}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                {columns.map((f) => (
                  <td key={f.id} className="table-clip">
                    {s.data[f.id] === true ? "Yes" : s.data[f.id] === false ? "No" : String(s.data[f.id] ?? "—") || "—"}
                  </td>
                ))}
                <td style={{ whiteSpace: "nowrap" }}>
                  {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <SubmissionModal
          submission={selected}
          fields={form.fields}
          onDelete={() => remove(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
