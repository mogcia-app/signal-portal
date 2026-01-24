# ホームページ（/home）拡張案

## 現在しっくり来ている項目

1. ✅ **通知はここに表示されます**（NotificationBanner）
2. ✅ **Signal.ツールにアクセス**（Signal.ツールを開くボタン）
3. ✅ **はじめに見る動画**（何ができるツールか・まず何をすればいいか・どこを見れば迷わないか）

## 拡張案

### 案1: シンプル重視（推奨）

現在の良い部分を活かしつつ、必要最小限の情報を追加：

```
┌─────────────────────────────────────┐
│ ホーム                               │
├─────────────────────────────────────┤
│ [通知はここに表示されます]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Signal.ツールにアクセス          │ │
│ │ SNS投稿作成や分析機能を使用できます│ │
│ │ [Signal.ツールを開く]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ はじめに見る動画                 │ │
│ │ 何ができるツールか・まず何をすれば│ │
│ │ いいか・どこを見れば迷わないか    │ │
│ │ [動画プレーヤー]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ クイックアクセス                  │ │
│ │ • 使い方動画一覧                   │ │
│ │ • サポート                        │ │
│ │ • アカウント管理                   │ │
│ └─────────────────────────────────┘ │
```

**追加要素**:
- **クイックアクセス**セクション（よく使うページへのショートカット）
- シンプルで見やすいレイアウト

---

### 案2: 情報を少し追加

案1に加えて、ユーザーの状態を表示：

```
┌─────────────────────────────────────┐
│ ホーム                               │
├─────────────────────────────────────┤
│ [通知はここに表示されます]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Signal.ツールにアクセス          │ │
│ │ SNS投稿作成や分析機能を使用できます│ │
│ │ [Signal.ツールを開く]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ はじめに見る動画                 │ │
│ │ 何ができるツールか・まず何をすれば│ │
│ │ いいか・どこを見れば迷わないか    │ │
│ │ [動画プレーヤー]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ あなたのプラン                    │ │
│ │ スタンダードプラン                │ │
│ │ 月額: ¥30,000                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ クイックアクセス                  │ │
│ │ • 使い方動画一覧                   │ │
│ │ • サポート                        │ │
│ │ • アカウント管理                   │ │
│ │ • 契約確認                        │ │
│ └─────────────────────────────────┘ │
```

**追加要素**:
- **あなたのプラン**セクション（現在のプラン名と月額料金を表示）
- クイックアクセスに「契約確認」を追加

---

### 案3: アクティビティ重視

ユーザーの利用状況を可視化：

```
┌─────────────────────────────────────┐
│ ホーム                               │
├─────────────────────────────────────┤
│ [通知はここに表示されます]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Signal.ツールにアクセス          │ │
│ │ SNS投稿作成や分析機能を使用できます│ │
│ │ [Signal.ツールを開く]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ はじめに見る動画                 │ │
│ │ 何ができるツールか・まず何をすれば│ │
│ │ いいか・どこを見れば迷わないか    │ │
│ │ [動画プレーヤー]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 最近のアクティビティ              │ │
│ │ • 投稿作成: 3件（今月）           │ │
│ │ • 分析実行: 5回（今月）           │ │
│ │ • 最後の利用: 2日前               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ クイックアクセス                  │ │
│ │ • 使い方動画一覧                   │ │
│ │ • サポート                        │ │
│ │ • アカウント管理                   │ │
│ └─────────────────────────────────┘ │
```

**追加要素**:
- **最近のアクティビティ**セクション（Signal.ツールからのデータを表示）

---

## 推奨: 案1（シンプル重視）

**理由**:
- 現在しっくり来ている項目を活かせる
- 情報過多にならず、ユーザーが迷わない
- 実装が簡単で、将来的に拡張しやすい

**実装内容**:
1. 現在の良い部分を維持
   - 通知バナー
   - Signal.ツールアクセスボタン
   - はじめに見る動画
2. 削除する項目
   - 「次にやること」チェックリスト（使われていない可能性）
   - 「今月の利用状況」（データがない可能性）
   - 「困ったらここ」（クイックアクセスに統合）
3. 追加する項目
   - **クイックアクセス**セクション
     - 使い方動画一覧
     - サポート
     - アカウント管理
     - 契約確認（請求書支払いユーザーの場合は請求書も）

---

## 実装イメージ（案1）

```tsx
<div className="max-w-5xl mx-auto space-y-8">
  <h1 className="text-2xl font-bold text-gray-900">ホーム</h1>

  {/* 通知バナー */}
  <NotificationBanner userProfile={userProfile} fixed={false} />

  {/* Signal.ツールへのアクセスボタン */}
  {signalToolAccessUrl && (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1 text-gray-900">
            Signal.ツールにアクセス
          </h2>
          <p className="text-sm text-gray-600">
            SNS投稿作成や分析機能を使用できます
          </p>
        </div>
        <button
          onClick={() => window.open(signalToolAccessUrl, '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Signal.ツールを開く
        </button>
      </div>
    </div>
  )}

  {/* はじめに見る動画 */}
  <div>
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        はじめに見る動画
      </h2>
      <p className="text-sm text-gray-600">
        何ができるツールか・まず何をすればいいか・どこを見れば迷わないか
      </p>
    </div>
    <div className="w-full h-96 bg-gray-300 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">
        概要説明動画（後から埋め込み予定・3分以内・1本完結）
      </p>
    </div>
  </div>

  {/* クイックアクセス */}
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">
      クイックアクセス
    </h2>
    <div className="grid grid-cols-2 gap-4">
      <Link
        href="/usage-video"
        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <div>
          <div className="font-medium text-gray-900">使い方動画一覧</div>
          <div className="text-sm text-gray-600">機能別の使い方を確認</div>
        </div>
      </Link>
      
      <Link
        href="/support"
        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <div>
          <div className="font-medium text-gray-900">サポート</div>
          <div className="text-sm text-gray-600">お問い合わせ・FAQ</div>
        </div>
      </Link>
      
      <Link
        href="/account"
        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div>
          <div className="font-medium text-gray-900">アカウント管理</div>
          <div className="text-sm text-gray-600">プロフィール・設定</div>
        </div>
      </Link>
      
      <Link
        href="/terms"
        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <div className="font-medium text-gray-900">契約確認</div>
          <div className="text-sm text-gray-600">契約書・請求書を確認</div>
        </div>
      </Link>
    </div>
  </div>
</div>
```

---

## まとめ

**推奨案**: 案1（シンプル重視）

**理由**:
- 現在しっくり来ている項目を活かせる
- 情報過多にならず、ユーザーが迷わない
- 実装が簡単で、将来的に拡張しやすい

**実装する項目**:
1. ✅ 通知バナー（維持）
2. ✅ Signal.ツールアクセスボタン（維持）
3. ✅ はじめに見る動画（維持）
4. ➕ クイックアクセスセクション（新規追加）

**削除する項目**:
- 「次にやること」チェックリスト
- 「今月の利用状況」
- 「困ったらここ」（クイックアクセスに統合）



