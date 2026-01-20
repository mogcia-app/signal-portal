# Signal.ツール 404エラー報告

## 概要

会員サイトから Signal.ツールへのアクセス時に404エラーが発生しています。

---

## エラー詳細

### エラーメッセージ
```
Failed to load resource: the server responded with a status of 404 ()
```

### 発生箇所
- **ページ**: `/home` (会員サイト toC ホームページ)
- **コンポーネント**: 「Signal.ツールにアクセス」ボタン
- **実装ファイル**: `src/app/home/page.tsx`

---

## 実装内容

### 会員サイト側の実装

会員サイトでは、以下のように Signal.ツールへのURLを取得・表示しています：

```typescript
// userProfileからsignalToolAccessUrlを取得
{userProfile?.signalToolAccessUrl && (
  <button
    onClick={() => {
      console.log('Opening Signal Tool URL:', userProfile.signalToolAccessUrl);
      window.open(userProfile.signalToolAccessUrl, '_blank');
    }}
  >
    Signal.ツールを開く
  </button>
)}
```

### データソース

- **保存場所**: Firestore `users` コレクション
- **フィールド名**: `signalToolAccessUrl`
- **設定方法**: Admin プロジェクトでユーザー作成時に生成・設定
- **データ型**: `string` (URL形式)

---

## 確認が必要な項目

### 1. URLの形式・構造

Adminで生成されているURLの形式を確認してください：

- ✅ **期待されるURL形式**: `https://signaltool.app/login?token=xxx` のような形式か？
- ✅ **パラメータ**: 認証トークン、ユーザーIDなどのパラメータが必要か？
- ✅ **パス**: 正しいエンドポイント（`/login`、`/dashboard`など）を使用しているか？

### 2. ツール側のルーティング

ツール側で以下の確認をお願いします：

- ✅ 生成されたURLのパスがツール側で定義されているか？
- ✅ 動的ルート（`[id]`、`[token]`など）が必要な場合、正しく設定されているか？
- ✅ 認証トークンの検証ロジックが正しく動作しているか？

### 3. 環境の違い

- ✅ **開発環境**: `localhost:xxxx` や `dev.signaltool.app` など
- ✅ **本番環境**: `signaltool.app` など
- ✅ Adminで生成されるURLが開発環境向けになっていないか？

### 4. 認証・セキュリティ

- ✅ 認証トークンの有効期限は適切か？
- ✅ CORS設定は正しいか？（会員サイトからのアクセスを許可しているか？）
- ✅ セキュリティヘッダーがアクセスをブロックしていないか？

---

## デバッグ情報

### コンソール出力

ボタンクリック時に、ブラウザのコンソールに以下のログが出力されます：

```javascript
Opening Signal Tool URL: <実際のURL>
```

このURLが正しいか確認してください。

### Firestoreデータ確認

Firestoreで以下のクエリを実行し、`signalToolAccessUrl`の値を確認してください：

```javascript
// Firestore Console または Admin SDK
const userDoc = await getDoc(doc(db, 'users', userId));
console.log('signalToolAccessUrl:', userDoc.data().signalToolAccessUrl);
```

---

## 想定される原因

### 1. ツール側のルーティングが未定義

生成されたURLのパスがツール側のルーティングに存在しない可能性があります。

**解決方法**: ツール側で該当ルートを追加する、またはAdminで正しいURLを生成する

### 2. 認証トークンの問題

URLに含まれる認証トークンが無効、期限切れ、または形式が間違っている可能性があります。

**解決方法**: トークンの生成・検証ロジックを確認する

### 3. 環境の不一致

開発環境と本番環境でURLが異なる可能性があります。

**解決方法**: Adminで生成されるURLを環境に応じて切り替える

### 4. Next.jsのルーティング設定

ツール側がNext.jsの場合、動的ルートの設定が必要な可能性があります。

**解決方法**: `app/[token]/page.tsx` のような動的ルートを追加する

---

## 対応依頼事項

以下の確認・対応をお願いします：

1. ✅ **生成されているURLの確認**: Adminで生成されている`signalToolAccessUrl`の実際の値を共有してください
2. ✅ **ツール側のルーティング確認**: そのURLにアクセスできるよう、ツール側でルーティングが定義されているか確認してください
3. ✅ **認証フロー確認**: URLにアクセスした際の認証・リダイレクトフローが正しく動作しているか確認してください
4. ✅ **エラーログ確認**: ツール側のサーバーログで404エラーの詳細を確認してください

---

## 会員サイト側の対応状況

- ✅ `signalToolAccessUrl`の取得・表示は正常に動作しています
- ✅ URLが存在しない場合のエラーハンドリングは実装済みです
- ✅ デバッグ用のコンソールログを追加済みです

会員サイト側の実装に問題はなく、ツール側での対応が必要です。

---

## 連絡先

質問や確認事項がございましたら、お気軽にお問い合わせください。

---

## 参考情報

- **会員サイトリポジトリ**: `signal-portal`
- **実装ファイル**: `src/app/home/page.tsx` (行38-74)
- **型定義**: `src/types/user.ts` (行10)

