# ベースイメージを指定
FROM node:20.18.0

# 作業ディレクトリを設定
WORKDIR /app

# # キャッシュ利用で効率化するために別でコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm install --frozen-lockfile --prefer-offline

# # ソースコードをコピー
COPY . .

# # アプリケーションをビルド
RUN npm run build

# # ポート番号を指定
EXPOSE 3000

# # アプリケーションを起動
CMD ["npm","run","dev"]
