import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import style from "./About.module.css";
import aboutImage from "/about/aboutImage.png";

export default function About() {
  const [activeTab, setActiveTab] = useState("profile");

  // 3D Portrait Rotation mouse tracker for About portrait
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 55 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const devMetrics = [
    { title: "SYSTEM_ARCHITECTURE", score: 92, glow: "var(--color-accent-cyan)" },
    { title: "UI_ORCHESTRATION", score: 95, glow: "var(--color-accent-pink)" },
    { title: "BACKEND_PIPELINES", score: 90, glow: "var(--color-accent-purple)" }
  ];

  return (
    <motion.section 
      className={style.container} 
      id="about"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
    >
      <h2 className={style.title}>System // Diagnostics</h2>
      
      <div className={style.contentGrid}>
        
        {/* LEFT COLUMN: 3D Portrait & Metrics */}
        <div className={style.leftCol}>
          <motion.div 
            className={style.imageFrameWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          >
            {/* Decors */}
            <div className={`${style.cornerTick} ${style.tl}`} />
            <div className={`${style.cornerTick} ${style.tr}`} />
            <div className={`${style.cornerTick} ${style.bl}`} />
            <div className={`${style.cornerTick} ${style.br}`} />
            <div className={style.gridBackground} />
            
            <div className={style.imageContainer} style={{ transform: "translateZ(30px)" }}>
              <img 
                src={aboutImage} 
                alt="Dhruv Patel Diagnostic Portrait" 
                className={style.aboutImage}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1534972195531-d756b9bda9f2?w=500&auto=format&fit=crop";
                }}
              />
            </div>
            <div className={style.telemetryOverlay} style={{ transform: "translateZ(40px)" }}>
              <span>DHRUV_PATEL_ID: DP-3125</span>
              <span>BIO_SYNC: 100%</span>
            </div>
          </motion.div>

          {/* Core capability metrics */}
          <div className={style.metricsWrapper}>
            <div className={style.terminalHeader}>CORE_CAPABILITIES</div>
            {devMetrics.map((metric) => (
              <div key={metric.title} className={style.metricItem}>
                <div className={style.metricLabelRow}>
                  <span className={style.metricName}>{metric.title}</span>
                  <span className={style.metricScore} style={{ color: metric.glow }}>{metric.score}%</span>
                </div>
                <div className={style.barTrack}>
                  <div 
                    className={style.barFill} 
                    style={{ width: `${metric.score}%`, backgroundColor: metric.glow, boxShadow: `0 0 10px ${metric.glow}` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Code Terminal */}
        <div className={style.rightCol}>
          <div className={style.terminalWindow}>
            {/* Terminal Header Chrome */}
            <div className={style.terminalWindowHeader}>
              <div className={style.chromeBtns}>
                <span className={style.chromeBtn} />
                <span className={style.chromeBtn} />
                <span className={style.chromeBtn} />
              </div>
              <span className={style.terminalTitle}>dpatel@system-shell:~</span>
            </div>

            {/* Terminal Tabs */}
            <div className={style.terminalTabs}>
              <button
                className={`${style.tabBtn} ${activeTab === "profile" ? style.activeTab : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                [01] PROFILE_INIT
              </button>
              <button
                className={`${style.tabBtn} ${activeTab === "stack" ? style.activeTab : ""}`}
                onClick={() => setActiveTab("stack")}
              >
                [02] TECH_STACK_CORE
              </button>
              <button
                className={`${style.tabBtn} ${activeTab === "infra" ? style.activeTab : ""}`}
                onClick={() => setActiveTab("infra")}
              >
                [03] INFRASTRUCTURE
              </button>
            </div>

            {/* Terminal Screen Console */}
            <div className={style.terminalBody}>
              <div className={style.scanlines} />
              
              {activeTab === "profile" && (
                <div className={style.tabContent}>
                  <div className={style.consoleInput}>$ cat profile_summary.log</div>
                  <p className={style.consoleText}>
                    I am a Full-Stack Engineer specialized in designing scalable, low-latency, 
                    and highly responsive web systems. I bridge clean UI engineering with complex 
                    backend architecture to build seamless digital assets.
                  </p>
                  
                  <div className={style.logsContainer}>
                    <div className={style.logRow}><span className={style.okLabel}>[OK]</span> BOOT_SEQUENCE: COMPLETE</div>
                    <div className={style.logRow}><span className={style.okLabel}>[OK]</span> DB_CLUSTER: READY // VADODARA_REGION</div>
                    <div className={style.logRow}><span className={style.okLabel}>[OK]</span> REALTIME_SOCKETS: MONITORING_ACTIVE</div>
                    <div className={style.logRow}><span className={style.infoLabel}>[INFO]</span> STATUS: ACTIVE_FOR_HIRING</div>
                  </div>
                </div>
              )}

              {activeTab === "stack" && (
                <div className={style.tabContent}>
                  <div className={style.consoleInput}>$ list --specializations --full</div>
                  
                  <div className={style.techCategory}>
                    <span className={style.categoryTitle}>// FRONTEND_ENGINEERING</span>
                    <p className={style.categoryDesc}>React 19, Redux Toolkit, Framer Motion, Responsive UX, Performance Optimization.</p>
                  </div>

                  <div className={style.techCategory}>
                    <span className={style.categoryTitle}>// BACKEND_ARCHITECTURE</span>
                    <p className={style.categoryDesc}>Node.js, Express, RESTful APIs, Redis/Bull Queue job schedulers, Socket.IO channels.</p>
                  </div>

                  <div className={style.techCategory}>
                    <span className={style.categoryTitle}>// DATA_STORE</span>
                    <p className={style.categoryDesc}>MongoDB aggregation pipelines, indexes, Supabase storage, PostgreSQL configurations.</p>
                  </div>
                </div>
              )}

              {activeTab === "infra" && (
                <div className={style.tabContent}>
                  <div className={style.consoleInput}>$ get-infrastructure --status</div>
                  <div className={style.infraCodeBlock}>
                    <div className={style.infraRow}><span className={style.blueAccent}>SOCKET_POOL:</span> [CONNECT: OK] 100/100 channels active</div>
                    <div className={style.infraRow}><span className={style.blueAccent}>BACKGROUND_WORKERS:</span> [REDIS_BULL_WORKERS: STANDBY]</div>
                    <div className={style.infraRow}><span className={style.blueAccent}>SECURITY:</span> [JWT_AUTH: PARALLEL] cryptographically signed</div>
                    <div className={style.infraRow}><span className={style.blueAccent}>AGGREGATIONS:</span> [MONGO_PIPELINE: MEMORY_OPTIMIZED]</div>
                  </div>
                  <div className={style.systemStatsRow}>
                    SYSTEM_STABILITY: <span className={style.okText}>99.98% uptime</span>
                  </div>
                </div>
              )}

              <div className={style.consolePromptRow}>
                <span className={style.promptText}>guest@dhruv-patel:~$</span>
                <span className={style.blinkingCursor} />
              </div>

            </div>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
