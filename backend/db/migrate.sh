#!/bin/bash

# Supabase接続情報
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# マイグレーションを実行
echo "Executing migrations..."
migrate -path ./db/migrations -database "postgres://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${SUPABASE_URL#https://}:5432/postgres?sslmode=require" up

echo "Migrations completed." 