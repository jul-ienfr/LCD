"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BoutonDeconnexion() {
  const router = useRouter();

  async function seDeconnecter() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium"
      onClick={seDeconnecter}
      type="button"
    >
      Se déconnecter
    </button>
  );
}
