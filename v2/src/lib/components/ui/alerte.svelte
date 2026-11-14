<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * Alerte unifiée (T026) : un seul composant, des tons normalisés et des
   * rôles ARIA cohérents.
   * - `danger` : `role="alert"` (interruption immédiate) ;
   * - `info`, `ok`, `attention` : `role="status"` (annonce polie).
   */
  let {
    ton = "info",
    role,
    children,
  }: {
    ton?: "info" | "ok" | "attention" | "alerte" | "danger";
    role?: "status" | "alert" | "none";
    children: Snippet;
  } = $props();

  const classes: Record<string, string> = {
    info: "ui-alerte",
    ok: "ui-alerte ui-alerte--ok",
    attention: "ui-alerte ui-alerte--attention",
    alerte: "ui-alerte ui-alerte--attention",
    danger: "ui-alerte ui-alerte--danger",
  };

  const roleCalcule = $derived(
    role ?? (ton === "danger" ? "alert" : "status"),
  );
</script>

<p class={classes[ton]} role={roleCalcule === "none" ? undefined : roleCalcule}>
  {@render children()}
</p>
