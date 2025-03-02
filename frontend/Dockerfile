# 1. ビルド用のコンテナ
FROM node:20-alpine AS builder
WORKDIR /app

# パッケージ関連のファイルをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# Next.js のビルドを実行
RUN npm run build

# 2. 本番用の軽量コンテナ
FROM node:20-alpine
WORKDIR /app

# 必要なファイルをコピー（package.json, package-lock.json, .next, public）
COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public

# 本番環境の依存関係をインストール
RUN npm ci --omit=dev  

# Next.js を起動
CMD ["npm", "run", "dev"]
