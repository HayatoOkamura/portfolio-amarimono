/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import styles from "./PieChart.module.scss";

type NutritionType = "calories" | "carbohydrates" | "fat" | "protein" | "salt" | "sugar";

const getNutritionColor = (type: NutritionType): string => {
  const colors = {
    calories: "#5B9BD5",      // 青
    carbohydrates: "#70AD47", // 緑
    fat: "#FFC000",          // 黄色
    protein: "#A5A5A5",      // グレー
    salt: "#7B68EE",         // 紫
    sugar: "#ED7D31",        // オレンジ
  };
  return colors[type] || "#03a9f4"; // デフォルトは青
};

const ResponsivePieChart = ({ value, type }: { value: number; type: NutritionType }) => {
  const [radius, setRadius] = useState(70);

  useEffect(() => {
    const resizeHandler = () => {
      const newRadius = Math.min(window.innerWidth * 0.2, 70); // 画面幅に応じて最大半径を調整
      setRadius(newRadius);
    };

    resizeHandler(); // 初回サイズ設定
    window.addEventListener("resize", resizeHandler); // 画面リサイズ時にサイズを再計算
    
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  // 100%を超える場合は0（完全な円）を表示
  const strokeDashoffset = value > 100 
    ? 0 
    : `calc(440 - (440 * ${value}) / 100)`;
  const strokeDasharray = 440;
  const color = getNutritionColor(type);

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
          stroke: color,
        }}
      ></circle>
    </svg>
  );
};

export default ResponsivePieChart;
