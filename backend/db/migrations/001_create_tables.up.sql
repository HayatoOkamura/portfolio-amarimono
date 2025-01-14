-- レシピテーブル
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    genre VARCHAR(50),
    instructions JSONB NOT NULL
);

-- 具材テーブル
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    quantity INTEGER NOT NULL,
    genre VARCHAR(50)
);

-- レシピと具材の中間テーブル
CREATE TABLE recipe_ingredients (
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_required INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);
