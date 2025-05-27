# 具材の単位実装 TODO

## 1. データベース修正

### 1.1 units テーブルの修正
- [ ] `unit_type` カラムの追加
  ```sql
  ALTER TABLE units ADD COLUMN unit_type VARCHAR(20) NOT NULL DEFAULT 'quantity';
  ```
- [ ] 既存の単位データの更新
  ```sql
  -- 数量型単位
  UPDATE units SET unit_type = 'quantity' WHERE name IN ('g', 'ml', '個', '本', '枚', '房', '株', '袋', '缶', '匹', '尾', 'パック', '切れ');
  
  -- 存在型単位
  UPDATE units SET unit_type = 'presence' WHERE name = 'presence';
  ```

### 1.2 マイグレーションファイルの作成
- [ ] `supabase/migrations/YYYYMMDDHHMMSS_add_unit_type.sql` の作成
- [ ] マイグレーションの実行

## 2. バックエンド修正

### 2.1 型定義の修正
- [ ] `backend/models/unit_type.go` の修正
  ```go
  type Unit struct {
    ID          int    `json:"id"`
    Name        string `json:"name"`
    Description string `json:"description"`
    Step        int    `json:"step"`
    UnitType    string `json:"unitType"`
  }
  ```

### 2.2 ハンドラーの修正
- [ ] `backend/handlers/recipes.go` の修正
  - [ ] レシピ検索時のpresenceタイプ処理修正
    - presenceタイプの具材は数量に関係なく存在するかどうかだけで判定
  - [ ] 調味料タイプの処理追加
    - 大さじ、小さじなどの数量指定を可能に

### 2.3 サービス層の修正
- [ ] `backend/services/recipe.go` の修正
  - [ ] 調味料の存在/非存在判定ロジック
  - [ ] 単位変換ロジック
  - [ ] レシピ検索時の単位タイプ考慮

## 3. フロントエンド修正

### 3.1 型定義の修正
- [ ] `frontend/app/types/index.ts` の修正
  ```typescript
  export type UnitType = 'quantity' | 'presence';
  
  export interface Unit {
    id: number;
    name: string;
    description: string;
    step: number;
    unitType: UnitType;
  }
  ```

### 3.2 コンポーネントの修正
- [ ] `frontend/app/components/ui/Cards/SearchIngredientCard/SearchIngredientCard.tsx` の修正
  - [ ] 調味料の存在/非存在判定
  - [ ] レシピ検索時と登録時の動作分岐
    - レシピ検索時：数量の増減ができない（存在/非存在のみ）
    - レシピ登録時：大さじ、小さじなどの数量を指定可能

- [ ] `frontend/app/components/ui/Cards/IngredientCard/IngredientCard.tsx` の修正
  - [ ] 調味料表示時の数量表示修正
  - [ ] 数量変更UIの制御
  - [ ] レシピ検索時と登録時の動作分岐

- [ ] `frontend/app/components/admin/IngredientForm.tsx` の修正
  - [ ] 単位選択の制御
  - [ ] 調味料ジャンル時の単位制限

- [ ] `frontend/app/components/RecipeForm.tsx` の修正
  - [ ] 調味料の単位選択モーダル
  - [ ] 具材選択ロジックの修正

### 3.3 カスタムフックの修正
- [ ] `frontend/app/hooks/recipes.ts` の修正
  - [ ] レシピ検索時の調味料処理
  - [ ] レシピ作成時の単位変換
  - [ ] 単位タイプに基づく処理分岐

- [ ] `frontend/app/hooks/ingredients.ts` の修正
  - [ ] 具材データの型定義更新
  - [ ] 単位関連の処理修正

### 3.4 ストアの修正
- [ ] `frontend/app/stores/ingredientStore.ts` の修正
  - [ ] 単位関連の状態管理
  - [ ] 調味料の存在/非存在管理
  - [ ] レシピ検索時と登録時の状態分岐

## 4. テスト

### 4.1 バックエンドテスト
- [ ] 単位タイプのバリデーションテスト
- [ ] レシピ検索時の調味料処理テスト
- [ ] レシピ作成時の単位変換テスト
- [ ] presenceタイプの具材検索テスト

### 4.2 フロントエンドテスト
- [ ] 具材選択コンポーネントのテスト
- [ ] レシピフォームのテスト
- [ ] 単位選択モーダルのテスト
- [ ] レシピ検索時と登録時の動作テスト

## 5. ドキュメント

### 5.1 API仕様書の更新
- [ ] 単位タイプの説明追加
- [ ] エンドポイントの仕様更新
- [ ] 調味料処理の説明追加

### 5.2 フロントエンドドキュメントの更新
- [ ] コンポーネントの使用方法更新
- [ ] 型定義の説明追加
- [ ] レシピ検索時と登録時の動作説明

## 6. デプロイ

### 6.1 データベース更新
- [ ] マイグレーションの実行
- [ ] 既存データの更新

### 6.2 アプリケーション更新
- [ ] バックエンドのデプロイ
- [ ] フロントエンドのデプロイ

## 7. 動作確認

### 7.1 機能確認
- [ ] 具材登録時の単位選択
- [ ] レシピ検索時の調味料処理
- [ ] レシピ作成時の単位選択
- [ ] presenceタイプの具材検索
- [ ] 調味料の数量指定

### 7.2 エッジケース確認
- [ ] 既存データの互換性
- [ ] エラーハンドリング
- [ ] パフォーマンス
- [ ] レシピ検索時と登録時の動作確認 