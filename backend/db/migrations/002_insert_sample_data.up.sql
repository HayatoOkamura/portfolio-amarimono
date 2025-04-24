-- 単位のサンプルデータ
INSERT INTO units (name, description, step) VALUES
('g', 'グラム', 1),
('ml', 'ミリリットル', 1),
('個', '個数', 1),
('大さじ', '大さじ1杯', 1),
('小さじ', '小さじ1杯', 1),
('適量', '適量', 1);

-- レシピジャンルのサンプルデータ
INSERT INTO recipe_genres (name) VALUES
('和食'),
('洋食'),
('中華'),
('イタリアン'),
('スイーツ'),
('サラダ'),
('スープ'),
('パスタ'),
('ご飯もの'),
('おつまみ'),
('その他');

-- 食材ジャンルのサンプルデータ
INSERT INTO ingredient_genres (name) VALUES
('野菜'),
('肉'),
('魚介'),
('穀物'),
('乳製品'),
('調味料'),
('果物'),
('豆類'),
('卵'),
('海藻'),
('その他');

-- レシピのサンプルデータ
INSERT INTO recipes (id, name, image_url, genre_id, instructions, cooking_time, cost_estimate, summary, nutrition, catchphrase, is_public, is_draft) VALUES
('11111111-1111-1111-1111-111111111111', '親子丼', 'https://example.com/oyakodon.jpg', 1, 
'[{"step": 1, "instruction": "鶏肉を一口大に切る"}, {"step": 2, "instruction": "玉ねぎを薄切りにする"}, {"step": 3, "instruction": "調味料を合わせる"}, {"step": 4, "instruction": "具材を煮る"}, {"step": 5, "instruction": "卵を加える"}]',
20, 500, '定番の親子丼レシピ', '{"calories": 600, "protein": 30, "fat": 20}', 'ふわとろ卵が決め手！', true, false),
('22222222-2222-2222-2222-222222222222', 'カレーライス', 'https://example.com/curry.jpg', 1,
'[{"step": 1, "instruction": "野菜を切る"}, {"step": 2, "instruction": "肉を炒める"}, {"step": 3, "instruction": "野菜を炒める"}, {"step": 4, "instruction": "水を加えて煮込む"}, {"step": 5, "instruction": "ルーを溶かす"}]',
40, 800, '定番のカレーライス', '{"calories": 800, "protein": 25, "fat": 30}', 'コクのある味わい', true, false),
('33333333-3333-3333-3333-333333333333', 'オムライス', 'https://example.com/omurice.jpg', 2,
'[{"step": 1, "instruction": "チキンライスを作る"}, {"step": 2, "instruction": "卵を溶く"}, {"step": 3, "instruction": "卵を焼く"}, {"step": 4, "instruction": "ライスを包む"}]',
30, 600, 'ふわふわ卵のオムライス', '{"calories": 700, "protein": 20, "fat": 25}', 'ふわふわ卵が自慢', true, false),
('44444444-4444-4444-4444-444444444444', 'パスタカルボナーラ', 'https://example.com/carbonara.jpg', 4,
'[{"step": 1, "instruction": "パスタを茹でる"}, {"step": 2, "instruction": "ベーコンを炒める"}, {"step": 3, "instruction": "卵とチーズを混ぜる"}, {"step": 4, "instruction": "ソースを作る"}]',
25, 700, '本格カルボナーラ', '{"calories": 750, "protein": 25, "fat": 35}', '濃厚な味わい', true, false),
('55555555-5555-5555-5555-555555555555', 'チョコレートケーキ', 'https://example.com/chocolatecake.jpg', 5,
'[{"step": 1, "instruction": "材料を混ぜる"}, {"step": 2, "instruction": "型に流す"}, {"step": 3, "instruction": "オーブンで焼く"}, {"step": 4, "instruction": "デコレーションする"}]',
60, 1000, '濃厚チョコレートケーキ', '{"calories": 400, "protein": 5, "fat": 20}', 'チョコレート好き必見', true, false),
('66666666-6666-6666-6666-666666666666', 'シーザーサラダ', 'https://example.com/caesarsalad.jpg', 6,
'[{"step": 1, "instruction": "レタスをちぎる"}, {"step": 2, "instruction": "ドレッシングを作る"}, {"step": 3, "instruction": "具材を盛り付ける"}]',
15, 400, '定番シーザーサラダ', '{"calories": 300, "protein": 10, "fat": 15}', 'さっぱりとした味わい', true, false),
('77777777-7777-7777-7777-777777777777', 'トマトスープ', 'https://example.com/tomatosoup.jpg', 7,
'[{"step": 1, "instruction": "野菜を切る"}, {"step": 2, "instruction": "炒める"}, {"step": 3, "instruction": "水を加えて煮込む"}, {"step": 4, "instruction": "味を調える"}]',
30, 300, 'トマトの旨味たっぷりスープ', '{"calories": 200, "protein": 5, "fat": 10}', '体が温まるスープ', true, false),
('88888888-8888-8888-8888-888888888888', 'ペペロンチーノ', 'https://example.com/peperoncino.jpg', 8,
'[{"step": 1, "instruction": "パスタを茹でる"}, {"step": 2, "instruction": "ニンニクを炒める"}, {"step": 3, "instruction": "唐辛子を加える"}, {"step": 4, "instruction": "パスタと和える"}]',
20, 500, 'シンプルなペペロンチーノ', '{"calories": 600, "protein": 15, "fat": 25}', 'ピリ辛がクセになる', true, false),
('99999999-9999-9999-9999-999999999999', 'チャーハン', 'https://example.com/friedrice.jpg', 3,
'[{"step": 1, "instruction": "具材を切る"}, {"step": 2, "instruction": "卵を炒める"}, {"step": 3, "instruction": "ご飯を炒める"}, {"step": 4, "instruction": "調味する"}]',
20, 400, 'パラパラチャーハン', '{"calories": 650, "protein": 20, "fat": 20}', 'パラパラ食感が自慢', true, false),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '枝豆', 'https://example.com/edamame.jpg', 10,
'[{"step": 1, "instruction": "枝豆を洗う"}, {"step": 2, "instruction": "塩をまぶす"}, {"step": 3, "instruction": "茹でる"}]',
10, 200, '定番のおつまみ', '{"calories": 150, "protein": 10, "fat": 5}', 'ビールのお供に', true, false); 