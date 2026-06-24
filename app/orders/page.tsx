"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const orders = [
    {
      id: 1,
      orderNo: "0001",
      customerName: "ABC工業",
      deliveryDate: "2026/07/01",
      deliveryPlace: "東京工場",
      constructionName: "配管更新工事",
      status: "受注",
    },
    {
      id: 2,
      orderNo: "0002",
      customerName: "XYZ製作所",
      deliveryDate: "2026/07/05",
      deliveryPlace: "大阪倉庫",
      constructionName: "搬送設備改修",
      status: "加工中",
    },
    {
      id: 3,
      orderNo: "0003",
      customerName: "DEF工業",
      deliveryDate: "2026/07/10",
      deliveryPlace: "名古屋工場",
      constructionName: "ライン増設工事",
      status: "出荷準備完了",
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const keyword = search.toLowerCase();

    return (
      order.orderNo.toLowerCase().includes(keyword) ||
      order.customerName.toLowerCase().includes(keyword) ||
      order.constructionName.toLowerCase().includes(keyword)
    );
  });

  function getStatusStyle(status) {
    switch (status) {
      case "受注":
        return "bg-slate-100 text-slate-700";
      case "加工中":
        return "bg-blue-100 text-blue-700";
      case "出荷準備完了":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">
            📋 製造指示書管理システム
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/orders/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ＋ 新規登録
            </button>

            <button className="text-slate-500 hover:text-red-500 text-sm">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          案件一覧
        </h2>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="案件No・顧客名・工事名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-white border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  案件No.
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  顧客名
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  納期
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  納入先
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  工事名
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  状態
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium">
                    {order.orderNo}
                  </td>

                  <td className="px-6 py-4">
                    {order.customerName}
                  </td>

                  <td className="px-6 py-4">
                    {order.deliveryDate}
                  </td>

                  <td className="px-6 py-4">
                    {order.deliveryPlace}
                  </td>

                  <td className="px-6 py-4">
                    {order.constructionName}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}