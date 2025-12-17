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

  const token = localStorage.getItem("token");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      loadTasks();
    }
  }, [token, navigate]);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask() {
    if (!input.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
      setInput("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  }

  async function toggleComplete(task) {
    if (!task || !task.id) {
      console.warn("Cannot toggle: task has no id", task);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) {
        console.error("Toggle failed:", res.status);
        return;
      }
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  }

  // FIXED: the typo was here
  function openEditModal(task) {
    if (!task || !task.id) {
      console.warn("Cannot edit: task has no id", task);
      return;
    }
    setModalTask(task); // ← Correctly set the task
    setModalVisible(true); // ← Open the modal
  }

  async function saveEdit(newText) {
    if (!modalTask || !modalTask.id) {
      console.warn("Cannot save edit: missing task id");
      setModalVisible(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${modalTask.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ text: newText }),
      });
      if (!res.ok) {
        console.error("Edit failed:", res.status);
        return;
      }
      const data = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === modalTask.id ? data.task : t))
      );
      setModalVisible(false);
    } catch (err) {
      console.error("Error editing task:", err);
    }
  }

  async function deleteTask(id) {
    if (!id) {
      console.warn("Cannot delete: missing id");
      return;
    }
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  // Filter valid tasks first, then apply search
  const validTasks = tasks.filter(
    (t) => t && t.id && typeof t.text === "string"
  );
  const filtered = validTasks.filter((t) =>
    t.text.toLowerCase().includes(search.toLowerCase())
  );

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
