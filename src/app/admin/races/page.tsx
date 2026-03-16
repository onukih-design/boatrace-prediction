"use client";

import { useEffect, useState } from "react";
import { VENUES } from "@/lib/venues";

interface Race {
  id: number;
  raceDate: string;
  raceNumber: number;
  venue: { name: string; code: string };
  entries: Array<{
    lane: number;
    result: number | null;
    racer: { name: string; rank: string; winRate: number };
    motor: { biaxialRate: number } | null;
  }>;
  predictions: Array<{
    lane: number;
    rank: number;
    score: number;
  }>;
  _count: { entries: number };
}

export default function AdminRaces() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedVenue, setSelectedVenue] = useState("");

  useEffect(() => {
    fetchRaces();
  }, [selectedDate, selectedVenue]);

  async function fetchRaces() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedVenue) params.set("venue", selectedVenue);
      const res = await fetch(`/api/admin/races?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRaces(data.races);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">レースデータ</h1>

      {/* フィルター */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全場</option>
          {VENUES.map((v) => (
            <option key={v.code} value={v.code}>
              {v.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            fetch("/api/admin/scrape", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date: selectedDate }),
            })
              .then((r) => r.json())
              .then((d) => alert(d.message));
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 この日のデータ取得
        </button>
      </div>

      {/* レース一覧 */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : races.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            レースデータがありません
          </p>
        ) : (
          races.map((race) => (
            <div
              key={race.id}
              className="bg-white rounded-xl shadow-sm border p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  🚤 {race.venue.name} {race.raceNumber}R
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(race.raceDate).toLocaleDateString("ja-JP")}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 text-left">枠</th>
                      <th className="px-2 py-1 text-left">選手</th>
                      <th className="px-2 py-1 text-left">ランク</th>
                      <th className="px-2 py-1 text-right">勝率</th>
                      <th className="px-2 py-1 text-right">モーター</th>
                      <th className="px-2 py-1 text-center">予想順位</th>
                      <th className="px-2 py-1 text-center">結果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {race.entries.map((entry) => {
                      const pred = race.predictions.find(
                        (p) => p.lane === entry.lane
                      );
                      return (
                        <tr
                          key={entry.lane}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-2 py-1 font-bold">{entry.lane}</td>
                          <td className="px-2 py-1">{entry.racer.name}</td>
                          <td className="px-2 py-1">
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                entry.racer.rank === "A1"
                                  ? "bg-red-100 text-red-700"
                                  : entry.racer.rank === "A2"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {entry.racer.rank}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-right">
                            {entry.racer.winRate.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {entry.motor?.biaxialRate.toFixed(1) || "-"}%
                          </td>
                          <td className="px-2 py-1 text-center">
                            {pred ? (
                              <span
                                className={`font-bold ${
                                  pred.rank === 1
                                    ? "text-red-600"
                                    : pred.rank === 2
                                      ? "text-blue-600"
                                      : pred.rank === 3
                                        ? "text-green-600"
                                        : "text-gray-500"
                                }`}
                              >
                                {pred.rank}位
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-2 py-1 text-center font-bold">
                            {entry.result ? `${entry.result}着` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
