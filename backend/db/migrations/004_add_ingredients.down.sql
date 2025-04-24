-- 具材の削除
DELETE FROM ingredients WHERE genre_id BETWEEN 1 AND 11;

-- 単位の削除
DELETE FROM units WHERE name IN (
    '個', '本', '枚', '房', '株', '袋', '缶', '匹', '尾', 'パック', '切れ',
    '小さじ', '大さじ', 'カップ', 'g', 'kg', 'ml', 'L', '滴', '適量', '少々'
);

-- 食材ジャンルの削除
DELETE FROM ingredient_genres WHERE name IN (
    '野菜', '肉', '魚介', '穀物', '乳製品', '調味料', '果物', '豆類', '卵', '海藻', 'その他'
); 