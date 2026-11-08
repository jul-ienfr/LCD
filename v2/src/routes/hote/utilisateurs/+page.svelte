<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.t.uTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.t.uSurtitre}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.uTitre}</h1>
      <p class="text-encre-douce">{data.t.uDescription}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote">{data.t.retour}</a>
  </header>

  {#if data.deuxfacteurs === "ok"}
    <p class="ui-alerte ui-alerte--succes">{data.t.deuxfaOk}</p>
  {/if}
  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <div class="ui-carte"><p class="text-sm text-encre-faine">{data.t.comptes}</p><p class="mt-1 text-2xl font-semibold">{data.utilisateurs.length}</p></div>
    <div class="ui-carte"><p class="text-sm text-encre-faine">{data.t.actifs}</p><p class="mt-1 text-2xl font-semibold">{data.actifs}</p></div>
    <div class="ui-carte"><p class="text-sm text-encre-faine">{data.t.admins}</p><p class="mt-1 text-2xl font-semibold">{data.admins}</p></div>
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{data.t.creerTitre}</h2>
    <p class="mt-1 text-sm text-encre-douce">{data.t.creerAide}</p>
    <p class="mt-3 rounded-controle border border-alerte bg-alerte-douce p-3 text-xs text-alerte"><strong>super_admin</strong> {data.t.superAdminNote}</p>
    <form method="POST" action="?/creer" class="mt-5 grid gap-4 sm:grid-cols-2">
      <label class="ui-champ-groupe"><span class="ui-label">{data.t.nom}</span><input class="ui-champ" name="name" autocomplete="name" minlength="2" maxlength="80" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{data.t.email}</span><input class="ui-champ" type="email" name="email" autocomplete="email" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">{data.t.role}</span>
        <select class="ui-champ" name="role">
          {#each data.roles as role (role.id)}<option value={role.id}>{data.t.roles[role.id] ?? role.label}</option>{/each}
        </select>
      </label>
      <label class="ui-champ-groupe"><span class="ui-label">{data.t.motDePasse}</span><input class="ui-champ" type="password" name="password" autocomplete="new-password" minlength="12" required /><span class="text-xs text-encre-faine">{data.t.motDePasseAide}</span></label>
      <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.creerCompte}</button></div>
    </form>
  </section>

  <section class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-lg font-semibold">{data.t.equipe}</h2>
      <p class="text-xs text-encre-faine">{data.t.desactivationNote}</p>
    </div>
    {#if data.utilisateurs.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">{data.t.aucunUtilisateur}</p>
    {:else}
      <ul class="space-y-3">
        {#each data.utilisateurs as utilisateur (utilisateur.id)}
          <li class="ui-carte space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  <span class="truncate">{utilisateur.name}</span>
                  {#if utilisateur.soi}<span class="ui-etiquette">{data.t.vous}</span>{/if}
                  {#if utilisateur.actif}<span class="ui-etiquette">{data.t.actif}</span>{:else}<span class="ui-etiquette border-danger text-danger">{data.t.desactive}</span>{/if}
                </p>
                <p class="break-all text-sm text-encre-douce">{utilisateur.email}</p>
                <p class="text-xs text-encre-faine">{data.t.roles[utilisateur.role] ?? utilisateur.roleLibelle}{utilisateur.twoFactorEnabled ? ` · ${data.t.deuxfaActive}` : ` · ${data.t.deuxfaInactive}`}</p>
                {#if utilisateur.role === "presta"}
                  <p class:text-danger={!utilisateur.rcValide} class="text-xs">
                    {data.t.rcLabel}
                    {#if !utilisateur.rcExpireLe}
                      {data.t.rcAbsente}
                    {:else}
                      {data.t.rcValable(utilisateur.rcExpireLe)}
                      {#if !utilisateur.rcValide}
                        — {data.t.rcExpiree}
                      {:else if utilisateur.rcJours !== null && utilisateur.rcJours <= 30}
                        — {data.t.rcExpireDans(utilisateur.rcJours)}
                      {/if}
                    {/if}
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex flex-wrap items-end gap-3">
              <details>
                <summary class="cursor-pointer text-sm text-encre-douce">{data.t.changerRole}</summary>
                <form method="POST" action="?/role" class="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <label class="ui-champ-groupe"><span class="ui-label">{data.t.role}</span>
                    <select class="ui-champ" name="role" disabled={utilisateur.soi}>
                      {#each data.roles as role (role.id)}<option value={role.id} selected={role.id === utilisateur.role}>{data.t.roles[role.id] ?? role.label}</option>{/each}
                    </select>
                  </label>
                  {#if !utilisateur.soi}<button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{data.t.changerRoleBtn}</button>{/if}
                </form>
              </details>

              {#if utilisateur.role === "presta"}
                <details>
                  <summary class="cursor-pointer text-sm text-encre-douce">
                    {data.t.assurance}
                  </summary>
                  <form method="POST" action="?/rc" class="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={utilisateur.id} />
                    <label class="ui-champ-groupe">
                      <span class="ui-label">{data.t.valableJusquau}</span>
                      <input
                        class="ui-champ"
                        type="date"
                        name="rcExpireLe"
                        value={utilisateur.rcExpireLe ?? ""}
                      />
                    </label>
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                      {data.t.enregistrerRc}
                    </button>
                  </form>
                  <p class="mt-2 text-xs text-encre-faine">
                    {data.t.rcAide}
                  </p>
                </details>
              {/if}

              {#if !utilisateur.soi}
                <form method="POST" action="?/actif">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <input type="hidden" name="actif" value={utilisateur.actif ? "false" : "true"} />
                  <button class={utilisateur.actif ? "ui-bouton ui-bouton--danger ui-bouton--petit" : "ui-bouton ui-bouton--secondaire ui-bouton--petit"} type="submit">
                    {utilisateur.actif ? data.t.desactiver : data.t.reactiver}
                  </button>
                </form>
              {/if}

              {#if utilisateur.twoFactorEnabled && !utilisateur.soi}
                <details>
                  <summary class="cursor-pointer text-sm text-encre-douce">{data.t.reinit2fa}</summary>
                  <form method="POST" action="?/deuxfacteurs" class="mt-3">
                    <input type="hidden" name="userId" value={utilisateur.id} />
                    <button
                      class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                      type="submit"
                      onclick={(event) => {
                        if (!confirm(data.t.confirm2fa)) {
                          event.preventDefault();
                        }
                      }}>{data.t.reinit2fa}</button>
                  </form>
                </details>
              {/if}
            </div>

            {#if !utilisateur.soi}
              <details class="border-t border-bordure pt-3">
                <summary class="cursor-pointer text-sm text-encre-douce">{data.t.reinitMdp}</summary>
                <form method="POST" action="?/motdepasse" class="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="userId" value={utilisateur.id} />
                  <label class="ui-champ-groupe"><span class="ui-label">{data.t.nouveauMdp}</span><input class="ui-champ" type="password" name="password" autocomplete="new-password" minlength="12" required /></label>
                  <label class="ui-champ-groupe"><span class="ui-label">{data.t.confirmation}</span><input class="ui-champ" type="password" name="confirmation" autocomplete="new-password" minlength="12" required /></label>
                  <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{data.t.reinitMdpBtn}</button></div>
                </form>
              </details>
            {/if}

            {#if form && "userId" in form && form.userId === utilisateur.id && form.ok}
              <p class="ui-alerte ui-alerte--succes" role="status">{form.message}</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
