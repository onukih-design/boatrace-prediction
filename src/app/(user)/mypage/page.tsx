"use client";

import { VENUES } from "@/lib/venues";

export default function MyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        ⚙️ マイページ
      </h1>

      {/* LINE連携案内 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          LINE連携
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 mb-3">
            LINEで友だち追加すると、毎日の予想結果が自動配信されます。
          </p>
          <a
            href="#"
            className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            LINE友だち追加
          </a>
          <p className="text-sm text-green-600 mt-2">
            ※ LINE公式アカウントのQRコードまたはリンクからどうぞ
          </p>
        </div>
      </div>

      {/* 通知設定 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          配信設定
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">レース前予想配信</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">結果通知</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">上位予想ピックアップ</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
          </label>
        </div>
      </div>

      {/* お気に入り場 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          お気に入り競艇場
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          選択した場の予想が優先的に配信されます
        </p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {VENUES.map((venue) => (
            <label
              key={venue.code}
              className="flex items-center gap-1.5 text-sm border rounded-lg px-2 py-1.5 hover:bg-blue-50 cursor-pointer"
            >
              <input type="checkbox" className="rounded" />
              <span>{venue.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 予想の見方 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          予想の見方
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <div>
              <p className="font-medium text-gray-800">1位予想（本命）</p>
              <p>統計データから最も勝率が高いと判定された艇</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <div>
              <p className="font-medium text-gray-800">2位予想（対抗）</p>
              <p>本命に次ぐスコアを持つ対抗馬</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <div>
              <p className="font-medium text-gray-800">3位予想（穴）</p>
              <p>波乱要素を含む注目の艇</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
