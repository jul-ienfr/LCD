<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsVoyageurs } from "@/lib/i18n-voyageurs";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsVoyageurs(data.langue));
</script>

<svelte:head>
  <title>{t.messagesTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{t.messagesSurtitre}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.messagesTitre}</h1>
      <p class="text-encre-douce">{t.messagesDescription}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote">{t.retourTableau}</a>
  </header>

  {#if !data.logement}
    <p class="ui-carte border-dashed text-encre-douce">{t.creerLogementDAbord}</p>
    <a class="ui-lien text-sm" href="/hote/logements">{t.creerLogement}</a>
  {:else}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a class={logement.id === data.logement.id ? "ui-etiquette border-accent bg-accent-douce font-semibold text-accent" : "ui-etiquette-ui"} href={`/hote/messages?logement=${logement.id}`}>{logement.nom}</a>
        {/each}
      </nav>
    {/if}

    {#if data.ok === "prepare"}<p class="ui-alerte ui-alerte--succes" role="status">{t.prepare}</p>{/if}
    {#if data.ok === "envoi"}<p class="ui-alerte ui-alerte--succes" role="status">{t.envoye}</p>{/if}
    {#if data.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}</p>{/if}

    <section class="grid gap-4 sm:grid-cols-3">
      <div class="ui-carte"><p class="text-sm text-encre-faine">{t.brouillons}</p><p class="mt-1 text-3xl font-semibold">{data.brouillons}</p></div>
      <div class="ui-carte"><p class="text-sm text-encre-faine">{t.envoyes}</p><p class="mt-1 text-3xl font-semibold">{data.envoyes}</p></div>
      <div class="ui-carte"><p class="text-sm text-encre-faine">{t.logement}</p><p class="mt-1 text-lg font-semibold">{data.logement.nom}</p></div>
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{t.preparerTitre}</h2>
      <form method="POST" action="?/preparer" class="mt-4 space-y-3">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <input type="hidden" name="ref" value={data.ref} />
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="ui-champ-groupe"><span class="ui-label">{t.canal}</span>
            <select class="ui-champ" name="canal">
              {#each data.canaux as canal (canal.id)}<option value={canal.id}>{canal.label}</option>{/each}
            </select>
          </label>
          <label class="ui-champ-groupe"><span class="ui-label">{t.type}</span>
            <select class="ui-champ" name="type">
              {#each data.types as type (type.id)}<option value={type.id}>{type.label}</option>{/each}
            </select>
          </label>
          <div class="rounded-controle border border-alerte bg-alerte-douce p-3 text-xs text-alerte">{t.codeAvert}</div>
        </div>
        <label class="ui-champ-groupe"><span class="ui-label">{t.emailVoyageur}</span><input class="ui-champ" name="destinataire" type="email" autocomplete="email" maxlength="254" placeholder="camille@example.com" /><span class="text-xs text-encre-faine">{t.emailAide}</span></label>
        <label class="ui-champ-groupe"><span class="ui-label">{t.telephoneVoyageur}</span><input class="ui-champ" name="telephone" type="tel" inputmode="tel" maxlength="20" placeholder="06 12 34 56 78" /><span class="text-xs text-encre-faine">{t.telephoneAide}</span></label>
        <label class="ui-champ-groupe"><span class="ui-label">{t.contenu}</span><textarea class="ui-champ" name="contenu" rows="4" maxlength="2000" required placeholder={t.contenuPlaceholder}></textarea></label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.preparer}</button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.messagesDe(data.logement.nom, data.messages.length)}</h2>
      {#if data.messages.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">{t.aucunMessage}</p>
      {:else}
        <ul class="space-y-3">
          {#each data.messages as message (message.id)}
            <li class="ui-carte">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-medium">{message.type} · {message.canal}{message.destinataire ? ` · ${message.destinataire}` : ""}</p>
                <span class="ui-etiquette">{message.statut === "envoye" ? t.envoyeStatut : t.brouillon}</span>
              </div>
              <p class="mt-2 whitespace-pre-line text-sm text-encre-douce">{message.contenu}</p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <span class="text-xs text-encre-faine">{message.date}</span>
                {#if message.statut === "brouillon"}
                  <form method="POST" action="?/envoyer">
                    <input type="hidden" name="logementId" value={data.logement.id} />
                    <input type="hidden" name="id" value={message.id} />
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                      {message.canal === "SMS" ? (data.smsConfigured ? t.envoyerSms : t.marquerEnvoye) : data.emailConfigured ? t.envoyerEmail : t.marquerEnvoye}
                    </button>
                  </form>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href="/hote/audit">{t.journalAudit}</a>
      <a class="ui-lien" href="/hote">{t.tableauBord}</a>
    </nav>
  {/if}
</main>
