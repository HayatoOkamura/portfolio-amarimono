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
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const resizeHandler = () => {
      const newRadius = Math.min(window.innerWidth * 0.2, 70); // 画面幅に応じて最大半径を調整
      setRadius(newRadius);
    };

    resizeHandler(); // 初回サイズ設定
    window.addEventListener("resize", resizeHandler); // 画面リサイズ時にサイズを再計算
    
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  // 100%を超える場合は100%として扱う
  const normalizedValue = Math.min(value, 100);
  const strokeDashoffset = circumference * (1 - normalizedValue / 100);
  const color = getNutritionColor(type);

  // デバッグログ
  console.log('PieChart Debug:', {
    value,
    type,
    radius,
    circumference,
    normalizedValue,
    strokeDashoffset,
    color
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg className={styles.svg} viewBox="0 0 150 150" preserveAspectRatio="xMidYMid meet">
        <circle 
          className={styles.base} 
          cx="75" 
          cy="75" 
          r={radius}
          fill="none"
          stroke="#e5e8ed"
          strokeWidth="10"
        />
        <circle
          className={styles.line}
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
        />
      </svg>
    </div>
  );
};

export default ResponsivePieChart;
