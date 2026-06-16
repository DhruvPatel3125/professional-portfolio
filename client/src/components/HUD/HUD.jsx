import React from "react";
import styles from "./HUD.module.css";

const MATRIX_THEMES = {
  cyan: {
    primary: "#576cbc",
    primaryDark: "#3a4b9c",
    secondary: "#19376d",
    bg: "#030c1b",
    accentCyan: "#00f2fe",
    accentPink: "#ff007f",
    accentPurple: "#7f00ff",
    textSecondary: "#a9c2e6",
    glassBg: "rgba(9, 24, 51, 0.6)",
    glowColor: "rgba(0, 242, 254, 0.2)"
  },
  emerald: {
    primary: "#0f9d58",
    primaryDark: "#0b7642",
    secondary: "#0d3c26",
    bg: "#010f07",
    accentCyan: "#39ff14", // neon green
    accentPink: "#ffd700", // gold
    accentPurple: "#00ffcc", // mint cyan
    textSecondary: "#8fbc8f",
    glassBg: "rgba(1, 24, 11, 0.6)",
    glowColor: "rgba(57, 255, 20, 0.2)"
  },
  nova: {
    primary: "#d53f8c",
    primaryDark: "#b83280",
    secondary: "#5c1d3d",
    bg: "#10020f",
    accentCyan: "#ff007f", // hot pink
    accentPink: "#7f00ff", // purple
    accentPurple: "#ff8008", // neon orange
    textSecondary: "#e2b6d7",
    glassBg: "rgba(32, 2, 31, 0.6)",
    glowColor: "rgba(255, 0, 127, 0.2)"
  },
  quantum: {
    primary: "#dd6b20",
    primaryDark: "#c05621",
    secondary: "#4a2c11",
    bg: "#0d0905",
    accentCyan: "#ff9900", // amber
    accentPink: "#ff5500", // flame orange
    accentPurple: "#38bdf8", // sky blue
    textSecondary: "#e2c9b6",
    glassBg: "rgba(26, 17, 8, 0.6)",
    glowColor: "rgba(255, 153, 0, 0.2)"
  }
};

export default function HUD({ theme, setTheme, scanlinesActive, setScanlinesActive }) {
  
  // Apply CSS Variables theme change
  const applyTheme = (themeName) => {
    const t = MATRIX_THEMES[themeName];
    if (!t) return;

    setTheme(themeName);
    const root = document.documentElement;

    root.style.setProperty("--color-primary", t.primary);
    root.style.setProperty("--color-primary-dark", t.primaryDark);
    root.style.setProperty("--color-secondary", t.secondary);
    root.style.setProperty("--color-bg", t.bg);
    root.style.setProperty("--color-accent-cyan", t.accentCyan);
    root.style.setProperty("--color-accent-pink", t.accentPink);
    root.style.setProperty("--color-accent-purple", t.accentPurple);
    root.style.setProperty("--color-text-secondary", t.textSecondary);
    root.style.setProperty("--glass-bg", t.glassBg);
    root.style.setProperty("--glass-glow-cyan", `0 0 20px ${t.glowColor}`);
  };

  return (
    <div className={styles.hudWrapper}>
      {/* 4 Outer Border Bars */}
      <div className={`${styles.hudLine} ${styles.hudTop}`} />
      <div className={`${styles.hudLine} ${styles.hudBottom}`} />
      <div className={`${styles.hudLine} ${styles.hudLeft}`} />
      <div className={`${styles.hudLine} ${styles.hudRight}`} />

      {/* Grid Corner Telemetries */}
      <div className={`${styles.hudCorner} ${styles.topLeft}`}>
        <div className={styles.cornerTick} />
        <div className={styles.cornerText}>[SYS_INTERFACE_v5.2]</div>
      </div>
      <div className={`${styles.hudCorner} ${styles.topRight}`}>
        <div className={styles.cornerTick} />
        <div className={styles.cornerText}>CORE_SYS: ONLINE</div>
      </div>
      <div className={`${styles.hudCorner} ${styles.bottomLeft}`}>
        <div className={styles.cornerTick} />
        <div className={styles.cornerText}>GPS: 22.3072 N / 73.1812 E</div>
      </div>
      <div className={`${styles.hudCorner} ${styles.bottomRight}`}>
        <div className={styles.cornerTick} />
        <div className={styles.cornerText}>DECRYPT: ENABLED</div>
      </div>

      {/* BOTTOM RIGHT: Cyber theme selection & scanlines customizer */}
      <div className={styles.controlPanel}>
        <div className={styles.panelHeader}>MATRIX_THEME_SELECT</div>
        <div className={styles.themeSelector}>
          {Object.keys(MATRIX_THEMES).map((themeName) => (
            <button
              key={themeName}
              onClick={() => applyTheme(themeName)}
              className={`${styles.themeBtn} ${styles[themeName]} ${
                theme === themeName ? styles.activeTheme : ""
              }`}
              title={`Switch to ${themeName} profile`}
            >
              <div className={styles.orbitRing} />
              <span className={styles.coreDot} />
            </button>
          ))}
        </div>
        
        {/* Hologram Toggle Switch */}
        <button
          onClick={() => setScanlinesActive(!scanlinesActive)}
          className={`${styles.scanlineToggleBtn} ${scanlinesActive ? styles.toggleActive : ""}`}
        >
          <div className={styles.toggleLED} />
          {scanlinesActive ? "CRT_SCANLINES: ONLINE" : "CRT_SCANLINES: STANDBY"}
        </button>
      </div>
    </div>
  );
}
