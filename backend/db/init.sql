-- 初期化スクリプト
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL
);

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE recipe_ingredients (
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
);

-- サンプルデータの挿入
INSERT INTO recipes (name, instructions) VALUES 
('Tomato Pasta', 'Boil pasta. Add tomato sauce. Mix and serve.');

INSERT INTO ingredients (name) VALUES 
('Tomato'), 
('Pasta'), 
('Carrot');

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES 
(1, 1, 2), -- 2 tomatoes
(1, 2, 1), -- 1 pasta
(1, 3, 5); -- 5 basil leaves
