/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import styles from "./PieChart.module.scss";

type NutritionType = "calories" | "carbohydrates" | "fat" | "protein" | "salt" ;

const getNutritionColor = (type: NutritionType): string => {
  const colors = {
    calories: "#FF6B6B",     
    carbohydrates: "#4ECDC4",
    fat: "#45B7D1",         
    protein: "#96CEB4",     
    salt: "#FFEAA7",        
  };
  return colors[type] || "#FF6B6B";
};

const ResponsivePieChart = ({ value, type, disableAnimation = false }: { value: number; type: NutritionType; disableAnimation?: boolean }) => {
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

  return (
    <div className={styles.pie_chart}>
      <svg 
        className={styles.svg} 
        viewBox="0 0 150 150" 
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
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
          className={disableAnimation ? '' : styles.line}
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          style={{
            '--dash-offset': strokeDashoffset,
            transform: 'rotate(-90deg)',
            ...(disableAnimation ? { strokeDashoffset: strokeDashoffset } : {})
          } as React.CSSProperties}
        />
      </svg>
    </div>
  );
};

export default ResponsivePieChart;
