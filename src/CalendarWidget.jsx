import React, { useState } from "react";
import "./CalendarWidget.css";

export default function CalendarWidget() {
  const today = new Date();
  const [completedDays, setCompletedDays] = useState([]);

  const markToday = () => {
    const todayDate = today.getDate();
    if (!completedDays.includes(todayDate)) {
      setCompletedDays([...completedDays, todayDate]);
    }
  };

  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="calendar-card">
      <h3>Progress Calendar</h3>

      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isDone = completedDays.includes(day);
          return (
            <div key={day} className={`calendar-day ${isDone ? "done" : ""}`}>
              {day}
            </div>
          );
        })}
      </div>

      <button className="mark-btn" onClick={markToday}>
        Mark Today Complete
      </button>
    </div>
  );
}
