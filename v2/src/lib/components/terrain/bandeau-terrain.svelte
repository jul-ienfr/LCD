<script lang="ts">
  /**
   * Bandeau hors ligne du staff terrain (spec 006, FR-045).
   *
   * En parité avec le voyageur : signale la coupure réseau et le nombre de
   * pointages conservés sur l'appareil, puis le résultat du rejeu. Le contenu
   * vient de `traductionsPresta` ; l'état est piloté par
   * `installerFileTerrain` (module client), ce composant ne fait que rendre
   * les zones et leurs modèles de message.
   */
  import { traductionsPresta } from "@/lib/i18n-presta";

  let { langue }: { langue: string } = $props();
  const t = $derived(traductionsPresta(langue));
</script>

<div class="bandeau-terrain ui-noprint" data-terrain-bandeau hidden>
  <p class="ui-alerte ui-alerte--attention text-sm" data-terrain-hors-ligne role="status" hidden>
    {t.terrainHorsLigne}
  </p>
  <p
    class="mt-1 text-xs text-encre-douce"
    data-terrain-file
    role="status"
    aria-label={t.terrainFileTitre}
    data-modele-attente={t.terrainFileEnAttente(0).replace(/\d+/, "__N__")}
    data-modele-synchronisee={t.terrainSynchronise(0).replace(/\d+/, "__N__")}
    hidden
  ></p>
  <p
    class="mt-1 text-xs text-encre-douce"
    data-terrain-etat
    role="status"
    data-modele-echec={t.terrainEchec}
    hidden
  ></p>
</div>
