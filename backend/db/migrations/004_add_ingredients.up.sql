-- 単位の追加
INSERT INTO units (name, description, step) VALUES
-- 個数系単位
('個', '個数', 1),
('本', '本数', 1),
('枚', '枚数', 1),
('房', '房数', 1),
('株', '株数', 1),
('袋', '袋数', 1),
('缶', '缶数', 1),
('匹', '匹数', 1),
('尾', '尾数', 1),
('パック', 'パック数', 1),
('切れ', '切れ数', 1),

-- 調味料系単位
('小さじ', '小さじ1杯（約5ml）', 1),
('大さじ', '大さじ1杯（約15ml）', 1),
('カップ', 'カップ1杯（約200ml）', 1),

-- 質量・容量単位
('g', 'グラム', 50),
('kg', 'キログラム', 0.1),
('ml', 'ミリリットル', 50),
('L', 'リットル', 0.1),

-- その他
('滴', '滴数', 1),
('適量', '適量', 1),
('少々', '少々', 1);

-- 具材の追加
INSERT INTO ingredients (name, genre_id, image_url, unit_id) VALUES
-- 野菜
('玉ねぎ', 1, 'https://example.com/onion.jpg', 3),
('にんじん', 1, 'https://example.com/carrot.jpg', 3),
('じゃがいも', 1, 'https://example.com/potato.jpg', 3),
('キャベツ', 1, 'https://example.com/cabbage.jpg', 3),
('トマト', 1, 'https://example.com/tomato.jpg', 3),
('きゅうり', 1, 'https://example.com/cucumber.jpg', 8),
('なす', 1, 'https://example.com/eggplant.jpg', 3),
('ピーマン', 1, 'https://example.com/pepper.jpg', 3),
('ほうれん草', 1, 'https://example.com/spinach.jpg', 11),
('レタス', 1, 'https://example.com/lettuce.jpg', 11),

-- 肉
('鶏もも肉', 2, 'https://example.com/chicken.jpg', 21),
('鶏むね肉', 2, 'https://example.com/chicken_breast.jpg', 21),
('豚バラ肉', 2, 'https://example.com/pork_belly.jpg', 21),
('豚ロース肉', 2, 'https://example.com/pork_loin.jpg', 21),
('牛バラ肉', 2, 'https://example.com/beef_belly.jpg', 21),
('牛ロース肉', 2, 'https://example.com/beef_loin.jpg', 21),
('ベーコン', 2, 'https://example.com/bacon.jpg', 9),
('ハム', 2, 'https://example.com/ham.jpg', 9),

-- 魚介
('鮭', 3, 'https://example.com/salmon.jpg', 15),
('マグロ', 3, 'https://example.com/tuna.jpg', 15),
('エビ', 3, 'https://example.com/shrimp.jpg', 14),
('イカ', 3, 'https://example.com/squid.jpg', 14),
('アサリ', 3, 'https://example.com/clam.jpg', 14),
('ツナ缶', 3, 'https://example.com/tuna_can.jpg', 13),

-- 穀物
('米', 4, 'https://example.com/rice.jpg', 21),
('小麦粉', 4, 'https://example.com/flour.jpg', 21),
('パン粉', 4, 'https://example.com/breadcrumbs.jpg', 21),
('パスタ', 4, 'https://example.com/pasta.jpg', 21),
('うどん', 4, 'https://example.com/udon.jpg', 21),

-- 乳製品
('牛乳', 5, 'https://example.com/milk.jpg', 23),
('チーズ', 5, 'https://example.com/cheese.jpg', 21),
('バター', 5, 'https://example.com/butter.jpg', 21),
('ヨーグルト', 5, 'https://example.com/yogurt.jpg', 23),

-- 調味料
('塩', 6, 'https://example.com/salt.jpg', 18),
('砂糖', 6, 'https://example.com/sugar.jpg', 18),
('醤油', 6, 'https://example.com/soy_sauce.jpg', 19),
('みりん', 6, 'https://example.com/mirin.jpg', 19),
('酢', 6, 'https://example.com/vinegar.jpg', 19),
('油', 6, 'https://example.com/oil.jpg', 19),
('ケチャップ', 6, 'https://example.com/ketchup.jpg', 19),
('マヨネーズ', 6, 'https://example.com/mayonnaise.jpg', 19),

-- 果物
('りんご', 7, 'https://example.com/apple.jpg', 3),
('バナナ', 7, 'https://example.com/banana.jpg', 8),
('みかん', 7, 'https://example.com/orange.jpg', 3),
('ぶどう', 7, 'https://example.com/grape.jpg', 10),
('いちご', 7, 'https://example.com/strawberry.jpg', 3),

-- 豆類
('大豆', 8, 'https://example.com/soybean.jpg', 21),
('小豆', 8, 'https://example.com/azuki.jpg', 21),
('枝豆', 8, 'https://example.com/edamame.jpg', 21),
('豆腐', 8, 'https://example.com/tofu.jpg', 16),
('納豆', 8, 'https://example.com/natto.jpg', 16),

-- 卵
('卵', 9, 'https://example.com/egg.jpg', 3),

-- 海藻
('わかめ', 10, 'https://example.com/wakame.jpg', 21),
('のり', 10, 'https://example.com/nori.jpg', 9),
('ひじき', 10, 'https://example.com/hijiki.jpg', 21),

-- その他
('こんにゃく', 11, 'https://example.com/konnyaku.jpg', 21),
('しらたき', 11, 'https://example.com/shirataki.jpg', 21),
('春雨', 11, 'https://example.com/harusame.jpg', 21); 