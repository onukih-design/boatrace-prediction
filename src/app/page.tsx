import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-600 text-white">
      {/* ヒーローセクション */}
      <header className="max-w-5xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🚤</span>
          <span className="text-xl font-bold">ボートレース予想AI</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/predictions" className="hover:text-blue-200 transition">
            予想一覧
          </Link>
          <Link href="/history" className="hover:text-blue-200 transition">
            的中履歴
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            管理画面
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          統計データが導く
          <br />
          <span className="text-yellow-300">勝利の方程式</span>
        </h1>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          全24場のレースデータを分析し、勝率・モーター成績・コース別成績から
          統計ベースの予想を毎日お届け。LINEで簡単に受け取れます。
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            href="/predictions"
            className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
          >
            🎯 今日の予想を見る
          </Link>
          <Link
            href="/history"
            className="px-8 py-3 bg-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
          >
            📊 的中履歴を見る
          </Link>
        </div>

        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">統計分析エンジン</h3>
            <p className="text-blue-100 text-sm">
              過去10年分の全場データを分析。選手勝率、モーター2連対率、コース有利度など9つの要素で総合スコアリング。
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">上位予想ピックアップ</h3>
            <p className="text-blue-100 text-sm">
              各レースの全出走艇をスコアリングし、上位予想を自動ピックアップ。毎日の予想をわかりやすく表示。
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">LINE自動配信</h3>
            <p className="text-blue-100 text-sm">
              友だち追加するだけで毎日の予想が届きます。「今日の予想」とメッセージを送るだけでOK。
            </p>
          </div>
        </div>

        {/* 分析要素 */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-left">
          <h2 className="text-2xl font-bold text-center mb-6">
            9つの分析要素
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-medium">選手勝率</p>
                <p className="text-blue-200">全国勝率（重み: 25%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">🛥️</span>
              <div>
                <p className="font-medium">コース有利度</p>
                <p className="text-blue-200">インコース優位（重み: 20%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">⚙️</span>
              <div>
                <p className="font-medium">モーター成績</p>
                <p className="text-blue-200">2連対率（重み: 15%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">🥇</span>
              <div>
                <p className="font-medium">ランクボーナス</p>
                <p className="text-blue-200">A1 → B2（重み: 10%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium">2連対率</p>
                <p className="text-blue-200">選手2連対率（重み: 10%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-medium">展示タイム</p>
                <p className="text-blue-200">直前展示（重み: 5%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-medium">STタイミング</p>
                <p className="text-blue-200">平均ST（重み: 5%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">🔢</span>
              <div>
                <p className="font-medium">3連対率</p>
                <p className="text-blue-200">選手3連対率（重み: 5%）</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-2xl">⛵</span>
              <div>
                <p className="font-medium">ボート成績</p>
                <p className="text-blue-200">ボート2連対率（重み: 5%）</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="max-w-5xl mx-auto px-4 py-8 mt-8 border-t border-white/20 text-center text-blue-200 text-sm">
        <p>ボートレース予想AI - 統計データに基づく予想配信サービス</p>
        <p className="mt-2 text-blue-300/60">
          予想は統計データに基づくもので、的中を保証するものではありません。
          競艇は公営競技です。節度を持ってお楽しみください。
        </p>
      </footer>
    </div>
  );
}
