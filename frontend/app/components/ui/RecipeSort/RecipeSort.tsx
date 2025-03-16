/* eslint-disable */
import useRecipeStore from "@/app/stores/recipeStore";

export const RecipeSort = () => {
  const { sortBy, setSortBy } = useRecipeStore();

  return (
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
      <option value="cost_asc">費用が安い順</option>
      <option value="rating_desc">評価が高い順</option>
      <option value="time_asc">調理時間が短い順</option>
      <option value="calorie_asc">カロリーが低い順</option>
    </select>
  );
};
