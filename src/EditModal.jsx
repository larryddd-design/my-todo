import React, { useState } from "react";
import "./EditModal.css";

export default function EditModal({ visible, onClose, task, onSave }) {
  const [value, setValue] = useState(task?.text || "");

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Task</h3>

        <input
          className="modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn save" onClick={() => onSave(value)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
