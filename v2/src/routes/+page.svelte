<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const identite = $derived(data.apparence.identite);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const qualites = [
    "Réservation directe",
    "Arrivée autonome",
    "Ménage hôtelier",
    "Linge inclus",
    "Assistance 7 j/7",
    "Sans commission",
  ];

  const engagements = [
    {
      numero: "01",
      titre: "Une maison préparée",
      texte: "Lits faits, linge hôtelier, produits d’accueil et climatisation vérifiée avant chaque arrivée.",
    },
    {
      numero: "02",
      titre: "Une arrivée sans friction",
      texte: "Instructions claires, boîte à clés sécurisée et assistance joignable jusqu’à minuit.",
    },
    {
      numero: "03",
      titre: "Un séjour suivi",
      texte: "Un seul numéro pour la moindre question, du premier petit-déjeuner au départ.",
    },
  ];

  const formules = [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / logement / mois",
      cible: "La boîte à outils pour propriétaire autonome.",
      points: ["Moteurs installés", "Vente directe", "Support communautaire"],
    },
    {
      nom: "Pilotage",
      prix: "190",
      base: "€ / logement / mois",
      cible: "L’exploitation déléguée, sans perdre la main.",
      points: ["Tout le Kit", "Ménage et dispatch pilotés", "Relevé mensuel propriétaire"],
      enAvant: true,
    },
    {
      nom: "Full service",
      prix: "290",
      base: "€ / logement / mois",
      cible: "La gestion complète, clé en main.",
      points: ["Tout le Pilotage", "Conciergerie et urgences", "Compta et reversement J+5"],
    },
  ];
</script>

<svelte:head>
  <title>{identite.nom} — séjours sur la Côte d’Azur</title>
  <meta
    name="description"
    content="Maisons choisies, arrivée autonome, ménage hôtelier et assistance 24/7. Réservez en direct, sans commission."
  />
  <link
    rel="preload"
    as="image"
    href="/photos/hero-villa-1800.webp"
    imagesrcset="/photos/hero-villa-900.webp 900w, /photos/hero-villa-1800.webp 1800w"
    imagesizes="100vw"
  />
</svelte:head>

<div class="bg-fond">
  <header class="absolute inset-x-0 top-0 z-40">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-8 md:py-5">
      <a
        class="flex items-center gap-2.5 rounded-full bg-surface/95 py-2 pl-2 pr-4 text-sm font-bold tracking-tight shadow-lg ui-verre"
        href="/"
      >
        {#if identite.logoUrl}
          <img class="h-8 w-auto" src={identite.logoUrl} alt="" />
        {:else}
          <span class="grid size-8 place-items-center rounded-full bg-accent text-sm font-black text-sur-accent">
            {identite.nom.slice(0, 1)}
          </span>
        {/if}
        <span class="hidden sm:block">{identite.nom}</span>
      </a>

      <nav
        class="hidden items-center gap-1 rounded-full bg-surface/90 px-2 py-1.5 text-sm font-semibold shadow-lg ui-verre md:flex"
        aria-label="Navigation principale"
      >
        <a class="rounded-full px-4 py-2 hover:bg-surface-2" href="/reserver">Séjours</a>
        <a class="rounded-full px-4 py-2 hover:bg-surface-2" href="/aide">Aide</a>
        <a class="rounded-full px-4 py-2 hover:bg-surface-2" href="/login">Propriétaires</a>
      </nav>

      <div class="flex items-center gap-2">
        <a
          class="rounded-full bg-surface px-5 py-2.5 text-sm font-semibold shadow-lg ui-verre hover:bg-surface-2"
          href="/reserver"
        >
          Réserver
        </a>
        <details class="relative md:hidden">
          <summary
            class="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-surface text-sm font-bold shadow-lg ui-verre [&::-webkit-details-marker]:hidden"
            aria-label="Ouvrir le menu"
          >
            ☰
          </summary>
          <div
            class="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-56 rounded-2xl border border-bordure bg-surface p-2 shadow-elevee"
          >
            <a class="ui-menu-lien" href="/reserver">Séjours</a>
            <a class="ui-menu-lien" href="/aide">Aide</a>
            <a class="ui-menu-lien" href="/login">Propriétaires</a>
            <a class="ui-menu-lien" href="/login">Se connecter</a>
          </div>
        </details>
      </div>
    </div>
  </header>

  <main>
    <section class="relative flex min-h-[94vh] flex-col justify-end overflow-hidden">
      <picture>
        <source media="(max-width: 767px)" srcset="/photos/hero-villa-900.webp" />
        <img
          class="absolute inset-0 h-full w-full object-cover"
          src="/photos/hero-villa-1800.webp"
          alt="Maison de vacances avec piscine et terrasse"
          width="1800"
          height="1100"
          fetchpriority="high"
          decoding="async"
        />
      </picture>
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/75"
        aria-hidden="true"
      ></div>

      <div class="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-36 md:px-8 md:pb-16">
        <p class="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
          Côte d’Azur · conciergerie indépendante
        </p>
        <h1 class="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
          Des maisons qui donnent envie de rester.
        </h1>
        <p class="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
          Des adresses choisies, préparées et suivies par une équipe locale.
          Réservez en direct, sans commission de plateforme.
        </p>

        <form
          class="mt-8 grid gap-2 rounded-[1.75rem] border border-white/25 bg-surface/95 p-2 shadow-2xl ui-verre md:grid-cols-[1.05fr_1fr_1fr_auto]"
          method="GET"
          action="/reserver"
        >
          <input type="hidden" name="tenant" value="lcd" />
          <div class="rounded-2xl px-5 py-3 md:py-2.5">
            <p class="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine">
              Destination
            </p>
            <p class="mt-1 text-sm font-semibold">Côte d’Azur</p>
          </div>
          <label class="rounded-2xl px-5 py-3 hover:bg-surface-2 md:py-2.5">
            <span class="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine">
              Arrivée
            </span>
            <input
              class="mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold text-encre outline-none"
              type="date"
              name="debut"
              min={aujourdhui}
              required
            />
          </label>
          <label class="rounded-2xl px-5 py-3 hover:bg-surface-2 md:py-2.5">
            <span class="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine">
              Départ
            </span>
            <input
              class="mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold text-encre outline-none"
              type="date"
              name="fin"
              min={aujourdhui}
              required
            />
          </label>
          <button
            class="ui-bouton ui-bouton--primaire min-h-14 rounded-2xl px-7 md:min-h-full"
            type="submit"
          >
            Rechercher
          </button>
        </form>

        <ul class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80" role="list">
          <li>Réservation directe</li>
          <li aria-hidden="true">·</li>
          <li>Sans commission</li>
          <li aria-hidden="true">·</li>
          <li>Paiement sécurisé</li>
          <li aria-hidden="true">·</li>
          <li>Assistance 24/7</li>
        </ul>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:px-8 md:py-28">
      <h2 class="max-w-2xl text-3xl font-semibold leading-[1.02] tracking-tight sm:text-4xl md:text-5xl">
        L’hospitalité d’une maison privée, la précision d’un hôtel.
      </h2>
      <div class="space-y-6">
        <p class="text-base leading-relaxed text-encre-douce md:text-lg">
          Nous ne listons pas des annonces. Nous préparons des maisons, formons
          les équipes qui y interviennent et restons joignables pendant tout
          votre séjour.
        </p>
        <dl class="grid grid-cols-3 gap-4 border-t border-bordure pt-6">
          {#each [["0 %", "commission"], ["5", "langues"], ["24/7", "assistance"]] as [valeur, libelle]}
            <div>
              <dt class="text-xl font-bold tabular-nums md:text-2xl">{valeur}</dt>
              <dd class="mt-0.5 text-xs text-encre-faine">{libelle}</dd>
            </div>
          {/each}
        </dl>
      </div>
    </section>

    <section class="border-y border-bordure bg-surface/60">
      <div class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-4 md:px-8" aria-label="Caractéristiques">
        {#each qualites as qualite (qualite)}
          <span class="whitespace-nowrap rounded-full border border-bordure bg-surface px-4 py-2 text-xs font-semibold text-encre-douce">
            {qualite}
          </span>
        {/each}
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">Les maisons</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Des lieux qui ont une âme.
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-encre-douce">
          Lumière du matin, vue dégagée, vraie cuisine : nous choisissons les
          maisons comme si nous devions y dormir.
        </p>
      </div>

      <div class="grid auto-rows-[14rem] gap-3 md:grid-cols-4 md:auto-rows-[15rem]">
        <figure class="ui-photo group relative col-span-1 row-span-2 overflow-hidden rounded-3xl md:col-span-2">
          <img
            class="h-full w-full object-cover"
            src="/photos/salon.webp"
            alt="Salon lumineux ouvert sur une terrasse"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <span class="text-xs uppercase tracking-widest text-white/70">Le salon</span>
            <p class="mt-1 text-lg font-semibold">Ouvert sur la terrasse</p>
          </figcaption>
        </figure>
        <figure class="ui-photo group relative col-span-1 row-span-1 overflow-hidden rounded-3xl md:col-span-2">
          <img
            class="h-full w-full object-cover"
            src="/photos/piscine.webp"
            alt="Piscine privée entourée de végétation"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <span class="text-xs uppercase tracking-widest text-white/70">Le matin</span>
            <p class="mt-1 text-lg font-semibold">Le premier plongeon</p>
          </figcaption>
        </figure>
        <figure class="ui-photo group relative overflow-hidden rounded-3xl">
          <img
            class="h-full w-full object-cover"
            src="/photos/chambre.webp"
            alt="Chambre préparée avec linge hôtelier"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="sr-only">Chambre préparée avec linge hôtelier</figcaption>
        </figure>
        <figure class="ui-photo group relative overflow-hidden rounded-3xl">
          <img
            class="h-full w-full object-cover"
            src="/photos/terrasse.webp"
            alt="Terrasse ombragée pour les repas"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="sr-only">Terrasse ombragée pour les repas</figcaption>
        </figure>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28" aria-labelledby="tit-adresses">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">Disponibles maintenant</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" id="tit-adresses">
            Nos adresses.
          </h2>
        </div>
        <a class="ui-bouton ui-bouton--secondaire" href="/reserver">
          Voir toutes les disponibilités
        </a>
      </div>

      {#if data.adresses.length === 0}
        <div class="rounded-3xl border border-bordure bg-surface p-8 text-center">
          <p class="text-encre-douce">
            Les prochaines disponibilités sont en préparation.
            <a class="ui-lien" href="/aide">Contactez-nous</a> pour être prévenu.
          </p>
        </div>
      {:else}
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.adresses as adresse (adresse.id)}
            <article class="group">
              <a
                class="block rounded-3xl focus-visible:outline-offset-4"
                href={`/reserver?tenant=lcd&logement=${encodeURIComponent(adresse.id)}`}
              >
                <div class="ui-photo relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-2">
                  <img
                    class="h-full w-full object-cover"
                    src={adresse.photo}
                    alt={`${adresse.nom}${adresse.adresse ? ` à ${adresse.adresse}` : ""}`}
                    width="1000"
                    height="750"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold tracking-tight">{adresse.nom}</h3>
                    <p class="mt-0.5 text-sm text-encre-faine">{adresse.adresse ?? "Côte d’Azur"}</p>
                  </div>
                  {#if adresse.prix}
                    <p class="shrink-0 text-right text-sm">
                      <span class="font-semibold">{adresse.prix}</span>
                      <span class="block text-xs text-encre-faine">la nuit</span>
                    </p>
                  {/if}
                </div>
                <p class="mt-2 text-sm font-semibold text-accent md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  Voir les disponibilités →
                </p>
              </a>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="bg-encre text-fond">
      <div class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div class="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Le séjour</p>
            <h2 class="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Vous arrivez. Tout est déjà là.
            </h2>
            <p class="mt-5 max-w-sm text-sm leading-relaxed opacity-70">
              Pas de boîte à clés introuvable, pas de ménage à refaire, pas de
              numéro qui sonne dans le vide.
            </p>
          </div>
          <ol class="grid gap-0" role="list">
            {#each engagements as engagement (engagement.numero)}
              <li class="grid gap-4 border-t border-white/15 py-6 sm:grid-cols-[3rem_1fr]">
                <span class="text-xs font-bold tabular-nums opacity-50">{engagement.numero}</span>
                <div>
                  <h3 class="text-lg font-semibold">{engagement.titre}</h3>
                  <p class="mt-1.5 max-w-lg text-sm leading-relaxed opacity-70">{engagement.texte}</p>
                </div>
              </li>
            {/each}
          </ol>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div class="grid overflow-hidden rounded-[2rem] border border-bordure bg-surface shadow-sm md:grid-cols-2">
        <div class="relative min-h-[20rem]">
          <img
            class="absolute inset-0 h-full w-full object-cover"
            src="/photos/maison.webp"
            alt="Maison contemporaine avec jardin"
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="flex flex-col justify-center gap-5 p-8 md:p-12">
          <p class="ui-surtitre">Propriétaires</p>
          <h2 class="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Votre maison mérite une équipe, pas un logiciel de plus.
          </h2>
          <p class="text-sm leading-relaxed text-encre-douce">
            Nous prenons en charge les séjours, la relation voyageur et la
            maintenance pendant que vous gardez la main sur les prix et le
            calendrier. Un seul interlocuteur, un relevé clair chaque mois.
          </p>
          <div class="flex flex-wrap gap-3">
            <a class="ui-bouton ui-bouton--primaire" href="/login">Confier mon logement</a>
            <a class="ui-bouton ui-bouton--secondaire" href="/aide">Comment ça marche</a>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28" aria-labelledby="tit-formules">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">Propriétaires</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" id="tit-formules">
            Un prix par logement, pas une commission.
          </h2>
        </div>
        <p class="max-w-sm text-sm text-encre-douce">
          Indicatif — le devis dépend du nombre de logements et du niveau de
          service.
        </p>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        {#each formules as formule (formule.nom)}
          <article
            class="flex flex-col gap-4 rounded-3xl border bg-surface p-7 {formule.enAvant
              ? 'border-accent shadow-elevee'
              : 'border-bordure'}"
          >
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-lg font-semibold">{formule.nom}</h3>
              {#if formule.enAvant}
                <span class="ui-badge ui-badge--accent">Le plus choisi</span>
              {/if}
            </div>
            <div>
              <p class="text-4xl font-extrabold tabular-nums">{formule.prix} €</p>
              <p class="text-xs text-encre-faine">{formule.base}</p>
            </div>
            <p class="text-sm text-encre-douce">{formule.cible}</p>
            <ul class="flex flex-col gap-2 text-sm" role="list">
              {#each formule.points as point (point)}
                <li class="flex items-start gap-2">
                  <span aria-hidden="true" class="mt-0.5 text-accent">✓</span>
                  {point}
                </li>
              {/each}
            </ul>
            <a class="ui-bouton ui-bouton--secondaire mt-auto" href="/login">Demander une offre</a>
          </article>
        {/each}
      </div>
    </section>

    <section class="relative overflow-hidden bg-accent text-sur-accent">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-16 md:px-8 md:py-20">
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Prêt à partir</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Votre prochain séjour commence ici.
          </h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <a class="ui-bouton ui-bouton--encre" href="/reserver">Voir les disponibilités</a>
          <a class="ui-bouton ui-bouton--secondaire" href="/aide">Poser une question</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-bordure bg-surface">
    <div class="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
      <div class="space-y-3">
        <a class="flex items-center gap-2.5 text-base font-bold tracking-tight" href="/">
          {#if identite.logoUrl}
            <img class="h-8 w-auto" src={identite.logoUrl} alt="" />
          {:else}
            <span class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent">
              {identite.nom.slice(0, 1)}
            </span>
          {/if}
          {identite.nom}
        </a>
        <p class="max-w-xs text-sm leading-relaxed text-encre-douce">
          Conciergerie indépendante sur la Côte d’Azur. Des maisons préparées,
          des séjours suivis.
        </p>
      </div>
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-encre-faine">Séjours</p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li><a class="ui-lien" href="/reserver">Réserver</a></li>
          <li><a class="ui-lien" href="/aide">Aide</a></li>
          <li><a class="ui-lien" href="/design">Design system</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-encre-faine">Propriétaires</p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li><a class="ui-lien" href="/login">Espace hôte</a></li>
          <li><a class="ui-lien" href="/login">Confier un logement</a></li>
          <li><a class="ui-lien" href="/hote">Tableau de bord</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-encre-faine">Informations</p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li><a class="ui-lien" href="/legales">Mentions légales</a></li>
          <li><a class="ui-lien" href="/api/lite?on=1&retour=/">Version légère</a></li>
          {#if identite.emailContact}
            <li>
              <a class="ui-lien" href={`mailto:${identite.emailContact}`}>{identite.emailContact}</a>
            </li>
          {/if}
        </ul>
      </div>
    </div>
    <div class="border-t border-bordure">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-encre-faine md:px-8">
        <p>© {new Date().getFullYear()} {identite.nom}. Tous droits réservés.</p>
        <p>Site accessible sans JavaScript · Hébergé en Europe</p>
      </div>
    </div>
  </footer>
</div>
