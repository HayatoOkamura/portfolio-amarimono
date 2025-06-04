# Supabase Client 実装計画

## 1. 現状分析
- [x] 既存の`supabaseClient.ts`の確認
- [x] 本番環境用の設定との違いを確認
- [x] 使用箇所の特定

## 2. 共通クライアントの実装
- [x] `supabaseClient.ts`の更新
  - [x] 本番環境用の設定を統合
  - [x] 環境変数の整理
  - [x] セッション管理の統一
  - [x] エラーハンドリングの強化

## 3. 認証関連ファイルの更新
### 3.1 認証フロー
- [x] `frontend/app/(auth)/callback/page.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] セッション管理の更新
  - [x] エラーハンドリングの確認

- [x] `frontend/app/(auth)/login/components/LoginForm.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] セッション管理の更新
  - [x] エラーハンドリングの確認

- [x] `frontend/app/(auth)/login/components/GoogleLogin.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] OAuth設定の確認

- [x] `frontend/app/(auth)/verify-email/page.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] メール認証フローの確認

### 3.2 API Routes
- [x] `frontend/app/api/auth/check-admin/route.ts`
  - [x] 共通クライアントの使用に変更
  - [x] 管理者権限チェックの確認

- [x] `frontend/app/api/auth/sync/route.ts`
  - [x] 共通クライアントの使用に変更
  - [x] セッション同期の確認

- [x] `frontend/app/api/auth/user/route.ts`
  - [x] 共通クライアントの使用に変更
  - [x] ユーザー情報取得の確認

- [x] `frontend/app/api/auth/logout/route.ts`
  - [x] 共通クライアントの使用に変更
  - [x] ログアウト処理の確認

- [x] `frontend/app/api/profile/route.ts`
  - [x] 共通クライアントの使用に変更
  - [x] プロフィール管理の確認

### 3.3 コンポーネント
- [x] `frontend/app/components/layout/Auth/Login/Login.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] ログインフローの確認

- [x] `frontend/app/components/layout/Auth/SignUp/SignUp.tsx`
  - [x] 共通クライアントの使用に変更
  - [x] サインアップフローの確認

### 3.4 フックとユーティリティ
- [x] `frontend/app/hooks/useAuth.ts`
  - [x] 共通クライアントの使用に変更
  - [x] 認証状態管理の確認

- [x] `frontend/app/lib/supabase-auth/server.ts`
  - [x] 共通クライアントの使用に変更
  - [x] サーバーサイド認証の確認

- [x] `frontend/app/utils/supabase.ts`
  - [x] 共通クライアントの使用に変更
  - [x] ユーティリティ関数の確認

## 4. テストと検証
- [x] 認証フローのテスト
  - [x] ログイン/ログアウト
  - [x] サインアップ
  - [x] メール認証
  - [x] Google認証

- [x] セッション管理のテスト
  - [x] セッションの永続化
  - [x] セッションの更新
  - [x] セッションのクリア

- [x] エラーハンドリングのテスト
  - [x] 認証エラー
  - [x] ネットワークエラー
  - [x] バリデーションエラー

## 5. ドキュメント更新
- [x] 実装の説明
- [x] 使用方法の説明
- [x] 環境変数の説明
- [x] トラブルシューティングガイド

## 6. 移行手順
1. 共通クライアントの実装
2. テスト環境での動作確認
3. 段階的なファイル更新
4. 各機能の動作確認
5. 本番環境への適用

## 7. 注意点
- セッション管理の一貫性を保つ
- 環境変数の適切な設定
- エラーハンドリングの徹底
- 既存機能への影響を最小限に抑える
- 段階的な移行によるリスク管理 