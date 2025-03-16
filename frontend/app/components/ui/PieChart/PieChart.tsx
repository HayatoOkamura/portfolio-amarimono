/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import styles from "./PieChart.module.scss";

const ResponsivePieChart = ({ value }: { value: number }) => {
  const [radius, setRadius] = useState(70);

  useEffect(() => {
    const resizeHandler = () => {
      const newRadius = Math.min(window.innerWidth * 0.2, 70); // 画面幅に応じて最大半径を調整
      setRadius(newRadius);
    };

    resizeHandler(); // 初回サイズ設定
    window.addEventListener("resize", resizeHandler); // 画面リサイズ時にサイズを再計算
    console.log("circle", value);
    
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  const strokeDashoffset = `calc(440 - (440 * ${value}) / 100)`; // パーセントに基づく偏差量
  const strokeDasharray = 440;

  return (
    <svg className={styles.svg} viewBox="0 0 150 150" style={{ width: "100%", height: "auto" }}>
      <circle className={styles.base} cx="75" cy="75" r={radius}></circle>
      <circle
        className={styles.line}
        cx="75"
        cy="75"
        r={radius}
        style={{
          strokeDashoffset,
          strokeDasharray,
        }}
      ></circle>
    </svg>
  );
};

export default ResponsivePieChart;
