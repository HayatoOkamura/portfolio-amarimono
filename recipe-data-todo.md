# レシピデータ生成のToDoリスト

## 最重要：レシピデータ作成の手順
レシピデータは必ず以下の順序で作成すること：

1. recipes.csvの基本情報作成
   - recipe-data-todo.mdから作成するレシピを選択
   - 外部データを参照する必要がない項目（instructions、genre_id、nutrition以外）を設定
   - レシピID、名前、調理時間、費用目安、概要、キャッチフレーズ、FAQを設定

2. genre_idの設定
   - original-data/recipe_genres.csvを参照
   - レシピに適切なジャンルIDを設定

3. recipe_ingredients.csvの作成
   - ingredient_data.csvを参照して具材を選択
   - 外部ファイルの参照が必要な項目は生成しない！（quantity_requiredの登録は不要）

4. recipe_ingredients.csvの値を設定
   - 具材の数量はstepの値に準拠（例：stepが10なら、10、20、30となる）
   - 使用する具材と数量を確定

5. instructionsの設定
   - 確定済みのrecipe_ingredients.csvに基づいて手順を作成
   - 各手順で使用する具材を明記
   - 手順は3-6ステップで、各ステップは50-100文字程度
   - 最後の手順には必ず「〜で完成です。」を含める

6. nutritionの設定
   - 確定済みのrecipe_ingredients.csvの具材の栄養素を合計
   - 合計値をレシピの栄養素として設定

7. image_prompts.jsonの作成
   - 確定済みのinstructionsを参照してプロンプトを作成
   - メイン画像と手順画像のプロンプトを設定

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
- [ ] 各レシピの具材IDは必ず`ingredient_data.csv`を参照して設定する
- [ ] 作成済みのレシピには✓マークを付ける
- [ ] 各レシピの手順は具体的で分かりやすい説明を心がける
- [ ] 各レシピのFAQは実際のユーザーが疑問に思う可能性の高い質問を設定する

## データの整合性に関する重要な注意事項
- [ ] レシピの説明、調理手順、画像プロンプトで言及される具材は、必ず`recipe_ingredients.csv`に含まれていること
- [ ] `recipe_ingredients.csv`に含まれる具材は、必ずレシピの説明、調理手順、画像プロンプトのいずれかで使用されること
- [ ] 新しい具材を使用する場合は、必ず`ingredient_data.csv`を参照して選択すること
- [ ] データの整合性チェックを実行する前に、上記のルールに従っているか確認すること
- [ ] 調理手順（instructions）で使用が明記されていない具材は`recipe_ingredients.csv`から削除すること
- [ ] 調理手順（instructions）で使用が明記されている具材は必ず`recipe_ingredients.csv`に含めること

※ これらの詳細なルールは`./cursor/rules/recipe-data-rules.mdc`にも記載されています。

## ジャンル別レシピ生成計画

### 1. 主菜
- [ ] 肉じゃが
- [ ] ハンバーグ
- [ ] 生姜焼き
- [ ] 鶏の唐揚げ
- [ ] 豚の角煮
- [ ] 鮭の塩焼き
- [ ] 鯖の味噌煮
- [ ] 照り焼きチキン
- [ ] 鶏の南蛮漬け
- [ ] 鶏むね肉のピカタ
- [ ] チキンカツ
- [ ] エビフライ
- [ ] 回鍋肉（ホイコーロー）
- [ ] 麻婆豆腐
- [ ] 豚キムチ炒め
- [ ] 鶏と大根の煮物
- [ ] 鮭のホイル焼き
- [ ] ぶりの照り焼き
- [ ] 鶏団子の甘酢あん
- [ ] 厚揚げと野菜の味噌炒め
- [ ] 鯖の竜田揚げ
- [ ] 鶏手羽元のさっぱり煮
- [ ] 鯵の南蛮漬け
- [ ] 鶏の味噌漬け焼き
- [ ] エビチリ（家庭向け）

### 2. 副菜
- [ ] ほうれん草のごま和え
- [ ] ひじきの煮物
- [ ] きんぴらごぼう
- [ ] 切り干し大根の煮物
- [ ] 冷ややっこ
- [ ] 小松菜のナムル
- [ ] キャベツの塩昆布和え
- [ ] ピーマンとじゃこの炒め物
- [ ] かぼちゃの煮物
- [ ] 長芋の梅和え
- [ ] ミニトマトのマリネ
- [ ] アスパラベーコン炒め
- [ ] ブロッコリーの胡麻和え
- [ ] マカロニサラダ
- [ ] こんにゃくのピリ辛炒め

### 3. 汁物
- [ ] 豆腐とわかめの味噌汁
- [ ] なめこの味噌汁
- [ ] 大根と油揚げの味噌汁
- [ ] じゃがいもの味噌汁
- [ ] 玉ねぎと卵のスープ
- [ ] 野菜たっぷり中華スープ
- [ ] かぼちゃの味噌汁
- [ ] かき玉汁
- [ ] わかめとたまごのスープ
- [ ] 三つ葉の吸い物

### 4. ご飯もの
- [ ] カレーライス
- [ ] 親子丼
- [ ] 牛丼
- [ ] オムライス
- [ ] 炊き込みご飯
- [ ] そぼろ丼（三色丼）
- [ ] チャーハン
- [ ] 焼きおにぎり
- [ ] しらすと大葉の混ぜご飯
- [ ] 高菜チャーハン

### 5. デザート
- [ ] フルーツヨーグルト
- [ ] さつまいも茶巾
- [ ] 手作りゼリー
- [ ] 黒ごまプリン
- [ ] フレンチトースト

### 6. 旬の食材
- [ ] 春キャベツのコールスロー
- [ ] 新玉ねぎのサラダ
- [ ] なすの焼き浸し
- [ ] とうもろこしご飯
- [ ] かぼちゃのそぼろ煮
- [ ] しめじと小松菜の炒め物
- [ ] さつまいもご飯
- [ ] 白菜と豚のミルフィーユ鍋
- [ ] かぶのそぼろ煮
- [ ] ふろふき大根

### 7. 健康・美容
- [ ] 雑穀米のサラダ
- [ ] ブロッコリーとゆで卵のサラダ
- [ ] 鶏むね肉のヨーグルト焼き
- [ ] 豆乳スープ
- [ ] キウイとヨーグルトの和え物
- [ ] ごま豆乳スープ
- [ ] もち麦入り炊き込みご飯
- [ ] ささみの梅しそ焼き
- [ ] トマトとアボカドのサラダ
- [ ] 豆腐ドーナツ

### 8. 時短・簡単
- [ ] 卵チャーハン
- [ ] お茶漬け（梅・鮭）
- [ ] レンジで蒸し野菜
- [ ] ツナときゅうりの和え物
- [ ] レンジ肉じゃが
- [ ] レンジでピーマンおかか和え
- [ ] レンジスクランブルエッグ丼
- [ ] しらすおろし丼
- [ ] しめじのバター醤油炒め
- [ ] 冷ややっこ
- [ ] キャベツの塩昆布和え
- [ ] 小松菜のナムル
- [ ] マカロニサラダ
- [ ] 野菜スープ（コンソメ）
- [ ] きゅうりとわかめの酢の物

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
  },
  {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "ingredient_id": "8",
    "quantity_required": "20"
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
- 8: バター（20g）

## データ生成の優先順位
1. 主菜（最も多い150レシピ）
2. 副菜（100レシピ）
3. 汁物、ご飯もの、デザート、健康・美容（各50レシピ）
4. 旬の食材、時短・簡単（各25レシピ）

## 注意事項
- 各レシピの具材は`ingredient_data.csv`から適切に選択
- 単位は`original-data/units_data.csv`から適切に選択
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
- レシピID: UUID形式（例: a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d）
- レシピ名: 日本語（例: 生姜焼き）
- ジャンルID: 数値（1-8）
- 調理時間: 分単位（例: 20）
- 費用目安: 円単位（例: 500）
- レシピの概要: 日本語（150文字前後）
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
- キャッチフレーズ: 日本語（30文字以内）
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