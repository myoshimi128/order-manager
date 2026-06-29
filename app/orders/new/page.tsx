'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderDashboard from '@/components/HeaderDashboard';
import Footer from '@/components/Footer';

// ステータスの型定義（Figmaのデザインに合わせ6種類）
const statuses = ['受注', '製造中', '検査中', '出荷待', '出荷済', '保留'] as const;
type StatusType = typeof statuses[number];

export default function NewOrderPage() {
  const router = useRouter();

  // フォームの状態管理
  const [orderNo, setOrderNo] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [status, setStatus] = useState<StatusType>('受注');
  const [notes, setNotes] = useState<string>('');
  
  // PDFファイルの状態管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // ドラッグ＆ドロップ ハンドラー
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('PDFファイルのみアップロード可能です。');
      }
    }
  };

  // リセット
  const handleReset = () => {
    setOrderNo('');
    setCustomer('');
    setDeadline('');
    setDestination('');
    setProjectName('');
    setStatus('受注');
    setNotes('');
    setSelectedFile(null);
  };

  // 登録処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!orderNo || !customer || !deadline || !destination || !projectName) {
      alert('必須項目（*）を入力してください。');
      return;
    }

    // TODO: ここにSupabaseへのデータ挿入ロジックを追加します
    console.log({ orderNo, customer, deadline, destination, projectName, status, notes, file: selectedFile?.name });
    
    alert('製造指示書を登録しました。');
    router.push('/orders');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <HeaderDashboard />

      {/* グリッド背景のメインエリア */}
      <main 
        className="flex-1 px-8 py-6 relative"
        style={{
          backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-7xl mx-auto z-10 relative">
          
          {/* 一覧へ戻る */}
          <Link 
            href="/orders" 
            className="inline-flex items-center text-xs font-bold text-brand-blue hover:underline mb-3"
          >
            <span className="mr-1">←</span> 一覧へ戻る
          </Link>

          {/* 画面タイトル */}
          <div className="flex items-center space-x-3 mb-6 bg-white/40 backdrop-blur-sm p-3 rounded-xl border border-slate-200/50 w-fit">
            <span className="text-lg p-2 bg-brand-blue text-white rounded-lg shadow-sm">📄</span>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-wider">製造指示書登録</h1>
              <p className="text-[11px] text-slate-400">新規案件の製造指示書とフォーム情報を登録します</p>
            </div>
          </div>

          {/* 2カラムフォームエリア */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* 左側：製造指示書PDFアップロードカード */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 min-h-[520px] flex flex-col">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2 border-b pb-2 border-slate-100">
                <span className="text-slate-500">📋</span>
                <span>製造指示書 PDF</span>
              </h2>

              {/* ファイル選択ボタン */}
              <div className="flex items-center space-x-3 mb-4">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-dark hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wider shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>⬆</span>
                  <span>ファイルを選択</span>
                </button>
                <span className="text-xs text-slate-400 truncate max-w-xs">
                  {selectedFile ? selectedFile.name : '選択されていません'}
                </span>
              </div>

              {/* ドロップエリア */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-all min-h-[350px] ${
                  isDragActive 
                    ? 'border-brand-blue bg-blue-50/40 text-brand-blue' 
                    : selectedFile 
                    ? 'border-green-300 bg-green-50/10' 
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 ${selectedFile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1">PDFファイルを認識しました</p>
                    <p className="text-[11px] text-green-600 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1.5">PDFをここにドロップ</p>
                    <p className="text-[11px] text-slate-400">または上のボタンからファイルを選択してください</p>
                  </div>
                )}
              </div>
            </div>

            {/* 右側：案件情報入力カード */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 flex flex-col justify-between min-h-[520px]">
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2 border-b pb-2 border-slate-100">
                  <span className="text-slate-500">⚙️</span>
                  <span>案件情報</span>
                </h2>

                <div className="space-y-4 text-xs">
                  {/* 案件No. */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      案件No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：P-2024-0092"
                      value={orderNo}
                      onChange={(e) => setOrderNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-mono"
                    />
                  </div>

                  {/* 顧客名 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      顧客名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：株式会社 東和工業"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    />
                  </div>

                  {/* 納期 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      納期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-mono text-slate-600"
                    />
                  </div>

                  {/* 納入先 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      納入先 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：埼玉県川口市 第2工場"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    />
                  </div>

                  {/* 工事名 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      工事名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：油圧シリンダー組立 #4ライン増設"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    />
                  </div>

                  {/* ステータス選択（ボタン切り替え式） */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      ステータス <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 w-fit">
                      {statuses.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setStatus(item)}
                          className={`px-3 py-1.5 rounded-md font-medium transition-all text-[11px] cursor-pointer ${
                            status === item
                              ? 'bg-brand-blue text-white shadow-sm font-bold'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 受注内容 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      受注内容
                    </label>
                    <textarea
                      placeholder="受注内容・備考を入力してください"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ボタンエリア (リセット・登録する) */}
              <div className="flex justify-end items-center space-x-2 mt-6 border-t pt-4 border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  🔄 リセット
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue hover:opacity-95 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center space-x-1"
                >
                  <span>💾</span>
                  <span>登録する</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}