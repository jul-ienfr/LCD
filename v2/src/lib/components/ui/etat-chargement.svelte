<script lang="ts">
  /**
   * État de chargement sobre (T024).
   *
   * Props :
   * - `libelle` : texte annoncé et affiché (défaut « Chargement... »).
   * - `lignes` : nombre de lignes du squelette (défaut 3).
   * - `ariaBusy` : valeur d'`aria-busy` sur le conteneur (défaut `"true"`).
   *
   * Le squelette est purement décoratif (`aria-hidden="true"`) et n'est animé
   * que si l'utilisateur accepte le mouvement (`motion-reduce:animate-none`) :
   * aucun JavaScript, aucune horloge client.
   */
  let {
    libelle = "Chargement...",
    lignes = 3,
    ariaBusy = "true",
  }: {
    libelle?: string;
    lignes?: number;
    ariaBusy?: "true" | "false";
  } = $props();

  const rangees = $derived(Array.from({ length: Math.max(0, lignes) }, (_, index) => index));
</script>

<div
  class="space-y-3"
  role="status"
  aria-live="polite"
  aria-busy={ariaBusy}
  aria-label={libelle}
>
  <span class="sr-only">{libelle}</span>
  <div class="space-y-2.5" aria-hidden="true">
    {#each rangees as rangee (rangee)}
      <div class="h-3.5 animate-pulse rounded-full bg-surface-2 motion-reduce:animate-none"></div>
    {/each}
  </div>
</div>
