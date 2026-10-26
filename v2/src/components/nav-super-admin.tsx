import Link from "next/link";

const LIENS = [
  { href: "/supervision", label: "Supervision" },
  { href: "/systeme", label: "Système" },
  { href: "/secrets", label: "Secrets" },
  { href: "/journal", label: "Journal global" },
] as const;

export function NavSuperAdmin({ actif }: { actif: string }) {
  return (
    <nav
      aria-label="Supervision plateforme"
      className="flex flex-wrap gap-2 rounded-full border border-bordure bg-surface p-1 text-sm"
    >
      {LIENS.map((lien) => (
        <Link
          aria-current={lien.href === actif ? "page" : undefined}
          className={
            lien.href === actif
              ? "rounded-full bg-encre px-4 py-2 font-medium text-fond"
              : "rounded-full px-4 py-2 hover:bg-fond"
          }
          href={lien.href}
          key={lien.href}
        >
          {lien.label}
        </Link>
      ))}
    </nav>
  );
}
