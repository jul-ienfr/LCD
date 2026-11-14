<script lang="ts">
  /**
   * Message de champ reliable (T023).
   *
   * Props :
   * - `id` : identifiant stable de l'élément, à citer dans l'attribut
   *   `aria-describedby` du champ concerné.
   * - `message` : texte du message ; si absent, l'élément reste rendu mais vide
   *   (la région live existe avant la mise à jour, ce qui garantit l'annonce).
   * - `ton` : `"erreur"` (défaut) → `role="alert"` ; `"aide"` → texte d'aide en
   *   `aria-live="polite"`, sans alerte.
   *
   * Sans JavaScript : le message est rendu côté serveur après une soumission.
   */
  let {
    id,
    message = "",
    ton = "erreur",
  }: {
    id: string;
    message?: string;
    ton?: "erreur" | "aide";
  } = $props();

  const estErreur = $derived(ton === "erreur");
</script>

<p
  {id}
  role={estErreur ? "alert" : "status"}
  aria-live={estErreur ? "assertive" : "polite"}
  aria-atomic="true"
  class="mt-1.5 text-sm {estErreur ? 'font-medium text-danger' : 'text-encre-douce'}"
>{message}</p>
