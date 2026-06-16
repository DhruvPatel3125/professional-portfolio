import React, { useRef, useEffect } from "react";
import styles from "./ParticleBackground.module.css";

const PARTICLE_COUNT = 85;
const MAX_DIST = 140;         // max px distance to draw a connecting line
const MOUSE_RADIUS = 180;     // how far the mouse repels particles
const BASE_SPEED = 0.35;

function hexToRgb(hex) {
  // Check if hex is shorthand or css var or other format
  if (!hex) return "255,255,255";
  // If it's already rgb(a) format
  if (hex.startsWith("rgb")) {
    const match = hex.match(/\d+/g);
    return match ? `${match[0]}, ${match[1]}, ${match[2]}` : "255,255,255";
  }
  
  const cleanHex = hex.trim().replace("#", "");
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return "0, 242, 254"; // default cyan fallback
  }
  return `${r}, ${g}, ${b}`;
}

const getThemeColors = () => {
  const rootStyle = getComputedStyle(document.documentElement);
  const c1 = rootStyle.getPropertyValue("--color-accent-cyan").trim() || "#00f2fe";
  const c2 = rootStyle.getPropertyValue("--color-accent-purple").trim() || "#7f00ff";
  const c3 = rootStyle.getPropertyValue("--color-primary").trim() || "#576cbc";
  const c4 = rootStyle.getPropertyValue("--color-accent-pink").trim() || "#ff007f";
  return [c1, c2, c3, c4];
};

export default function ParticleBackground({ theme }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);

  // Cache colors to prevent style queries in the draw loop
  const themeColorsRef = useRef(["#00f2fe", "#7f00ff", "#576cbc", "#ff007f"]);
  const rgbColorsRef = useRef(["0, 242, 254", "127, 0, 255", "87, 108, 188", "255, 0, 127"]);

  useEffect(() => {
    const colors = getThemeColors();
    themeColorsRef.current = colors;
    rgbColorsRef.current = colors.map(c => hexToRgb(c));
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const makeParticle = (width, height) => {
      const colorIndex = Math.floor(Math.random() * 4);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * BASE_SPEED * 2,
        vy: (Math.random() - 0.5) * BASE_SPEED * 2,
        radius: Math.random() * 1.8 + 0.8,
        colorIndex,
        opacity: Math.random() * 0.5 + 0.4,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        isSpark: false,
        life: 1.0
      };
    };

    const initParticles = () => {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        makeParticle(canvas.width, canvas.height)
      );
    };

    const draw = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const { x: mx, y: my } = mouse.current;
      
      const themeColors = themeColorsRef.current;
      const rgbColors = rgbColorsRef.current;

      // update & draw each particle
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // If it is a click spark, update lifecycle
        if (p.isSpark) {
          p.life -= 0.025; // fade out speed
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }

        // mouse repulsion (only for standard particles)
        if (!p.isSpark) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
            p.vx += (dx / dist) * force * 0.5;
            p.vy += (dy / dist) * force * 0.5;
          }

          // damping so particles don't fly off indefinitely
          p.vx *= 0.99;
          p.vy *= 0.99;

          // clamp speed
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 1.5) {
            p.vx = (p.vx / speed) * 1.5;
            p.vy = (p.vy / speed) * 1.5;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // wrap around edges (for standard particles)
        if (!p.isSpark) {
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;
        }

        // pulsing opacity
        p.pulsePhase += p.pulseSpeed;
        const pulse = Math.sin(p.pulsePhase) * 0.2 + 0.8;
        const currentOpacity = p.isSpark 
          ? p.life * p.opacity 
          : p.opacity * pulse;

        const rgb = rgbColors[p.colorIndex];

        // draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isSpark ? p.radius : p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${currentOpacity})`;
        ctx.fill();

        // tiny glow halo
        const glowRadius = p.isSpark ? p.radius * 3 : p.radius * 5 * pulse;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        glow.addColorStop(0, `rgba(${rgb}, ${0.15 * currentOpacity})`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // draw connecting lines to nearby particles (only standard particles connect)
        if (!p.isSpark) {
          for (let j = i - 1; j >= 0; j--) {
            const q = particles[j];
            if (q.isSpark) continue;

            const ldx = p.x - q.x;
            const ldy = p.y - q.y;
            const lDist = Math.sqrt(ldx * ldx + ldy * ldy);

            if (lDist < MAX_DIST) {
              const alpha = (1 - lDist / MAX_DIST) * 0.25;
              const qRgb = rgbColors[q.colorIndex];

              const grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
              grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
              grad.addColorStop(1, `rgba(${qRgb}, ${alpha})`);

              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = grad;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    animFrameRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      resize();
      initParticles();
    };

    const handleMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    // Click sparks launcher
    const handleMouseClick = (e) => {
      const mx = e.clientX;
      const my = e.clientY;

      for (let k = 0; k < 12; k++) {
        const colorIndex = Math.floor(Math.random() * 4);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1.2;

        particlesRef.current.push({
          x: mx,
          y: my,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.5 + 0.6,
          colorIndex,
          opacity: Math.random() * 0.4 + 0.6,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.05,
          isSpark: true,
          life: 1.0
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleMouseClick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleMouseClick);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

