-- 具材のデータ（ジャンルIDを参照）
DELETE FROM recipe_ingredients WHERE recipe_id IN (1, 2);

-- レシピのデータ（ジャンルIDを参照）
DELETE FROM recipes WHERE name IN ('Spaghetti Carbonara', 'Tomato Soup');

-- 具材のデータ（ジャンルIDを参照）
DELETE FROM ingredients WHERE name IN ('Tomato', 'Pasta', 'Egg');

-- レシピジャンルのデータを削除
DELETE FROM recipe_genres WHERE name IN ('Italian', 'Soup', 'Vegetable', 'Grain', 'Dairy');

-- 具材ジャンルのデータを削除
DELETE FROM ingredient_genres WHERE name IN ('Italian', 'Soup', 'Vegetable', 'Grain', 'Dairy');
