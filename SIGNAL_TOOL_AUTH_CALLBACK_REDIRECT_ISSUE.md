# Signal.ツール 認証コールバック リダイレクト問題報告

## 概要

会員サイトから Signal.ツールへのアクセス時に、正しい認証コールバックURL（`/auth/callback?userId=xxx`）にアクセスしても、自動的に`/login`ページにリダイレクトされてしまう問題が発生しています。

---

## 問題の詳細

### 発生状況

1. 会員サイトの`/home`ページで「Signal.ツールを開く」ボタンをクリック
2. 正しいURLが開かれる：`https://signaltool.app/auth/callback?userId=91M8DtE2zRNk2FHK8GJCvOUwqfu1`
3. 一瞬、コールバックURLが表示される
4. その後、自動的に`https://signaltool.app/login`にリダイレクトされる

### 期待される動作

`/auth/callback?userId=xxx`にアクセスした場合：
- Signal.ツール側で`userId`パラメータを受け取る
- Firebase Authでユーザーを認証
- 認証成功後、ツールのダッシュボードまたは適切なページにリダイレクト
- **自動ログインが完了する**

### 実際の動作

- コールバックURLにアクセス
- 認証処理が完了しない、または失敗
- `/login`ページにリダイレクトされる
- **ユーザーは再度ログインする必要がある**

---

## 会員サイト側の実装

### URLの生成

会員サイトでは、以下のようにSignal.ツールへのアクセスURLを生成しています：

```typescript
// AuthContext.tsx
const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app';
const signalToolAccessUrl = `${signalToolBaseUrl}/auth/callback?userId=${uid}`;
```

### Firestoreでの保存

生成されたURLは、Firestoreの`users`コレクションに保存されています：

```typescript
{
  signalToolAccessUrl: "https://signaltool.app/auth/callback?userId=91M8DtE2zRNk2FHK8GJCvOUwqfu1"
}
```

### ボタンからのアクセス

`/home`ページで、このURLを使用してSignal.ツールを開きます：

```typescript
<button
  onClick={() => {
    if (signalToolAccessUrl) {
      console.log('Opening Signal Tool URL:', signalToolAccessUrl);
      window.open(signalToolAccessUrl, '_blank');
    }
  }}
>
  Signal.ツールを開く
</button>
```

---

## Signal.ツール側で確認が必要な項目

### 1. `/auth/callback`エンドポイントの実装

**確認ポイント**：
- ✅ `/auth/callback`ルートが正しく定義されているか？
- ✅ `userId`クエリパラメータを正しく受け取れているか？
- ✅ エラーハンドリングが適切に実装されているか？

**確認方法**：
```typescript
// 例: Next.js App Router
// app/auth/callback/page.tsx または app/auth/callback/route.ts

export default function AuthCallbackPage({ searchParams }: { searchParams: { userId?: string } }) {
  const userId = searchParams.userId;
  // userIdを受け取れているか確認
  console.log('Received userId:', userId);
  
  // Firebase Authで認証処理
  // ...
}
```

### 2. Firebase Authでの認証処理

**確認ポイント**：
- ✅ `userId`からFirestoreでユーザー情報を取得できているか？
- ✅ Firebase Authでユーザーを認証できているか？
- ✅ 認証セッションが正しく作成されているか？

**想定される実装**：
```typescript
// Signal.ツール側での認証処理の例
import { doc, getDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export default async function AuthCallbackPage({ searchParams }) {
  const { userId } = searchParams;
  
  // Firestoreからユーザー情報を取得
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    // ユーザーが存在しない場合は/loginにリダイレクト
    redirect('/login');
  }
  
  // カスタムトークンを使用して認証
  // または、Firebase Admin SDKでトークンを生成してクライアント側で認証
  // ...
  
  // 認証成功後、ダッシュボードにリダイレクト
  redirect('/dashboard');
}
```

### 3. リダイレクトロジック

**確認ポイント**：
- ✅ 認証成功時のリダイレクト先が正しいか？
- ✅ 認証失敗時に`/login`にリダイレクトする前に、エラーログを出力しているか？
- ✅ リダイレクトが適切なタイミングで実行されているか？

### 4. エラーハンドリング

**確認ポイント**：
- ✅ 認証処理中にエラーが発生していないか？
- ✅ サーバーログまたはクライアントサイドのコンソールログを確認
- ✅ エラーメッセージが適切に表示されているか？

### 5. CORS・セキュリティ設定

**確認ポイント**：
- ✅ 会員サイト（`signal-portal`）からのリクエストを許可しているか？
- ✅ セキュリティヘッダーが適切に設定されているか？
- ✅ クロスオリジンリクエストがブロックされていないか？

---

## デバッグ情報

### 実際に使用されているURL

```
https://signaltool.app/auth/callback?userId=91M8DtE2zRNk2FHK8GJCvOUwqfu1
```

### ユーザーID

```
91M8DtE2zRNk2FHK8GJCvOUwqfu1
```

### 期待されるURL形式

現在の実装では、以下の形式を期待しています：

```
https://signaltool.app/auth/callback?userId={userId}
```

もしSignal.ツール側で異なる形式を期待している場合（例：`?token=xxx`、`?authToken=xxx`など）、会員サイト側の実装を修正する必要があります。

---

## 確認したいポイント

1. **`/auth/callback`エンドポイントが実装されているか？**
   - 実装されている場合、どのように認証処理を行っているか？
   - 実装されていない場合、実装が必要です

2. **`userId`パラメータの受け取り方法**
   - クエリパラメータ（`?userId=xxx`）で受け取れているか？
   - 異なるパラメータ名（`token`、`authToken`など）を期待していないか？

3. **認証方法**
   - Firebase Custom Tokenを使用しているか？
   - 別の認証方法を使用しているか？
   - 認証トークンの生成方法は？

4. **リダイレクト先**
   - 認証成功後、どこにリダイレクトされるべきか？
   - 現在、なぜ`/login`にリダイレクトされているか？

5. **エラーログ**
   - サーバーログにエラーが記録されていないか？
   - ブラウザのコンソールにエラーが表示されていないか？

---

## 想定される原因

### 1. `/auth/callback`エンドポイントが未実装

`/auth/callback`ルートがSignal.ツール側で定義されていない場合、Next.jsのデフォルト動作で`/login`にリダイレクトされている可能性があります。

**解決方法**：`/auth/callback`エンドポイントを実装する

### 2. 認証処理のエラー

認証処理中にエラーが発生し、エラーハンドリングで`/login`にリダイレクトされている可能性があります。

**解決方法**：エラーログを確認し、認証処理を修正する

### 3. `userId`パラメータの受け取り失敗

`userId`パラメータが正しく受け取れていない可能性があります。

**解決方法**：パラメータの受け取り方法を確認する

### 4. Firebase Authの認証方法の不一致

会員サイトとSignal.ツールで使用するFirebaseプロジェクトが異なる、または認証方法が一致していない可能性があります。

**解決方法**：Firebase設定と認証方法を確認する

### 5. セッション管理の問題

認証後、セッションが正しく作成されず、認証状態が保持されていない可能性があります。

**解決方法**：セッション管理の実装を確認する

---

## 対応依頼事項

Signal.ツール側の開発者様へ、以下の確認・対応をお願いします：

1. ✅ **`/auth/callback`エンドポイントの実装確認**
   - エンドポイントが実装されているか？
   - 実装されている場合、認証処理が正しく動作しているか？

2. ✅ **`userId`パラメータの受け取り確認**
   - `?userId=xxx`形式のクエリパラメータを受け取れているか？
   - 異なるパラメータ形式を期待していないか？

3. ✅ **認証処理の動作確認**
   - `userId`からユーザー情報を取得できているか？
   - Firebase Authで認証できているか？
   - 認証成功後のリダイレクトが正しく動作しているか？

4. ✅ **エラーログの確認**
   - サーバーログまたはクライアントサイドのコンソールにエラーが出力されていないか？
   - エラーが発生している場合、エラーの詳細を共有してください

5. ✅ **期待される動作の確認**
   - `/auth/callback?userId=xxx`にアクセスした際の期待される動作を確認
   - 必要な認証方法、パラメータ形式、リダイレクト先などを共有してください

---

## 会員サイト側の対応状況

会員サイト側では、以下の対応を完了しています：

- ✅ `signalToolAccessUrl`の生成と保存
- ✅ FirestoreへのURL保存（既存ユーザーにも自動生成・保存）
- ✅ `/home`ページでのURL表示とボタン実装
- ✅ デバッグ用のコンソールログ出力

**結論**：会員サイト側の実装に問題はなく、Signal.ツール側での対応が必要です。

---

## 連絡先・質問

ご不明な点がございましたら、お気軽にお問い合わせください。

---

## 参考情報

- **会員サイトリポジトリ**: `signal-portal`
- **実装ファイル**: 
  - `src/app/home/page.tsx` (Signal.ツールへのアクセスボタン)
  - `src/contexts/AuthContext.tsx` (URL生成ロジック)
- **Firestoreデータ構造**: `users`コレクション > `signalToolAccessUrl`フィールド
- **環境変数**: `NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL=https://signaltool.app`

