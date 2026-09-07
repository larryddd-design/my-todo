// src/Dashboard.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import EditModal from "./EditModal";
import CalendarWidget from "./CalendarWidget";

const API_BASE = "https://my-todo-gj8m.onrender.com";

export default function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalTask, setModalTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | alphabetical
  const [filterBy, setFilterBy] = useState("all"); // all | active | completed
  const [actionFeedback, setActionFeedback] = useState(""); // toast-like feedback

  const inputRef = useRef(null);

  /* ✅ MOBILE-SAFE TOKEN LOAD (unchanged) */
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

  /* ✅ Close sidebar when clicking outside on mobile */
  useEffect(() => {
    const closeSidebar = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", closeSidebar);
    return () => window.removeEventListener("resize", closeSidebar);
  }, []);

  /* ✅ Auto-hide action feedback */
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(""), 2500);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const authHeaders = (t) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${t}`,
  });

  /* ✅ LOAD TASKS WITH 401 HANDLING + ID NORMALIZATION (unchanged logic) */
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
      const normalized = (data.tasks || []).map((task) => ({
        ...task,
        id: task.id || task._id,
      }));
      setTasks(normalized);
    } catch (err) {
      console.error("Error loading tasks:", err);
      showFeedback("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }

  /* ✅ ADD TASK (unchanged backend call, better UX feedback) */
  async function handleAddTask() {
    const trimmed = input.trim();
    if (!trimmed || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();

      if (data?.task) {
        setTasks((prev) => [
          { ...data.task, id: data.task.id || data.task._id },
          ...prev,
        ]);
        showFeedback("Task added ✓");
      }
      setInput("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error adding task:", err);
      showFeedback("Failed to add task", "error");
    }
  }

  /* ✅ TOGGLE COMPLETE (unchanged) */
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

  function openEditModal(task) {
    if (!task?.id) return;
    setModalTask(task);
    setModalVisible(true);
  }

  /* ✅ SAVE EDIT (unchanged) */
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
      showFeedback("Task updated ✓");
    } catch (err) {
      console.error("Error editing task:", err);
      showFeedback("Failed to save changes", "error");
    }
  }

  /* ✅ DELETE TASK (unchanged) */
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
        showFeedback("Task deleted ✓");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      showFeedback("Failed to delete task", "error");
    }
  }

  /* ✅ NEW: Clear all completed tasks in one go */
  async function clearCompleted() {
    if (!token) return;
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) {
      showFeedback("No completed tasks to clear");
      return;
    }
    if (!window.confirm(`Delete ${completedTasks.length} completed task(s)?`))
      return;

    try {
      await Promise.all(
        completedTasks.map((t) =>
          fetch(`${API_BASE}/api/tasks/${t.id}`, {
            method: "DELETE",
            headers: authHeaders(token),
          }),
        ),
      );
      setTasks((prev) => prev.filter((t) => !t.completed));
      showFeedback(`Cleared ${completedTasks.length} task(s) ✓`);
    } catch (err) {
      console.error("Error clearing completed:", err);
    }
  }

  function showFeedback(msg) {
    setActionFeedback(msg);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  /* ✅ Filtered + sorted + searched task list */
  const filtered = useMemo(() => {
    let list = tasks
      .filter((t) => t?.id && typeof t.text === "string")
      .filter((t) => t.text.toLowerCase().includes(search.toLowerCase()));

    if (filterBy === "active") list = list.filter((t) => !t.completed);
    if (filterBy === "completed") list = list.filter((t) => t.completed);

    const sorted = [...list];
    if (sortBy === "alphabetical") {
      sorted.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortBy === "oldest") {
      sorted.reverse();
    }
    return sorted;
  }, [tasks, search, sortBy, filterBy]);

  /* ✅ Stats for the header */
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, percent };
  }, [tasks]);

  return (
    <div className={`page-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar onNavigate={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* ✅ MOBILE HEADER with hamburger + stats */}
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
            <h1 className="header-title">Dashboard</h1>
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          {/* ✅ Progress summary */}
          {!loading && tasks.length > 0 && (
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">Total</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending</span>
                <span className="stat-value">{stats.pending}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Done</span>
                <span className="stat-value">{stats.completed}</span>
              </div>
              <div className="stat-item stat-progress">
                <span className="stat-label">Progress</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${stats.percent}%` }}
                  ></div>
                </div>
                <span className="stat-percent">{stats.percent}%</span>
              </div>
            </div>
          )}
        </header>

        {/* ✅ Action feedback toast */}
        {actionFeedback && (
          <div className="action-feedback" role="status">
            {actionFeedback}
          </div>
        )}

        {/* ✅ Input bar */}
        <div className="input-bar">
          <input
            ref={inputRef}
            type="text"
            className="task-input"
            placeholder="Add a new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            aria-label="New task text"
          />
          <button
            className="add-btn"
            onClick={handleAddTask}
            disabled={!input.trim()}
          >
            + Add
          </button>
        </div>

        {/* ✅ Search + filters row (stacks on mobile) */}
        <div className="controls-row">
          <div className="search-wrapper">
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              className="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <div className="filter-group">
            <select
              className="select-control"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              aria-label="Filter tasks"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className="select-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tasks"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alphabetical">A → Z</option>
            </select>
          </div>
        </div>

        <CalendarWidget />

        {/* ✅ Task list */}
        <div className="task-list">
          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Loading your tasks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <h3>
                {search
                  ? "No tasks match your search"
                  : filterBy !== "all"
                    ? `No ${filterBy} tasks`
                    : "No tasks yet"}
              </h3>
              <p>
                {tasks.length === 0
                  ? "Add your first task above to get started!"
                  : "Try adjusting your filters or search."}
              </p>
            </div>
          ) : (
            filtered.map((task) => (
              <div
                className={`task-card ${task.completed ? "is-completed" : ""}`}
                key={task.id}
              >
                <div className="task-left">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={!!task.completed}
                      onChange={() => toggleComplete(task)}
                      aria-label={`Mark "${task.text}" as ${task.completed ? "active" : "completed"}`}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <span className="task-text">{task.text}</span>
                </div>
                <div className="task-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => openEditModal(task)}
                    title="Edit"
                    aria-label={`Edit ${task.text}`}
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
                    aria-label={`Delete ${task.text}`}
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

        {/* ✅ Bulk actions (only shown when there are completed tasks) */}
        {stats.completed > 0 && (
          <div className="bulk-actions">
            <button className="clear-btn" onClick={clearCompleted}>
              Clear {stats.completed} completed task
              {stats.completed !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* ✅ NICER FOOTER */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">✨</span>
              <span>My Todo</span>
            </div>
            <nav className="footer-links">
              <button onClick={() => navigate("/")}>Home</button>
              <button onClick={() => navigate("/dashboard")}>Dashboard</button>
              <button onClick={handleLogout}>Logout</button>
            </nav>
          </div>
          <div className="footer-bottom">
            <p>Stay productive — &copy; {new Date().getFullYear()} My Todo</p>
            <p className="footer-sub">Built with ♥ · All rights reserved</p>
          </div>
        </footer>
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
