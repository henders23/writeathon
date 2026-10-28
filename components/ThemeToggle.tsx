"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "./Icons";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setDark(attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  function flip() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("writeathon.theme", next ? "dark" : "light");
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }

  return (
    <button className="round-btn" onClick={flip} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
