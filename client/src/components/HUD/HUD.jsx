import React from "react";
import styles from "./HUD.module.css";

export default function HUD() {
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
    </div>
  );
}
