# Prepared Statement エラー修正 TODO

## 概要
`ERROR: prepared statement "stmtcache_..." already exists (SQLSTATE 42P05)` エラーの段階的検証と修正

## 現在の状況
- エラーが継続的に発生
- 複数の対策を実施済みだが解決していない
- 段階的な検証が必要

---

## Phase 1: 基本設定の確認と修正

### 1.1 GORM設定の完全無効化
**目的**: prepared statementを完全に無効化してエラーの根本原因を確認

**修正ファイル**: `backend/db/connection.go`
**修正内容**:
```go
// GORMの初期化
database, err := gorm.Open(postgres.New(postgres.Config{
    DSN:                  dsn,
    PreferSimpleProtocol: true,  // prepared statementを完全に無効化
    PrepareStmt:          false, // GORMレベルでも無効化
}), &gorm.Config{
    // ... 他の設定
})
```

**必要な情報**:
- JSONBデータの処理に影響がないか確認
- パフォーマンスへの影響を測定

**検証方法**:
- アプリケーションを再デプロイ
- prepared statementエラーの発生を監視
- JSONBデータの保存・取得をテスト

---

### 1.2 接続プール設定の最小化
**目的**: 接続数を最小限に抑えて競合を回避

**修正ファイル**: `backend/db/connection.go`
**修正内容**:
```go
// 本番環境用の設定（最小限）
sqlDB.SetMaxIdleConns(0)                   // アイドル接続を完全に無効化
sqlDB.SetMaxOpenConns(1)                   // 接続数を1に制限
sqlDB.SetConnMaxLifetime(1 * time.Minute)  // 接続寿命を短縮
sqlDB.SetConnMaxIdleTime(30 * time.Second) // アイドル時間を短縮
```

**必要な情報**:
- 同時リクエスト数の制限
- レスポンス時間への影響

**検証方法**:
- 複数のリクエストを同時送信
- レスポンス時間を測定
- エラーレートを監視

---

## Phase 2: 環境設定の検証

### 2.1 Supabase接続設定の確認
**目的**: Supabaseの接続設定が正しいか確認

**確認ファイル**: 
- `.env` (ローカル環境)
- Render環境変数

**確認項目**:
- `USE_POOLER` の設定値
- `SUPABASE_DB_HOST` の形式
- 接続文字列の詳細

**必要な情報**:
- Supabaseプロジェクトの設定
- 接続プールの有効/無効状態
- データベースのホスト名形式

**検証方法**:
- 接続ログの詳細確認
- 異なる接続設定でのテスト

---

### 2.2 Render設定の確認
**目的**: Renderの設定がprepared statementエラーに影響していないか確認

**確認項目**:
- Instance Type設定
- 環境変数の設定
- デプロイ設定

**必要な情報**:
- Renderダッシュボードの設定画面
- 環境変数の一覧
- デプロイログ

**検証方法**:
- 設定の再確認
- 異なる設定でのテスト

---

## Phase 3: アプリケーション構造の検証

### 3.1 ハンドラーでのprepared statement使用確認
**目的**: どのハンドラーでprepared statementエラーが発生しているか特定

**確認ファイル**: `backend/handlers/admin.go:44`
**修正内容**:
```go
// エラーが発生している箇所にログを追加
log.Printf("🔍 Executing query at line 44: %s", query)
```

**必要な情報**:
- エラーが発生する具体的なクエリ
- エラーが発生するタイミング
- 関連するハンドラー

**検証方法**:
- 詳細なログ出力
- エラー発生箇所の特定

---

### 3.2 トランザクション処理の確認
**目的**: トランザクション内でのprepared statement使用を確認

**確認ファイル**:
- `backend/handlers/admin.go`
- その他のハンドラーファイル

**修正内容**:
```go
// トランザクション開始時にログを追加
log.Printf("🔄 Starting transaction")
tx := h.DB.Begin()
log.Printf("✅ Transaction started successfully")
```

**必要な情報**:
- トランザクションの使用箇所
- トランザクション内のクエリ
- エラーハンドリング

**検証方法**:
- トランザクションログの確認
- エラー発生タイミングの特定

---

## Phase 4: 根本的な解決策の実装

### 4.1 カスタムprepared statement管理
**目的**: GORMのprepared statement管理をカスタマイズ

**修正ファイル**: `backend/db/connection.go`
**修正内容**:
```go
// カスタムprepared statement管理
type CustomPreparedStatementManager struct {
    // 実装詳細
}

// 接続ごとにユニークなprepared statement名を生成
func generateUniqueStatementName() string {
    return fmt.Sprintf("stmt_%s_%d", time.Now().Format("20060102150405"), rand.Intn(1000))
}
```

**必要な情報**:
- prepared statementの命名規則
- 接続管理の詳細
- エラーハンドリング

**検証方法**:
- カスタム管理の実装
- エラー発生の監視

---

### 4.2 接続分離の実装
**目的**: 各リクエストで独立した接続を使用

**修正ファイル**: `backend/db/connection.go`
**修正内容**:
```go
// リクエストごとに新しい接続を作成
func (h *Handler) getNewConnection() (*gorm.DB, error) {
    // 新しい接続の作成ロジック
}
```

**必要な情報**:
- 接続作成のオーバーヘッド
- リソース使用量
- パフォーマンスへの影響

**検証方法**:
- 接続作成時間の測定
- メモリ使用量の監視
- レスポンス時間の確認

---

## Phase 5: 代替案の検討

### 5.1 データベースドライバーの変更
**目的**: 異なるPostgreSQLドライバーの使用を検討

**検討項目**:
- `lib/pq` への変更
- `pgx` への変更
- その他のドライバー

**必要な情報**:
- 各ドライバーの特性
- GORMとの互換性
- パフォーマンス比較

**検証方法**:
- ドライバーの変更
- 機能テスト
- パフォーマンステスト

---

### 5.2 アーキテクチャの変更
**目的**: アプリケーションアーキテクチャの見直し

**検討項目**:
- マイクロサービス化
- 接続プールの分離
- データベース接続の最適化

**必要な情報**:
- 現在のアーキテクチャ
- 変更の影響範囲
- 実装コスト

**検証方法**:
- アーキテクチャ設計
- 段階的な移行
- テストと検証

---

## 検証手順

### 1. 各Phaseの実行順序
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

### 2. 検証の進め方
```
1. 修正を実装
2. アプリケーションをデプロイ
3. エラーの監視（24時間）
4. 結果を評価
5. 次のPhaseに進む
```

### 3. 成功基準
```
- prepared statementエラーが発生しない
- アプリケーションが正常に動作
- パフォーマンスが許容範囲内
- JSONBデータが正常に処理される
```

---

## 注意事項

### 1. 修正の影響
- 各修正が他の機能に影響しないか確認
- パフォーマンスへの影響を測定
- ユーザー体験への影響を評価

### 2. ロールバック計画
- 各Phaseでロールバック可能な状態を維持
- 修正前の設定をバックアップ
- 緊急時の対応手順を準備

### 3. 監視とログ
- 詳細なログ出力を維持
- エラー発生の監視を継続
- パフォーマンスメトリクスの収集

---

## 完了条件

### 1. 短期目標
- prepared statementエラーの発生を90%以上削減
- アプリケーションの安定性を確保

### 2. 長期目標
- prepared statementエラーの完全解決
- スケーラブルなアーキテクチャの実現
- パフォーマンスの最適化 