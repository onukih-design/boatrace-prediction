"use client";

import { useEffect, useState } from "react";

interface LineUser {
  id: number;
  lineUserId: string;
  displayName: string | null;
  isActive: boolean;
  isBlocked: boolean;
  joinedAt: string;
  lastActiveAt: string;
  _count: { notifications: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<LineUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">顧客管理</h1>

      {/* フィルター */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="名前・LINE IDで検索..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">全て</option>
          <option value="active">アクティブ</option>
          <option value="blocked">ブロック</option>
        </select>
        <span className="self-center text-gray-500">
          {pagination ? `全${pagination.total}件` : ""}
        </span>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                表示名
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                ステータス
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                登録日
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                最終アクティブ
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                配信数
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  読み込み中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  ユーザーがいません
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.id}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {user.displayName || "未設定"}
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        アクティブ
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        ブロック
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.joinedAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.lastActiveAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user._count.notifications}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            ← 前へ
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  );
}
