<script lang="ts">
  import { traductionsAdministration } from "@/lib/i18n-administration";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsAdministration((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.uTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{t.uSurtitre}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.uTitre}</h1>
      <p class="text-encre-douce">{t.uDescription}</p>
    </div>
    <a class="ui-lien-action inline-flex min-h-11 items-center text-sm" href="/hote">{t.retour}</a>
  </header>

  {#if data.deuxfacteurs === "ok"}
    <p role="status" class="ui-alerte ui-alerte--succes">{t.deuxfaOk}</p>
  {/if}
  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role={form.ok ? "status" : "alert"}>{form.message}</p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <div class="ui-carte"><p class="text-sm text-encre-faine">{t.comptes}</p><p class="mt-1 text-2xl font-semibold">{data.utilisateurs.length}</p></div>
    <div class="ui-carte"><p class="text-sm text-encre-faine">{t.actifs}</p><p class="mt-1 text-2xl font-semibold">{data.actifs}</p></div>
    <div class="ui-carte"><p class="text-sm text-encre-faine">{t.admins}</p><p class="mt-1 text-2xl font-semibold">{data.admins}</p></div>
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{t.creerTitre}</h2>
    <p class="mt-1 text-sm text-encre-douce">{t.creerAide}</p>
    <p class="mt-3 rounded-controle border border-alerte bg-alerte-douce p-3 text-xs text-alerte"><strong>super_admin</strong> {t.superAdminNote}</p>
    <form method="POST" action="?/creer" class="mt-5 grid gap-4 sm:grid-cols-2">
      <label class="ui-champ-groupe"><span class="ui-label">{t.nom}</span><input class="ui-champ" name="name" autocomplete="name" minlength="2" maxlength="80" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{t.email}</span><input class="ui-champ" type="email" name="email" autocomplete="email" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{t.role}</span>
        <select class="ui-champ" name="role">
          {#each data.roles as role (role.id)}<option value={role.id}>{t.roles[role.id] ?? role.label}</option>{/each}
        </select>
      </label>
      <label class="ui-champ-groupe"><span class="ui-label">{t.motDePasse}</span><input class="ui-champ" type="password" name="password" autocomplete="new-password" minlength="12" required /><span class="text-xs text-encre-faine">{t.motDePasseAide}</span></label>
      <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--primaire" type="submit">{t.creerCompte}</button></div>
    </form>
  </section>

  <section class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-lg font-semibold">{t.equipe}</h2>
      <p class="text-xs text-encre-faine">{t.desactivationNote}</p>
    </div>
    {#if data.utilisateurs.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">{t.aucunUtilisateur}</p>
    {:else}
      <ul class="space-y-3">
        {#each data.utilisateurs as utilisateur (utilisateur.id)}
          <li class="ui-carte space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  <span class="truncate">{utilisateur.name}</span>
                  {#if utilisateur.soi}<span class="ui-etiquette">{t.vous}</span>{/if}
                  {#if utilisateur.actif}<span class="ui-etiquette">{t.actif}</span>{:else}<span class="ui-etiquette border-danger text-danger">{t.desactive}</span>{/if}
                </p>
                <p class="break-all text-sm text-encre-douce">{utilisateur.email}</p>
                <p class="text-xs text-encre-faine">{t.roles[utilisateur.role] ?? utilisateur.roleLibelle}{utilisateur.twoFactorEnabled ? ` · ${t.deuxfaActive}` : ` · ${t.deuxfaInactive}`}</p>
                {#if utilisateur.role === "presta"}
                  <p class:text-danger={!utilisateur.rcValide} class="text-xs">
                    {t.rcLabel}
                    {#if !utilisateur.rcExpireLe}
                      {t.rcAbsente}
                    {:else}
                      {t.rcValable(utilisateur.rcExpireLe)}
                      {#if !utilisateur.rcValide}
                        — {t.rcExpiree}
                      {:else if utilisateur.rcJours !== null && utilisateur.rcJours <= 30}
                        — {t.rcExpireDans(utilisateur.rcJours)}
                      {/if}
                    {/if}
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex flex-wrap items-end gap-3">
              <details>
                <summary class="flex min-h-11 cursor-pointer items-center text-sm text-encre-douce">{t.changerRole}</summary>
                <form method="POST" action="?/role" class="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <label class="ui-champ-groupe"><span class="ui-label">{t.role}</span>
                    <select class="ui-champ" name="role" disabled={utilisateur.soi}>
                      {#each data.roles as role (role.id)}<option value={role.id} selected={role.id === utilisateur.role}>{t.roles[role.id] ?? role.label}</option>{/each}
                    </select>
                  </label>
                  {#if !utilisateur.soi}<button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.changerRoleBtn}</button>{/if}
                </form>
              </details>

              {#if utilisateur.role === "presta"}
                <details>
                  <summary class="flex min-h-11 cursor-pointer items-center text-sm text-encre-douce">
                    {t.assurance}
                  </summary>
                  <form method="POST" action="?/rc" class="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={utilisateur.id} />
                    <label class="ui-champ-groupe">
                      <span class="ui-label">{t.valableJusquau}</span>
                      <input
                        class="ui-champ"
                        type="date"
                        name="rcExpireLe"
                        value={utilisateur.rcExpireLe ?? ""}
                      />
                    </label>
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                      {t.enregistrerRc}
                    </button>
                  </form>
                  <p class="mt-2 text-xs text-encre-faine">
                    {t.rcAide}
                  </p>
                </details>
              {/if}

              {#if !utilisateur.soi}
                <form method="POST" action="?/actif">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <input type="hidden" name="actif" value={utilisateur.actif ? "false" : "true"} />
                  <button class={utilisateur.actif ? "ui-bouton ui-bouton--danger ui-bouton--petit" : "ui-bouton ui-bouton--secondaire ui-bouton--petit"} type="submit">
                    {utilisateur.actif ? t.desactiver : t.reactiver}
                  </button>
                </form>
              {/if}

              {#if utilisateur.twoFactorEnabled && !utilisateur.soi}
                <details>
                  <summary class="flex min-h-11 cursor-pointer items-center text-sm text-encre-douce">{t.reinit2fa}</summary>
                  <form method="POST" action="?/deuxfacteurs" class="mt-3">
                    <input type="hidden" name="userId" value={utilisateur.id} />
                    <button
                      class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                      type="submit"
                      onclick={(event) => {
                        if (!confirm(t.confirm2fa)) {
                          event.preventDefault();
                        }
                      }}>{t.reinit2fa}</button>
                  </form>
                </details>
              {/if}
            </div>

            {#if !utilisateur.soi}
              <details class="border-t border-bordure pt-3">
                <summary class="flex min-h-11 cursor-pointer items-center text-sm text-encre-douce">{t.reinitMdp}</summary>
                <form method="POST" action="?/motdepasse" class="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <label class="ui-champ-groupe"><span class="ui-label">{t.nouveauMdp}</span><input class="ui-champ" type="password" name="password" autocomplete="new-password" minlength="12" required /></label>
                  <label class="ui-champ-groupe"><span class="ui-label">{t.confirmation}</span><input class="ui-champ" type="password" name="confirmation" autocomplete="new-password" minlength="12" required /></label>
                  <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{t.reinitMdpBtn}</button></div>
                </form>
              </details>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
