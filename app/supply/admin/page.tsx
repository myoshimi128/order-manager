"use client";

import React, { useState } from "react";
import Link from "next/link";
import HeaderZaiko from "@/components/HeaderZaiko";
import Footer from "@/components/Footer";

// 現場から届いている発注リクエストの初期ダミーデータ
const initialRequests = [
  { id: "REQ-001", name: "コピー用紙 A4", catalog_no: "PPC-A4-500", quantity: 10, unit: "本", location: "事務所 棚A-1", requester: "田中（事務所）", comment: "来週から大きな現場の書類印刷で入用があるので早めに発注します。多めにお願いします。", date: "2026/06/27" },
  { id: "REQ-002", name: "養生テープ", catalog_no: "YT-50", quantity: 5, unit: "個", location: "現場 倉庫B", requester: "佐藤（現場班）", comment: "来月の外壁工事セクションで一気に使うため、ストックを補充したいです。", date: "2026/06/26" },
  { id: "REQ-003", name: "清掃用モップ", catalog_no: "MOP-60", quantity: 2, unit: "本", location: "現場 倉庫C", requester: "鈴木（美化係）", comment: "既存のモップの柄が折れてしまい、現在在庫が0なので至急お願いします！", date: "2026/06/25" },
];

export default function AdminOrderRequestsPage() {
  const [requests, setRequests] = useState(initialRequests);

  // 1. 承認ボタンを押した時の処理
  const handleApprove = (id: string, name: string) => {
    alert(`【承認完了】\n${name} の発注リクエストを承認しました。\nステータスを「発注済み」に更新し、発注処理へ回します。`);
    // 本来はここでSupabase等のDBのステータスを「発注済み」に更新します
    setRequests(requests.filter(req => req.id !== id)); // 画面一覧から消す
  };

  // 2. 削除ボタン（事実上の否認）を押した時の処理
  const handleDelete = (id: string, name: string) => {
    const confirmDelete = window.confirm(`【リクエストの削除確認】\n${name} のリクエストを一覧から削除しますか？\n（まだ不要と判断した場合など、画面から非表示になります）`);
    if (confirmDelete) {
      // 本来はここでDBから削除、または非表示フラグを立てます
      setRequests(requests.filter(req => req.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans">
      <HeaderZaiko />

      <main className="flex-1 p-8 bg-(--color-background)" style={{ backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* ヘッダーエリア */}
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 tracking-wider">発注リクエスト承認管理</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  役職・管理者用
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">ORDER REQUEST APPROVAL</p>
            </div>
            <Link 
              href="/supply" 
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              ← 在庫一覧（ダッシュボード）へ
            </Link>
          </div>

          {/* メインリスト */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">承認待ちのリクエスト 一覧</span>
              <span className="text-xs font-bold text-slate-500">未処理: {requests.length} 件</span>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="text-2xl">🎉</div>
                <div className="text-xs font-bold text-slate-400">現在、未処理の発注リクエストはありません。</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6">
                    
                    {/* 左側：リクエストの主要情報 */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {req.id}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          申請日: {req.date}
                        </span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-100/80 px-2 py-0.5 rounded">
                          申請者: {req.requester}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-800">{req.name}</h3>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">型番: {req.catalog_no} / 保管場所: {req.location}</p>
                      </div>

                      {/* 数量のアピール */}
                      <div className="inline-flex items-baseline gap-1 bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-slate-500 font-medium">希望発注数:</span>
                        <span className="text-lg font-black text-slate-800 ml-1">{req.quantity}</span>
                        <span className="text-xs font-bold text-slate-500">{req.unit}</span>
                      </div>

                      {/* 【重要】現場からのコメント（背景色付きで目立たせる） */}
                      <div className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-3 text-xs text-slate-600 leading-relaxed relative">
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">💬 現場からのコメント・理由</div>
                        「{req.comment}」
                      </div>
                    </div>

                    {/* 右側：アクションボタン（承認・削除） */}
                    <div className="flex md:flex-col justify-end gap-2 whitespace-nowrap pt-2 md:pt-0">
                      <button
                        onClick={() => handleApprove(req.id, req.name)}
                        className="flex-1 md:w-32 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer text-center"
                      >
                        👍 承認する
                      </button>
                      <button
                        onClick={() => handleDelete(req.id, req.name)}
                        className="flex-1 md:w-32 px-4 py-2.5 border border-slate-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                      >
                        🗑️ 削除
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}