# 請求書自動生成ガイド

## 概要

請求書支払いを選択したユーザーに対して、毎月自動で請求書を生成し、通知を送信する機能を実装しました。

## 機能

1. **サイドバーに請求書ページへのリンクを表示**
   - 請求書支払い（`contractData.paymentMethods`に"請求書発行"が含まれる）ユーザーのみ表示
   - `/invoice`ページにアクセス可能

2. **請求書ページ（/invoice）**
   - 過去の請求書一覧を表示
   - 今月の請求書を手動で発行可能
   - 請求書詳細の表示・PDF出力

3. **毎月の請求書自動生成**
   - API route: `/api/invoices/generate-monthly`
   - 請求書支払いユーザー全員に対して、今月の請求書を自動生成
   - 既に今月の請求書が存在する場合はスキップ
   - 請求書発行時に通知も自動生成

4. **通知システム**
   - 請求書発行時に自動で通知を作成
   - 通知は`/home`ページの`NotificationBanner`に表示される

## スケジュール設定方法

毎月の請求書自動生成をスケジュールするには、以下のいずれかの方法を使用できます：

### 方法1: Vercel Cron Jobs（推奨）

`vercel.json`に以下を追加：

```json
{
  "crons": [
    {
      "path": "/api/invoices/generate-monthly",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

これにより、毎月1日の0時0分に自動実行されます。

### 方法2: 外部Cronサービス

GitHub Actions、cron-job.org、EasyCronなどの外部サービスを使用：

- URL: `https://your-domain.com/api/invoices/generate-monthly`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: 毎月1日 0:00（推奨）

### 方法3: Cloud Functions（Firebase）

Firebase Functionsを使用する場合：

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const generateMonthlyInvoices = functions.pubsub
  .schedule('0 0 1 * *') // 毎月1日 0:00
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    // API routeと同じロジックを実装
    // または、API routeを呼び出す
  });
```

## 環境変数

`.env.local`に以下を追加：

```env
CRON_SECRET=your-secret-key-here
```

このシークレットキーは、API routeの認証に使用されます。

## Firestore構造

### invoicesコレクション

```typescript
{
  userId: string;
  invoiceNumber: string; // "INV-YYYYMM-XXX"
  invoiceDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  planId: string; // "light" | "standard" | "professional" | "light-plus"
  monthlyFee: number;
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "overdue";
  createdAt: Timestamp;
  paidAt?: Timestamp;
}
```

### notificationsコレクション

請求書発行時に自動生成される通知：

```typescript
{
  title: "請求書が発行されました",
  content: string; // 請求書番号、金額、支払期限を含む
  type: "info",
  priority: "high",
  status: "published",
  targetAudience: "all",
  isSticky: true, // 固定表示
  tags: ["請求書"],
  createdBy: "system",
  createdAt: Timestamp,
  publishedAt: Timestamp,
}
```

## セキュリティ

- Firestoreセキュリティルールで、ユーザーは自分の請求書のみ読み取り可能
- API routeは`CRON_SECRET`による認証が必要
- 請求書の書き込みはAPI route経由のみ（クライアント側からの直接書き込みは不可）

## テスト方法

手動で請求書を生成する場合：

```bash
curl -X POST https://your-domain.com/api/invoices/generate-monthly \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

または、`/invoice`ページの「今月の請求書を発行」ボタンを使用。






