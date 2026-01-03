export default function SidebarTob() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          メニュー
        </h2>
        
        <a
          href="/toB"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          ホーム
        </a>
        
        <a
          href="/toB/accounts"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          アカウント一覧
        </a>
        
        <a
          href="/toB/usage-video"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          使い方動画
        </a>
        
        <a
          href="/toB/sales-materials"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          営業資料
        </a>
        
        <a
          href="/toB/support"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          サポート
        </a>
        
        <a
          href="/toB/case-studies"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          成功事例・失敗事例
        </a>
        
        <a
          href="/toB/invoice"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          請求書
        </a>
      </nav>
    </aside>
  );
}

