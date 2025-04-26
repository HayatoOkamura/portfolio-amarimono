#!/bin/bash

# タイムスタンプとバージョンを生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(git rev-parse --short HEAD)
DUMP_FILE="database_dumps/dump_${TIMESTAMP}_${VERSION}.sql"
CHECKSUM_FILE="database_dumps/last_checksum.txt"

# database_dumpsディレクトリが存在しない場合は作成
mkdir -p database_dumps

# 現在のデータベースの状態を取得
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

# 前回のチェックサムを読み込む
if [ -f "$CHECKSUM_FILE" ]; then
  LAST_CHECKSUM=$(cat "$CHECKSUM_FILE")
else
  LAST_CHECKSUM=""
fi

# データベースのダンプを作成
PGPASSWORD=postgres pg_dump -U postgres -h db -d postgres > "$DUMP_FILE"

# 変更があった場合のみコミット
if [ "$CURRENT_CHECKSUM" = "$LAST_CHECKSUM" ]; then
  echo "No changes in database"
  # 変更がない場合はダンプファイルを削除
  rm "$DUMP_FILE"
else
  echo "Database changes detected"
  echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
  
  # 古いダンプファイルを削除（最新の5つを残す）
  ls -t database_dumps/dump_*.sql | tail -n +6 | xargs -r rm
  
  git add "$DUMP_FILE" "$CHECKSUM_FILE"
  git commit -m "Update database dump ${TIMESTAMP}"
  git push
fi 