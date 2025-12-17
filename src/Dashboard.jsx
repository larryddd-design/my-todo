// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
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

  /* ✅ MOBILE-SAFE TOKEN LOAD */
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

  const authHeaders = (t) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${t}`,
  });

  /* ✅ LOAD TASKS WITH 401 HANDLING + ID NORMALIZATION */
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
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask() {
    if (!input.trim() || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      if (data?.task) {
        setTasks((prev) => [
          { ...data.task, id: data.task.id || data.task._id },
          ...prev,
        ]);
      }

      setInput("");
    } catch (err) {
      console.error("Error adding task:", err);
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
            : t
        )
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
            : t
        )
      );
      setModalVisible(false);
    } catch (err) {
      console.error("Error editing task:", err);
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
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  const filtered = tasks
    .filter((t) => t?.id && typeof t.text === "string")
    .filter((t) => t.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <header className="header">
          <h1>Dashboard</h1>
        </header>

        <div className="input-bar">
          <input
            type="text"
            placeholder="Add a new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          />
          <button onClick={handleAddTask}>Add</button>
        </div>

        <input
          className="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CalendarWidget />

        <div className="task-list">
          {loading ? (
            <p>Loading...</p>
          ) : filtered.length === 0 ? (
            <p>No tasks found.</p>
          ) : (
            filtered.map((task) => (
              <div className="task-card" key={task.id}>
                <div className="task-left">
                  <input
                    type="checkbox"
                    checked={!!task.completed}
                    onChange={() => toggleComplete(task)}
                  />
                  <span className={task.completed ? "completed" : ""}>
                    {task.text}
                  </span>
                </div>
                <div className="task-actions">
                  <button onClick={() => openEditModal(task)}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="footer">
          <p>✨ Stay productive — 2025</p>
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
