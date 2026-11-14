<script lang="ts">
  /**
   * Indicateur d'étapes numérotées (T020).
   *
   * HTML d'abord : une liste ordonnée (`<ol>`) de `<li>`, aucun JavaScript,
   * aucun état client. L'étape en cours porte `aria-current="step"` — c'est la
   * seule information nécessaire aux technologies d'assistance.
   *
   * Les couleurs ne portent jamais l'information seules : le numéro d'ordre et
   * le libellé textuel restent lisibles sans CSS, et l'étape courante est
   * annoncée en toutes lettres aux lecteurs d'écran. L'étape active reprend
   * `ui-puce-active` (contraste `--accent-fonce` sur `--accent-douce`, cible
   * 44 px) ; l'étape inactive n'est pas cliquable et reste neutre, sans
   * affordance de survol trompeuse.
   */
  import type { Langue } from "@/lib/i18n";

  interface EtapeIndicateur {
    /** Identifiant stable, comparé à `active`. */
    id: string;
    /** Libellé visible de l'étape. */
    libelle: string;
  }

  let {
    etapes,
    active,
    langue = "fr",
    libelle,
  }: {
    etapes: EtapeIndicateur[];
    /** `id` de l'étape en cours ; aucune si l'identifiant est inconnu. */
    active: string;
    langue?: Langue;
    /** Nom accessible de la liste ; par défaut, traduction de `langue`. */
    libelle?: string;
  } = $props();

  const LIBELLES: Record<Langue, { nom: string; enCours: string }> = {
    fr: { nom: "Étapes du parcours", enCours: "étape en cours" },
    en: { nom: "Progress steps", enCours: "current step" },
    es: { nom: "Etapas del proceso", enCours: "etapa actual" },
    it: { nom: "Fasi del percorso", enCours: "fase attuale" },
    de: { nom: "Schritte", enCours: "aktueller Schritt" },
  };

  const mots = $derived(LIBELLES[langue]);
</script>

<ol
  class="flex flex-wrap items-center gap-2"
  aria-label={libelle ?? mots.nom}
  data-indicateur-etapes
>
  {#each etapes as etape, index (etape.id)}
    <li
      class="flex min-h-11 flex-wrap items-center gap-2 {etape.id === active
        ? 'ui-puce-active'
        : 'rounded-full border border-bordure px-3 py-1 text-sm text-encre-douce'}"
      aria-current={etape.id === active ? "step" : undefined}
    >
      <span
        class="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold {etape.id ===
        active
          ? 'bg-accent text-sur-accent'
          : 'bg-surface-2 text-encre-douce'}"
        aria-hidden="true">{index + 1}</span
      >
      <span>{etape.libelle}</span>
      {#if etape.id === active}
        <span class="sr-only">— {mots.enCours}</span>
      {/if}
    </li>
  {/each}
</ol>
