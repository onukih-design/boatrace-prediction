"use client";

import { useEffect, useState } from "react";

export default function AdminPredictions() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/predictions");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!confirm("本日の予想を生成しますか？")) return;
    const res = await fetch("/api/admin/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert(data.message || "生成完了");
    fetchStats();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">予想管理</h1>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          🎯 予想生成
        </button>
      </div>

      {/* 的中率推移 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          直近の的中率推移
        </h2>
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : stats?.hitHistory?.length > 0 ? (
          <div className="space-y-2">
            {stats.hitHistory.map((hit: any) => (
              <div key={hit.id} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24">
                  {new Date(hit.targetDate).toLocaleDateString("ja-JP")}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(hit.hitRate * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {hit.hitCount}/{hit.predictedRaces} ({(hit.hitRate * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">的中データがありません</p>
        )}
      </div>

      {/* 予想一覧テーブル */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          本日の予想一覧
        </h2>
        {stats?.todayPredictions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">場</th>
                  <th className="px-3 py-2 text-left">R</th>
                  <th className="px-3 py-2 text-center">1位予想</th>
                  <th className="px-3 py-2 text-center">2位予想</th>
                  <th className="px-3 py-2 text-center">3位予想</th>
                  <th className="px-3 py-2 text-center">結果</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayPredictions.map((race: any) => (
                  <tr key={race.raceId} className="border-t">
                    <td className="px-3 py-2">{race.venue}</td>
                    <td className="px-3 py-2">{race.raceNumber}R</td>
                    <td className="px-3 py-2 text-center font-bold text-red-600">
                      {race.picks[0]?.lane || "-"}号艇
                    </td>
                    <td className="px-3 py-2 text-center text-blue-600">
                      {race.picks[1]?.lane || "-"}号艇
                    </td>
                    <td className="px-3 py-2 text-center text-green-600">
                      {race.picks[2]?.lane || "-"}号艇
                    </td>
                    <td className="px-3 py-2 text-center">
                      {race.isHit === true ? (
                        <span className="text-red-600 font-bold">◎的中</span>
                      ) : race.isHit === false ? (
                        <span className="text-gray-400">✕</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">本日の予想はまだありません</p>
        )}
      </div>
    </div>
  );
}
