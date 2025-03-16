import React, { useState, useRef } from "react";

type CookingTimeSelectorProps = {
  cookingTime: number;
  setCookingTime: (time: number) => void;
};

const CookingTimeSelector: React.FC<CookingTimeSelectorProps> = ({
  cookingTime,
  setCookingTime,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectTime = (time: number) => {
    setCookingTime(time);
    setIsOpen(false);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}時間` : `${hours}時間${mins}分`;
    }
  };

  // 5分刻み（60分未満）・10分刻み（60分以上）
  const timeOptions = Array.from({ length: 24 }, (_, i) =>
    i < 12 ? (i + 1) * 5 : 60 + (i - 11) * 10
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border p-2 rounded w-full bg-gray-200"
      >
        {cookingTime ? formatTime(cookingTime) : "時間を選択"}
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto z-10">
          {timeOptions.map((time) => (
            <div
              key={time}
              onClick={() => handleSelectTime(time)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {formatTime(time)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CookingTimeSelector;
