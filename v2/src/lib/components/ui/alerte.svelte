<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    ton = "info",
    children,
  }: {
    ton?: "info" | "ok" | "alerte" | "danger";
    children: Snippet;
  } = $props();

  const classes: Record<string, string> = {
    info: "ui-alerte",
    ok: "ui-alerte ui-alerte--ok",
    alerte: "ui-alerte ui-alerte--alerte",
    danger: "ui-alerte ui-alerte--danger",
  };
</script>

<p class={classes[ton]} role={ton === "danger" ? "alert" : "status"}>
  {@render children()}
</p>
