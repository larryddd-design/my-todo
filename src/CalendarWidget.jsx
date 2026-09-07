import React, { useEffect, useState } from "react";
import "./CalendarWidget.css";

export default function CalendarWidget() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const monthName = today.toLocaleString("default", { month: "long" });
  const storageKey = `todo-calendar-progress-${year}-${month + 1}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday

  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // Keep only valid dates and remove duplicates
      return [
        ...new Set(
          parsed.filter(
            (d) => Number.isInteger(d) && d >= 1 && d <= daysInMonth,
          ),
        ),
      ].sort((a, b) => a - b);
    } catch {
      return [];
    }
  });

  // Save progress whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedDays));
    } catch (err) {
      console.error("Could not save calendar progress:", err);
    }
  }, [completedDays, storageKey]);

  const completedCount = completedDays.length;
  const percent = daysInMonth
    ? Math.round((completedCount / daysInMonth) * 100)
    : 0;
  const isTodayCompleted = completedDays.includes(todayDate);

  function toggleDay(day) {
    setCompletedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  }

  function markToday() {
    if (!isTodayCompleted) {
      setCompletedDays((prev) => [...prev, todayDate].sort((a, b) => a - b));
    }
  }

  function resetMonth() {
    if (window.confirm(`Reset progress for ${monthName}?`)) {
      setCompletedDays([]);
    }
  }

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <section className="calendar-card">
      <div className="calendar-top">
        <div>
          <h3>Progress Calendar</h3>
          <p className="calendar-sub">
            {monthName} {year}
          </p>
        </div>

        <div className="calendar-stats">
          <span>
            {completedCount} of {daysInMonth} days
          </span>
          <div className="calendar-progress">
            <div
              className="calendar-progress-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <small>{percent}%</small>
        </div>
      </div>

      <div className="calendar-weekdays">
        {weekdays.map((day, index) => (
          <div key={index}>{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {/* Empty cells for correct starting position */}
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-empty" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isDone = completedDays.includes(day);
          const isToday = day === todayDate;

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`calendar-day ${isDone ? "done" : ""} ${isToday ? "today" : ""}`}
              aria-label={`${monthName} ${day}, ${isDone ? "completed" : "not completed"}`}
              aria-pressed={isDone}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="calendar-actions">
        <button
          className="mark-btn"
          onClick={markToday}
          disabled={isTodayCompleted}
        >
          {isTodayCompleted ? "Today Completed ✓" : "Mark Today Complete"}
        </button>

        <button className="clear-btn" onClick={resetMonth}>
          Reset Month
        </button>
      </div>
    </section>
  );
}
