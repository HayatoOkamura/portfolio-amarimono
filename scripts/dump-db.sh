#!/bin/bash

# デバッグ情報の出力
echo "=== Starting dump-db.sh ==="
echo "Current directory: $(pwd)"
echo "Current time: $(date)"

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# mainブランチでない場合は終了
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Not on main branch. Skipping database dump."
  exit 0
fi

# Gitの同期状態を確認
echo "Checking Git synchronization..."
git fetch origin

# ローカルとリモートの差分を確認
LOCAL_COMMITS=$(git rev-list HEAD...origin/develop --count)
REMOTE_COMMITS=$(git rev-list origin/develop...HEAD --count)

if [ "$LOCAL_COMMITS" -gt 0 ] || [ "$REMOTE_COMMITS" -gt 0 ]; then
  echo "Local commits: $LOCAL_COMMITS"
  echo "Remote commits: $REMOTE_COMMITS"
  
  # リモートの変更を取得
  echo "Pulling remote changes..."
  if ! git pull origin develop; then
    echo "Error: Failed to pull changes. Please resolve conflicts manually."
    exit 1
  fi
fi

# データベース接続設定
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_NAME=${DB_NAME:-amarimono}

# タイムスタンプとバージョンを生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(git rev-parse --short HEAD)
DUMP_DIR="database_dumps"
LATEST_DUMP="$DUMP_DIR/dump_${TIMESTAMP}_${VERSION}.sql"
SYMLINK="dump.sql"
STATE_FILE="$DUMP_DIR/last_state.txt"

# ディレクトリの作成
mkdir -p "$DUMP_DIR"
echo "Created/verified dump directory: $DUMP_DIR"

# データベース接続の確認
echo "Checking database connection..."
echo "Using database settings:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo "Database: $DB_NAME"

if ! PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1" 2>&1; then
  echo "Error: Cannot connect to database. Please check if the database container is running."
  echo "Error details:"
  PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1" 2>&1
  exit 1
fi

# 現在のデータベースの状態を取得
echo "Checking database state..."
echo "Executing SQL query to get current state..."
CURRENT_STATE=$(PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
  WITH table_info AS (
    SELECT 
      schemaname,
      tablename,
      (SELECT COUNT(*) FROM \"public\".\"recipes\") as row_count,
      (SELECT md5(string_agg(md5(row_to_json(t)::text), ''))
       FROM (SELECT * FROM \"public\".\"recipes\") t) as data_hash
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
  )
  SELECT string_agg(
    format(
      '%s:%s:%s:%s',
      schemaname,
      tablename,
      row_count,
      data_hash
    ),
    '|'
  )
  FROM table_info;
")

echo "SQL query result: $CURRENT_STATE"

if [ -z "$CURRENT_STATE" ]; then
  echo "Error: Failed to get database state. Please check if tables exist in the public schema."
  exit 1
fi

echo "Current database state: $CURRENT_STATE"

# 前回の状態を読み込む
if [ -f "$STATE_FILE" ]; then
  LAST_STATE=$(cat "$STATE_FILE")
  echo "Last state from file: $LAST_STATE"
  HAS_PREVIOUS_STATE=true
else
  LAST_STATE=""
  echo "No previous state file found - this is the first run"
  HAS_PREVIOUS_STATE=false
fi

# 変更があった場合、または初回実行の場合はダンプを作成
if [ "$HAS_PREVIOUS_STATE" = false ] || [ "$CURRENT_STATE" != "$LAST_STATE" ]; then
  echo "Database changes detected or first run"
  
  # データベースのダンプを作成
  echo "Creating database dump..."
  echo "Dump file path: $LATEST_DUMP"
  
  if ! PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME > "$LATEST_DUMP"; then
    echo "Error: Failed to create database dump. Please check database credentials and connection."
    exit 1
  fi

  # ダンプファイルのサイズを確認
  DUMP_SIZE=$(stat -f%z "$LATEST_DUMP")
  echo "Dump file size: $DUMP_SIZE bytes"

  if [ "$DUMP_SIZE" -eq 0 ]; then
    echo "Error: Created dump file is empty. Please check database content and permissions."
    exit 1
  fi

  # ダンプファイルの内容を確認
  echo "Dump file content preview:"
  head -n 5 "$LATEST_DUMP"

  # 状態を保存
  echo "$CURRENT_STATE" > "$STATE_FILE"
  echo "Saved current state to $STATE_FILE"
  
  # シンボリックリンクを更新
  rm -f "$SYMLINK"
  ln -s "$LATEST_DUMP" "$SYMLINK"
  echo "Updated symlink $SYMLINK to point to $LATEST_DUMP"
  
  # 古いダンプファイルを削除（最新の5つを残す）
  echo "Cleaning up old dump files..."
  ls -t "$DUMP_DIR"/dump_*.sql | tail -n +6 | xargs -r rm
  
  # 変更をコミット
  git add "$LATEST_DUMP" "$STATE_FILE" "$SYMLINK"
  git commit -m "Update database dump ${TIMESTAMP}"
  echo "Committed changes to git"
  
  # プッシュを実行
  echo "Pushing changes..."
  if ! git push origin main; then
    echo "Error: Failed to push changes. Please try again."
    exit 1
  fi
  echo "Successfully pushed changes to main branch"
else
  echo "No changes in database detected"
fi

echo "=== Script completed ===" 