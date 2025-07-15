# パフォーマンス最適化 TODO

## 概要
TOPページのLighthouseパフォーマンススコア33を85-90に改善するためのTODOリスト

**現在の状況:**
- First Contentful Paint: 2.4秒
- Largest Contentful Paint: 56.2秒
- Total Blocking Time: 8,250ms
- Speed Index: 10.7秒
- パフォーマンススコア: 33

**目標:**
- First Contentful Paint: 1.5秒以下
- Largest Contentful Paint: 2.5秒以下
- Total Blocking Time: 300ms以下
- Speed Index: 3.4秒以下
- パフォーマンススコア: 85-90

---

## 🔥 高優先度（即座に実装）

### 1. 画像最適化の改善

#### 1.1 BaseIngredientCard.tsxの画像最適化
- [✔︎] `frontend/app/components/ui/Cards/BaseIngredientCard/BaseIngredientCard.tsx`を修正
- [✔︎] `priority={false}`を追加（重要でない画像）
- [✔︎] `loading="lazy"`を明示的に追加
- [✔︎] `sizes`属性を追加（レスポンシブ対応）
- [✔︎] 適切な`width`と`height`を指定

```typescript
<Image
  src={ingredient.imageUrl ? `${imageBaseUrl}/${ingredient.imageUrl}` : "/pic_ingredient_default.webp"}
  alt={ingredient.name}
  width={100}
  height={100}
  priority={false}
  loading="lazy"
  sizes="(max-width: 768px) 50vw, 25vw"
/>
```

#### 1.2 他の画像コンポーネントの最適化
- [✔︎] `RecipeCard.tsx`の画像最適化
- [✔︎] `IngredientList.tsx`の画像最適化
- [✔︎] `GenerateRecipe.tsx`の画像最適化
- [✔︎] 全ての画像に適切な`loading="lazy"`を追加

### 2. Lottieアニメーションの最適化

#### 2.1 Loading.tsxの最適化
- [✔︎] `frontend/app/components/ui/Loading/Loading.tsx`を修正
- [✔︎] 明示的なサイズ指定を追加
- [✔︎] アニメーションの軽量化

```typescript
<DotLottieReact
  src="https://lottie.host/593f8704-611e-44a2-8442-c42fc8e8d3fc/5hnEEVP1Y6.lottie"
  loop
  autoplay
  className={styles.loading_block__lottie}
  style={{ width: '100%', height: 'auto' }}
/>
```

#### 2.2 RecipeLoading.tsxの最適化
- [✔︎] `frontend/app/components/ui/Loading/RecipeLoading.tsx`を修正
- [✔︎] 同様の最適化を適用

### 3. 未使用CSS/JSの削除

#### 3.1 未使用ライブラリの特定と削除
- [✔︎] `@chakra-ui/next-js`の使用状況確認
- [✔︎] `@chakra-ui/react`の使用状況確認
- [✔︎] `framer-motion`の使用状況確認
- [✔︎] `react-joyride`の使用状況確認
- [✔︎] `swiper`の使用状況確認
- [✔︎] 未使用ライブラリを`package.json`から削除

#### 3.2 CSS最適化
- [ ] 未使用のCSSクラスを特定
- [ ] 重複するCSSルールを統合
- [ ] CSSの最小化を確認

---

## ⚡ 中優先度（1-2週間以内）

### 4. 具材カードの仮想化

#### 4.1 react-windowの導入
- [ ] `npm install react-window @types/react-window`を実行
- [ ] `frontend/app/components/layout/IngredientSelector/IngredientSelector.tsx`を修正
- [ ] 仮想化グリッドコンポーネントを作成

```typescript
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedIngredientGrid = ({ ingredients }) => {
  const Cell = ({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      <IngredientCard ingredient={ingredients[rowIndex * 4 + columnIndex]} />
    </div>
  );

  return (
    <Grid
      columnCount={4}
      columnWidth={150}
      height={600}
      rowCount={Math.ceil(ingredients.length / 4)}
      rowHeight={200}
      width={600}
    >
      {Cell}
    </Grid>
  );
};
```

### 5. コード分割と遅延読み込み

#### 5.1 動的インポートの導入
- [ ] `frontend/app/HomePageClient.tsx`を修正
- [ ] 非重要なコンポーネントを動的インポートに変更

```typescript
import dynamic from 'next/dynamic';

const IngredientSelector = dynamic(() => import('./components/layout/IngredientSelector/IngredientSelector'), {
  loading: () => <Loading />,
  ssr: false
});

const GenerateRecipe = dynamic(() => import('./components/ui/GenerateRecipe/GenerateRecipe'), {
  loading: () => <div>読み込み中...</div>
});
```

### 6. React Queryの最適化

#### 6.1 キャッシュ戦略の改善
- [ ] `frontend/app/hooks/ingredients.ts`を修正
- [ ] 適切な`staleTime`と`gcTime`を設定

```typescript
export const useIngredients = (options?: {
  initialData?: Ingredient[];
  staleTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}) => {
  return useQuery({
    queryKey: ingredientKeys.lists(),
    queryFn: fetchIngredientsService,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000,   // 10分間ガベージコレクション
    ...options
  });
};
```

---

## 📈 低優先度（1ヶ月以内）

### 7. Next.js設定の最適化

#### 7.1 next.config.jsの改善
- [ ] `frontend/next.config.js`を修正
- [ ] 実験的機能の有効化
- [ ] コンパイラ設定の最適化

```javascript
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@lottiefiles/dotlottie-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  }
};
```

### 8. キャッシュ戦略の改善

#### 8.1 静的アセットのキャッシュ
- [ ] 画像ファイルのキャッシュヘッダー設定
- [ ] CSS/JSファイルのキャッシュ戦略
- [ ] APIレスポンスのキャッシュ設定

### 9. バンドルサイズの最適化

#### 9.1 バンドル分析
- [ ] `npm install --save-dev @next/bundle-analyzer`を実行
- [ ] バンドル分析レポートの生成
- [ ] 大きな依存関係の特定と最適化

---

## 🧪 テストと検証

### 10. パフォーマンス測定

#### 10.1 Lighthouse監査
- [ ] 各改善後にLighthouse監査を実行
- [ ] パフォーマンススコアの記録
- [ ] 改善効果の測定

#### 10.2 実機テスト
- [ ] モバイルデバイスでのテスト
- [ ] 低速ネットワークでのテスト
- [ ] ユーザー体験の確認

---

## 📋 実装チェックリスト

### 実装前
- [ ] 現在のパフォーマンススコアを記録
- [ ] 改善目標を設定
- [ ] 実装計画を作成

### 実装中
- [ ] 各改善を段階的に実装
- [ ] 各段階でテストを実行
- [ ] 問題が発生した場合は即座に対応

### 実装後
- [ ] 最終的なパフォーマンススコアを測定
- [ ] 改善効果を文書化
- [ ] 今後の監視計画を策定

---

## 🎯 成功指標

### 主要指標
- [ ] パフォーマンススコア: 33 → 85-90
- [ ] First Contentful Paint: 2.4秒 → 1.5秒以下
- [ ] Largest Contentful Paint: 56.2秒 → 2.5秒以下
- [ ] Total Blocking Time: 8,250ms → 300ms以下
- [ ] Speed Index: 10.7秒 → 3.4秒以下

### 副次指標
- [ ] バンドルサイズの削減
- [ ] 画像読み込み時間の短縮
- [ ] ユーザー体験の向上

---

## 📝 注意事項

1. **段階的な実装**: 一度に全ての改善を行うのではなく、優先度順に実装
2. **テストの重要性**: 各改善後に必ずテストを実行
3. **ユーザー体験**: パフォーマンス改善とUXのバランスを考慮
4. **監視の継続**: 改善後も定期的なパフォーマンス監視を実施

---

## 🔄 更新履歴

- **2024-01-XX**: 初版作成
- **実装完了時**: 各項目の完了日時を記録 