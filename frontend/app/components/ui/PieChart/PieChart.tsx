/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import styles from "./PieChart.module.scss";

type NutritionType = "calories" | "carbohydrates" | "fat" | "protein" | "salt" ;

const getNutritionColor = (type: NutritionType): string => {
  const colors = {
    calories: "#DA5944",      // 赤
    carbohydrates: "#3762ED", // 青
    fat: "#6846C1",          // 紫
    protein: "#DBBE62",      // 黄
    salt: "#49B552",         // 紫
  };
  return colors[type] || "#03a9f4"; // デフォルトは青
};

const ResponsivePieChart = ({ value, type }: { value: number; type: NutritionType }) => {
  const [radius, setRadius] = useState(70);
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const resizeHandler = () => {
      const newRadius = Math.min(window.innerWidth * 0.2, 70);
      setRadius(newRadius);
    };

    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

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
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg 
        className={styles.svg} 
        viewBox="0 0 150 150" 
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: '150px', maxHeight: '150px' }}
      >
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
          style={{
            '--dash-offset': strokeDashoffset,
            transform: 'rotate(-90deg)'
          } as React.CSSProperties}
        />
      </svg>
    </div>
  );
};

export default ResponsivePieChart;
