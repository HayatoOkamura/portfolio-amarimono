# 開発環境用のコンテナ
FROM node:20-alpine
WORKDIR /frontend

# 環境変数を設定
ENV NODE_ENV=development
ENV NEXT_PUBLIC_BACKEND_URL=http://backend:8080
ENV NEXT_PUBLIC_IMAGE_BASE_URL=http://backend:8080
ENV WATCHPACK_POLLING=false
ENV CHOKIDAR_USEPOLLING=false
ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_arch=arm64
ENV NODE_OPTIONS=--max-old-space-size=4096

# Supabaseの環境変数はcompose.ymlから注入されるため、ここでは設定しない

# パッケージ関連のファイルをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# ディレクトリの所有権を変更
RUN chown -R node:node /frontend

# .nextディレクトリの作成とパーミッション設定
RUN rm -rf /frontend/.next && \
    mkdir -p /frontend/.next && \
    chown -R node:node /frontend/.next && \
    chmod 755 /frontend/.next

# nodeユーザーに切り替え
USER node

# Next.js を起動
CMD ["npm", "run", "dev"]
