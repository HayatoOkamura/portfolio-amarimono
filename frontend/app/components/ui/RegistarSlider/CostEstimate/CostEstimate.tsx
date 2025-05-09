import React, { useState, useRef } from "react";
import styles from "./CostEstimate.module.scss";

type CostEstimateSliderProps = {
  costEstimate: number;
  setCostEstimate: (cost: number) => void;
};

const CostEstimateSlider: React.FC<CostEstimateSliderProps> = ({
  costEstimate,
  setCostEstimate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectCost = (cost: number) => {
    setCostEstimate(cost);
    setIsOpen(false);
  };

  const formatCost = (cost: number) => `約${cost.toLocaleString()}円`;

  const costOptions = [
    ...Array.from({ length: 19 }, (_, i) => 100 + i * 50), // 100円〜1000円: 50円単位
    ...Array.from({ length: 21 }, (_, i) => 1100 + i * 100), // 1100円〜3000円: 100円単位
  ];

  return (
    <div ref={containerRef} className={styles.cost_estimate_block}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.cost_estimate_block__button}
      >
        {costEstimate ? formatCost(costEstimate) : "予算を選択"}
      </button>

      {isOpen && (
        <div className={styles.cost_estimate_block__list}>
          {costOptions.map((cost) => (
            <div
              key={cost}
              onClick={() => handleSelectCost(cost)}
              className={styles.cost_estimate_block__item}
            >
              {formatCost(cost)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostEstimateSlider;