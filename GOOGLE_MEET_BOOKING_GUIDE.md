# Google Meet予約カレンダー実装ガイド

## 概要

Google Meetの予約カレンダーを`/support`ページに埋め込む方法について説明します。

## 実装方法の選択肢

### 方法1: Google Calendarの予約ページ機能を使用（推奨・最も簡単・無料）

**メリット**:
- Google Calendarの標準機能
- **追加のアカウント作成が不要**（既存のGoogleアカウントでOK）
- 完全無料
- 実装が最も簡単（約15分）
- Google Meetとの連携が自動
- メンテナンスが不要

**デメリット**:
- カスタマイズ性が低い
- デザインの統一が難しい

**実装手順**:

#### ステップ1: Google Calendarで予約ページを作成

1. [Google Calendar](https://calendar.google.com/)にアクセス
2. 左サイドバーの「予約ページを作成」をクリック
   - 表示されない場合は、設定アイコン（⚙️）→「予約ページ」から作成
3. 予約ページの設定：
   - **名前**: 「Signal.サポートミーティング」
   - **説明**: 必要に応じて入力
   - **予約可能な時間帯**: 営業時間を設定（例: 平日 10:00-18:00）
   - **会議の長さ**: 30分、60分など
   - **会議の種類**: Google Meetを選択
4. 「保存」をクリック
5. 予約ページのURLをコピー
   - 形式: `https://calendar.google.com/calendar/appointments/schedules/[SCHEDULE_ID]`

#### ステップ2: `/support`ページに埋め込む

**コード例（リンク）**:
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    ミーティングを予約
  </h2>
  <p className="text-sm text-gray-600 mb-4">
    Google Calendarの予約ページから予約できます
  </p>
  <a
    href="https://calendar.google.com/calendar/appointments/schedules/your-schedule-id"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    予約ページを開く
  </a>
</div>
```

**コード例（iframe）**:
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    ミーティングを予約
  </h2>
  <p className="text-sm text-gray-600 mb-4">
    Google Calendarの予約ページから予約できます
  </p>
  <div className="w-full" style={{ minHeight: '650px' }}>
    <iframe
      src="https://calendar.google.com/calendar/appointments/schedules/your-schedule-id"
      width="100%"
      height="650"
      frameBorder="0"
      title="Google Calendar予約ページ"
      className="rounded-lg"
    />
  </div>
</div>
```

---

### 方法2: Cal.comを使用（オープンソース・無料）

**メリット**:
- 完全無料（オープンソース）
- 軽量で高速
- Google Meetとの連携が自動
- カスタマイズ性が高い
- セルフホスティング可能（Vercelにデプロイ可能）

**デメリット**:
- アカウント作成が必要
- セルフホスティングする場合は設定が必要

**実装手順**:
1. [Cal.com](https://cal.com/)でアカウント作成（またはセルフホスティング）
2. イベントタイプを作成（Google Meetを自動追加）
3. 埋め込みコードを取得
4. `/support`ページにiframeで埋め込む

**コード例**:
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    ミーティングを予約
  </h2>
  <p className="text-sm text-gray-600 mb-4">
    Google Meetでミーティングを予約できます
  </p>
  <div className="w-full" style={{ minHeight: '650px' }}>
    <iframe
      src="https://cal.com/mogcia/support"
      width="100%"
      height="650"
      frameBorder="0"
      title="Cal.com予約カレンダー"
      className="rounded-lg"
    />
  </div>
</div>
```

---

### 方法3: その他のサービス

#### YouCanBook.me
- 無料プランあり
- Google Meet連携可能
- 軽量

#### Simplybook.me
- 無料プランあり
- Google Meet連携可能

#### Bookly
- WordPressプラグイン（Next.jsには不向き）

---

### 方法4: Google Calendar API + Google Meet（カスタム実装）

**メリット**:
- Googleの公式APIを使用
- カスタマイズ性が高い
- 完全に自社ブランドで統一可能

**デメリット**:
- 実装が複雑（約2-3時間）
- OAuth認証が必要
- 予約管理の実装が必要

**実装手順**:

#### 1. Google Cloud Consoleで設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成（または既存プロジェクトを選択）
3. **APIとサービス > ライブラリ**から以下を有効化：
   - Google Calendar API
   - Google Meet API（利用可能な場合）

#### 2. OAuth 2.0認証情報を作成

1. **APIとサービス > 認証情報**に移動
2. **認証情報を作成 > OAuth クライアント ID**を選択
3. アプリケーションの種類: **ウェブアプリケーション**
4. 承認済みのリダイレクト URI: `http://localhost:3000/api/auth/callback`（開発環境）
5. クライアントIDとクライアントシークレットを取得

#### 3. 環境変数を設定

`.env.local`に追加：
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

#### 4. 実装例（Next.js API Route）

```typescript
// src/app/api/calendar/create-meeting/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startTime, endTime, attendeeEmail } = body;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // アクセストークンを設定（実際にはユーザー認証フローから取得）
    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN, // 実際には動的に取得
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Google Meetリンク付きイベントを作成
    const event = {
      summary: "サポートミーティング",
      description: "Signal.ツールに関するサポートミーティング",
      start: {
        dateTime: startTime,
        timeZone: "Asia/Tokyo",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Tokyo",
      },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return NextResponse.json({
      success: true,
      meetingLink: response.data.hangoutLink,
      eventId: response.data.id,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "ミーティングの作成に失敗しました" },
      { status: 500 }
    );
  }
}
```

---

## 推奨: 方法1（Google Calendarの予約ページ機能）

**理由**:
- **実装が最も簡単**（約15分）
- **完全無料**
- **アカウント作成不要**（既存のGoogleアカウントでOK）
- Google Meetとの連携が自動
- メンテナンスが不要
- サイトが重くても問題なし（Google Calendarは軽量）

**次点**: 方法2（Cal.com）
- オープンソースで無料
- カスタマイズ性が高い
- 軽量で高速

---

## 環境変数の設定（方法4の場合のみ）

`.env.local`に追加：
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

本番環境では、Vercelの環境変数設定に追加してください。

---

## まとめ

**推奨**: Google Calendarの予約ページ機能（方法1）

**理由**:
- 実装が最も簡単（約15分）
- 完全無料
- アカウント作成不要
- Google Meetとの連携が自動
- メンテナンスが不要

**実装時間**:
- 方法1（Google Calendar予約ページ）: 約15分（最も簡単・推奨）
- 方法2（Cal.com）: 約30分
- 方法3（その他のサービス）: 約30分
- 方法4（Google Calendar API）: 約2-3時間
