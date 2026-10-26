import type { ReactNode } from "react";
import { BandeauApercu } from "@/components/bandeau-apercu";
import { lireApercuBrut } from "@/lib/apercu";

export default async function LayoutStaff({ children }: { children: ReactNode }) {
  const apercu = await lireApercuBrut();
  return (
    <>
      {apercu ? <BandeauApercu email={apercu.email} role={apercu.role} /> : null}
      {children}
    </>
  );
}
