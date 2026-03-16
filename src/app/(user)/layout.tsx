import Link from "next/link";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🚤</span>
            <span className="text-lg font-bold text-gray-800">
              ボートレース予想AI
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/predictions"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              予想一覧
            </Link>
            <Link
              href="/history"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              的中履歴
            </Link>
            <Link
              href="/mypage"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              マイページ
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>ボートレース予想AI - 統計データに基づく予想配信サービス</p>
          <p className="mt-2 text-gray-500">
            予想は統計データに基づくもので、的中を保証するものではありません。
          </p>
          <p className="mt-2 text-gray-500">
            競艇は公営競技です。節度を持ってお楽しみください。
          </p>
        </div>
      </footer>
    </div>
  );
}
