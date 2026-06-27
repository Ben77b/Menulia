"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      localStorage.removeItem("menulia_current_restaurant");
      router.replace("/login");
    }

    signOut();
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-gray-500">Signing you out...</p>
    </div>
  );
}
