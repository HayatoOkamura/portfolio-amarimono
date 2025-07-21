# Next.js 13+ App Router 理想的な実装方法とチェックリスト

## 📋 目次
1. [アーキテクチャ設計](#アーキテクチャ設計)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [コンポーネント設計](#コンポーネント設計)
4. [データフェッチング](#データフェッチング)
5. [パフォーマンス最適化](#パフォーマンス最適化)
6. [型安全性](#型安全性)
7. [エラーハンドリング](#エラーハンドリング)
8. [セキュリティ](#セキュリティ)
9. [テスト戦略](#テスト戦略)
10. [チェックリスト](#チェックリスト)

## 🏗️ アーキテクチャ設計

### 基本原則
- **Server Components First**: デフォルトでServer Componentsを使用
- **Client Components Minimization**: 必要最小限でのみClient Componentsを使用
- **Progressive Enhancement**: 基本的な機能はServer Componentsで、インタラクティブな機能をClient Componentsで追加
- **Separation of Concerns**: 関心事の分離を徹底

### レンダリング戦略
```typescript
// 推奨されるレンダリング方法の選択基準
- Static Generation (SG): 静的なコンテンツ、SEO重要
- Incremental Static Regeneration (ISR): 定期的に更新されるコンテンツ
- Server-Side Rendering (SSR): ユーザー固有のデータ、認証が必要
- Client-Side Rendering (CSR): インタラクティブな機能、リアルタイム更新
```

## 📁 ディレクトリ構造

### 理想的な構造
```
src/
├── app/                          # App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/              # ダッシュボード関連
│   │   ├── user/
│   │   ├── admin/
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── recipes/
│   │   └── users/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/                   # React Components
│   ├── ui/                      # 基本UIコンポーネント
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── features/                # 機能別コンポーネント
│   │   ├── Recipe/
│   │   │   ├── RecipeCard/
│   │   │   ├── RecipeForm/
│   │   │   └── RecipeDetail/
│   │   ├── Ingredient/
│   │   └── User/
│   ├── layout/                  # レイアウトコンポーネント
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── Container/
│   └── common/                  # 共通コンポーネント
│       ├── Loading/
│       ├── ErrorBoundary/
│       └── ResponsiveWrapper/
├── hooks/                       # カスタムフック
│   ├── api/                     # API関連フック
│   │   ├── useRecipes.ts
│   │   ├── useIngredients.ts
│   │   └── useUsers.ts
│   ├── auth/                    # 認証関連フック
│   │   ├── useAuth.ts
│   │   └── useAuthGuard.ts
│   ├── form/                    # フォーム関連フック
│   │   ├── useForm.ts
│   │   └── useValidation.ts
│   └── ui/                      # UI関連フック
│       ├── useModal.ts
│       └── useResponsive.ts
├── lib/                         # ユーティリティライブラリ
│   ├── api/                     # API関連
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── auth/                    # 認証関連
│   │   ├── supabase/
│   │   └── session.ts
│   ├── utils/                   # 汎用ユーティリティ
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── stores/                  # 状態管理
│       ├── recipeStore.ts
│       ├── ingredientStore.ts
│       └── userStore.ts
├── types/                       # 型定義
│   ├── api.ts
│   ├── components.ts
│   └── global.ts
└── styles/                      # グローバルスタイル
    ├── globals.scss
    ├── variables.scss
    └── mixins.scss
```

## 🧩 コンポーネント設計

### Server Components
```typescript
// ✅ 推奨: Server Component
export default async function RecipeList() {
  const recipes = await fetchRecipes();
  
  return (
    <div>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
```

### Client Components
```typescript
// ✅ 推奨: 必要最小限のClient Component
"use client";

import { useState } from 'react';

export default function RecipeForm() {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // フォーム送信処理
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム要素 */}
    </form>
  );
}
```

### コンポーネント分割の原則
- **Single Responsibility**: 1つのコンポーネントは1つの責任のみ
- **Composition over Inheritance**: 継承より合成を優先
- **Props Interface**: 明確なProps型定義
- **Default Props**: 適切なデフォルト値の設定

## 📡 データフェッチング

### Server Componentsでのデータフェッチ
```typescript
// ✅ 推奨: Server Componentでの直接フェッチ
export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await fetchRecipe(params.id);
  
  return (
    <div>
      <h1>{recipe.name}</h1>
      <RecipeDetail recipe={recipe} />
    </div>
  );
}
```

### Client Componentsでのデータフェッチ
```typescript
// ✅ 推奨: TanStack Query + カスタムフック
"use client";

import { useRecipe } from '@/hooks/api/useRecipes';

export default function RecipeDetail({ id }: { id: string }) {
  const { data: recipe, isLoading, error } = useRecipe(id);
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <RecipeContent recipe={recipe} />;
}
```

### キャッシュ戦略
```typescript
// ISRの実装
export const revalidate = 3600; // 1時間

// 動的キャッシュ
const data = await fetch(url, { 
  next: { 
    revalidate: 3600,
    tags: ['recipes']
  } 
});

// キャッシュ無効化
revalidateTag('recipes');
```

## ⚡ パフォーマンス最適化

### 画像最適化
```typescript
// ✅ 推奨: next/imageの使用
import Image from 'next/image';

<Image
  src="/recipe.jpg"
  alt="Recipe"
  width={800}
  height={600}
  priority={true} // 重要な画像
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### コード分割
```typescript
// ✅ 推奨: 動的インポート
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false // クライアントサイドのみ
});
```

### バンドル最適化
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: ['react-icons', 'framer-motion'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

## 🔒 型安全性

### TypeScript設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 型定義のベストプラクティス
```typescript
// ✅ 推奨: 明確な型定義
interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  updatedAt: Date;
}

// APIレスポンス型
type ApiResponse<T> = {
  data: T;
  message: string;
  status: 'success' | 'error';
};

// エラー型
type ApiError = {
  message: string;
  code: string;
  details?: Record<string, unknown>;
};
```

## 🛡️ エラーハンドリング

### エラーバウンダリ
```typescript
// app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

### API エラーハンドリング
```typescript
// ✅ 推奨: 統一されたエラーハンドリング
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    // 特定のエラー処理
    return error.message;
  }
  // 汎用エラー処理
  return '予期しないエラーが発生しました';
};
```

## 🔐 セキュリティ

### 環境変数管理
```typescript
// ✅ 推奨: 環境変数の型安全性
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      DATABASE_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}
```

### 認証・認可
```typescript
// ✅ 推奨: サーバーサイドでの認証チェック
import { createClient } from '@/lib/auth/server';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return <ProtectedContent user={user} />;
}
```

### 入力値検証
```typescript
// ✅ 推奨: Zod によるスキーマ検証
import { z } from 'zod';

const RecipeSchema = z.object({
  name: z.string().min(1).max(100),
  ingredients: z.array(z.object({
    id: z.number().positive(),
    quantity: z.number().positive()
  })),
  cookingTime: z.number().min(1).max(480)
});

type RecipeInput = z.infer<typeof RecipeSchema>;
```

## 🧪 テスト戦略

### テスト構造
```
__tests__/
├── components/
│   ├── ui/
│   ├── features/
│   └── layout/
├── hooks/
├── utils/
└── integration/
```

### テストの種類
```typescript
// ユニットテスト
describe('RecipeCard', () => {
  it('should render recipe information correctly', () => {
    const recipe = mockRecipe();
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText(recipe.name)).toBeInTheDocument();
  });
});

// 統合テスト
describe('Recipe Flow', () => {
  it('should create and display a new recipe', async () => {
    // レシピ作成から表示までの一連の流れをテスト
  });
});
```

## ✅ チェックリスト

### 🏗️ アーキテクチャ
- [ ] Server Componentsをデフォルトで使用
- [ ] Client Componentsは必要最小限に制限
- [ ] 関心事の分離が適切に実装されている
- [ ] レンダリング戦略が各ページに最適化されている

### 📁 ディレクトリ構造
- [ ] 推奨ディレクトリ構造に従っている
- [ ] コンポーネントが適切に分類されている
- [ ] ファイル名が一貫性のある命名規則に従っている
- [ ] インデックスファイルでエクスポートを整理している

### 🧩 コンポーネント設計
- [ ] 各コンポーネントが単一責任の原則に従っている
- [ ] Propsの型定義が明確
- [ ] デフォルトPropsが適切に設定されている
- [ ] コンポーネントの再利用性が考慮されている

### 📡 データフェッチング
- [ ] Server Componentsで可能な限りデータフェッチを実行
- [ ] Client ComponentsではTanStack Queryを使用
- [ ] 適切なキャッシュ戦略が実装されている
- [ ] エラーハンドリングが統一されている

### ⚡ パフォーマンス
- [ ] next/imageを使用して画像最適化
- [ ] 動的インポートでコード分割を実装
- [ ] バンドルサイズが最適化されている
- [ ] Core Web Vitalsが基準値を満たしている

### 🔒 型安全性
- [ ] TypeScriptのstrict modeが有効
- [ ] 全てのPropsとAPIレスポンスに型定義がある
- [ ] 環境変数に型定義がある
- [ ] エラー型が適切に定義されている

### 🛡️ エラーハンドリング
- [ ] グローバルエラーバウンダリが実装されている
- [ ] API エラーハンドリングが統一されている
- [ ] ユーザーフレンドリーなエラーメッセージが表示される
- [ ] エラーログが適切に記録されている

### 🔐 セキュリティ
- [ ] 環境変数が適切に管理されている
- [ ] 認証・認可がサーバーサイドで実装されている
- [ ] 入力値検証が実装されている
- [ ] XSS対策が実装されている

### 🧪 テスト
- [ ] ユニットテストが主要コンポーネントに実装されている
- [ ] 統合テストが重要なフローに実装されている
- [ ] E2Eテストが主要ユーザーフローに実装されている
- [ ] テストカバレッジが80%以上

### 📱 アクセシビリティ
- [ ] セマンティックHTMLが使用されている
- [ ] ARIA属性が適切に設定されている
- [ ] キーボードナビゲーションが実装されている
- [ ] スクリーンリーダー対応が確認されている

### 🌐 SEO
- [ ] メタデータが適切に設定されている
- [ ] 構造化データが実装されている
- [ ] サイトマップが生成されている
- [ ] robots.txtが適切に設定されている

### 📊 監視・分析
- [ ] パフォーマンス監視が実装されている
- [ ] エラー監視が実装されている
- [ ] ユーザー行動分析が実装されている
- [ ] ログ収集が適切に設定されている

## 🚀 実装の優先順位

### Phase 1: 基盤整備
1. ディレクトリ構造の整理
2. TypeScript設定の最適化
3. 基本的なエラーハンドリングの実装

### Phase 2: パフォーマンス最適化
1. Server Componentsの活用
2. 画像最適化の実装
3. コード分割の実装

### Phase 3: 品質向上
1. テストの実装
2. アクセシビリティの改善
3. SEO対策の実装

### Phase 4: 監視・分析
1. パフォーマンス監視の実装
2. エラー監視の実装
3. ユーザー行動分析の実装

## 📚 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) 