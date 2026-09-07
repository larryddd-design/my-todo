// src/ReminderManager.jsx
import { useEffect, useRef, useState } from "react";
import "./ReminderManager.css";

const API_BASE = "https://my-todo-gj8m.onrender.com";

export default function ReminderManager() {
  const [banners, setBanners] = useState([]);
  const remindedRef = useRef(new Set());
  const audioCtxRef = useRef(null);

  // Play a beep sound using Web Audio API (no audio file needed)
  function playBeep() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn("Beep failed:", err);
    }
  }

  // Show an in-app banner toast
  function showBanner(title, body) {
    const id = Date.now() + Math.random();
    setBanners((prev) => [...prev, { id, title, body }]);
    setTimeout(() => {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    }, 8000);
  }

  // Fire the browser notification
  function fireNotification(task, minutesLeft) {
    const title = minutesLeft <= 0 ? "⏰ Task Due Now!" : "⏰ Task Due Soon";
    const body = `"${task.text}" — ${
      minutesLeft <= 0
        ? "This task is due now."
        : `Due in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`
    }`;

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "https://api.iconify.design/mdi:bell-ring.svg?color=%236a5acd",
        });
      } catch (e) {
        // Ignore notification errors
      }
    }

    // Beep sound
    playBeep();

    // In-app banner
    showBanner(title, `${task.text}`);
  }

  // Request notification permission on first load
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Small delay so it doesn't pop immediately on page load
      const t = setTimeout(() => {
        Notification.requestPermission();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Main reminder loop — checks every 60 seconds
  useEffect(() => {
    async function checkReminders() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const tasks = data.tasks || [];

        const now = new Date();
        const WINDOW_MINUTES = 5; // Remind up to 5 minutes before

        for (const rawTask of tasks) {
          const task = { ...rawTask, id: rawTask.id || rawTask._id };

          // Skip completed, no due date, or already reminded
          if (task.completed || !task.dueDate) continue;
          if (remindedRef.current.has(task.id)) continue;

          const dueDate = new Date(task.dueDate);
          const diffMs = dueDate.getTime() - now.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);

          // Trigger when: overdue OR due within 5 minutes
          if (diffMs <= 0) {
            // Overdue / due now
            fireNotification(task, 0);
            remindedRef.current.add(task.id);
          } else if (diffMs <= WINDOW_MINUTES * 60000) {
            // Due within the warning window
            fireNotification(task, diffMinutes);
            remindedRef.current.add(task.id);
          }
        }

        // Clear reminded set for tasks that got completed (so they can re-arm if un-done)
        const activeIds = new Set(
          tasks.filter((t) => !t.completed).map((t) => t.id || t._id),
        );
        for (const id of remindedRef.current) {
          if (!activeIds.has(id)) remindedRef.current.delete(id);
        }
      } catch (err) {
        // Silently fail — don't spam errors
      }
    }

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="reminder-container" aria-live="polite">
      {banners.map((b) => (
        <div key={b.id} className="reminder-banner">
          <div className="reminder-icon">🔔</div>
          <div className="reminder-text">
            <strong>{b.title}</strong>
            <p>{b.body}</p>
          </div>
          <button
            className="reminder-close"
            onClick={() =>
              setBanners((prev) => prev.filter((x) => x.id !== b.id))
            }
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
