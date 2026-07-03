"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await getCurrentUser();

      if (user) {
        router.replace("/portal");
      } else {
        router.replace("/login");
      }
    }

    checkUser();
  }, [router]);

  return <p>読み込み中...</p>;
}