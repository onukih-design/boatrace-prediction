"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayRaces: number;
  todayPredictions: number;
  hitRate: number;
  deliveryToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "総ユーザー数",
      value: stats?.totalUsers ?? 0,
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      label: "アクティブユーザー",
      value: stats?.activeUsers ?? 0,
      icon: "✅",
      color: "bg-green-500",
    },
    {
      label: "本日のレース数",
      value: stats?.todayRaces ?? 0,
      icon: "🚤",
      color: "bg-cyan-500",
    },
    {
      label: "予想数",
      value: stats?.todayPredictions ?? 0,
      icon: "🎯",
      color: "bg-purple-500",
    },
    {
      label: "直近的中率",
      value: stats ? `${stats.hitRate.toFixed(1)}%` : "-%",
      icon: "📈",
      color: "bg-orange-500",
    },
    {
      label: "本日配信数",
      value: stats?.deliveryToday ?? 0,
      icon: "📨",
      color: "bg-pink-500",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div
                className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          クイックアクション
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => triggerScrape()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 データ取得実行
          </button>
          <button
            onClick={() => triggerPrediction()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🎯 予想生成
          </button>
          <button
            onClick={() => triggerDelivery()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📨 LINE配信
          </button>
        </div>
      </div>
    </div>
  );
}

async function triggerScrape() {
  if (!confirm("本日のデータ取得を開始しますか？")) return;
  const res = await fetch("/api/admin/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const data = await res.json();
  alert(data.message || "実行しました");
}

async function triggerPrediction() {
  if (!confirm("予想を生成しますか？")) return;
  const res = await fetch("/api/admin/predictions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const data = await res.json();
  alert(data.message || "生成しました");
}

async function triggerDelivery() {
  if (!confirm("予想結果をLINEユーザーに配信しますか？")) return;
  const res = await fetch("/api/admin/delivery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  const data = await res.json();
  alert(data.message || "配信しました");
}
