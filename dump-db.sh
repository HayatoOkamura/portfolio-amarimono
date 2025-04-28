#!/bin/bash

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# エラー処理
handle_error() {
    log_error "$1"
    exit 1
}

# 環境変数の設定
DB_CONTAINER="portfolio-amarimono_db_1"
DB_NAME="amarimono"
DB_USER="postgres"
SUPABASE_HOST="aws-0-ap-northeast-1.pooler.supabase.com"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.qmrjsqeigdkizkrpiahs"

# ディレクトリの作成
mkdir -p database_dumps

# 古いダンプファイルのクリーンアップ
log_info "Cleaning up old dump files..."
find database_dumps -name "dump_*.sql" -type f | sort -r | tail -n +6 | xargs -r rm

# ダンプファイル名の生成
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMMIT_HASH=$(git rev-parse --short HEAD)
DATA_FILE="database_dumps/data_${TIMESTAMP}.sql"
BACKUP_FILE="database_dumps/backup_${TIMESTAMP}.sql"
SCHEMA_FILE="database_dumps/schema_${TIMESTAMP}.sql"

# Supabaseへの復元オプション
read -p "Do you want to restore this dump to Supabase? (y/n) " restore_choice
if [ "$restore_choice" = "y" ]; then
    read -s -p "Enter Supabase database password: " supabase_password
    echo
    
    log_info "Restoring to Supabase..."
    
    # 接続テスト
    if ! PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Failed to connect to Supabase. Please check your connection settings and password."
        exit 1
    fi
    
    # バックアップの作成
    log_info "Creating backup of current database..."
    PGPASSWORD="$supabase_password" pg_dump -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" --no-owner --no-acl > "$BACKUP_FILE"
    
    if [ ! -s "$BACKUP_FILE" ]; then
        log_warn "Failed to create backup. Proceeding with caution..."
    else
        log_info "Backup created successfully: $BACKUP_FILE"
    fi

    # テーブルの存在チェックと作成
    log_info "Checking and creating tables if necessary..."
    {
        # 拡張機能の作成
        echo "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA public;"
        
        # 基本テーブルの作成
        echo "CREATE TABLE IF NOT EXISTS public.units (id integer PRIMARY KEY, name character varying NOT NULL, description character varying, step numeric NOT NULL);"
        echo "CREATE TABLE IF NOT EXISTS public.recipe_genres (id integer PRIMARY KEY, name character varying NOT NULL);"
        echo "CREATE TABLE IF NOT EXISTS public.ingredient_genres (id integer PRIMARY KEY, name character varying NOT NULL);"
        echo "CREATE TABLE IF NOT EXISTS public.users (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), email character varying, username character varying, profile_image text, age character varying, gender character varying);"
        
        # 依存テーブルの作成
        echo "CREATE TABLE IF NOT EXISTS public.ingredients (id integer PRIMARY KEY, name character varying NOT NULL, genre_id integer REFERENCES public.ingredient_genres(id), image_url text, unit_id integer REFERENCES public.units(id));"
        echo "CREATE TABLE IF NOT EXISTS public.recipes (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name character varying NOT NULL, image_url text, genre_id integer REFERENCES public.recipe_genres(id), instructions jsonb NOT NULL, cooking_time integer, cost_estimate integer, summary text, nutrition jsonb, catchphrase text, faq jsonb, user_id uuid REFERENCES public.users(id), is_public boolean, is_draft boolean, created_at timestamp without time zone, updated_at timestamp without time zone);"
        echo "CREATE TABLE IF NOT EXISTS public.recipe_ingredients (recipe_id uuid REFERENCES public.recipes(id), ingredient_id integer REFERENCES public.ingredients(id), quantity_required double precision NOT NULL, PRIMARY KEY (recipe_id, ingredient_id));"
        echo "CREATE TABLE IF NOT EXISTS public.reviews (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), recipe_id uuid REFERENCES public.recipes(id), user_id uuid REFERENCES public.users(id), rating integer, comment text, created_at timestamp without time zone, updated_at timestamp without time zone);"
        echo "CREATE TABLE IF NOT EXISTS public.likes (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid REFERENCES public.users(id), recipe_id uuid REFERENCES public.recipes(id), created_at timestamp without time zone);"
        echo "CREATE TABLE IF NOT EXISTS public.user_ingredient_defaults (user_id uuid REFERENCES public.users(id), ingredient_id integer REFERENCES public.ingredients(id), default_quantity integer NOT NULL, created_at timestamp without time zone, updated_at timestamp without time zone, PRIMARY KEY (user_id, ingredient_id));"
    } > "$SCHEMA_FILE"

    # スキーマの適用
    log_info "Applying schema..."
    if ! PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "$SCHEMA_FILE"; then
        log_error "Failed to apply schema"
        exit 1
    fi

    # 各テーブルの最大IDを取得
    log_info "Getting maximum IDs from Supabase..."
    MAX_IDS=$(PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -t -c "
        SELECT 
            COALESCE(MAX(id), 0) as max_id,
            'units' as table_name
        FROM public.units
        UNION ALL
        SELECT 
            COALESCE(MAX(id), 0) as max_id,
            'recipe_genres' as table_name
        FROM public.recipe_genres
        UNION ALL
        SELECT 
            COALESCE(MAX(id), 0) as max_id,
            'ingredient_genres' as table_name
        FROM public.ingredient_genres
        UNION ALL
        SELECT 
            COALESCE(MAX(id), 0) as max_id,
            'ingredients' as table_name
        FROM public.ingredients;
    ")

    # 最大IDを配列に格納
    MAX_ID_UNITS=0
    MAX_ID_RECIPE_GENRES=0
    MAX_ID_INGREDIENT_GENRES=0
    MAX_ID_INGREDIENTS=0

    while IFS='|' read -r max_id table_name; do
        case $(echo $table_name | tr -d ' ') in
            "units")
                MAX_ID_UNITS=$max_id
                ;;
            "recipe_genres")
                MAX_ID_RECIPE_GENRES=$max_id
                ;;
            "ingredient_genres")
                MAX_ID_INGREDIENT_GENRES=$max_id
                ;;
            "ingredients")
                MAX_ID_INGREDIENTS=$max_id
                ;;
        esac
    done <<< "$MAX_IDS"

    # データのダンプ（依存関係の順序に従って）
    log_info "Creating data dump with adjusted IDs..."
    {
        # 基本テーブルのデータ（IDを調整）
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT 
                id + $MAX_ID_UNITS,
                quote_literal(name),
                COALESCE(quote_literal(description), 'NULL'),
                step
            FROM public.units
            ORDER BY id;
        " | sed 's/|/,/g' | sed "s/^[[:space:]]*//" | sed "s/^/INSERT INTO public.units (id, name, description, step) VALUES (/;s/$/);/"

        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT 
                id + $MAX_ID_RECIPE_GENRES,
                quote_literal(name)
            FROM public.recipe_genres
            ORDER BY id;
        " | sed 's/|/,/g' | sed "s/^[[:space:]]*//" | sed "s/^/INSERT INTO public.recipe_genres (id, name) VALUES (/;s/$/);/"

        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT 
                id + $MAX_ID_INGREDIENT_GENRES,
                quote_literal(name)
            FROM public.ingredient_genres
            ORDER BY id;
        " | sed 's/|/,/g' | sed "s/^[[:space:]]*//" | sed "s/^/INSERT INTO public.ingredient_genres (id, name) VALUES (/;s/$/);/"

        # ユーザーテーブルはUUIDなので、そのままコピー
        docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=public.users --no-owner --no-acl --disable-triggers

        # 食材テーブル（IDを調整）
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT 
                id + $MAX_ID_INGREDIENTS,
                quote_literal(name),
                genre_id + $MAX_ID_INGREDIENT_GENRES,
                COALESCE(quote_literal(image_url), 'NULL'),
                unit_id + $MAX_ID_UNITS
            FROM public.ingredients
            ORDER BY id;
        " | sed 's/|/,/g' | sed "s/^[[:space:]]*//" | sed "s/^/INSERT INTO public.ingredients (id, name, genre_id, image_url, unit_id) VALUES (/;s/$/);/"

        # レシピテーブル（UUIDなので、そのままコピー）
        docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=public.recipes --no-owner --no-acl --disable-triggers

        # レシピ食材テーブル（IDを調整）
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT 
                quote_literal(recipe_id),
                ingredient_id + $MAX_ID_INGREDIENTS,
                quantity_required
            FROM public.recipe_ingredients
            ORDER BY recipe_id, ingredient_id;
        " | sed 's/|/,/g' | sed "s/^[[:space:]]*//" | sed "s/^/INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity_required) VALUES (/;s/$/);/"

        # その他のテーブル（UUIDなので、そのままコピー）
        docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=public.reviews --no-owner --no-acl --disable-triggers
        docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=public.likes --no-owner --no-acl --disable-triggers
        docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=public.user_ingredient_defaults --no-owner --no-acl --disable-triggers
    } > "$DATA_FILE"

    # 外部キー制約の一時的な無効化
    log_info "Disabling foreign key constraints..."
    PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -c "SET session_replication_role = 'replica';"
    
    # データの復元
    log_info "Restoring data..."
    if ! PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "$DATA_FILE"; then
        log_error "Failed to restore data"
        log_info "Attempting to restore from backup..."
        if [ -s "$BACKUP_FILE" ]; then
            if PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -f "$BACKUP_FILE"; then
                log_info "Backup restored successfully"
            else
                log_error "Failed to restore from backup"
            fi
        else
            log_error "No backup available"
        fi
        exit 1
    fi
    
    # 外部キー制約の再有効化
    log_info "Re-enabling foreign key constraints..."
    PGPASSWORD="$supabase_password" psql -h "$SUPABASE_HOST" -p "$SUPABASE_PORT" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -c "SET session_replication_role = 'origin';"
    
    log_info "Restore completed successfully"
fi

read -p "Press any key to exit... " -n1 -s
echo 