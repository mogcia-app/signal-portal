import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";

export default function ToBSupportPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* toB専用サイドバー */}
      <SidebarTob />

      {/* メインコンテンツエリア */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            サポート
          </h1>

          {/* 運営会社情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              運営会社情報
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">運営会社：</span>
                <span className="text-sm text-gray-900 ml-2">（後で入力）</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">メール：</span>
                <span className="text-sm text-gray-900 ml-2">（後で入力）</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">電話：</span>
                <span className="text-sm text-gray-900 ml-2">（後で入力）</span>
              </div>
            </div>
          </div>

          {/* その他の問い合わせ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              その他の問い合わせ
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              お問い合わせフォームはこちら
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">
                （お問い合わせフォームを後で実装予定）
              </p>
            </div>
          </div>

          {/* ミーティングを予約する */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ミーティングを予約する
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Google Meetでミーティングを予約できます
            </p>
            <div className="bg-gray-100 rounded-lg p-4 aspect-video flex items-center justify-center">
              <p className="text-sm text-gray-500">
                Google Meet（後から埋め込み予定）
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 右下フローティングQ&A */}
      <FloatingQnA />
    </div>
  );
}

