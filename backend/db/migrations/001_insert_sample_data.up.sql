-- レシピのジャンルのデータを追加
INSERT INTO recipe_genres (name) 
VALUES 
('Italian'),
('French'),
('Asian'),
('Mexican'),
('Vegetarian');

-- 具材のジャンルのデータを追加
INSERT INTO ingredient_genres (name) 
VALUES 
('Vegetable'),
('Fruit'),
('Meat'),
('Dairy'),
('Grain'),
('Spices');

-- レシピのデータ（ジャンルIDを参照）
INSERT INTO recipes (name, image_url, genre_id, instructions) 
VALUES 
('Spaghetti Carbonara', 'https://example.com/carbonara.jpg', 1, '[{"stepNumber":1,"instructions":"Boil pasta"},{"stepNumber":2,"instructions":"Mix egg and cheese"}]'),
('Tomato Soup', 'https://example.com/tomatosoup.jpg', 2, '[{"stepNumber":1,"instructions":"Chop tomatoes"},{"stepNumber":2,"instructions":"Simmer tomatoes"}]');

-- 具材のデータ（ジャンルIDを参照）
INSERT INTO ingredients (name, image_url, quantity, genre_id) 
VALUES 
('Tomato', 'https://example.com/tomato.jpg', 10, 1),   -- 具材のジャンルとしてVegetable
('Pasta', 'https://example.com/pasta.jpg', 20, 5),    -- 具材のジャンルとしてGrain
('Egg', 'https://example.com/egg.jpg', 12, 4);        -- 具材のジャンルとしてDairy


-- レシピと具材の中間データ
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
VALUES 
(1, 2, 100),
(1, 3, 2),
(2, 1, 3);
