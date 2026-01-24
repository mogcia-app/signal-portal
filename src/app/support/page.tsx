"use client";

import Link from "next/link";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";

export default function SupportPage() {
  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-gray-50">
        {/* toC専用サイドバー */}
        <SidebarToc />

        {/* メインコンテンツエリア */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">
              サポート
            </h1>

            {/* よくある質問 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                よくある質問
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Q. Signal.ツールの使い方が分かりません
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    A. <Link href="/usage-video" className="text-orange-600 hover:text-orange-700 underline">使い方動画一覧</Link>ページで、機能別の使い方動画を確認できます。また、<Link href="/home" className="text-orange-600 hover:text-orange-700 underline">ホームページ</Link>の「はじめに見る動画」もご覧ください。
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Q. プランの変更はできますか？
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    A. プランの変更は<Link href="/account" className="text-orange-600 hover:text-orange-700 underline">アカウント管理</Link>ページから行えます。変更は次回請求日から反映されます。
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Q. 請求書の確認方法を教えてください
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    A. 請求書支払いを選択されている場合は、サイドバーの「請求書」から確認できます。また、<Link href="/terms" className="text-orange-600 hover:text-orange-700 underline">契約確認</Link>ページでも契約内容と請求書を確認できます。
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Q. パスワードを忘れてしまいました
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    A. ログインページの「パスワードを忘れた場合」から、メールアドレスを入力してパスワードリセットメールを送信してください。
                  </p>
                </div>
              </div>
            </div>

            {/* 運営会社情報 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                運営会社情報
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">運営会社：</span>
                  <span className="text-sm text-gray-900 ml-2">株式会社MOGCIA</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">住所：</span>
                  <span className="text-sm text-gray-900 ml-2">〒810-0001 福岡県福岡市中央区天神4丁目6-28 いちご天神ノースビル7階</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">メール：</span>
                  <a href="mailto:info@mogcia.jp" className="text-sm text-orange-600 hover:text-orange-700 ml-2 underline">
                    info@mogcia.jp
                  </a>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">電話：</span>
                  <a href="tel:092-517-9804" className="text-sm text-orange-600 hover:text-orange-700 ml-2 underline">
                    092-517-9804
                  </a>
                </div>
              </div>
            </div>

            {/* お問い合わせ */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                お問い合わせ
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                ご不明な点がございましたら、以下の方法でお問い合わせください。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">メールでお問い合わせ</div>
                    <a href="mailto:info@mogcia.jp" className="text-sm text-orange-600 hover:text-orange-700">
                      info@mogcia.jp
                    </a>
                  </div>
                </div>
                <a
                  href="https://calendar.app.google/XtgkwcwuutwJ9qJYA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">ミーティングを予約</div>
                    <p className="text-sm text-gray-600">Google Meetで直接お話しできます</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* 関連リンク */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                関連リンク
              </h2>
              <div className="space-y-2">
                <Link
                  href="/usage-video"
                  className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  • 使い方動画一覧
                </Link>
                <Link
                  href="/home"
                  className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  • ホーム
                </Link>
                <Link
                  href="/account"
                  className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  • アカウント管理
                </Link>
                <Link
                  href="/terms"
                  className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  • 契約確認
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* 右下フローティングQ&A */}
        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}


