-- 追加カラムの削除
ALTER TABLE recipes
DROP COLUMN cooking_time,
DROP COLUMN reviews,
DROP COLUMN cost_estimate,
DROP COLUMN summary,
DROP COLUMN nutrition,
DROP COLUMN faq;

-- instructions を元の型に戻す（例: TEXT に変換）
ALTER TABLE recipes
ALTER COLUMN instructions TYPE TEXT USING instructions::TEXT;
