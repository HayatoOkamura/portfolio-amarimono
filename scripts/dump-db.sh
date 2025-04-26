#!/bin/bash

# ログファイルの設定
LOG_FILE="database_dumps/dump_$(date +%Y%m%d_%H%M%S).log"
mkdir -p database_dumps

# ログ出力関数
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# デバッグ情報の出力
log "=== Starting dump-db.sh ==="
log "Current directory: $(pwd)"
log "Current time: $(date)"
log "Git status:"
git status | tee -a "$LOG_FILE"

# タイムスタンプとバージョンを生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(git rev-parse --short HEAD)
DUMP_FILE="database_dumps/dump_${TIMESTAMP}_${VERSION}.sql"
STATE_FILE="database_dumps/last_state.txt"

log "Dump file will be created at: $DUMP_FILE"

# 現在のデータベースの状態を取得
log "Checking database state..."
CURRENT_STATE=$(docker exec db psql -U postgres -d postgres -t -c "
  WITH table_info AS (
    SELECT 
      schemaname,
      tablename,
      (SELECT COUNT(*) FROM \"\".schemaname.\"\" || '.' || \"\".tablename.\"\") as row_count,
      (SELECT md5(string_agg(md5(row_to_json(t)::text), ''))
       FROM (SELECT * FROM \"\".schemaname.\"\" || '.' || \"\".tablename.\"\") t) as data_hash
    FROM pg_tables
    WHERE schemaname = 'public'
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

log "Current database state: $CURRENT_STATE"

# 前回の状態を読み込む
if [ -f "$STATE_FILE" ]; then
  LAST_STATE=$(cat "$STATE_FILE")
  log "Last state from file: $LAST_STATE"
  HAS_PREVIOUS_STATE=true
else
  LAST_STATE=""
  log "No previous state file found - this is the first run"
  HAS_PREVIOUS_STATE=false
fi

# データベースのダンプを作成
log "Creating database dump..."
PGPASSWORD=postgres pg_dump -U postgres -h db -d postgres > "$DUMP_FILE"

# ダンプファイルのサイズを確認
DUMP_SIZE=$(stat -f%z "$DUMP_FILE")
log "Dump file size: $DUMP_SIZE bytes"

# 変更があった場合、または初回実行の場合はコミット
if [ "$HAS_PREVIOUS_STATE" = false ] || [ "$CURRENT_STATE" != "$LAST_STATE" ]; then
  log "Database changes detected or first run"
  echo "$CURRENT_STATE" > "$STATE_FILE"
  
  # 古いダンプファイルを削除（最新の5つを残す）
  log "Cleaning up old dump files..."
  ls -t database_dumps/dump_*.sql | tail -n +6 | xargs -r rm
  
  log "Committing changes..."
  git add "$DUMP_FILE" "$STATE_FILE"
  git commit -m "Update database dump ${TIMESTAMP}"
  
  log "Pushing changes..."
  git push
else
  log "No changes in database detected"
  # 変更がない場合はダンプファイルを削除
  rm "$DUMP_FILE"
fi

log "=== Script completed ===" 