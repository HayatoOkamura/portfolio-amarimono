/* eslint-disable */
import { useState } from "react";

export const RecipeSort = ({ onSortChange }: { onSortChange: (sortBy: string) => void }) => {
  const [sortBy, setSortBy] = useState("rating_desc");

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    onSortChange(newSortBy);
  };

  return (
    <select value={sortBy} onChange={handleSortChange}>
      <option value="rating_desc">評価が高い順</option>
      <option value="cost_asc">費用が安い順</option>
      <option value="time_asc">調理時間が短い順</option>
      <option value="calorie_asc">カロリーが低い順</option>
    </select>
  );
};
