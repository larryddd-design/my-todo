import React, { useState } from "react";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-menu-btn" onClick={() => setOpen(!open)}>
        ☰
      </div>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h2 className="logo">Tasks</h2>

        <nav>
          <a href="#" className="active">
            Dashboard
          </a>
          {/* <a href="#">My Tasks</a>
          <a href="#">Settings</a>
          <a href="#">Help</a> */}
        </nav>

        <div className="sidebar-footer">
          <p>© 2025</p>
        </div>
      </aside>
    </>
  );
}
