"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [userNo, setUserNo] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setMessage("");
    setIsLoading(true);

    const email = `${userNo}@system.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage("ユーザーIDまたはパスワードが正しくありません");
      return;
    }

    router.push("/orders");
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10">
        {/* アイコン */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl border-2 border-blue-600 flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-3">
          製造指示書管理システム
        </h1>

        <p className="text-center text-gray-500 mb-10">
          IDとパスワードを入力してログインしてください
        </p>

        {/* エラーメッセージ */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {message}
          </div>
        )}

        {/* ID */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            ユーザーID
          </label>

          <input
            type="text"
            value={userNo}
            onChange={(e) => setUserNo(e.target.value)}
            placeholder="IDを入力してください"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* パスワード */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-2">
            パスワード
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力してください"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ボタン */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </main>
  );
}