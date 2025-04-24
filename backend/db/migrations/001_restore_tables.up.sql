-- UUID拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 単位テーブル
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    description VARCHAR(100),
    step INTEGER NOT NULL DEFAULT 1
);

-- レシピジャンルテーブル
CREATE TABLE recipe_genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 食材ジャンルテーブル
CREATE TABLE ingredient_genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    username VARCHAR(255),
    profile_image TEXT,
    age VARCHAR(50),
    gender VARCHAR(10)
);

-- レシピテーブル
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    genre_id INTEGER REFERENCES recipe_genres(id) ON DELETE SET NULL,
    instructions JSONB NOT NULL,
    cooking_time INTEGER,
    cost_estimate INTEGER,
    summary TEXT,
    nutrition JSONB,
    catchphrase TEXT,
    faq JSONB DEFAULT '[]',
    user_id UUID,
    is_public BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 食材テーブル
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    genre_id INTEGER REFERENCES ingredient_genres(id) ON DELETE SET NULL,
    image_url TEXT,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL
);

-- ユーザーごとの具材初期値テーブル
CREATE TABLE user_ingredient_defaults (
    user_id UUID NOT NULL,
    ingredient_id INTEGER NOT NULL,
    default_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, ingredient_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- レシピと食材の中間テーブル
CREATE TABLE recipe_ingredients (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_required INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- レビューテーブル
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- いいねテーブル
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recipe_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);