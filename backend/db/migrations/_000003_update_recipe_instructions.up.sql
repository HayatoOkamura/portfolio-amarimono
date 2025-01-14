ALTER TABLE recipes
ALTER COLUMN instructions TYPE jsonb
USING instructions::jsonb;