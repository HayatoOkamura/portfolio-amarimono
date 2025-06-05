# 栄養素計算機能の実装手順

## 1. データベースの修正

### 1.1 マイグレーションファイルの作成
- [x] `supabase/migrations/`に新しいマイグレーションファイルを作成
  - ファイル名: `001_add_gram_equivalent_to_ingredients.sql`
  - 内容:
    ```sql
    -- up
    ALTER TABLE ingredients ADD COLUMN gram_equivalent FLOAT NOT NULL DEFAULT 100;

    -- down
    ALTER TABLE ingredients DROP COLUMN gram_equivalent;
    ```

### 1.2 既存の具材データの更新
- [x] 既存の具材に対して、適切な`gram_equivalent`値を設定
  - 例：
    ```sql
    -- 個数系単位の具材
    UPDATE ingredients SET gram_equivalent = 50 WHERE name = '卵' AND unit_id = (SELECT id FROM units WHERE name = '個');
    UPDATE ingredients SET gram_equivalent = 3000 WHERE name = 'スイカ' AND unit_id = (SELECT id FROM units WHERE name = '個');
    UPDATE ingredients SET gram_equivalent = 300 WHERE name = 'りんご' AND unit_id = (SELECT id FROM units WHERE name = '個');

    -- 調味料系単位の具材
    UPDATE ingredients SET gram_equivalent = 15 WHERE unit_id = (SELECT id FROM units WHERE name = '大さじ');
    UPDATE ingredients SET gram_equivalent = 5 WHERE unit_id = (SELECT id FROM units WHERE name = '小さじ');
    UPDATE ingredients SET gram_equivalent = 200 WHERE unit_id = (SELECT id FROM units WHERE name = 'カップ');

    -- 質量・容量単位の具材
    UPDATE ingredients SET gram_equivalent = 1000 WHERE unit_id = (SELECT id FROM units WHERE name = 'kg');
    UPDATE ingredients SET gram_equivalent = 1 WHERE unit_id = (SELECT id FROM units WHERE name = 'ml');
    UPDATE ingredients SET gram_equivalent = 1000 WHERE unit_id = (SELECT id FROM units WHERE name = 'L');
    UPDATE ingredients SET gram_equivalent = 1 WHERE unit_id = (SELECT id FROM units WHERE name = 'g');
    ```

## 2. バックエンドの実装

### 2.1 モデルの更新
- [x] `Ingredient`モデルに`gram_equivalent`フィールドを追加
- [x] 具材作成・更新APIのリクエスト/レスポンス構造体を更新

### 2.2 APIエンドポイントの更新
- [x] 具材作成APIの更新
- [x] 具材更新APIの更新
- [x] 具材取得APIの更新

## 3. フロントエンドの実装

### 3.1 型定義の更新
- [x] `Ingredient`インターフェースに`gramEquivalent`フィールドを追加
- [x] 具材作成・編集フォームの型定義を更新

### 3.2 具材フォームの更新
- [x] 具材作成フォームに`gramEquivalent`入力フィールドを追加
- [x] 具材編集フォームに`gramEquivalent`入力フィールドを追加
- [x] 単位に応じたデフォルト値の設定機能を追加

### 3.3 栄養素計算ロジックの更新
- [x] `nutritionCalculator.ts`の計算ロジックを更新
  - 単位の`gramEquivalent`ではなく、具材の`gramEquivalent`を使用するように修正

## 4. テストの実装

### 4.1 バックエンドテスト
- [x] 具材作成APIのテスト更新
- [x] 具材更新APIのテスト更新
- [x] 具材取得APIのテスト更新

### 4.2 フロントエンドテスト
- [x] 栄養素計算ロジックのテストケース作成
  - 異なる具材での計算テスト
  - 異なる単位での計算テスト
  - 端数処理のテスト

## 5. ドキュメントの更新

### 5.1 開発者向けドキュメント
- [ ] 栄養素計算の仕組みの説明
- [ ] `gramEquivalent`の設定ガイドライン
- [ ] 新しい具材を追加する際の注意点

### 5.2 ユーザー向けドキュメント
- [ ] 具材登録時の`gramEquivalent`設定方法の説明
- [ ] 栄養素計算の仕組みの説明

## 6. デプロイ手順

### 6.1 準備
- [ ] データベースのバックアップを取得
- [ ] メンテナンス時間の設定

### 6.2 デプロイ
- [ ] データベースのマイグレーションを実行
- [ ] 既存の具材データを更新
- [ ] バックエンドの新しいコードをデプロイ
- [ ] フロントエンドの新しいコードをデプロイ

### 6.3 検証
- [ ] 既存のレシピの栄養素を再計算
- [ ] 計算結果の正確性を確認
- [ ] エラーログの確認

## 7. モニタリング

### 7.1 パフォーマンスモニタリング
- [ ] 栄養素計算の処理時間をモニタリング
- [ ] データベースの負荷をモニタリング

### 7.2 エラーモニタリング
- [ ] エラーログの監視
- [ ] 異常値の検出

## 注意事項

1. 既存の具材データの更新は慎重に行う
2. デプロイ前に必ずバックアップを取得
3. 段階的なデプロイを検討
4. ユーザーへの影響を最小限に抑える 