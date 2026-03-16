"use client";

import { useEffect, useState } from "react";
import { VENUES } from "@/lib/venues";

interface PredictionData {
  id: number;
  lane: number;
  score: number;
  rank: number;
  isHit: boolean | null;
  race: {
    id: number;
    raceDate: string;
    raceNumber: number;
    venue: { name: string; code: string };
    entries: Array<{
      lane: number;
      racer: { name: string; rank: string; winRate: number };
    }>;
  };
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedVenue, setSelectedVenue] = useState("");

  useEffect(() => {
    fetchPredictions();
  }, [selectedDate, selectedVenue]);

  async function fetchPredictions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedVenue) params.set("venue", selectedVenue);
      const res = await fetch(`/api/predictions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // レースごとにグループ化
  const grouped = predictions.reduce(
    (acc, pred) => {
      const key = pred.race.id;
      if (!acc[key]) {
        acc[key] = {
          race: pred.race,
          predictions: [],
        };
      }
      acc[key].predictions.push(pred);
      return acc;
    },
    {} as Record<number, { race: PredictionData["race"]; predictions: PredictionData[] }>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        🎯 本日の予想
      </h1>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全場</option>
          {VENUES.map((v) => (
            <option key={v.code} value={v.code}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* 予想カード */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">予想データがありません</p>
          <p className="text-gray-300 text-sm mt-2">
            レースデータが取得されると予想が生成されます
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(grouped).map(({ race, predictions: preds }) => (
            <div
              key={race.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    🚤 {race.venue.name} {race.raceNumber}R
                  </h3>
                  <span className="text-sm opacity-80">
                    {new Date(race.raceDate).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {preds
                  .sort((a, b) => a.rank - b.rank)
                  .map((pred) => {
                    const entry = race.entries.find(
                      (e) => e.lane === pred.lane
                    );
                    return (
                      <div
                        key={pred.id}
                        className={`flex items-center gap-3 py-2 ${
                          pred.rank > 1 ? "border-t" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            pred.rank === 1
                              ? "bg-red-500"
                              : pred.rank === 2
                                ? "bg-blue-500"
                                : "bg-green-500"
                          }`}
                        >
                          {pred.rank}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">
                              {pred.lane}号艇
                            </span>
                            <span className="text-gray-600">
                              {entry?.racer.name || ""}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                entry?.racer.rank === "A1"
                                  ? "bg-red-100 text-red-700"
                                  : entry?.racer.rank === "A2"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {entry?.racer.rank}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            勝率{entry?.racer.winRate.toFixed(2)} | スコア
                            {(pred.score * 100).toFixed(1)}
                          </div>
                        </div>
                        {pred.isHit === true && (
                          <span className="text-red-500 font-bold text-sm">
                            ◎的中
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
