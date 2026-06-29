'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/Layout'; // 共通レイアウト
import { Button } from '@/components/Button'; // 共通ボタン

// 案件データの型定義
interface Order {
  id: string;
  customer: string;
  name: string;
  deadline: string;
  destination: string;
  status: '受注' | '製造中' | '出荷待';
}

// MVP向けモックデータ
const initialOrders: Order[] = [
  { id: 'P-2024-0091', customer: '株式会社 東和工業', name: '油圧シリンダー組立 #4ライン増設', deadline: '2024-02-15', destination: '埼玉県川口市 第2工場', status: '製造中' },
  { id: 'P-2024-0089', customer: '中部電機工業 株式会社', name: '配電盤ユニット 製造・納入', deadline: '2024-02-08', destination: '愛知県刈谷市 組立棟', status: '出荷待' },
  { id: 'P-2024-0088', customer: '株式会社 北陸マシン', name: 'CNCフライス盤 オーバーホール', deadline: '2024-02-20', destination: '石川県金沢市 金沢工場', status: '受注' },
  { id: 'P-2024-0086', customer: '株式会社 信州精密', name: '旋盤チャック 精度調整・交換', deadline: '2024-02-25', destination: '長野県諏訪市 精密工場', status: '受注' },
];

// タブの型定義
const tabs = ['すべて', '受注', '製造中', '出荷待'] as const;
type TabType = typeof tabs[number];

// ステータスごとのカラー設定
const getStatusStyle = (status: Order['status']): string => {
  switch (status) {
    case '受注': return 'bg-blue-50 text-blue-600 border-blue-200';
    case '製造中': return 'bg-green-50 text-green-600 border-green-200';
    case '出荷待': return 'bg-orange-50 text-orange-600 border-orange-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('すべて');

  // タブと検索ワードでフィルタリング
  const filteredOrders = initialOrders.filter((order: Order) => {
    const matchesTab = activeTab === 'すべて' || order.status === activeTab;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.includes(searchQuery) ||
      order.name.includes(searchQuery) ||
      order.destination.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto z-10 relative">
        
        {/* 上部：タイトルと新規登録ボタン */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-xl p-2 bg-slate-100 rounded-lg text-slate-700">📋</span>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-wider">案件一覧</h1>
              <p className="text-[11px] text-slate-400">全 {initialOrders.length} 件中 {filteredOrders.length} 件表示</p>
            </div>
          </div>
          {/* 新規登録ボタン（共通コンポーネントを使用） */}
          <div className="w-28">
            <Button href="/orders/new" className="bg-brand-blue text-white font-bold py-2 text-xs shadow-sm">
              ＋ 新規登録
            </Button>
          </div>
        </div>

        {/* 中部：検索バーとステータスタブ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="No.・顧客名・工事名・納入先で検索"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* ステータスタブ選択 */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 下部：データテーブルカード */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4 text-center w-24">No.</th>
                  <th className="py-3.5 px-4 w-48">顧客名</th>
                  <th className="py-3.5 px-4">工事名</th>
                  <th className="py-3.5 px-4 w-28">納期</th>
                  <th className="py-3.5 px-4 w-48">納入先</th>
                  <th className="py-3.5 px-4 text-center w-28">ステータス</th>
                  <th className="py-3.5 px-4 text-center w-36">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-center">{order.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{order.customer}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{order.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{order.deadline}</td>
                    <td className="py-3.5 px-4 text-slate-500">{order.destination}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {/* 操作リンク（共通コンポーネントをミニサイズで使用） */}
                      <div className="flex justify-center space-x-1.5">
                        <div className="w-16">
                          <Button href={`/orders/${order.id}`} className="bg-slate-100 text-slate-700 border border-slate-300 py-1 text-[11px] font-medium hover:bg-slate-200">
                            詳細
                          </Button>
                        </div>
                        <div className="w-16">
                          <Button href={`/orders/${order.id}/edit`} className="bg-white text-slate-700 border border-slate-300 py-1 text-[11px] font-medium hover:bg-slate-50">
                            編集
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                      該当する案件が見つかりません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-2.5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <div>最終更新: 2026-06-25 18:00:00</div>
            <div>{filteredOrders.length} 件表示</div>
          </div>
        </div>

      </div>
    </Layout>
  );
}