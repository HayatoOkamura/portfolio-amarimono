# 画像最適化ガイド

## 概要

このドキュメントでは、Amarimonoアプリケーションの画像パフォーマンスを最適化するための実装と推奨事項について説明します。

## 実装された最適化

### 1. Next.js Image Component の最適化

- **適切なサイズ指定**: `sizes="100px"` で固定サイズを指定
- **品質設定**: `quality={75}` で適切な品質を設定
- **プレースホルダー**: `placeholder="blur"` でローディング中の表示
- **遅延読み込み**: `loading="lazy"` で非表示領域の画像を遅延読み込み

### 2. 優先読み込み戦略

- **重要な画像の特定**: 最初の8つの具材画像を優先読み込み
- **プリロード**: `ImagePreloader` コンポーネントで重要な画像を事前読み込み
- **fetchpriority**: 画像の重要度に応じてfetchpriorityを設定

### 3. Intersection Observer

- **効率的な遅延読み込み**: 画面に表示される直前の画像のみを読み込み
- **メモリ効率**: 不要な画像の読み込みを防止

### 4. キャッシュ戦略

- **Next.js キャッシュ**: `minimumCacheTTL: 86400` (24時間)
- **ブラウザキャッシュ**: 適切なCache-Controlヘッダーの設定

## パフォーマンス監視

### 開発環境での監視

- **LCP (Largest Contentful Paint)**: 最大コンテンツの描画時間
- **FID (First Input Delay)**: 最初の入力遅延
- **CLS (Cumulative Layout Shift)**: 累積レイアウトシフト

### 監視方法

```typescript
// 開発環境でコンソールに表示される
console.log('LCP:', { element, value, size, id, url });
console.log('FID:', { value, startTime, processingStart, processingEnd, target });
console.log('CLS:', { value, total, sources });
```

## バックエンド側の推奨事項

### 1. 画像の最適化

```go
// 画像アップロード時の最適化
func optimizeImage(file multipart.File) error {
    // 1. 画像のリサイズ
    // 2. フォーマットの最適化 (WebP/AVIF)
    // 3. 品質の調整
    // 4. メタデータの削除
    return nil
}
```

### 2. 画像のバリエーション生成

```go
// 複数サイズの画像を生成
func generateImageVariants(originalPath string) error {
    sizes := []int{100, 200, 400, 800}
    for _, size := range sizes {
        // 各サイズの画像を生成
    }
    return nil
}
```

### 3. CDNの活用

```go
// CDN経由での画像配信
const imageCDN = "https://cdn.example.com/images/"
```

## フロントエンド側の最適化

### 1. 画像の条件付きレンダリング

```tsx
{(isPriority || hasIntersected) && (
  <Image
    src={imageUrl}
    alt={alt}
    width={100}
    height={100}
    priority={isPriority}
    loading={isPriority ? "eager" : "lazy"}
    sizes="100px"
    quality={75}
    placeholder="blur"
  />
)}
```

### 2. プリロード戦略

```tsx
// 重要な画像をプリロード
<ImagePreloader 
  imageUrls={priorityImageUrls} 
  priority={1} 
/>
```

### 3. 遅延読み込みの最適化

```tsx
const { elementRef, hasIntersected } = useIntersectionObserver<HTMLLIElement>({
  threshold: 0.1,
  rootMargin: '100px',
});
```

## パフォーマンス目標

### Lighthouse スコア目標

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+

### 具体的な指標

- **LCP**: < 2.5秒
- **FID**: < 100ms
- **CLS**: < 0.1

## 今後の改善案

### 1. 画像フォーマットの最適化

- **AVIF**: より効率的な画像フォーマットの採用
- **WebP**: ブラウザ対応の拡大

### 2. 画像の事前最適化

- **ビルド時最適化**: 画像の事前処理
- **動的最適化**: ユーザーのデバイスに応じた最適化

### 3. キャッシュ戦略の改善

- **Service Worker**: オフライン対応
- **IndexedDB**: ローカルキャッシュ

### 4. 監視の強化

- **Real User Monitoring**: 実際のユーザー体験の監視
- **Error Tracking**: 画像読み込みエラーの追跡

## トラブルシューティング

### よくある問題

1. **画像が表示されない**
   - ネットワーク接続の確認
   - 画像URLの妥当性確認
   - CORS設定の確認

2. **画像の読み込みが遅い**
   - 画像サイズの確認
   - CDNの設定確認
   - キャッシュ設定の確認

3. **LCPが改善されない**
   - 重要な画像の特定
   - プリロード設定の確認
   - 画像の最適化レベル確認

## 参考資料

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse) 