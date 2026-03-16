"use client";

import { useEffect, useState } from "react";

interface DeliveryLog {
  id: number;
  messageType: string;
  content: string;
  status: string;
  sentAt: string;
  lineUser: {
    displayName: string | null;
    lineUserId: string;
  };
}

export default function AdminDelivery() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery?page=${page}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleBroadcast() {
    if (!confirm("全アクティブユーザーに本日の予想を配信しますか？")) return;
    const res = await fetch("/api/admin/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert(data.message || "配信完了");
    fetchLogs();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            送信済
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            失敗
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">配信管理</h1>
        <button
          onClick={handleBroadcast}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          📨 一斉配信
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                日時
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ユーザー
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                種別
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ステータス
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                内容
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  読み込み中...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  配信ログがありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(log.sentAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {log.lineUser.displayName || log.lineUser.lineUserId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.messageType}
                  </td>
                  <td className="px-4 py-3">{statusBadge(log.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {log.content.substring(0, 80)}...
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
