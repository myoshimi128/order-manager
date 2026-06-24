"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/orders");
      } else {
        router.replace("/login");
      }
    }

    checkUser();
  }, [router]);

  return <p>読み込み中...</p>;
}