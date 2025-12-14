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
    if (!token) navigate("/login");
    else loadTasks();
  }, []);

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
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data.task : t)));
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  }

  function openEditModal(task) {
    setModalTask(task);
    setModalVisible(true);
  }

  async function saveEdit(newText) {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${modalTask._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ text: newText }),
      });
      const data = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t._id === modalTask._id ? data.task : t))
      );
      setModalVisible(false);
    } catch (err) {
      console.error("Error editing task:", err);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  const filtered = tasks.filter((t) =>
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
              <div className="task-card" key={task._id}>
                <div className="task-left">
                  <input
                    type="checkbox"
                    checked={task.completed}
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
                    onClick={() => deleteTask(task._id)}
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
