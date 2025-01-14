-- レシピのデータ
INSERT INTO recipes (name, image_url, genre, instructions) 
VALUES 
('Spaghetti Carbonara', 'https://example.com/carbonara.jpg', 'Italian', '[{"stepNumber":1,"instructions":"Boil pasta"},{"stepNumber":2,"instructions":"Mix egg and cheese"}]'),
('Tomato Soup', 'https://example.com/tomatosoup.jpg', 'Soup', '[{"stepNumber":1,"instructions":"Chop tomatoes"},{"stepNumber":2,"instructions":"Simmer tomatoes"}]');

-- 具材のデータ
INSERT INTO ingredients (name, image_url, quantity, genre) 
VALUES 
('Tomato', 'https://example.com/tomato.jpg', 10, 'Vegetable'),
('Pasta', 'https://example.com/pasta.jpg', 20, 'Grain'),
('Egg', 'https://example.com/egg.jpg', 12, 'Dairy');

-- レシピと具材の中間データ
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
VALUES 
(1, 2, 100),
(1, 3, 2),
(2, 1, 3);
