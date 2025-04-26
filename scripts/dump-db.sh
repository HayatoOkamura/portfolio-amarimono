#!/bin/bash

# データベースのダンプを作成
PGPASSWORD=postgres pg_dump -U postgres -h localhost -d postgres > dump.sql

# 変更があった場合のみコミット
if git diff --quiet dump.sql; then
  echo "No changes in database"
  # 変更がない場合はdump.sqlを削除
  rm dump.sql
else
  echo "Database changes detected"
  git add dump.sql
  git commit -m "Update database dump"
  git push
fi 