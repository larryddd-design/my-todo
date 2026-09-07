// src/Settings.jsx
import React, { useEffect, useState } from "react";
import "./Settings.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const API_BASE = "https://my-todo-gj8m.onrender.com";

export default function Settings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [taskCount, setTaskCount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      navigate("/login");
      return;
    }
    setEmail(localStorage.getItem("userEmail") || "Signed in user");

    fetch(`${API_BASE}/api/tasks`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((d) => setTaskCount((d.tasks || []).length))
      .catch(() => setTaskCount(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(""), 2500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function clearCalendarProgress() {
    if (!window.confirm("Clear all calendar progress marks?")) return;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("todo-calendar-progress-")) localStorage.removeItem(k);
    });
    setFeedback("Calendar progress cleared ✓");
  }

  async function deleteAllTasks() {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (
      !window.confirm(
        "Delete ALL your tasks permanently? This cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.tasks || [];
      await Promise.all(
        list.map((t) =>
          fetch(`${API_BASE}/api/tasks/${t.id || t._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      setFeedback(`Deleted ${list.length} task(s) ✓`);
      setTaskCount(0);
    } catch (err) {
      console.error("Error deleting all tasks:", err);
      setFeedback("Failed to delete tasks");
    }
  }

  return (
    <div className={`page-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar onNavigate={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="header">
          <div className="header-top">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle sidebar"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1 className="header-title">Settings</h1>
          </div>
        </header>

        {feedback && <div className="action-feedback">{feedback}</div>}

        <div className="settings-grid">
          <section className="settings-card">
            <h3>👤 Profile</h3>
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span className="settings-value">{email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Total tasks</span>
              <span className="settings-value">
                {taskCount === null ? "Loading..." : taskCount}
              </span>
            </div>
          </section>

          <section className="settings-card">
            <h3>🧹 Data Management</h3>
            <p className="settings-desc">These actions cannot be undone.</p>
            <div className="settings-buttons">
              <button
                className="settings-btn warning"
                onClick={clearCalendarProgress}
              >
                Clear calendar progress
              </button>
              <button className="settings-btn danger" onClick={deleteAllTasks}>
                Delete all tasks
              </button>
            </div>
          </section>

          <section className="settings-card">
            <h3>🔐 Account</h3>
            <div className="settings-buttons">
              <button className="settings-btn danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>

          <section className="settings-card">
            <h3>ℹ️ About</h3>
            <p className="settings-desc">
              My Todo — stay productive. Version 2.0 (Claire's Edition).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
