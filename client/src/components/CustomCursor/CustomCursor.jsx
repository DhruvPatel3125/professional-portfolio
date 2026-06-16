import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Framer Motion Spring settings for lagging lag/inertia effect
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 300, mass: 0.6 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor-active");
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  useEffect(() => {
    const moveCursor = (e) => {
      if (!isVisible) setIsVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Check if mouse is hovering over interactive element
      const target = e.target;
      if (target) {
        const isInteractive = target.closest(
          "a, button, input, select, textarea, [role='button'], [data-interactive='true']"
        );
        setIsHovered(!!isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseDown = () => {
      setClicked(true);
    };

    const handleMouseUp = () => {
      setClicked(false);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={styles.cursorWrapper}>
      {/* Outer Glow Ring (with spring lag) */}
      <motion.div
        className={`${styles.outerRing} ${isHovered ? styles.hoveredRing : ""} ${
          clicked ? styles.clickedRing : ""
        }`}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%"
        }}
      >
        {/* Holographic targeting reticle ticks inside the outer ring when hovering */}
        {isHovered && (
          <>
            <div className={`${styles.crosshairTick} ${styles.tickTop}`} />
            <div className={`${styles.crosshairTick} ${styles.tickBottom}`} />
            <div className={`${styles.crosshairTick} ${styles.tickLeft}`} />
            <div className={`${styles.crosshairTick} ${styles.tickRight}`} />
            <span className={styles.telemetryTag}>SYS_ACTV</span>
          </>
        )}
      </motion.div>

      {/* Inner Dot (follows cursor exactly) */}
      <motion.div
        className={`${styles.innerDot} ${isHovered ? styles.hoveredDot : ""}`}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%"
        }}
      />
    </div>
  );
}
