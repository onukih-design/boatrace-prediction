"use client";

import { useEffect, useState } from "react";

interface HitSummary {
  id: number;
  targetDate: string;
  totalRaces: number;
  predictedRaces: number;
  hitCount: number;
  hitRate: number;
  topPickHits: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // 統計計算
  const totalHits = history.reduce((sum, h) => sum + h.hitCount, 0);
  const totalPredicted = history.reduce((sum, h) => sum + h.predictedRaces, 0);
  const overallRate = totalPredicted > 0 ? totalHits / totalPredicted : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        📊 的中履歴
      </h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">総合的中率</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {loading ? "..." : `${(overallRate * 100).toFixed(1)}%`}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">的中数 / 予想数</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">
            {loading ? "..." : `${totalHits} / ${totalPredicted}`}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">集計日数</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">
            {loading ? "..." : history.length}
          </p>
        </div>
      </div>

      {/* 日別一覧 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700">日別的中率</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            的中データがありません
          </div>
        ) : (
          <div className="divide-y">
            {history.map((h) => (
              <div
                key={h.id}
                className="px-6 py-4 flex items-center hover:bg-gray-50"
              >
                <div className="w-32 text-sm text-gray-500">
                  {new Date(h.targetDate).toLocaleDateString("ja-JP")}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          h.hitRate >= 0.3
                            ? "bg-green-500"
                            : h.hitRate >= 0.15
                              ? "bg-blue-500"
                              : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.max(h.hitRate * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-32 text-right">
                  <span className="font-bold text-gray-800">
                    {h.hitCount}/{h.predictedRaces}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(h.hitRate * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
