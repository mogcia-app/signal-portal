import Link from "next/link";

export default function SidebarToc() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
      {/* Signal.ボタン */}
      <div className="mb-8">
        <Link
          href="https://signaltool.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 text-2xl font-semibold text-gray-900 hover:text-gray-600 transition-colors"
        >
          Signal<span style={{ color: '#FF8a15' }}>.</span>
        </Link>
      </div>

      <nav className="space-y-2 flex-1">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          メニュー
        </h2>
        
        <a
          href="/home"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          ホーム
        </a>
        
        <a
          href="/usage-video"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          使い方動画
        </a>
        
        <a
          href="/support"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          サポート
        </a>
        
        <a
          href="/account"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          アカウント管理
        </a>
        
        <a
          href="/terms"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          利用規約
        </a>
      </nav>
    </aside>
  );
}

