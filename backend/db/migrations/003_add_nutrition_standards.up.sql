-- 栄養基準値テーブル
CREATE TABLE nutrition_standards (
    age_group VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    calories FLOAT NOT NULL,
    protein FLOAT NOT NULL,
    fat FLOAT NOT NULL,
    carbohydrates FLOAT NOT NULL,
    sugar FLOAT NOT NULL,
    salt FLOAT NOT NULL,
    PRIMARY KEY (age_group, gender)
);

-- サンプルデータ
INSERT INTO nutrition_standards (age_group, gender, calories, protein, fat, carbohydrates, sugar, salt) VALUES
('18-29', 'male', 2500, 60, 70, 300, 30, 7.5),
('18-29', 'female', 2000, 50, 60, 250, 25, 6.5),
('30-49', 'male', 2400, 55, 65, 280, 28, 7.0),
('30-49', 'female', 1900, 45, 55, 230, 23, 6.0),
('50-64', 'male', 2200, 50, 60, 260, 26, 6.5),
('50-64', 'female', 1800, 40, 50, 220, 22, 5.5),
('65-74', 'male', 2000, 45, 55, 240, 24, 6.0),
('65-74', 'female', 1700, 35, 45, 200, 20, 5.0),
('75+', 'male', 1800, 40, 50, 220, 22, 5.5),
('75+', 'female', 1600, 30, 40, 180, 18, 4.5); 