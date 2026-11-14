<script lang="ts">
  /**
   * Récapitulatif de prix (T021).
   *
   * HTML d'abord : une liste de définitions (`<dl>`) lisible sans CSS et sans
   * JavaScript. Les montants sont formatés **côté serveur** avec
   * `Intl.NumberFormat` (devise et séparateurs de la langue), à partir de
   * centimes entiers — jamais de flottant, jamais de calcul dans le navigateur.
   */
  import type { Langue } from "@/lib/i18n";

  let {
    nuits,
    voyageurs,
    prixNuitCentimes,
    totalCentimes,
    taxeCentimes,
    inclusions = [],
    devise = "EUR",
    langue = "fr",
  }: {
    /** Nombre de nuits du séjour. */
    nuits: number;
    /** Nombre de voyageurs. */
    voyageurs: number;
    /** Prix d'une nuit, en centimes. */
    prixNuitCentimes: number;
    /** Total du séjour, en centimes. */
    totalCentimes: number;
    /** Taxe de séjour, en centimes ; ligne masquée si absente. */
    taxeCentimes?: number | null;
    /** Prestations comprises, déjà traduites par l'appelant. */
    inclusions?: string[];
    /** Code ISO 4217 de la devise. */
    devise?: string;
    langue?: Langue;
  } = $props();

  const LOCALES: Record<Langue, string> = {
    fr: "fr-FR",
    en: "en-GB",
    es: "es-ES",
    it: "it-IT",
    de: "de-DE",
  };

  const LIBELLES: Record<
    Langue,
    {
      nuits: (n: number) => string;
      voyageurs: (n: number) => string;
      prixNuit: string;
      taxe: string;
      total: string;
      inclus: string;
      devis: string;
    }
  > = {
    fr: {
      nuits: (n) => (n > 1 ? "Nuits" : "Nuit"),
      voyageurs: (n) => (n > 1 ? "Voyageurs" : "Voyageur"),
      prixNuit: "Prix par nuit",
      taxe: "Taxe de séjour",
      total: "Total",
      inclus: "Compris dans le prix",
      devis: "Montant indicatif, confirmé avant paiement.",
    },
    en: {
      nuits: (n) => (n > 1 ? "Nights" : "Night"),
      voyageurs: (n) => (n > 1 ? "Guests" : "Guest"),
      prixNuit: "Price per night",
      taxe: "Tourist tax",
      total: "Total",
      inclus: "Included in the price",
      devis: "Indicative amount, confirmed before payment.",
    },
    es: {
      nuits: (n) => (n > 1 ? "Noches" : "Noche"),
      voyageurs: (n) => (n > 1 ? "Viajeros" : "Viajero"),
      prixNuit: "Precio por noche",
      taxe: "Tasa turística",
      total: "Total",
      inclus: "Incluido en el precio",
      devis: "Importe orientativo, confirmado antes del pago.",
    },
    it: {
      nuits: (n) => (n > 1 ? "Notti" : "Notte"),
      voyageurs: (n) => (n > 1 ? "Viaggiatori" : "Viaggiatore"),
      prixNuit: "Prezzo per notte",
      taxe: "Tassa di soggiorno",
      total: "Totale",
      inclus: "Incluso nel prezzo",
      devis: "Importo indicativo, confermato prima del pagamento.",
    },
    de: {
      nuits: (n) => (n > 1 ? "Nächte" : "Nacht"),
      voyageurs: (n) => (n > 1 ? "Gäste" : "Gast"),
      prixNuit: "Preis pro Nacht",
      taxe: "Kurtaxe",
      total: "Gesamt",
      inclus: "Im Preis enthalten",
      devis: "Richtwert, vor der Zahlung bestätigt.",
    },
  };

  const mots = $derived(LIBELLES[langue]);

  /** Formateur tolérant : replie sur un nombre simple si la devise est invalide. */
  function formateur(): Intl.NumberFormat {
    const locale = LOCALES[langue];
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: devise,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    }
  }

  const montant = $derived(formateur());
  const format = (centimes: number) => montant.format(Math.round(centimes) / 100);
  const aTaxe = $derived(taxeCentimes !== undefined && taxeCentimes !== null);
</script>

<div class="space-y-4" lang={langue} data-resume-prix>
  <dl class="grid gap-2 text-sm">
    <div class="flex items-baseline justify-between gap-4">
      <dt class="text-encre-douce">{mots.nuits(nuits)}</dt>
      <dd class="font-semibold tabular-nums">{nuits}</dd>
    </div>
    <div class="flex items-baseline justify-between gap-4">
      <dt class="text-encre-douce">{mots.voyageurs(voyageurs)}</dt>
      <dd class="font-semibold tabular-nums">{voyageurs}</dd>
    </div>
    <div class="flex items-baseline justify-between gap-4">
      <dt class="text-encre-douce">{mots.prixNuit}</dt>
      <dd class="font-semibold tabular-nums">{format(prixNuitCentimes)}</dd>
    </div>
    {#if aTaxe}
      <div class="flex items-baseline justify-between gap-4">
        <dt class="text-encre-douce">{mots.taxe}</dt>
        <dd class="font-semibold tabular-nums">{format(taxeCentimes ?? 0)}</dd>
      </div>
    {/if}
    <div
      class="flex items-baseline justify-between gap-4 border-t border-bordure pt-2"
    >
      <dt class="font-semibold">{mots.total}</dt>
      <dd class="text-lg font-bold tabular-nums">{format(totalCentimes)}</dd>
    </div>
  </dl>

  <p class="text-xs text-encre-faine">{mots.devis}</p>

  {#if inclusions.length > 0}
    <div class="space-y-2">
      <p class="text-xs font-bold uppercase tracking-widest text-encre-faine">
        {mots.inclus}
      </p>
      <ul class="space-y-1 text-sm text-encre-douce" role="list">
        {#each inclusions as inclusion, index (index)}
          <li class="flex items-start gap-2">
            <span class="text-accent" aria-hidden="true">✓</span>
            <span>{inclusion}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
