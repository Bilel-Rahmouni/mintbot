import { useState } from "react";
import type { FormFieldDef, FormSubmissionRow } from "../../lib/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";

interface Props {
  submission: FormSubmissionRow;
  fields: FormFieldDef[];
  onDelete: () => Promise<void>;
  onClose: () => void;
}

function formatValue(value: string | boolean | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value?.toString().trim() || "—";
}

export function SubmissionModal({ submission, fields, onDelete, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const location = [submission.city, submission.country].filter(Boolean).join(", ");

  return (
    <Modal title={new Date(submission.createdAt).toLocaleString()} onClose={onClose}>
      <div className="submission-detail">
        {fields.map((field) => (
          <div key={field.id} className="submission-detail-row">
            <span className="field-label">{field.label}</span>
            <span className="submission-detail-value">{formatValue(submission.data[field.id])}</span>
          </div>
        ))}
        {location && (
          <div className="submission-detail-row">
            <span className="field-label">Location</span>
            <span className="submission-detail-value">{location}</span>
          </div>
        )}
        {submission.pageUrl && (
          <div className="submission-detail-row">
            <span className="field-label">Page</span>
            <span className="submission-detail-value" style={{ wordBreak: "break-all" }}>
              {submission.pageUrl}
            </span>
          </div>
        )}
      </div>
      <div className="modal-actions">
        <Button variant="danger" onClick={remove} loading={busy}>
          Delete
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
