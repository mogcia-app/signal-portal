# 会員サイト側実装ガイド

## 📋 概要

このドキュメントは、Adminプロジェクトで実装された会員サイト管理機能に対応するため、会員サイト側で実装すべき機能をまとめたものです。

---

## 🎯 実装が必要な機能一覧

### 1. プラン階層別アクセス制御
### 2. 通知機能（お知らせ表示）
### 3. ブログ/ガイド機能（投稿表示）
### 4. Stripe決済設定ページ（後で実装）
### 5. ユーザープロフィール表示

---

## 1. プラン階層別アクセス制御

### 概要

Adminプロジェクトで設定されたユーザーのプラン階層（梅・竹・松）に基づいて、会員サイト側での機能アクセスを制御します。

### データ構造

**Firestore `users` コレクションの各ドキュメント:**
```typescript
interface User {
  planTier?: 'ume' | 'take' | 'matsu'
  // ... 既存フィールド
}
```

### 実装済みファイル

- ✅ `src/types/user.ts` - 型定義
- ✅ `src/lib/plan-access.ts` - プランアクセス制御ライブラリ

### 使用方法

```typescript
import { canAccessFeature, getUserPlanTier, getPlanName } from '@/lib/plan-access'

// プラン階層を取得
const planTier = getUserPlanTier(userProfile) // 'ume' | 'take' | 'matsu'

// 機能へのアクセス権限をチェック
if (canAccessFeature(userProfile, 'canAccessPosts')) {
  // 投稿一覧機能へのアクセスを許可
}

// プラン名を取得
const planName = getPlanName(planTier) // '梅プラン' | '竹プラン' | '松プラン'
```

### ページルーティング制御マトリックス

| ページパス | 梅プラン | 竹プラン | 松プラン |
|-----------|---------|---------|---------|
| `/instagram/lab/*` | ✅ | ✅ | ✅ |
| `/instagram/posts` | ❌ | ✅ | ✅ |
| `/instagram/posts/[id]` | ❌ | ✅ | ✅ |
| `/instagram/analytics/*` | ❌ | ❌ | ✅ |
| `/instagram/plan` | ❌ | ❌ | ✅ |
| `/instagram/report` | ❌ | ❌ | ✅ |
| `/instagram/kpi` | ❌ | ❌ | ✅ |
| `/learning` | ❌ | ❌ | ✅ |
| `/home` | ✅ | ✅ | ✅ |

---

## 2. 通知機能（お知らせ表示）

### 概要

Adminプロジェクトで作成・公開されたお知らせを会員サイト側で表示します。

### データ構造

**Firestore `notifications` コレクション:**
- 詳細は `src/types/notification.ts` を参照

### 実装済みファイル

- ✅ `src/types/notification.ts` - 型定義
- ✅ `src/lib/notifications.ts` - 通知取得ライブラリ
- ✅ `src/components/notifications/NotificationBanner.tsx` - 通知バナーコンポーネント
- ✅ `src/app/notifications/page.tsx` - 通知一覧ページ

### 使用方法

```typescript
import { NotificationBanner } from '@/components/notifications/NotificationBanner'

// レイアウトやページに追加
<NotificationBanner userProfile={userProfile} />
```

---

## 3. ブログ/ガイド機能（投稿表示）

### 概要

Adminプロジェクトで作成・公開されたブログ記事（ガイド）を会員サイト側で表示します。

### データ構造

**Firestore `blogPosts` コレクション:**
- 詳細は `src/types/blog.ts` を参照

### 実装済みファイル

- ✅ `src/types/blog.ts` - 型定義
- ✅ `src/lib/blog.ts` - ブログ取得ライブラリ
- ✅ `src/app/guides/page.tsx` - ブログ一覧ページ
- ✅ `src/app/guides/[slug]/page.tsx` - ブログ詳細ページ

### 使用方法

```typescript
import { getPublishedBlogPosts, getBlogPostBySlug } from '@/lib/blog'

// 記事一覧を取得
const posts = await getPublishedBlogPosts()

// スラッグから記事を取得
const post = await getBlogPostBySlug('my-post-slug')
```

---

## 4. Stripe決済設定ページ（未実装）

### 概要

Adminプロジェクトで支払い方法を「クレジットカード（Stripe）」に設定したユーザーが、会員サイト側でStripeの初期決済設定を行えるようにします。

**実装は後で行います。**

---

## 5. 環境変数の設定

**ファイル: `.env.local`**

```bash
# Stripe設定（後で追加）
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...

# Firebase設定（既存のものを使用）
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 6. Firestoreセキュリティルールの更新

**ファイル: `firestore.rules`**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... 既存のルール

    // 通知（読み取りのみ）
    match /notifications/{notificationId} {
      // 公開中の通知のみ読み取り可能
      allow read: if isAuthenticated() && 
                       resource.data.status == 'published' &&
                       (resource.data.targetAudience == 'all' ||
                        resource.data.targetAudience == getUserPlanTier());
      // 管理者のみ書き込み可能
      allow write: if isAuthenticated() && isAdminEmail(request.auth.token.email);
    }

    // ブログ投稿（読み取りのみ）
    match /blogPosts/{postId} {
      // 公開中の投稿のみ読み取り可能
      allow read: if isAuthenticated() && resource.data.status == 'published';
      // 管理者のみ書き込み可能
      allow write: if isAuthenticated() && isAdminEmail(request.auth.token.email);
    }
  }
}
```

---

## 7. 実装チェックリスト

### プラン階層別アクセス制御
- [x] `src/types/user.ts`の作成
- [x] `src/lib/plan-access.ts`の作成
- [ ] 各ページコンポーネントでのアクセス制御実装（会員サイト側で実装が必要）
- [ ] サイドバーナビゲーションの条件付き表示（会員サイト側で実装が必要）
- [ ] APIルートでのプランチェック（会員サイト側で実装が必要）

### 通知機能
- [x] `src/types/notification.ts`の作成
- [x] `src/lib/notifications.ts`の作成
- [x] `src/components/notifications/NotificationBanner.tsx`の作成
- [x] `src/app/notifications/page.tsx`の作成
- [ ] レイアウトへの通知バナー追加（userProfile取得が必要）
- [ ] Firestoreセキュリティルールの更新

### ブログ/ガイド機能
- [x] `src/types/blog.ts`の作成
- [x] `src/lib/blog.ts`の作成
- [x] `src/app/guides/page.tsx`の作成
- [x] `src/app/guides/[slug]/page.tsx`の作成
- [ ] Markdownレンダリングライブラリのインストール（必要に応じて）
- [ ] Firestoreセキュリティルールの更新

### Stripe決済設定
- [ ] Stripe SDKのインストール
- [ ] `src/app/settings/payment/page.tsx`の作成
- [ ] `src/app/api/stripe/create-setup-intent/route.ts`の作成
- [ ] 環境変数の設定
- [ ] 設定ページへのリダイレクト実装

---

## 8. その他の注意事項

### パフォーマンス最適化
- 通知やブログ投稿は適切な`limit`を設定して取得
- 必要に応じてページネーションを実装
- 画像は最適化された形式（WebPなど）を使用

### エラーハンドリング
- Firestoreへのアクセスエラーを適切に処理
- ネットワークエラー時のフォールバック表示

### セキュリティ
- ユーザー情報の更新は適切な認証チェックを行う
- XSS対策（Markdownレンダリング時のサニタイゼーション）

---

## 9. 参考資料

- [Stripe Setup Intents ドキュメント](https://stripe.com/docs/payments/setup-intents)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js App Router](https://nextjs.org/docs/app)


