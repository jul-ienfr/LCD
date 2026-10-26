import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  LIBELLES_NATURE,
  LIBELLES_REGIME,
  LIBELLES_TVA,
} from "@/domain/entite";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";

export const instant = false;

export const metadata: Metadata = {
  title: "Mentions légales & CGV",
  description:
    "Éditeur de la plateforme, mandat de conciergerie, données personnelles et mentions LCEN.",
};

export default async function PageLegales({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const slug = params.tenant?.trim() || "lcd";
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  const editeur = tenant && tenant.statut === "actif" ? tenant : null;
  const identite = await new LireIdentiteSite(
    new DrizzleParametresSiteRepository(),
  ).executer();
  const contactPublic =
    identite.emailContact ||
    identite.telephoneContact ||
    identite.adresseContact;
  const sirenManquant = !editeur?.siren;
  const adresseManquante = !editeur?.adresse;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Transparence · LCEN art. 6 III · RGPD
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mentions légales &amp; CGV
        </h1>
        <p className="text-encre-douce">
          Les informations ci-dessous proviennent du registre réel de
          l’établissement. Ce qui n’est pas renseigné est affiché « à
          compléter » : aucun numéro ni éditeur n’est inventé.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Éditeur de la plateforme</h2>
        {!editeur ? (
          <p className="rounded-xl border border-bordure bg-fond px-4 py-3 text-sm text-encre-douce">
            Aucun éditeur actif n’est configuré pour cet espace. Renseignez
            l’entité juridique depuis l’espace hôte avant d’exploiter la
            plateforme.
          </p>
        ) : (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-encre-faine">Dénomination</dt>
                <dd className="font-medium">{editeur.nom}</dd>
              </div>
              <div>
                <dt className="text-encre-faine">Forme juridique</dt>
                <dd>{LIBELLES_NATURE[editeur.nature]}</dd>
              </div>
              <div>
                <dt className="text-encre-faine">Régime fiscal</dt>
                <dd>{LIBELLES_REGIME[editeur.regime]}</dd>
              </div>
              <div>
                <dt className="text-encre-faine">TVA</dt>
                <dd>{LIBELLES_TVA[editeur.tva]}</dd>
              </div>
              <div>
                <dt className="text-encre-faine">SIREN</dt>
                <dd className={sirenManquant ? "text-encre-faine" : "tabular-nums"}>
                  {editeur.siren ?? "À compléter"}
                </dd>
              </div>
              <div>
                <dt className="text-encre-faine">Adresse</dt>
                <dd className={adresseManquante ? "text-encre-faine" : undefined}>
                  {editeur.adresse ?? "À compléter"}
                </dd>
              </div>
              {contactPublic ? (
                <div className="sm:col-span-2">
                  <dt className="text-encre-faine">Contact</dt>
                  <dd className="flex flex-wrap gap-x-4 gap-y-1">
                    {identite.emailContact ? (
                      <a
                        className="underline"
                        href={`mailto:${identite.emailContact}`}
                      >
                        {identite.emailContact}
                      </a>
                    ) : null}
                    {identite.telephoneContact ? (
                      <a
                        className="underline"
                        href={`tel:${identite.telephoneContact.replace(/[^+0-9]/gu, "")}`}
                      >
                        {identite.telephoneContact}
                      </a>
                    ) : null}
                    {identite.adresseContact ? (
                      <span>{identite.adresseContact}</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
            {(sirenManquant || adresseManquante) && (
              <p className="rounded-xl border border-bordure bg-fond px-4 py-3 text-sm text-encre-douce">
                Mentions incomplètes : le SIREN et l’adresse de l’éditeur sont
                obligatoires pour une exploitation commerciale (LCEN). Ils
                seront affichés dès leur saisie dans l’espace hôte.
              </p>
            )}
            {editeur.mentionsLegales && (
              <div className="space-y-1 border-t border-bordure pt-3 text-sm">
                <h3 className="font-medium">Mentions complémentaires</h3>
                <p className="whitespace-pre-line text-encre-douce">
                  {editeur.mentionsLegales}
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Mandat de conciergerie</h2>
        <p className="text-sm text-encre-douce">
          La plateforme distingue deux modes d’exploitation : la gestion en
          propre (l’hôte est propriétaire ou mandataire de ses logements) et le
          mandat de conciergerie (un tiers gère les logements pour le compte
          d’un propriétaire). Le périmètre, la durée, la commission et les
          obligations de chaque partie sont fixés dans le contrat signé entre
          les parties. Cette page n’est pas un mandat et ne vaut pas acceptation
          des CGV.
        </p>
        <p className="text-sm text-encre-douce">
          Les documents contractuels et les factures sont émis depuis la
          plateforme avec l’identité de l’éditeur ci-dessus. Toute réservation
          reste soumise à la disponibilité réelle du logement et aux conditions
          du séjour.
        </p>
        <p className="text-sm text-encre-douce">
          Forfaits indicatifs par logement et par mois : <strong>Kit 149 €</strong>{" "}
          (plancher), <strong>Pilotage 190 €</strong>,{" "}
          <strong>Full service 290 €</strong>, hors extras facturés au réel. La
          commission de conciergerie est déduite avant reversement au
          propriétaire ; aucun cumul de commissions plateforme n’est appliqué.
          Les relevés de l’espace propriétaire sont indicatifs : le
          rapprochement comptable et sa validation restent du ressort de
          l’expert-comptable.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Médiation de la consommation</h2>
        <p className="text-sm text-encre-douce">
          En cas de litige non résolu par une réclamation écrite préalable,
          le consommateur peut recourir gratuitement à un médiateur de la
          consommation. Les coordonnées du médiateur désigné par l’éditeur
          seront affichées dans cette section dès sa désignation ; à défaut,
          le consommateur peut saisir le médiateur compétent pour le secteur
          du tourisme ou, en dernier recours, les tribunaux compétents.
        </p>
        <p className="text-sm text-encre-douce">
          Cette page ne constitue ni un mandat ni une acceptation des
          conditions générales : les CGV complètes sont remises et signées
          avec le contrat écrit.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Données personnelles &amp; RGPD</h2>
        <p className="text-sm text-encre-douce">
          Les données collectées servent à gérer les séjours, les contrats, la
          facturation, la relation avec les voyageurs, les propriétaires et les
          prestataires, ainsi qu’à la sécurité des comptes. Les bases légales
          sont l’exécution du contrat, l’obligation légale (comptabilité,
          fiscalité) et l’intérêt légitime (sécurité, prévention de la fraude).
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-encre-douce">
          <li>
            Factures et pièces comptables : conservées 10 ans (obligation
            légale).
          </li>
          <li>
            Journaux techniques et d’audit : durée limitée, consultables par les
            administrateurs habilités.
          </li>
          <li>
            Sessions : conservées jusqu’à expiration ou fermeture explicite ;
            les autres sessions peuvent être révoquées depuis la page Sécurité.
          </li>
          <li>
            Aucune donnée de carte bancaire n’est stockée par la plateforme ;
            les prestataires de paiement traitent les transactions.
          </li>
        </ul>
        <p className="text-sm text-encre-douce">
          Vous pouvez demander l’accès, la rectification, l’effacement ou la
          portabilité de vos données, et vous opposer à certains traitements.
          Les demandes sont tracées dans le registre RGPD de l’établissement.
          En cas de désaccord, vous pouvez saisir la CNIL.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">État de l’édition (LCEN)</h2>
        <p className="text-sm text-encre-douce">
          Cette instance est une édition beta. Elle est hébergée par Netlify,
          Inc. (San Francisco, États-Unis) ; la base de données de la beta est
          hébergée hors Union européenne. Les notifications e-mail peuvent être
          désactivées et aucun encaissement de paiement n’est réalisé par la
          plateforme tant que l’éditeur n’a pas complété ses obligations
          (SIREN, assurance, carte professionnelle lorsque requise).
        </p>
        <p className="text-sm text-encre-douce">
          Une réservation effectuée sur cette édition ne constitue pas un
          engagement ferme tant que le contrat et les conditions du séjour ne
          sont pas confirmés par l’éditeur.
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-encre-faine">
        <p>Version du {new Date().toISOString().slice(0, 10)}.</p>
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/aide">
            Aide
          </Link>
          <Link className="underline" href="/">
            Retour à l’accueil
          </Link>
        </div>
      </footer>
    </main>
  );
}
