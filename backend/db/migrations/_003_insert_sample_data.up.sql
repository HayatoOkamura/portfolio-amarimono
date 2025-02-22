-- ==============================
-- ④ 追加カラムへのデータ更新
-- ==============================

UPDATE recipes SET 
cooking_time = 20, 
reviews = 4.5, 
cost_estimate = '1000円以内', 
summary = '濃厚なカルボナーラを自宅で再現！',
nutrition = '{"calories": 500, "carbohydrates": 50, "fat": 20, "protein": 25, "sugar": 5, "salt": 1.5}',
faq = '[{"question": "卵は全卵ですか？", "answer": "はい、全卵を使用します。"}]'
WHERE name = 'Spaghetti Carbonara';

UPDATE recipes SET 
cooking_time = 15, 
reviews = 4.0, 
cost_estimate = '500円以内', 
summary = '優しい味わいのトマトスープ',
nutrition = '{"calories": 150, "carbohydrates": 30, "fat": 5, "protein": 3, "sugar": 10, "salt": 1}',
faq = '[{"question": "牛乳を加えても良いですか？", "answer": "はい、よりクリーミーになります。"}]'
WHERE name = 'Tomato Soup';