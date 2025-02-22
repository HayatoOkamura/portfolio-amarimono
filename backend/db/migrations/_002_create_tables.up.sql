-- レシピテーブルの変更（追加カラム）
ALTER TABLE recipes
ADD COLUMN cooking_time INTEGER, -- 調理時間（分）
ADD COLUMN reviews NUMERIC(2,1) DEFAULT 0, -- レビュー（例: 4.5）
ADD COLUMN cost_estimate TEXT, -- 費用目安（例: "1000円以内"）
ADD COLUMN summary TEXT, -- 概要（料理の説明やキャッチフレーズ）
ADD COLUMN nutrition JSONB, -- 成分情報（カロリー、炭水化物、脂質、タンパク質、糖質、塩分）
ADD COLUMN faq JSONB; -- よくある質問（Q&A形式）

-- instructions に画像情報を追加（JSONB 型に変更）
ALTER TABLE recipes
ALTER COLUMN instructions TYPE JSONB USING instructions::JSONB;