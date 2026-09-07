import React, { useEffect, useRef, useState } from "react";
import "./EditModal.css";

export default function EditModal({ visible, onClose, task, onSave }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  /*
    ✅ Fix:
    Sync input value every time the modal opens or task changes.
    This prevents the old task text from staying in the input.
  */
  useEffect(() => {
    if (visible && task) {
      setValue(task.text || "");
      setSaving(false);

      // Focus input after modal animation starts
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [visible, task]);

  /*
    ✅ Extra UX:
    - Close modal with Escape key
    - Lock background scroll while modal is open
  */
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [visible, onClose, saving]);

  if (!visible || !task) return null;

  const trimmedValue = value.trim();
  const originalValue = (task.text || "").trim();

  const canSave =
    trimmedValue.length > 0 && trimmedValue !== originalValue && !saving;

  async function handleSave() {
    if (!canSave) return;

    setSaving(true);

    try {
      await onSave(trimmedValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <div className="modal-header">
          <h3 id="edit-modal-title">Edit Task</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          className="modal-input"
          value={value}
          placeholder="Edit your task..."
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
        />

        <p className="modal-hint">Press Enter to save · Esc to cancel</p>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="modal-btn save"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
