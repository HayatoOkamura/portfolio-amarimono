# ベースイメージを指定
FROM golang:latest AS builder
# コンテナ内の作業ディレクトリを指定
WORKDIR /app

# 必要なツールをインストール
RUN apt-get update && apt-get install -y wget tar

# golang-migrate をアーキテクチャに応じてインストール
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi && \
    if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi && \
    wget https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-$ARCH.tar.gz && \
    tar -xzvf migrate.linux-$ARCH.tar.gz && \
    mv migrate /usr/local/bin/ && \
    rm migrate.linux-$ARCH.tar.gz

# ローカルのソースコードをコンテナにコピー
COPY . .
# 必要なパッケージをインストール
RUN go mod download
# アプリケーションをビルド
RUN go build -o main .

# 最小限のランタイムイメージを作成
FROM golang:latest
WORKDIR /app

# golang-migrateとアプリケーションのバイナリをコピー
COPY --from=builder /usr/local/bin/migrate /usr/local/bin/migrate
COPY --from=builder /app/main /app/main
# migrationsディレクトリは必要に応じて後で追加

# 環境変数の設定
ENV USE_SUPABASE=true
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV GOOGLE_CLOUD_TRANSLATION_API_KEY=${GOOGLE_CLOUD_TRANSLATION_API_KEY}

# 公開予定のコンテナのポートを明示
EXPOSE 8080

# アプリケーションを実行
CMD ["./main"]
