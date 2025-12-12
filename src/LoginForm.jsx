// src/LoginForm.jsx
import React, { useState } from "react";
import "./LoginForm.css";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(false);

    if (!email || !password) {
      setError(true);
      setMessage("Both fields are required");
      setLoading(false);
      return;
    }

    try {
      const send = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await send.json();

      if (!send.ok) {
        setError(true);
        setMessage(data.error || data.message || "Login failed");
      } else {
        setError(false);
        setMessage(data.message || "Login successful!");
        // Save token and redirect
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", data.email || "");
          setTimeout(() => navigate("/dashboard"), 300);
        } else {
          // fallback
          setTimeout(() => navigate("/dashboard"), 300);
        }
      }
    } catch (err) {
      setError(true);
      setMessage("An Error Occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <div className="login-group">
          <label>Email or Username</label>
          <input
            type="text"
            placeholder="your@email.com"
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage(null);
            }}
            value={email}
          />
        </div>

        <div className="login-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage(null);
            }}
            value={password}
          />
        </div>

        {message ? (
          <p style={{ color: error ? "red" : "green" }}>{message}</p>
        ) : null}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="login-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
