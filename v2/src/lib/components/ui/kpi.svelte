<script lang="ts">
  let {
    libelle,
    valeur,
    note,
    ton = "neutre",
  }: {
    libelle: string;
    valeur: string | number;
    note?: string;
    ton?: "neutre" | "accent" | "danger" | "alerte";
  } = $props();

  const classes: Record<string, string> = {
    neutre: "",
    accent: "text-accent",
    danger: "text-danger",
    alerte: "text-alerte",
  };
</script>

<div class="ui-carte">
  <p class="text-sm text-encre-faine">{libelle}</p>
  <p class="mt-1 text-2xl font-semibold {classes[ton]}">{valeur}</p>
  {#if note}
    <p class="text-xs text-encre-faine">{note}</p>
  {/if}
</div>
