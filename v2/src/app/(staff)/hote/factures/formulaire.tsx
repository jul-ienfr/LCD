"use client";

import { useActionState, useState } from "react";
import {
  formaterTauxTva,
  montantTaxeSejour,
  montantTva,
  type ParametresFiscaux,
} from "@/domain/fiscal";
import type { Logement } from "@/domain/logement";
import { nuitsSejour } from "@/domain/planning";
import type { Reservation } from "@/domain/reservation";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import {
  creerFactureAction,
  type EtatFormulaireFacture,
} from "./actions";

const etatInitial: EtatFormulaireFacture = { ok: false, message: "" };

export function FormulaireFacture({
  logements,
  reservations,
  dateDefaut,
  numeroDefaut,
  fiscal,
}: {
  logements: Pick<Logement, "id" | "nom" | "code">[];
  reservations: Pick<
    Reservation,
    "id" | "ref" | "debut" | "fin" | "clientNom" | "montantCentimes" | "logementId" | "voyageurs"
  >[];
  dateDefaut: string;
  numeroDefaut: string;
  fiscal: Pick<
    ParametresFiscaux,
    | "tauxTvaBp"
    | "taxeSejourNuitPersonneCentimes"
    | "taxeSejourPlafondCentimes"
  >;
}) {
  const [etat, action, enCours] = useActionState(
    creerFactureAction,
    etatInitial,
  );

  const [logementId, setLogementId] = useState(logements[0]?.id ?? "");
  const [reservationId, setReservationId] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [designation, setDesignation] = useState("Séjour");
  const [quantite, setQuantite] = useState("1");
  const [prixUnitaire, setPrixUnitaire] = useState("0");
  const [tva, setTva] = useState("");
  const [taxe, setTaxe] = useState("");

  const ht =
    (centimesDepuisSaisie(prixUnitaire) ?? 0) *
    Math.max(1, Number(quantite) || 1);
  const tvaCentimes = tva.trim()
    ? (centimesDepuisSaisie(tva) ?? 0)
    : montantTva(ht, fiscal.tauxTvaBp);

  const reservationChoisie = reservations.find((r) => r.id === reservationId);
  const taxeAuto = reservationChoisie
    ? montantTaxeSejour({
        nuits: nuitsSejour(reservationChoisie.debut, reservationChoisie.fin),
        voyageurs: reservationChoisie.voyageurs,
        taxeSejourNuitPersonneCentimes:
          fiscal.taxeSejourNuitPersonneCentimes,
        taxeSejourPlafondCentimes: fiscal.taxeSejourPlafondCentimes,
      })
    : 0;
  const taxeCentimes = taxe.trim()
    ? (centimesDepuisSaisie(taxe) ?? 0)
    : taxeAuto;
  const ttc = ht + tvaCentimes + taxeCentimes;

  function choisirReservation(id: string) {
    setReservationId(id);
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) return;

    setLogementId(reservation.logementId);
    setClientNom(reservation.clientNom ?? "");
    setDesignation(
      `Séjour du ${reservation.debut} au ${reservation.fin}`,
    );
    const nuits = nuitsSejour(reservation.debut, reservation.fin);
    setQuantite(String(nuits));
    setPrixUnitaire(
      (reservation.montantCentimes / 100 / Math.max(1, nuits)).toFixed(2),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">
          <span>Réservation liée (facultatif)</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="reservationId"
            value={reservationId}
            onChange={(e) => choisirReservation(e.target.value)}
          >
            <option value="">Aucune — facture libre</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.ref} — {r.debut} → {r.fin}
                {r.clientNom ? ` (${r.clientNom})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Logement</span>
          <select
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="logementId"
            value={logementId}
            onChange={(e) => setLogementId(e.target.value)}
            required
          >
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom} ({l.code})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Numéro</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 font-mono text-base"
            defaultValue={numeroDefaut}
            name="numero"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Client</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="clientNom"
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Email client (facultatif)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="clientEmail"
            type="email"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Date d’émission</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            defaultValue={dateDefaut}
            name="dateEmission"
            type="date"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Échéance (facultatif)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="echeance"
            type="date"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block space-y-1 text-sm font-medium sm:col-span-2">
          <span>Désignation</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            name="designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Quantité</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            min={1}
            name="quantite"
            type="number"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Prix unitaire (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            inputMode="decimal"
            name="prixUnitaireEuros"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1 text-sm font-medium">
          <span>TVA (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            inputMode="decimal"
            name="tvaEuros"
            placeholder={`Auto : ${formaterTauxTva(fiscal.tauxTvaBp)}`}
            value={tva}
            onChange={(e) => setTva(e.target.value)}
          />
          <span className="block text-xs font-normal text-encre-faine">
            Laisser vide pour calculer avec le taux du tenant.
          </span>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>Taxe de séjour (€)</span>
          <input
            className="w-full rounded-xl border border-bordure p-3 text-base"
            inputMode="decimal"
            name="taxeEuros"
            placeholder="Auto"
            value={taxe}
            onChange={(e) => setTaxe(e.target.value)}
          />
          <span className="block text-xs font-normal text-encre-faine">
            {reservationChoisie
              ? `Auto : ${formaterEuros(taxeAuto)} (${reservationChoisie.voyageurs} voyageur(s), nuits du séjour).`
              : "Auto : 0 € sans réservation liée ; saisir un montant pour forcer."}
          </span>
        </label>
        <div className="rounded-xl border border-bordure bg-fond p-3 text-sm">
          <p>HT : {formaterEuros(ht)}</p>
          <p>TVA : {formaterEuros(tvaCentimes)}</p>
          <p>Taxe : {formaterEuros(taxeCentimes)}</p>
          <p className="font-medium">TTC : {formaterEuros(ttc)}</p>
        </div>
      </div>

      <label className="block space-y-1 text-sm font-medium">
        <span>Notes (facultatif)</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-bordure p-3 text-base"
          name="notes"
        />
      </label>

      {etat.message ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          {etat.message}
        </p>
      ) : null}

      <button
        className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Création…" : "Créer la facture"}
      </button>
    </form>
  );
}
