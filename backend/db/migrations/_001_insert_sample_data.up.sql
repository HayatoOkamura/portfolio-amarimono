-- ==============================
-- ③ 初期データ挿入
-- ==============================

-- 単位のデータ
INSERT INTO units (name, description) VALUES 
('g', 'グラム'),
('ml', 'ミリリットル'),
('個', '個数'),
('tbsp', '大さじ'),
('tsp', '小さじ');

-- レシピのジャンル
INSERT INTO recipe_genres (name) 
VALUES 
('Italian'),
('French'),
('Asian'),
('Mexican'),
('Vegetarian');

-- 具材のジャンル
INSERT INTO ingredient_genres (name) 
VALUES 
('Vegetable'),
('Fruit'),
('Meat'),
('Dairy'),
('Grain'),
('Spices');

-- レシピデータ
INSERT INTO recipes (name, image_url, genre_id, instructions) 
VALUES 
('Spaghetti Carbonara', 'https://example.com/carbonara.jpg', 1, '[{"stepNumber":1,"instructions":"Boil pasta"},{"stepNumber":2,"instructions":"Mix egg and cheese"}]'),
('Tomato Soup', 'https://example.com/tomatosoup.jpg', 2, '[{"stepNumber":1,"instructions":"Chop tomatoes"},{"stepNumber":2,"instructions":"Simmer tomatoes"}]');

-- 具材データ
INSERT INTO ingredients (name, image_url, quantity, unit_id, genre_id) 
VALUES 
('Tomato', 'https://example.com/tomato.jpg', 10, 3, 1),   -- 具材のジャンルとしてVegetable, 単位は"個"
('Pasta', 'https://example.com/pasta.jpg', 20, 1, 5),     -- 具材のジャンルとしてGrain, 単位は"g"
('Egg', 'https://example.com/egg.jpg', 12, 3, 4);         -- 具材のジャンルとしてDairy, 単位は"個"

-- レシピと具材の関係データ
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
VALUES 
(1, 2, 100),  -- Pasta 100g
(1, 3, 2),    -- Egg 2個
(2, 1, 3);    -- Tomato 3個