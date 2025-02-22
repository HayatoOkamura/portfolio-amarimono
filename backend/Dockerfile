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

# 公開予定のコンテナのポートを明示
EXPOSE 8080
# アプリケーションを実行

# migrationsを使用しない場合はこちら(データベースを更新しないので実行が早い)
CMD ["go", "run", "main.go"]

# migrationsを使用する場合はこちら(データベースを更新するが実行が遅い)
# CMD ["/bin/sh", "-c", "migrate -path /app/db/migrations -database 'postgres://postgres:password@db:5432/db?sslmode=disable' up && ./main"]
