import { useState, useEffect } from "react";
import type { PawnForm } from "../../lib/sell";

interface SellDeviceStatusProps {
  form: PawnForm;
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void;
  onCompleteChange: (complete: boolean) => void;
  compact?: boolean;
}

function isDeviceStatusComplete(form: PawnForm): boolean {
  if (!form.deviceStatusChosen) return false;
  if (!form.isWorking) return true;
  if (form.hasIssues === false) return true;
  if (form.hasIssues === true) {
    return (form.issuesNote || form.description).trim().length >= 3;
  }
  return false;
}

export default function SellDeviceStatus({
  form,
  updateForm,
  onCompleteChange,
  compact,
}: SellDeviceStatusProps) {
  const [issuesDraft, setIssuesDraft] = useState(form.issuesNote);

  useEffect(() => {
    onCompleteChange(isDeviceStatusComplete(form));
  }, [form, onCompleteChange]);

  useEffect(() => {
    if (form.hasIssues === true) {
      setIssuesDraft(form.issuesNote || "");
    }
  }, [form.hasIssues, form.issuesNote]);

  function pickWorking(working: boolean) {
    updateForm("deviceStatusChosen", true);
    updateForm("isWorking", working);
    updateForm("hasIssues", null);
    updateForm("issuesNote", "");
    setIssuesDraft("");
    if (!working) {
      updateForm("condition", 0);
      return;
    }
    updateForm("condition", 4);
  }

  function pickIssues(hasIssues: boolean) {
    updateForm("hasIssues", hasIssues);
    if (!hasIssues) {
      updateForm("condition", 4);
      updateForm("issuesNote", "");
      setIssuesDraft("");
      return;
    }
    updateForm("condition", 2);
  }

  function saveIssuesNote(note: string) {
    setIssuesDraft(note);
    updateForm("issuesNote", note);
    const trimmed = note.trim();
    if (trimmed.length >= 3) {
      const prefix = trimmed.startsWith("Issues:") ? trimmed : `Issues: ${trimmed}`;
      if (!form.description.trim() || form.description.startsWith("Issues:")) {
        updateForm("description", prefix);
      }
    }
  }

  function resetStatus() {
    updateForm("deviceStatusChosen", false);
    updateForm("hasIssues", null);
    updateForm("issuesNote", "");
    setIssuesDraft("");
  }

  const complete = isDeviceStatusComplete(form);
  const showIssues = form.deviceStatusChosen && form.isWorking;
  const showExplain = showIssues && form.hasIssues === true;

  const statusLabel = !form.deviceStatusChosen
    ? "Tap Working or Not Working to start"
    : !form.isWorking
      ? "Not working — parts / repair value"
      : form.hasIssues === false
        ? "Working with no issues"
        : form.hasIssues === true
          ? complete
            ? "Working — issues noted"
            : "Describe the issues to continue"
          : "Any issues with the device?";

  return (
    <div className={`sell-device-status ${compact ? "sell-device-status--compact" : ""}`}>
      <div className="sell-device-status__head">
        <div>
          <p className="sell-device-status__kicker">Device functionality</p>
          <h2 className="sell-device-status__title">Does your item work?</h2>
          <p className="sell-device-status__sub">{statusLabel}</p>
        </div>
        {form.deviceStatusChosen && (
          <button type="button" onClick={resetStatus} className="sell-device-status__reset">
            Reset
          </button>
        )}
      </div>

      <div className="sell-device-status__row">
        <button
          type="button"
          onClick={() => pickWorking(true)}
          className={`sell-device-status__btn sell-device-status__btn--working ${
            form.deviceStatusChosen && form.isWorking ? "sell-device-status__btn--active" : ""
          }`}
        >
          <span className="sell-device-status__btn-icon">✓</span>
          <span className="sell-device-status__btn-label">Working</span>
          <span className="sell-device-status__btn-hint">Powers on &amp; functions</span>
        </button>
        <button
          type="button"
          onClick={() => pickWorking(false)}
          className={`sell-device-status__btn sell-device-status__btn--broken ${
            form.deviceStatusChosen && !form.isWorking ? "sell-device-status__btn--active" : ""
          }`}
        >
          <span className="sell-device-status__btn-icon">✗</span>
          <span className="sell-device-status__btn-label">Not Working</span>
          <span className="sell-device-status__btn-hint">Dead, damaged, or parts only</span>
        </button>
      </div>

      {showIssues && (
        <div className="sell-device-status__followup">
          <p className="sell-device-status__question">Any issues?</p>
          <div className="sell-device-status__row sell-device-status__row--compact">
            <button
              type="button"
              onClick={() => pickIssues(false)}
              className={`sell-device-status__pill ${form.hasIssues === false ? "sell-device-status__pill--active" : ""}`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => pickIssues(true)}
              className={`sell-device-status__pill sell-device-status__pill--warn ${form.hasIssues === true ? "sell-device-status__pill--active" : ""}`}
            >
              Yes
            </button>
          </div>
        </div>
      )}

      {showExplain && (
        <div className="sell-device-status__followup">
          <label className="sell-device-status__question" htmlFor="sell-issues-note">
            What issues should we know about?
          </label>
          <textarea
            id="sell-issues-note"
            value={issuesDraft}
            onChange={(e) => saveIssuesNote(e.target.value)}
            rows={3}
            placeholder="e.g. Cracked screen but touch works. Battery holds ~2 hours. Missing charger."
            className="sell-device-status__textarea"
          />
          <p className="sell-device-status__note-hint">
            {issuesDraft.trim().length < 3
              ? "Add a few words so we can price it accurately."
              : "Got it — you can continue to AI valuation."}
          </p>
        </div>
      )}

      {complete && (
        <p className="sell-device-status__ready">
          {!form.isWorking
            ? "Ready for evaluation — non-working pricing applies."
            : form.hasIssues
              ? "Ready for evaluation — we'll factor in your notes."
              : "Ready for evaluation — working, no issues."}
        </p>
      )}
    </div>
  );
}