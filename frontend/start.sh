#!/bin/sh

# node_modulesが存在しない場合はインストール
if [ ! -d "/app/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Next.jsを起動
echo "Starting Next.js..."
npm run dev 