# レシピデータ生成のToDoリスト

## 全体の注意事項
- [ ] 各レシピのIDはUUID形式で生成
- [ ] 各レシピの画像はAdobe Fireflyで生成
- [ ] 各レシピの手順画像もAdobe Fireflyで生成
- [ ] 栄養素は使用する具材の栄養素の合計値を設定
- [ ] 各レシピの具材は2-8種類程度で設定
- [ ] 各レシピの手順は3-6ステップ程度で設定
- [ ] 各レシピの調理時間は15-60分の範囲で設定
- [ ] 各レシピの費用は200-2000円の範囲で設定
- [ ] 各レシピのFAQは1-3問程度で設定
- [ ] 各レシピの最後の手順には必ず「〜で完成です。」という完成を示すステップを含める
- [ ] 各レシピの具材IDは必ず`ingredients_data.json`を参照して設定する

## ジャンル別レシピ生成計画

### 1. 主菜 (150レシピ)
- [ ] 肉料理 (60レシピ)
  - [ ] 牛肉料理 (20レシピ)
    - [ ] ステーキ系 (5レシピ)
    - [ ] 煮込み系 (5レシピ)
    - [ ] 炒め物系 (5レシピ)
    - [ ] その他 (5レシピ)
  - [ ] 豚肉料理 (20レシピ)
    - [ ] とんかつ系 (5レシピ)
    - [ ] 生姜焼き系 (5レシピ)
    - [ ] 煮込み系 (5レシピ)
    - [ ] その他 (5レシピ)
  - [ ] 鶏肉料理 (20レシピ)
    - [ ] 唐揚げ系 (5レシピ)
    - [ ] 照り焼き系 (5レシピ)
    - [ ] 煮込み系 (5レシピ)
    - [ ] その他 (5レシピ)
- [ ] 魚料理 (60レシピ)
  - [ ] 白身魚料理 (20レシピ)
  - [ ] 赤身魚料理 (20レシピ)
  - [ ] 青魚料理 (20レシピ)
- [ ] その他の主菜 (30レシピ)
  - [ ] 豆腐料理 (10レシピ)
  - [ ] 卵料理 (10レシピ)
  - [ ] その他 (10レシピ)

### 2. 副菜 (100レシピ)
- [ ] 野菜料理 (60レシピ)
  - [ ] 根菜類 (20レシピ)
  - [ ] 葉物野菜 (20レシピ)
  - [ ] その他野菜 (20レシピ)
- [ ] きのこ料理 (20レシピ)
- [ ] 海藻料理 (10レシピ)
- [ ] その他副菜 (10レシピ)

### 3. 汁物 (50レシピ)
- [ ] 味噌汁 (15レシピ)
- [ ] スープ (20レシピ)
- [ ] その他汁物 (15レシピ)

### 4. ご飯もの (50レシピ)
- [ ] 丼もの (15レシピ)
- [ ] リゾット・ピラフ (15レシピ)
- [ ] 炊き込みご飯 (10レシピ)
- [ ] その他ご飯もの (10レシピ)

### 5. デザート (50レシピ)
- [ ] 和菓子 (15レシピ)
- [ ] 洋菓子 (20レシピ)
- [ ] その他デザート (15レシピ)

### 6. 旬の食材 (25レシピ)
- [ ] 春の食材 (5レシピ)
- [ ] 夏の食材 (5レシピ)
- [ ] 秋の食材 (5レシピ)
- [ ] 冬の食材 (5レシピ)
- [ ] 通年食材 (5レシピ)

### 7. 健康・美容 (50レシピ)
- [ ] 低カロリー料理 (15レシピ)
- [ ] 栄養バランス料理 (20レシピ)
- [ ] 美容効果のある料理 (15レシピ)

### 8. 時短・簡単 (25レシピ)
- [ ] 15分以内で作れる料理 (10レシピ)
- [ ] 電子レンジで作れる料理 (10レシピ)
- [ ] その他簡単料理 (5レシピ)

## 画像生成プロンプトの例
### レシピ画像
- [ ] メイン画像プロンプト例：
  ```
  高品質な料理写真、[料理名]、[特徴的な要素]、[盛り付けスタイル]、[背景スタイル]、プロフェッショナルな料理写真
  ```

### 手順画像
- [ ] 手順画像プロンプト例：
  ```
  料理の手順写真、[具体的な手順]、[使用する調理器具]、[食材の状態]、[調理の進行状況]、プロフェッショナルな料理写真
  ```

## レシピエントリーのサンプル
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "和風ハンバーグ",
  "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/main.webp",
  "genre_id": 1,
  "instructions": [
    {
      "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/instructions/step1.webp",
      "stepNumber": 1,
      "description": "玉ねぎをみじん切りにし、フライパンで透き通るまで炒めます。"
    },
    {
      "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/instructions/step2.webp",
      "stepNumber": 2,
      "description": "ボウルに合い挽き肉、炒めた玉ねぎ、パン粉、卵、塩こしょうを入れ、粘りが出るまでよく混ぜます。"
    },
    {
      "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/instructions/step3.webp",
      "stepNumber": 3,
      "description": "手で丸めながら空気を抜き、小判型に成形します。"
    },
    {
      "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/instructions/step4.webp",
      "stepNumber": 4,
      "description": "フライパンに油を熱し、中火で両面を焼きます。"
    },
    {
      "image_url": "recipes/550e8400-e29b-41d4-a716-446655440000/instructions/step5.webp",
      "stepNumber": 5,
      "description": "和風ソース（しょうゆ、みりん、酒）を加え、中火で煮詰めます。"
    }
  ],
  "cooking_time": 30,
  "cost_estimate": 800,
  "summary": "和風の味わいが特徴的なハンバーグです。玉ねぎの甘みと和風ソースの相性が抜群で、ご飯が進む一品です。",
  "nutrition": {
    "fat": 15.2,
    "salt": 1.8,
    "protein": 18.5,
    "calories": 450,
    "carbohydrates": 25.3
  },
  "catchphrase": "玉ねぎの甘みが効いた、和風ソースで仕上げる絶品ハンバーグ",
  "faq": [
    {
      "question": "パン粉の代わりに何を使えますか？",
      "answer": "パン粉の代わりに、おからパウダーや豆腐を崩したものを使用することができます。その場合は、水分量を調整する必要があります。"
    },
    {
      "question": "冷凍保存は可能ですか？",
      "answer": "はい、焼いたハンバーグを冷凍保存できます。保存期間は約1ヶ月です。食べる際は電子レンジで温めるか、フライパンで再加熱してください。"
    }
  ],
  "user_id": "6fbaf02f-ad06-4bee-966b-48407c7af8cb",
  "is_public": true,
  "is_draft": false,
  "created_at": "2024-03-20 10:00:00.000000",
  "updated_at": "2024-03-20 10:00:00.000000"
}
```

### レシピ画像生成プロンプトの例（和風ハンバーグ）
```
高品質な料理写真、和風ハンバーグ、玉ねぎの甘みが効いた、和風ソースがかかった、白いお皿に盛り付け、木目調のテーブル、プロフェッショナルな料理写真
```

### 手順画像生成プロンプトの例（和風ハンバーグ）
1. ```
   料理の手順写真、玉ねぎをみじん切りにする、まな板の上で、包丁で、プロフェッショナルな料理写真
   ```
2. ```
   料理の手順写真、ハンバーグのタネを混ぜる、ボウルの中で、手で、プロフェッショナルな料理写真
   ```
3. ```
   料理の手順写真、ハンバーグを成形する、手のひらで、小判型に、プロフェッショナルな料理写真
   ```
4. ```
   料理の手順写真、ハンバーグを焼く、フライパンで、中火で、プロフェッショナルな料理写真
   ```
5. ```
   料理の手順写真、和風ソースをかける、フライパンで、煮詰める、プロフェッショナルな料理写真
   ```

### レシピ具材データのサンプル（和風ハンバーグ）
```json
[
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "1",
    "quantity_required": "300"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "2",
    "quantity_required": "1"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "3",
    "quantity_required": "1"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "4",
    "quantity_required": "2"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "5",
    "quantity_required": "1"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "6",
    "quantity_required": "2"
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "7",
    "quantity_required": "1"
  }
]
```

※ 具材IDの対応例：
- 1: 合い挽き肉
- 2: 玉ねぎ
- 3: パン粉
- 4: 卵
- 5: しょうゆ
- 6: みりん
- 7: 酒

## データ生成の優先順位
1. 主菜（最も多い150レシピ）
2. 副菜（100レシピ）
3. 汁物、ご飯もの、デザート、健康・美容（各50レシピ）
4. 旬の食材、時短・簡単（各25レシピ）

## 注意事項
- 各レシピの具材は`ingredients_data.json`から適切に選択
- 単位は`units_data.json`から適切に選択
- 栄養素は使用する具材の栄養素を合計して設定
- 各レシピの画像はAdobe Fireflyで生成する際のプロンプトを詳細に記載
- 各レシピの手順は具体的で分かりやすい説明を心がける
- FAQは実際のユーザーが疑問に思う可能性のある質問を想定して作成

## 生成するファイル形式
Supabaseのデータベースに直接インポートするために、以下の形式でファイルを生成します。

### ディレクトリ構成
```
recipe-data/
├── csv/
│   ├── recipes.csv
│   └── recipe_ingredients.csv
├── sql/
│   ├── recipes.sql
│   └── recipe_ingredients.sql
└── prompts/
    └── image_prompts.json
```

### CSVファイル形式
1. `recipes.csv`:
```csv
id,name,image_url,genre_id,cooking_time,cost_estimate,summary,nutrition,catchphrase,instructions,user_id,is_public,is_draft,created_at,updated_at
a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d,生姜焼き,recipes/a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d/main.webp,1,20,600,"定番の和食、生姜焼きです。",{"fat":12.5,"salt":1.2,"protein":25.8,"calories":380,"carbohydrates":15.2},"生姜の香りが食欲をそそる、定番の和食",[{"image_url":"recipes/a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d/instructions/step1.webp","stepNumber":1,"description":"豚肉を食べやすい大きさに切ります。"}],6fbaf02f-ad06-4bee-966b-48407c7af8cb,true,false,2024-03-20 10:00:00.000000,2024-03-20 10:00:00.000000
```

2. `recipe_ingredients.csv`:
```csv
recipe_id,ingredient_id,quantity_required
a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d,1,200
a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d,2,1
a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d,3,2
```

### SQLファイル形式
1. `recipes.sql`:
```sql
INSERT INTO recipes (id, name, image_url, genre_id, cooking_time, cost_estimate, summary, nutrition, catchphrase, instructions, user_id, is_public, is_draft, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
  '生姜焼き',
  'recipes/a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d/main.webp',
  1,
  20,
  600,
  '定番の和食、生姜焼きです。',
  '{"fat":12.5,"salt":1.2,"protein":25.8,"calories":380,"carbohydrates":15.2}',
  '生姜の香りが食欲をそそる、定番の和食',
  '[{"image_url":"recipes/a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d/instructions/step1.webp","stepNumber":1,"description":"豚肉を食べやすい大きさに切ります。"}]',
  '6fbaf02f-ad06-4bee-966b-48407c7af8cb',
  true,
  false,
  '2024-03-20 10:00:00.000000',
  '2024-03-20 10:00:00.000000'
);
```

2. `recipe_ingredients.sql`:
```sql
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required) VALUES
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 1, 200),
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 2, 1),
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 3, 2);
```

### 画像生成プロンプト
`prompts/image_prompts.json`:
```json
{
  "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d": {
    "main_image": "高品質な料理写真、生姜焼き、玉ねぎと豚肉の炒め物、しょうがの香りが漂う、白いご飯の横に盛り付け、木目調のテーブル、プロフェッショナルな料理写真",
    "step_images": [
      "料理の手順写真、豚肉を切る、まな板の上で、包丁で、プロフェッショナルな料理写真",
      "料理の手順写真、玉ねぎを薄切りにする、まな板の上で、包丁で、プロフェッショナルな料理写真"
    ]
  }
}
```

### ファイル生成の注意点
- CSVファイルはUTF-8エンコーディングで保存
- 日時はISO 8601形式（YYYY-MM-DD HH:MM:SS.SSSSSS）
- JSONデータは適切にエスケープ
- 画像URLは相対パスで指定
- 各ファイルのヘッダー行はSupabaseのテーブルカラム名と一致させる
- instructionsはJSONB形式で保存（配列として）

## レシピの材料情報
- `recipe_ingredients.csv` の `ingredient_id` は `ingredients_data.json` の `id` フィールドを参照する
- 材料名の表記ゆれや別名を考慮して検索する（例: 「しょうゆ」→「醤油」、「生姜」→「しょうが」）
- 材料が存在しない場合は、類似の材料で代用する（例: 「カレールー」が存在しない場合→「カレー粉」で代用）
- 材料IDは必ず`ingredients_data.json`から取得し、直接数値を指定しない
- 材料の単位は`units_data.json`の`unit_id`を参照する

## レシピの材料情報
- レシピID: UUID形式（例: a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d）
- レシピ名: 日本語（例: 生姜焼き）
- ジャンルID: 数値（1-8）
- 調理時間: 分単位（例: 20）
- 費用目安: 円単位（例: 500）
- レシピの概要: 日本語（100-200文字）
- 栄養情報: JSON形式
  ```json
  {
    "fat": 数値,
    "salt": 数値,
    "protein": 数値,
    "calories": 数値,
    "carbohydrates": 数値
  }
  ```
- キャッチフレーズ: 日本語（30-50文字）
- FAQ: JSON形式
  ```json
  [
    {
      "question": "質問文",
      "answer": "回答文"
    }
  ]
  ```

## レシピの手順情報
- 手順番号: 1から始まる連番
- 手順の説明: 日本語（50-100文字）
- 手順画像のプロンプト: 以下の形式で詳細に記述（英語）
  ```
  Step 1：手順のタイトル（日本語）
  Step-by-step cooking photo, [specific action being performed], [tools and ingredients state], [cooking environment details], [lighting condition], [camera angle], [background details], professional food photography
  ```
- 最後の手順: 必ず「〜で完成です。」という完成を示すステップを含める（例：「お皿に盛り付け、好みの焼き加減で完成です。」）

## レシピ画像のプロンプト
以下の形式で詳細に記述（日本語）：
```
日本の家庭料理、[料理名]、[盛り付けの詳細]、[食材の状態や調理状態]、[添え物や付け合わせ]、[食器やテーブルの状態]、[光の状態]、[雰囲気]、[撮影アングル]、プロフェッショナルな料理写真
```

## 画像生成の注意点
- レシピ画像: 完成した料理の全体像
- 手順画像: 各手順の具体的な作業状況
- 画像サイズ: 1024x1024
- 画像形式: WebP
- 画像品質: 高品質（90%以上）
- 画像の保存先: recipes/[レシピID]/[画像ID].webp

## データの整合性チェック
- レシピIDの一貫性
- 材料IDの存在確認
- 手順番号の連続性
- 画像ファイルの存在確認
- 必須フィールドの入力確認 