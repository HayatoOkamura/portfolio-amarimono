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
CHECKSUM_FILE="database_dumps/last_checksum.txt"

log "Dump file will be created at: $DUMP_FILE"

# 現在のデータベースの状態を取得
log "Checking database state..."
CURRENT_CHECKSUM=$(docker exec db psql -U postgres -d postgres -t -c "
  SELECT string_agg(
    format(
      '%s:%s:%s',
      schemaname,
      tablename,
      (SELECT COUNT(*) FROM \"%s\".\"%s\")
    ),
    '|'
  )
  FROM pg_tables
  WHERE schemaname = 'public'
")

log "Current database checksum: $CURRENT_CHECKSUM"

# 前回のチェックサムを読み込む
if [ -f "$CHECKSUM_FILE" ]; then
  LAST_CHECKSUM=$(cat "$CHECKSUM_FILE")
  log "Last checksum from file: $LAST_CHECKSUM"
else
  LAST_CHECKSUM=""
  log "No previous checksum file found"
fi

# データベースのダンプを作成
log "Creating database dump..."
PGPASSWORD=postgres pg_dump -U postgres -h db -d postgres > "$DUMP_FILE"

# ダンプファイルのサイズを確認
DUMP_SIZE=$(stat -f%z "$DUMP_FILE")
log "Dump file size: $DUMP_SIZE bytes"

# 変更があった場合のみコミット
if [ "$CURRENT_CHECKSUM" = "$LAST_CHECKSUM" ]; then
  log "No changes in database detected"
  # 変更がない場合はダンプファイルを削除
  rm "$DUMP_FILE"
else
  log "Database changes detected"
  echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
  
  # 古いダンプファイルを削除（最新の5つを残す）
  log "Cleaning up old dump files..."
  ls -t database_dumps/dump_*.sql | tail -n +6 | xargs -r rm
  
  log "Committing changes..."
  git add "$DUMP_FILE" "$CHECKSUM_FILE"
  git commit -m "Update database dump ${TIMESTAMP}"
  
  log "Pushing changes..."
  git push
fi

log "=== Script completed ===" 