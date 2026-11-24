<script lang="ts">
  import type { PageData } from "./$types";
  import { LIBELLES_CANAL_FIL } from "@/domain/fil-voyageur";
  import { messageFils } from "@/lib/i18n-fils";
  import { traductionsStatuts } from "@/lib/i18n-statuts";

  let { data, form }: {
    data: PageData;
    form: {
      erreur?: string | null;
      contenu?: string | null;
      traduction?: {
        messageId: string | null;
        texte: string;
        langueCible: string;
      };
      traductionReponse?: {
        messageId: string | null;
        texte: string;
        langueCible: string;
      };
    } | null;
  } = $props();

  const t = $derived(data.t);
  const statuts = $derived(traductionsStatuts((data as { langue?: string }).langue));
  const ok = $derived(data.ok);

  const brouillons = $derived(data.messages.filter((m) => m.statut === "brouillon"));

  function dateHeure(valeur: Date | string): string {
    const date = valeur instanceof Date ? valeur : new Date(valeur);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function piecesDe(messageId: string) {
    return data.pieces.find((p) => p.messageId === messageId)?.elements ?? [];
  }
</script>

<svelte:head>
  <title>{data.fil.voyageurNom} — {t.titre}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <nav class="text-sm"><a class="ui-lien-action" href="/hote/messages/fils">← {t.titre}</a></nav>
    <h1 class="text-3xl font-semibold tracking-tight">{data.fil.voyageurNom}</h1>
    <p class="text-sm text-encre-faine">
      {data.fil.voyageurEmail ?? "—"} · {data.fil.voyageurTelephone ?? "—"}
      {#if data.logement}· {data.logement.nom}{/if}
      · <span class="ui-etiquette-ui">{t.statuts[data.fil.statut] ?? data.fil.statut}</span>
    </p>
  </header>

  {#if ok}<p class="ui-alerte ui-alerte--succes" role="status">{messageFils(t, ok)}</p>{/if}
  {#if form?.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{form.erreur}</p>{/if}

  <section class="space-y-3" aria-label={t.colonneMessages}>
    {#if data.messages.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">{t.aucunMessage}</p>
    {/if}
    {#each data.messages as message (message.id)}
      <article class="ui-carte space-y-2">
        <header class="flex flex-wrap items-center justify-between gap-2 text-sm text-encre-faine">
          <span class="font-medium">
            {message.sens === "entrant" ? "←" : "→"} {LIBELLES_CANAL_FIL[message.canal]}
            · {dateHeure(message.createdAt)}
          </span>
          <span class="ui-etiquette-ui">{statuts[message.statut] ?? message.statut}</span>
        </header>
        <p class="whitespace-pre-line">{message.contenu}</p>

        {#if data.traductionActive && message.sens === "entrant" && data.langueInterface !== data.fil.langue}
          <form method="POST" action="?/traduire" class="flex flex-wrap items-center gap-2">
            <input type="hidden" name="messageId" value={message.id} />
            <input type="hidden" name="vers" value={data.langueInterface} />
            <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">
              {t.traduire}
            </button>
          </form>
        {/if}

        {#if form?.traduction?.messageId === message.id}
          <div class="ui-carte space-y-1 border-dashed">
            <p class="text-sm font-medium">{t.traduction} ({form.traduction.langueCible})</p>
            <p class="whitespace-pre-line text-sm">{form.traduction.texte}</p>
            <p class="text-xs text-encre-douce">{t.traductionAide}</p>
          </div>
        {/if}

        {#if piecesDe(message.id).length > 0}
          <ul class="space-y-1 text-sm">
            {#each piecesDe(message.id) as piece (piece.id)}
              <li>
                <a class="ui-lien-action" href={`/api/messages/pieces-jointes/${piece.id}`}>{piece.nomFichier}</a>
                <span class="text-encre-faine">({Math.round(piece.tailleOctets / 1024)} Ko)</span>
              </li>
            {/each}
          </ul>
        {/if}

        {#if message.statut === "brouillon"}
          <form method="POST" action="?/repondre" class="border-t border-bordure pt-3">
            <input type="hidden" name="brouillonId" value={message.id} />
            <input type="hidden" name="canal" value={message.canal} />
            <button class="ui-bouton" type="submit">{t.envoyerBrouillon}</button>
          </form>
        {/if}

        <form method="POST" action="?/pieceJointe" enctype="multipart/form-data" class="flex flex-wrap items-end gap-2 border-t border-bordure pt-3">
          <input type="hidden" name="messageId" value={message.id} />
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.pieceJointe}</span>
            <input class="ui-champ min-h-11" type="file" name="fichier" accept="image/jpeg,image/png,image/webp,application/pdf" />
          </label>
          <button class="ui-bouton ui-bouton--fantome" type="submit">{t.ajouterPieceJointe}</button>
        </form>
      </article>
    {/each}
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">{t.repondre}</h2>
    <form method="POST" action="?/repondre" class="space-y-3">
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.canal}</span>
          <select class="ui-champ" name="canal">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
        <label class="ui-champ-groupe sm:col-span-2">
          <span class="ui-label">{t.sujet}</span>
          <input class="ui-champ" type="text" name="sujet" />
        </label>
      </div>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.message}</span>
        <textarea class="ui-champ" name="contenu" rows="6" required value={form?.contenu ?? ""}></textarea>
      </label>
      <div class="flex flex-wrap gap-2">
        <button class="ui-bouton" type="submit">{t.envoyer}</button>
        {#if data.traductionActive && data.langueInterface !== data.fil.langue}
          <button
            class="ui-bouton ui-bouton--fantome"
            type="submit"
            formaction="?/traduireReponse"
          >
            {t.traduireReponse}
          </button>
        {/if}
      </div>
    </form>
    {#if form?.traductionReponse}
      <div class="ui-carte space-y-2 border-dashed">
        <h3 class="font-medium">
          {t.traductionReponse} ({form.traductionReponse.langueCible})
        </h3>
        <textarea class="ui-champ" rows="6" readonly value={form.traductionReponse.texte}></textarea>
        <p class="text-xs text-encre-douce">{t.traductionAide}</p>
      </div>
    {/if}
    {#if brouillons.length > 0}
      <p class="text-sm text-encre-douce">{brouillons.length} {t.brouillon}</p>
    {/if}
  </section>

  {#if data.assistantActif}
    <section class="ui-carte space-y-3">
      <h2 class="text-xl font-semibold">{t.assistant}</h2>
      <p class="text-sm text-encre-douce">{t.assistantAide}</p>
      <form method="POST" action="?/assistant" class="grid gap-3 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.intention}</span>
          <select class="ui-champ" name="intention">
            {#each data.intentions as intention (intention.valeur)}
              <option value={intention.valeur}>{intention.libelle}</option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.ton}</span>
          <select class="ui-champ" name="ton">
            {#each data.tons as ton (ton.valeur)}
              <option value={ton.valeur}>{ton.libelle}</option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.canal}</span>
          <select class="ui-champ" name="canal">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.message}</span>
          <input class="ui-champ" type="text" name="details" maxlength="400" />
        </label>
        <div class="sm:col-span-2">
          <button class="ui-bouton" type="submit">{t.redigerAssistant}</button>
        </div>
      </form>
    </section>
  {/if}

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">{t.consignes}</h2>
    <ul class="space-y-1 text-sm">
      <li>Email : {data.fil.consentements.email ? "autorisé" : "retiré"}</li>
      <li>SMS : {data.fil.consentements.sms ? "autorisé" : "retiré"}</li>
      <li>WhatsApp : {data.fil.consentements.whatsapp ? "autorisé" : "retiré"}</li>
    </ul>
    <form method="POST" action="?/consentement" class="flex flex-wrap items-end gap-2">
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.canal}</span>
        <select class="ui-champ" name="canal">
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.consignes}</span>
        <select class="ui-champ" name="valeur">
          <option value="retire">{t.optout}</option>
          <option value="accorde">{t.actif}</option>
        </select>
      </label>
      <button class="ui-bouton ui-bouton--fantome" type="submit">{t.consignes}</button>
    </form>
  </section>
</main>
