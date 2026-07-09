'use client';

import React, { useState } from 'react';
import { login } from "@/services/auth";
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/Button';

export default function LoginPage() {
  const [userNo, setUserNo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const email = userNo.includes('@') ? userNo : `${userNo}@system.local`;

    try {
      const result = await login(email, password);

      if (result.error) {
        if (result.error.message === 'Invalid login credentials') {
          setErrorMsg('ユーザーNo.またはパスワードが正しくありません。');
        } else {
          setErrorMsg(result.error.message);
        }
        return;
      }

      // チェック用のクッキーを発行（ミドルウェア突破用）
      document.cookie = "auth-token=true; path=/; max-age=86400;";

      // 状態の不整合を防ぐため、フルリロードでロール対応画面へ遷移
      window.location.href = result.redirectTo;

    } catch {
      setErrorMsg('予期せぬエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="w-full max-w-md z-10 flex flex-col items-center">

        {/* システムタイトル */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-slate-800 tracking-wider">社内システム</h1>
          <p className="text-xs text-brand-blue font-mono tracking-widest mt-1.5 uppercase">
            Manufacturing Instruction Management
          </p>
        </div>

        {/* ログインフォームカード */}
        <div className="bg-white w-full rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2 border-slate-100">
            ログイン
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ユーザーNo. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="例：U00123"
                value={userNo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                パスワード <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="mt-2 bg-brand-blue hover:opacity-90 text-white font-bold py-3 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  認証中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </div>

        {/* セキュリティ注意書き */}
        <div className="text-center mt-6 max-w-md px-2">
          <p className="text-[11px] text-slate-400 leading-relaxed tracking-wide">
            このシステムへのアクセスは許可された従業員のみに限定されています。
            <br />
            不正アクセスは社内規定および法令により処罰されます。
          </p>
        </div>

      </div>
    </PublicLayout>
  );
}