<script lang="ts">
  let { actif = "" }: { actif?: string } = $props();

  const liens = [
    { id: "apparence", href: "/supervision/apparence", libelle: "Apparence" },
    {
      id: "fournisseurs",
      href: "/supervision/fournisseurs",
      libelle: "Fournisseurs",
    },
    { id: "tenants", href: "/supervision", libelle: "Vue d’ensemble" },
    { id: "espaces", href: "/supervision/espaces", libelle: "Espaces" },
    { id: "modules", href: "/supervision/modules", libelle: "Modules" },
    {
      id: "maintenance",
      href: "/supervision/maintenance",
      libelle: "Maintenance",
    },
    {
      id: "journaux",
      href: "/supervision/journaux",
      libelle: "Journaux applicatifs",
    },
    { id: "voir-comme", href: "/supervision/voir-comme", libelle: "Voir comme" },
    { id: "journal", href: "/journal", libelle: "Journal global" },
    { id: "systeme", href: "/systeme", libelle: "Système" },
    { id: "secrets", href: "/secrets", libelle: "Secrets" },
    { id: "audit", href: "/hote/audit", libelle: "Audit" },
    { id: "retour", href: "/hote", libelle: "Espace hôte" },
  ];
</script>

<nav class="ui-nav" aria-label="Supervision">
  {#each liens as lien (lien.id)}
    <a
      class="ui-nav-lien"
      href={lien.href}
      aria-current={actif === lien.id ? "page" : undefined}
    >
      {lien.libelle}
    </a>
  {/each}
</nav>
