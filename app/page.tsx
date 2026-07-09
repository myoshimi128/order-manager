"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAppUser, getRedirectPath } from "@/services/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      // Authとusersテーブルからロール含むユーザー情報を取得
      const user = await getCurrentAppUser();

      if (user) {
        // 役職なら /supply/admin、一般/現場なら /supply など適切なページへ飛ばす
        const targetPath = getRedirectPath(user.role);
        router.replace(targetPath);
      } else {
        // 未ログインならログイン画面へ
        router.replace("/login");
      }
    }

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-xs font-bold text-slate-400 animate-pulse">
        認証状態を確認中...
      </p>
    </div>
  );
}