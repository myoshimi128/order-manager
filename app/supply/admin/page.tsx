'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/Layout'; // 共通レイアウト
import { Button } from '@/components/Button'; // 共通ボタン

// 初期ダミーデータ（status, purchase_url, ordered_at を完備）
const initialRequests = [
  { 
    id: "REQ-001", 
    name: "コピー用紙 A4", 
    catalog_no: "PPC-A4-500", 
    quantity: 10, 
    unit: "本", 
    location: "事務所 棚A-1", 
    requester: "田中（事務所）", 
    comment: "来週から大きな現場の書類印刷で入用があるので早めに発注します。多めにお願いします。", 
    date: "2026/06/27",
    status: "リクエスト中",
    purchase_url: "https://www.amazon.co.jp/s?k=%E3%82%B3%E3%83%94%E3%83%BC%E7%94%A8%E7%B4%99+A4",
    ordered_at: null as string | null
  },
  { 
    id: "REQ-002", 
    name: "養生テープ", 
    catalog_no: "YT-50", 
    quantity: 5, 
    unit: "個", 
    location: "現場 倉庫B", 
    requester: "佐藤（現場班）", 
    comment: "来月の外壁工事セクションで一気に使うため、ストックを補充したいです。", 
    date: "2026/06/26",
    status: "リクエスト中",
    purchase_url: "https://www.monotaro.com/s/q-%E9%A4%8A%E7%94%9F%E3%83%85%E3%83%BC%E3%83%97/",
    ordered_at: null as string | null
  },
  { 
    id: "REQ-003", 
    name: "清掃用モップ", 
    catalog_no: "MOP-60", 
    quantity: 2, 
    unit: "本", 
    location: "現場 倉庫C", 
    requester: "鈴木（美化係）", 
    comment: "既存のモップの柄が折れてしまい、現在在庫が0なので至急お願いします！", 
    date: "2026/06/25",
    status: "リクエスト中",
    purchase_url: "https://www.amazon.co.jp/s?k=%E6%B8%85%E6%8A%AC%E7%94%A8%E3%83%A2%E3%83%83%E3%83%97",
    ordered_at: null as string | null
  },
];

export default function AdminOrderRequestsPage() {
  const [requests, setRequests] = useState(initialRequests);

  // 【設計書仕様】発注完了にする処理
  const handleOrderComplete = (id: string, name: string) => {
    const now = new Date().toLocaleString('ja-JP');
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: '発注済み', ordered_at: now } : req
      )
    );
    alert(`【発注処理完了】\n${name} を「発注済み」に更新しました。\n（自動挿入時刻: ${now}）`);
  };

  // 【復活】削除ボタン（否認）を押した時の処理
  const handleDelete = (id: string, name: string) => {
    const confirmDelete = window.confirm(`【リクエストの削除確認】\n${name} のリクエストを一覧から削除しますか？\n（画面から非表示になります）`);
    if (confirmDelete) {
      setRequests(requests.filter(req => req.id !== id));
    }
  };

  // リクエスト中（未処理）と発注済み（処理済み）を分ける
  const activeRequests = requests.filter(req => req.status === 'リクエスト中');
  const completedRequests = requests.filter(req => req.status === '発注済み');

  return (
    <Layout className="max-w-7xl space-y-6 my-6">
      <div className="w-full mx-auto space-y-6 z-10 relative">
        
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
          <div className="w-56">
            <Button href="/supply" className="border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50">
              ← 在庫一覧（ダッシュボード）へ
            </Button>
          </div>
        </div>

        {/* メインリスト（見やすかったテーブル風レイアウトをベースに改良） */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">承認待ちのリクエスト 一覧</span>
            <span className="text-xs font-bold text-slate-500">未処理: {activeRequests.length} 件</span>
          </div>

          {activeRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-2xl">🎉</div>
              <div className="text-xs font-bold text-slate-400">現在、未処理の発注リクエストはありません。</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeRequests.map((req) => (
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

                    {/* 数量 */}
                    <div className="inline-flex items-baseline gap-1 bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-slate-500 font-medium">希望発注数:</span>
                      <span className="text-lg font-black text-slate-800 ml-1">{req.quantity}</span>
                      <span className="text-xs font-bold text-slate-500">{req.unit}</span>
                    </div>

                    {/* 現場からのコメント */}
                    <div className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-3 text-xs text-slate-600 leading-relaxed relative">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">💬 現場からのコメント・理由</div>
                      「{req.comment}」
                    </div>
                  </div>

                  {/* 右側：3つのアクションボタン（購入先・発注完了・削除） */}
                  <div className="flex md:flex-col justify-end gap-2 whitespace-nowrap pt-2 md:pt-0">
                    {/* 1. 購入先ページを開くリンク（安全な a タグ仕様） */}
                    <div className="w-full md:w-32">
                      <a
                        href={req.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-amber-500 text-white font-bold text-xs py-2.5 hover:bg-amber-400 flex items-center justify-center gap-1 rounded-md text-center shadow-xs transition-colors cursor-pointer"
                      >
                        🛒 購入先を開く
                      </a>
                    </div>
                    
                    {/* 2. 発注完了にする（ブランドカラーの青） */}
                    <div className="w-full md:w-32">
                      <button
                        type="button"
                        onClick={() => handleOrderComplete(req.id, req.name)}
                        className="w-full bg-brand-dark hover:bg-brand-blue text-white font-bold text-xs py-2.5 rounded-md flex items-center justify-center gap-1 text-center transition-colors cursor-pointer shadow-sm"
                      >
                        👍 発注完了にする
                      </button>
                    </div>

                    {/* 3. 削除ボタン（しっかり残しました！） */}
                    <div className="w-full md:w-32">
                      <Button
                        onClick={() => handleDelete(req.id, req.name)}
                        className="border border-slate-200 bg-white text-slate-500 font-bold text-xs py-2.5 hover:bg-red-50 hover:text-red-600"
                      >
                        🗑️ 削除
                      </Button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------
           【履歴】処理済み（発注済み）の履歴表示エリア
        ------------------------------------------------------- */}
        {completedRequests.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
              ✅ 本日処理済みのタスク（履歴: {completedRequests.length}件）
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold">
                    <th className="p-4">ID / 備品名</th>
                    <th className="p-4">発注数量</th>
                    <th className="p-4">状態</th>
                    <th className="p-4 text-right">発注完了時刻 (ordered_at)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {completedRequests.map((req) => (
                    <tr key={req.id} className="bg-slate-50/30">
                      <td className="p-4">
                        <span className="font-mono text-slate-400 mr-2">[{req.id}]</span>
                        <span className="font-bold text-slate-700">{req.name}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{req.quantity} {req.unit}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full font-bold text-[10px]">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">{req.ordered_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </Layout>
  );
}