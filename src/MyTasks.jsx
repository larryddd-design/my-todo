// src/MyTasks.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./MyTasks.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import EditModal from "./EditModal";

const API_BASE = "https://my-todo-gj8m.onrender.com";

export default function MyTasks() {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("low");
  const [dueDate, setDueDate] = useState("");

  const [tab, setTab] = useState("all"); // all | active | completed | overdue
  const [sortBy, setSortBy] = useState("dueDate");

  const [modalTask, setModalTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(""), 2500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const authHeaders = (t) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${t}`,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      navigate("/login");
    } else {
      setToken(storedToken);
      loadTasks(storedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function loadTasks(t) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: authHeaders(t),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const data = await res.json();
      setTasks(
        (data.tasks || []).map((task) => ({
          ...task,
          id: task.id || task._id,
        })),
      );
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim() || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          text: text.trim(),
          priority,
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (data?.task) {
        setTasks((prev) => [
          { ...data.task, id: data.task.id || data.task._id },
          ...prev,
        ]);
        setFeedback("Task added ✓");
      }
      setText("");
      setDueDate("");
      setPriority("low");
    } catch (err) {
      console.error("Error adding task:", err);
      setFeedback("Failed to add task");
    }
  }

  async function toggleComplete(task) {
    if (!task?.id || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...data.task, id: data.task.id || data.task._id }
            : t,
        ),
      );
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  }

  async function deleteTask(id) {
    if (!id || !token) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setFeedback("Task deleted ✓");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  function openEdit(task) {
    setModalTask(task);
    setModalVisible(true);
  }

  async function saveEdit(newText) {
    if (!modalTask?.id || !token) {
      setModalVisible(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${modalTask.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ text: newText }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === modalTask.id
            ? { ...data.task, id: data.task.id || data.task._id }
            : t,
        ),
      );
      setModalVisible(false);
      setFeedback("Task updated ✓");
    } catch (err) {
      console.error("Error editing task:", err);
    }
  }

  const isOverdue = (task) =>
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => t?.id && typeof t.text === "string");
    if (tab === "active") list = list.filter((t) => !t.completed);
    if (tab === "completed") list = list.filter((t) => t.completed);
    if (tab === "overdue") list = list.filter((t) => isOverdue(t));

    const weight = { high: 3, medium: 2, low: 1 };
    if (sortBy === "priority") {
      list = [...list].sort(
        (a, b) => (weight[b.priority] || 1) - (weight[a.priority] || 1),
      );
    } else if (sortBy === "dueDate") {
      list = [...list].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }
    return list;
  }, [tasks, tab, sortBy]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

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
            <h1 className="header-title">My Tasks</h1>
          </div>
        </header>

        {feedback && <div className="action-feedback">{feedback}</div>}

        {/* Add form with priority + due date */}
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="task-input"
            placeholder="Add a new task..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select
            className="select-control"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            className="date-input"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date and time"
          />
          <button className="add-btn" type="submit" disabled={!text.trim()}>
            + Add
          </button>
        </form>

        {/* Tabs + sort */}
        <div className="tabs-row">
          <div className="tabs">
            {["all", "active", "completed", "overdue"].map((t) => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <select
            className="select-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="dueDate">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        <div className="task-list">
          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Loading your tasks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks here</h3>
              <p>Add a task above or switch tabs.</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div
                className={`task-card ${task.completed ? "is-completed" : ""} ${isOverdue(task) ? "is-overdue" : ""}`}
                key={task.id}
              >
                <div className="task-left">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={!!task.completed}
                      onChange={() => toggleComplete(task)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <div className="task-info">
                    <span className="task-text">{task.text}</span>
                    <div className="task-meta">
                      <span className={`badge ${task.priority || "low"}`}>
                        {(task.priority || "low").toUpperCase()}
                      </span>
                      {task.dueDate && (
                        <span
                          className={`due-date ${isOverdue(task) ? "overdue" : ""}`}
                        >
                          {isOverdue(task) ? "Overdue · " : "Due "}
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => openEdit(task)}
                    title="Edit"
                    aria-label="Edit task"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => deleteTask(task.id)}
                    title="Delete"
                    aria-label="Delete task"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <EditModal
        visible={modalVisible}
        task={modalTask}
        onClose={() => setModalVisible(false)}
        onSave={saveEdit}
      />
    </div>
  );
}
