import React, { useState, useRef } from "react";

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
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border p-2 rounded w-full bg-gray-200"
      >
        {costEstimate ? formatCost(costEstimate) : "予算を選択"}
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto z-10">
          {costOptions.map((cost) => (
            <div
              key={cost}
              onClick={() => handleSelectCost(cost)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
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