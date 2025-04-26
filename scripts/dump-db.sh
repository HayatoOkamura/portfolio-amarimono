#!/bin/bash

# タイムスタンプとバージョンを生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(git rev-parse --short HEAD)
DUMP_FILE="database_dumps/dump_${TIMESTAMP}_${VERSION}.sql"

# database_dumpsディレクトリが存在しない場合は作成
mkdir -p database_dumps

# データベースのダンプを作成
PGPASSWORD=postgres pg_dump -U postgres -h localhost -d postgres > "$DUMP_FILE"

# 変更があった場合のみコミット
if git diff --quiet "$DUMP_FILE"; then
  echo "No changes in database"
  # 変更がない場合はダンプファイルを削除
  rm "$DUMP_FILE"
else
  echo "Database changes detected"
  
  # 古いダンプファイルを削除（最新の5つを残す）
  ls -t database_dumps/dump_*.sql | tail -n +6 | xargs -r rm
  
  git add "$DUMP_FILE"
  git commit -m "Update database dump ${TIMESTAMP}"
  git push
fi 