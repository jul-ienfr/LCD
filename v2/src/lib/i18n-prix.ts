import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsPrix {
  titrePage: string;
  surtitre: string;
  titre: (mois: string) => string;
  resume: (nom: string, code: string, plan: string, tarifs: number, restrictions: number) => string;
  videAide: string;
  gererLogements: string;
  ok1: string;
  okRestriction: string;
  okRestrictionSupprimee: string;
  okRestrictionPlage: string;
  okRestrictionSupprimeePlage: string;
  okCutoff: string;
  okBuffer: string;
  okPrixPlage: string;
  okStrategie: (prix: string | null) => string;
  okPlanCree: string;
  okPlanModifie: string;
  okPlanSupprime: string;
  okDate: (date: string) => string;
  errPrix: string;
  errCutoff: string;
  errBuffer: string;
  errStrategie: string;
  errPlan: string;
  moisPrecedent: string;
  moisCourant: string;
  moisSuivant: string;
  logement: string;
  plan: string;
  tarifBase: string;
  inactif: string;
  afficher: string;
  modeTitre: string;
  modeDescription: string;
  prixInchanges: string;
  ajustementMois: (ajustement: number) => string;
  appliquerAuxPrix: (mois: string) => string;
  enregistrerMode: string;
  canalTitre: string;
  cutoffDescription: string;
  bufferDescription: string;
  cutoffJours: string;
  preparationJours: string;
  enregistrer: string;
  plansTitre: string;
  plansDescription: string;
  affiche: string;
  inactifBadge: string;
  derive: (ajustement: number) => string;
  prixIndependants: string;
  ratePlanValue: (id: string) => string;
  nonMappe: string;
  priorite: (n: number) => string;
  configurer: string;
  nom: string;
  nomExemple: string;
  code: string;
  codeExemple: string;
  mode: string;
  modeIndependant: string;
  modeDerive: string;
  ajustement: string;
  heriter: string;
  ratePlan: string;
  optionnel: string;
  prioriteLabel: string;
  enregistrerPlan: string;
  ouvrir: string;
  desactiver: string;
  activer: string;
  supprimer: string;
  aucunPlan: string;
  creerPlan: string;
  definirTitre: (plan: string) => string;
  definirDescription: string;
  date: string;
  prixNuit: string;
  supplementPersonne: string;
  personnesIncluses: string;
  enregistrerPrix: string;
  supplementAide: string;
  plageTitre: (plan: string) => string;
  plageDescription: string;
  du: string;
  au: string;
  appliquerPrix: string;
  joursPlage: string;
  joursAide: string;
  reglesTitre: (plan: string) => string;
  reglesDescription: string;
  auOptionnel: string;
  sejourMin: string;
  sejourMax: string;
  arrivee: string;
  depart: string;
  vente: string;
  nonPrecise: string;
  nonPreciseF: string;
  autorisee: string;
  interdite: string;
  autorise: string;
  interdit: string;
  ouverte: string;
  arretee: string;
  enregistrerRegle: string;
  effacerDate: string;
  joursRegleAide: string;
  jours: string[];
}

const FR: TraductionsPrix = {
  titrePage: "Prix — Espace hôte", surtitre: "Espace hôte",
  titre: (mois) => `Prix — ${mois}`,
  resume: (nom, code, plan, tarifs, restrictions) =>
    `${nom} (${code}) · ${plan} · ${tarifs} jour${tarifs > 1 ? "s" : ""} tarifé${tarifs > 1 ? "s" : ""} · ${restrictions} règle${restrictions === 1 ? "" : "s"} de séjour`,
  videAide: "Créez d’abord un logement pour définir des prix.", gererLogements: "Gérer les logements",
  ok1: "Prix enregistré.", okRestriction: "Règle de séjour enregistrée.",
  okRestrictionSupprimee: "Règle de séjour supprimée.", okRestrictionPlage: "Règles de séjour enregistrées sur la plage.",
  okRestrictionSupprimeePlage: "Règles de séjour supprimées sur la plage.",
  okCutoff: "Délai minimum avant arrivée enregistré.", okBuffer: "Délai de préparation enregistré.",
  okPrixPlage: "Prix appliqués sur la plage.",
  okStrategie: (prix) => `Mode de pilotage enregistré${prix ? ` · ${prix} prix ajusté${Number(prix) > 1 ? "s" : ""}` : ""}.`,
  okPlanCree: "Plan tarifaire créé.", okPlanModifie: "Plan tarifaire mis à jour.", okPlanSupprime: "Plan tarifaire supprimé.",
  okDate: (date) => `Prix du ${date} enregistré`,
  errPrix: "Prix invalide (ex. 120 ou 120,50).",
  errCutoff: "Délai invalide : indiquez un nombre de jours entre 0 et 365.",
  errBuffer: "Délai de préparation invalide : indiquez un nombre de jours entre 0 et 7.",
  errStrategie: "Mode de pilotage invalide.",
  errPlan: "Plan invalide : nom (2–80 caractères), code minuscule, ajustement -90 à 500 %, priorité 0–1000.",
  moisPrecedent: "← Mois précédent", moisCourant: "Mois courant", moisSuivant: "Mois suivant →",
  logement: "Logement", plan: "Plan", tarifBase: "Tarif de base", inactif: " (inactif)", afficher: "Afficher",
  modeTitre: "Mode de pilotage des prix",
  modeDescription: "Un seul choix pour le logement. Il règle l’ajustement appliqué aux prix existants, le last-minute et la priorité occupation / marge. Chaque bascule est tracée dans l’audit.",
  prixInchanges: "Prix inchangés", ajustementMois: (a) => `${a > 0 ? "+" : ""}${a} % sur les prix du mois`,
  appliquerAuxPrix: (mois) => `Appliquer aussi l’ajustement aux prix déjà saisis pour ${mois}. Sans cette case, seuls les futurs prix sont concernés.`,
  enregistrerMode: "Enregistrer le mode de pilotage",
  canalTitre: "Configuration du canal",
  cutoffDescription: "Délai minimum entre aujourd’hui et l’arrivée. Les dates plus proches sont fermées à la vente sur les canaux connectés et à la réservation directe. 0 désactive le cut-off.",
  bufferDescription: "Le délai de préparation ferme les nuits qui suivent chaque départ (ménage, linge, contrôle). Il s’applique aux canaux connectés et à la réservation directe. 0 autorise l’enchaînement le jour même.",
  cutoffJours: "Cut-off (jours)", preparationJours: "Préparation (jours)", enregistrer: "Enregistrer",
  plansTitre: "Plans tarifaires",
  plansDescription: "Chaque plan porte ses propres prix et règles de séjour. Un plan dérivé applique son ajustement aux prix de base lorsqu’aucun prix propre n’est saisi, et peut hériter des règles de base. Le plan de base reste disponible sans configuration. Les plans personnalisés sont poussés vers les canaux qui gèrent plusieurs rate plans (Channex).",
  affiche: "(affiché)", inactifBadge: "inactif",
  derive: (a) => `dérivé ${a >= 0 ? "+" : ""}${a} %`, prixIndependants: "prix indépendants",
  ratePlanValue: (id) => `rate plan ${id}`, nonMappe: "non mappé au fournisseur", priorite: (n) => `priorité ${n}`,
  configurer: "Configurer", nom: "Nom", nomExemple: "Non remboursable", code: "Code", codeExemple: "non-remboursable", mode: "Mode", modeIndependant: "Prix indépendants",
  modeDerive: "Dérivé du tarif de base", ajustement: "Ajustement (%)", heriter: "Hériter des règles de base",
  ratePlan: "Rate plan fournisseur", optionnel: "optionnel", prioriteLabel: "Priorité",
  enregistrerPlan: "Enregistrer le plan", ouvrir: "Ouvrir", desactiver: "Désactiver", activer: "Activer",
  supprimer: "Supprimer", aucunPlan: "Aucun plan personnalisé. Les prix ci-dessous utilisent le tarif de base.",
  creerPlan: "Créer le plan",
  definirTitre: (plan) => `Définir un prix — ${plan}`,
  definirDescription: "Le prix est par nuit et par logement. Une nouvelle saisie remplace le prix existant pour cette date.",
  date: "Date", prixNuit: "Prix par nuit (€)", supplementPersonne: "Supplément / personne (€)",
  personnesIncluses: "Personnes incluses", enregistrerPrix: "Enregistrer le prix",
  supplementAide: "Le supplément s’ajoute par nuit et par voyageur au-delà des personnes incluses. Laisser vide pour un prix forfaitaire.",
  plageTitre: (plan) => `Prix sur une plage — ${plan}`,
  plageDescription: "Applique le même prix à toutes les dates de la plage (366 jours maximum), avec un filtre optionnel par jour de semaine. Les prix déjà présents sont remplacés.",
  du: "Du", au: "Au", appliquerPrix: "Appliquer les prix", joursPlage: "Jours de la plage",
  joursAide: "Décocher des jours pour ne tarifer que certains jours ; aucun jour coché = tous.",
  reglesTitre: (plan) => `Règles de séjour — ${plan}`,
  reglesDescription: "Elles sont poussées aux canaux compatibles avec les disponibilités et les tarifs. Une seule règle par date ; un champ vide n’impose aucune limite. Laisser tous les champs vides supprime la règle. Renseigner « Au » applique la même règle à toute la plage, éventuellement limitée aux jours cochés.",
  auOptionnel: "Au (optionnel)", sejourMin: "Séjour minimum (nuits)", sejourMax: "Séjour maximum (nuits)",
  arrivee: "Arrivée", depart: "Départ", vente: "Vente", nonPrecise: "Non précisé", nonPreciseF: "Non précisée",
  autorisee: "Autorisée", interdite: "Interdite", autorise: "Autorisé", interdit: "Interdit",
  ouverte: "Ouverte", arretee: "Arrêtée", enregistrerRegle: "Enregistrer la règle", effacerDate: "Effacer cette date",
  joursRegleAide: "Ignoré sans date de fin. Décocher des jours pour n’appliquer la règle qu’à certains jours de la semaine ; aucun jour coché = tous.",
  jours: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
};

const EN: TraductionsPrix = {
  titrePage: "Pricing — Staff area", surtitre: "Staff area",
  titre: (mois) => `Pricing — ${mois}`,
  resume: (nom, code, plan, tarifs, restrictions) =>
    `${nom} (${code}) · ${plan} · ${tarifs} priced day${tarifs === 1 ? "" : "s"} · ${restrictions} stay rule${restrictions === 1 ? "" : "s"}`,
  videAide: "Create a property first to set prices.", gererLogements: "Manage properties",
  ok1: "Price saved.", okRestriction: "Stay rule saved.", okRestrictionSupprimee: "Stay rule deleted.",
  okRestrictionPlage: "Stay rules saved across the range.", okRestrictionSupprimeePlage: "Stay rules deleted across the range.",
  okCutoff: "Minimum lead time saved.", okBuffer: "Preparation time saved.", okPrixPlage: "Prices applied across the range.",
  okStrategie: (prix) => `Pricing mode saved${prix ? ` · ${prix} price${Number(prix) > 1 ? "s" : ""} adjusted` : ""}.`,
  okPlanCree: "Rate plan created.", okPlanModifie: "Rate plan updated.", okPlanSupprime: "Rate plan deleted.",
  okDate: (date) => `Price for ${date} saved`,
  errPrix: "Invalid price (e.g. 120 or 120.50).",
  errCutoff: "Invalid lead time: enter a number of days between 0 and 365.",
  errBuffer: "Invalid preparation time: enter a number of days between 0 and 7.",
  errStrategie: "Invalid pricing mode.",
  errPlan: "Invalid plan: name (2–80 characters), lowercase code, adjustment -90 to 500%, priority 0–1000.",
  moisPrecedent: "← Previous month", moisCourant: "Current month", moisSuivant: "Next month →",
  logement: "Property", plan: "Plan", tarifBase: "Base rate", inactif: " (inactive)", afficher: "Show",
  modeTitre: "Pricing mode",
  modeDescription: "One choice per property. It sets the adjustment applied to existing prices, last-minute pricing and the occupancy / margin priority. Every change is audited.",
  prixInchanges: "Prices unchanged", ajustementMois: (a) => `${a > 0 ? "+" : ""}${a}% on this month’s prices`,
  appliquerAuxPrix: (mois) => `Also apply the adjustment to prices already entered for ${mois}. Without this box, only future prices are affected.`,
  enregistrerMode: "Save pricing mode",
  canalTitre: "Channel configuration",
  cutoffDescription: "Minimum time between today and arrival. Closer dates are closed for sale on connected channels and direct booking. 0 disables the cut-off.",
  bufferDescription: "Preparation time closes the nights after each departure (cleaning, linen, inspection). It applies to connected channels and direct booking. 0 allows same-day turnover.",
  cutoffJours: "Cut-off (days)", preparationJours: "Preparation (days)", enregistrer: "Save",
  plansTitre: "Rate plans",
  plansDescription: "Each plan carries its own prices and stay rules. A derived plan applies its adjustment to base prices when no own price is entered, and can inherit base rules. The base plan remains available without configuration. Custom plans are pushed to channels that manage multiple rate plans (Channex).",
  affiche: "(shown)", inactifBadge: "inactive",
  derive: (a) => `derived ${a >= 0 ? "+" : ""}${a}%`, prixIndependants: "independent prices",
  ratePlanValue: (id) => `rate plan ${id}`, nonMappe: "not mapped to provider", priorite: (n) => `priority ${n}`,
  configurer: "Configure", nom: "Name", nomExemple: "Non-refundable", code: "Code", codeExemple: "non-refundable", mode: "Mode", modeIndependant: "Independent prices",
  modeDerive: "Derived from base rate", ajustement: "Adjustment (%)", heriter: "Inherit base rules",
  ratePlan: "Provider rate plan", optionnel: "optional", prioriteLabel: "Priority",
  enregistrerPlan: "Save plan", ouvrir: "Open", desactiver: "Deactivate", activer: "Activate",
  supprimer: "Delete", aucunPlan: "No custom plan. Prices below use the base rate.",
  creerPlan: "Create plan",
  definirTitre: (plan) => `Set a price — ${plan}`,
  definirDescription: "The price is per night and per property. A new entry replaces the existing price for that date.",
  date: "Date", prixNuit: "Price per night (€)", supplementPersonne: "Supplement / person (€)",
  personnesIncluses: "People included", enregistrerPrix: "Save price",
  supplementAide: "The supplement is added per night and per guest beyond the included people. Leave blank for a flat price.",
  plageTitre: (plan) => `Price over a range — ${plan}`,
  plageDescription: "Applies the same price to every date in the range (366 days maximum), with an optional weekday filter. Existing prices are replaced.",
  du: "From", au: "To", appliquerPrix: "Apply prices", joursPlage: "Days in the range",
  joursAide: "Uncheck days to price only some days; no day checked = all.",
  reglesTitre: (plan) => `Stay rules — ${plan}`,
  reglesDescription: "They are pushed to channels compatible with availability and rates. One rule per date; an empty field imposes no limit. Leaving all fields empty deletes the rule. Entering “To” applies the same rule to the whole range, optionally limited to checked days.",
  auOptionnel: "To (optional)", sejourMin: "Minimum stay (nights)", sejourMax: "Maximum stay (nights)",
  arrivee: "Arrival", depart: "Departure", vente: "Sale", nonPrecise: "Not specified", nonPreciseF: "Not specified",
  autorisee: "Allowed", interdite: "Not allowed", autorise: "Allowed", interdit: "Not allowed",
  ouverte: "Open", arretee: "Stopped", enregistrerRegle: "Save rule", effacerDate: "Clear this date",
  joursRegleAide: "Ignored without an end date. Uncheck days to apply the rule only on some weekdays; no day checked = all.",
  jours: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const ES: TraductionsPrix = {
  titrePage: "Precios — Área profesional", surtitre: "Área profesional",
  titre: (mois) => `Precios — ${mois}`,
  resume: (nom, code, plan, tarifs, restrictions) =>
    `${nom} (${code}) · ${plan} · ${tarifs} día${tarifs === 1 ? "" : "s"} con tarifa · ${restrictions} regla${restrictions === 1 ? "" : "s"} de estancia`,
  videAide: "Cree primero un alojamiento para definir precios.", gererLogements: "Gestionar alojamientos",
  ok1: "Precio guardado.", okRestriction: "Regla de estancia guardada.", okRestrictionSupprimee: "Regla de estancia eliminada.",
  okRestrictionPlage: "Reglas de estancia guardadas en el rango.", okRestrictionSupprimeePlage: "Reglas de estancia eliminadas en el rango.",
  okCutoff: "Plazo mínimo antes de la llegada guardado.", okBuffer: "Tiempo de preparación guardado.",
  okPrixPlage: "Precios aplicados en el rango.",
  okStrategie: (prix) => `Modo de precios guardado${prix ? ` · ${prix} precio${Number(prix) > 1 ? "s" : ""} ajustado${Number(prix) > 1 ? "s" : ""}` : ""}.`,
  okPlanCree: "Plan tarifario creado.", okPlanModifie: "Plan tarifario actualizado.", okPlanSupprime: "Plan tarifario eliminado.",
  okDate: (date) => `Precio del ${date} guardado`,
  errPrix: "Precio inválido (ej. 120 o 120,50).",
  errCutoff: "Plazo inválido: indique un número de días entre 0 y 365.",
  errBuffer: "Tiempo de preparación inválido: indique un número de días entre 0 y 7.",
  errStrategie: "Modo de precios inválido.",
  errPlan: "Plan inválido: nombre (2–80 caracteres), código en minúsculas, ajuste -90 a 500 %, prioridad 0–1000.",
  moisPrecedent: "← Mes anterior", moisCourant: "Mes actual", moisSuivant: "Mes siguiente →",
  logement: "Alojamiento", plan: "Plan", tarifBase: "Tarifa base", inactif: " (inactivo)", afficher: "Mostrar",
  modeTitre: "Modo de gestión de precios",
  modeDescription: "Una sola elección por alojamiento. Define el ajuste aplicado a los precios existentes, el last-minute y la prioridad ocupación / margen. Cada cambio se audita.",
  prixInchanges: "Precios sin cambios", ajustementMois: (a) => `${a > 0 ? "+" : ""}${a} % sobre los precios del mes`,
  appliquerAuxPrix: (mois) => `Aplicar también el ajuste a los precios ya introducidos para ${mois}. Sin esta casilla, solo se ven afectados los precios futuros.`,
  enregistrerMode: "Guardar el modo de precios",
  canalTitre: "Configuración del canal",
  cutoffDescription: "Plazo mínimo entre hoy y la llegada. Las fechas más cercanas se cierran a la venta en los canales conectados y en la reserva directa. 0 desactiva el cut-off.",
  bufferDescription: "El tiempo de preparación cierra las noches siguientes a cada salida (limpieza, ropa, control). Se aplica a los canales conectados y a la reserva directa. 0 permite el enlace el mismo día.",
  cutoffJours: "Cut-off (días)", preparationJours: "Preparación (días)", enregistrer: "Guardar",
  plansTitre: "Planes tarifarios",
  plansDescription: "Cada plan tiene sus propios precios y reglas de estancia. Un plan derivado aplica su ajuste a los precios base cuando no se introduce un precio propio, y puede heredar las reglas base. El plan base sigue disponible sin configuración. Los planes personalizados se envían a los canales que gestionan varios rate plans (Channex).",
  affiche: "(mostrado)", inactifBadge: "inactivo",
  derive: (a) => `derivado ${a >= 0 ? "+" : ""}${a} %`, prixIndependants: "precios independientes",
  ratePlanValue: (id) => `rate plan ${id}`, nonMappe: "no asignado al proveedor", priorite: (n) => `prioridad ${n}`,
  configurer: "Configurar", nom: "Nombre", nomExemple: "No reembolsable", code: "Código", codeExemple: "no-reembolsable", mode: "Modo", modeIndependant: "Precios independientes",
  modeDerive: "Derivado de la tarifa base", ajustement: "Ajuste (%)", heriter: "Heredar las reglas base",
  ratePlan: "Rate plan del proveedor", optionnel: "opcional", prioriteLabel: "Prioridad",
  enregistrerPlan: "Guardar el plan", ouvrir: "Abrir", desactiver: "Desactivar", activer: "Activar",
  supprimer: "Eliminar", aucunPlan: "Ningún plan personalizado. Los precios siguientes usan la tarifa base.",
  creerPlan: "Crear el plan",
  definirTitre: (plan) => `Definir un precio — ${plan}`,
  definirDescription: "El precio es por noche y por alojamiento. Una nueva entrada sustituye el precio existente para esa fecha.",
  date: "Fecha", prixNuit: "Precio por noche (€)", supplementPersonne: "Suplemento / persona (€)",
  personnesIncluses: "Personas incluidas", enregistrerPrix: "Guardar el precio",
  supplementAide: "El suplemento se añade por noche y por viajero más allá de las personas incluidas. Déjelo vacío para un precio fijo.",
  plageTitre: (plan) => `Precio en un rango — ${plan}`,
  plageDescription: "Aplica el mismo precio a todas las fechas del rango (366 días máximo), con un filtro opcional por día de la semana. Los precios existentes se sustituyen.",
  du: "Desde", au: "Hasta", appliquerPrix: "Aplicar los precios", joursPlage: "Días del rango",
  joursAide: "Desmarque días para tarificar solo algunos; ningún día marcado = todos.",
  reglesTitre: (plan) => `Reglas de estancia — ${plan}`,
  reglesDescription: "Se envían a los canales compatibles con las disponibilidades y las tarifas. Una sola regla por fecha; un campo vacío no impone límite. Dejar todos los campos vacíos elimina la regla. Indicar «Hasta» aplica la misma regla a todo el rango, limitado opcionalmente a los días marcados.",
  auOptionnel: "Hasta (opcional)", sejourMin: "Estancia mínima (noches)", sejourMax: "Estancia máxima (noches)",
  arrivee: "Llegada", depart: "Salida", vente: "Venta", nonPrecise: "No precisado", nonPreciseF: "No precisada",
  autorisee: "Autorizada", interdite: "Prohibida", autorise: "Autorizado", interdit: "Prohibido",
  ouverte: "Abierta", arretee: "Detenida", enregistrerRegle: "Guardar la regla", effacerDate: "Borrar esta fecha",
  joursRegleAide: "Se ignora sin fecha de fin. Desmarque días para aplicar la regla solo algunos días de la semana; ningún día marcado = todos.",
  jours: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

const IT: TraductionsPrix = {
  titrePage: "Prezzi — Area professionale", surtitre: "Area professionale",
  titre: (mois) => `Prezzi — ${mois}`,
  resume: (nom, code, plan, tarifs, restrictions) =>
    `${nom} (${code}) · ${plan} · ${tarifs} giorn${tarifs === 1 ? "o" : "i"} tariffat${tarifs === 1 ? "o" : "i"} · ${restrictions} regol${restrictions === 1 ? "a" : "e"} di soggiorno`,
  videAide: "Crei prima un alloggio per definire i prezzi.", gererLogements: "Gestisci gli alloggi",
  ok1: "Prezzo salvato.", okRestriction: "Regola di soggiorno salvata.", okRestrictionSupprimee: "Regola di soggiorno eliminata.",
  okRestrictionPlage: "Regole di soggiorno salvate sull’intervallo.", okRestrictionSupprimeePlage: "Regole di soggiorno eliminate sull’intervallo.",
  okCutoff: "Tempo minimo prima dell’arrivo salvato.", okBuffer: "Tempo di preparazione salvato.",
  okPrixPlage: "Prezzi applicati sull’intervallo.",
  okStrategie: (prix) => `Modalità prezzi salvata${prix ? ` · ${prix} prezz${Number(prix) > 1 ? "i" : "o"} adattat${Number(prix) > 1 ? "i" : "o"}` : ""}.`,
  okPlanCree: "Piano tariffario creato.", okPlanModifie: "Piano tariffario aggiornato.", okPlanSupprime: "Piano tariffario eliminato.",
  okDate: (date) => `Prezzo del ${date} salvato`,
  errPrix: "Prezzo non valido (es. 120 o 120,50).",
  errCutoff: "Tempo non valido: indichi un numero di giorni tra 0 e 365.",
  errBuffer: "Tempo di preparazione non valido: indichi un numero di giorni tra 0 e 7.",
  errStrategie: "Modalità prezzi non valida.",
  errPlan: "Piano non valido: nome (2–80 caratteri), codice minuscolo, adeguamento -90 a 500 %, priorità 0–1000.",
  moisPrecedent: "← Mese precedente", moisCourant: "Mese corrente", moisSuivant: "Mese successivo →",
  logement: "Alloggio", plan: "Piano", tarifBase: "Tariffa base", inactif: " (inattivo)", afficher: "Mostra",
  modeTitre: "Modalità di gestione dei prezzi",
  modeDescription: "Una sola scelta per alloggio. Imposta l’adeguamento applicato ai prezzi esistenti, il last-minute e la priorità occupazione / margine. Ogni cambio è tracciato nell’audit.",
  prixInchanges: "Prezzi invariati", ajustementMois: (a) => `${a > 0 ? "+" : ""}${a} % sui prezzi del mese`,
  appliquerAuxPrix: (mois) => `Applica l’adeguamento anche ai prezzi già inseriti per ${mois}. Senza questa casella, sono interessati solo i prezzi futuri.`,
  enregistrerMode: "Salva la modalità prezzi",
  canalTitre: "Configurazione del canale",
  cutoffDescription: "Tempo minimo tra oggi e l’arrivo. Le date più vicine sono chiuse alla vendita sui canali connessi e sulla prenotazione diretta. 0 disattiva il cut-off.",
  bufferDescription: "Il tempo di preparazione chiude le notti successive a ogni partenza (pulizie, biancheria, controllo). Si applica ai canali connessi e alla prenotazione diretta. 0 consente il cambio lo stesso giorno.",
  cutoffJours: "Cut-off (giorni)", preparationJours: "Preparazione (giorni)", enregistrer: "Salva",
  plansTitre: "Piani tariffari",
  plansDescription: "Ogni piano ha i propri prezzi e regole di soggiorno. Un piano derivato applica il suo adeguamento ai prezzi base quando non viene inserito un prezzo proprio, e può ereditare le regole base. Il piano base resta disponibile senza configurazione. I piani personalizzati vengono inviati ai canali che gestiscono più rate plan (Channex).",
  affiche: "(mostrato)", inactifBadge: "inattivo",
  derive: (a) => `derivato ${a >= 0 ? "+" : ""}${a} %`, prixIndependants: "prezzi indipendenti",
  ratePlanValue: (id) => `rate plan ${id}`, nonMappe: "non mappato al fornitore", priorite: (n) => `priorità ${n}`,
  configurer: "Configura", nom: "Nome", nomExemple: "Non rimborsabile", code: "Codice", codeExemple: "non-rimborsabile", mode: "Modalità", modeIndependant: "Prezzi indipendenti",
  modeDerive: "Derivato dalla tariffa base", ajustement: "Adeguamento (%)", heriter: "Eredita le regole base",
  ratePlan: "Rate plan del fornitore", optionnel: "opzionale", prioriteLabel: "Priorità",
  enregistrerPlan: "Salva il piano", ouvrir: "Apri", desactiver: "Disattiva", activer: "Attiva",
  supprimer: "Elimina", aucunPlan: "Nessun piano personalizzato. I prezzi seguenti usano la tariffa base.",
  creerPlan: "Crea il piano",
  definirTitre: (plan) => `Definisci un prezzo — ${plan}`,
  definirDescription: "Il prezzo è per notte e per alloggio. Un nuovo inserimento sostituisce il prezzo esistente per quella data.",
  date: "Data", prixNuit: "Prezzo per notte (€)", supplementPersonne: "Supplemento / persona (€)",
  personnesIncluses: "Persone incluse", enregistrerPrix: "Salva il prezzo",
  supplementAide: "Il supplemento si aggiunge per notte e per ospite oltre le persone incluse. Lasci vuoto per un prezzo forfettario.",
  plageTitre: (plan) => `Prezzo su un intervallo — ${plan}`,
  plageDescription: "Applica lo stesso prezzo a tutte le date dell’intervallo (366 giorni massimo), con un filtro opzionale per giorno della settimana. I prezzi esistenti vengono sostituiti.",
  du: "Dal", au: "Al", appliquerPrix: "Applica i prezzi", joursPlage: "Giorni dell’intervallo",
  joursAide: "Deselezioni giorni per tariffare solo alcuni; nessun giorno selezionato = tutti.",
  reglesTitre: (plan) => `Regole di soggiorno — ${plan}`,
  reglesDescription: "Vengono inviate ai canali compatibili con disponibilità e tariffe. Una sola regola per data; un campo vuoto non impone limiti. Lasciare tutti i campi vuoti elimina la regola. Indicare «Al» applica la stessa regola a tutto l’intervallo, eventualmente limitato ai giorni selezionati.",
  auOptionnel: "Al (opzionale)", sejourMin: "Soggiorno minimo (notti)", sejourMax: "Soggiorno massimo (notti)",
  arrivee: "Arrivo", depart: "Partenza", vente: "Vendita", nonPrecise: "Non precisato", nonPreciseF: "Non precisata",
  autorisee: "Consentito", interdite: "Vietato", autorise: "Consentito", interdit: "Vietato",
  ouverte: "Aperta", arretee: "Bloccata", enregistrerRegle: "Salva la regola", effacerDate: "Cancella questa data",
  joursRegleAide: "Ignorato senza data di fine. Deselezioni giorni per applicare la regola solo alcuni giorni della settimana; nessun giorno selezionato = tutti.",
  jours: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
};

const DE: TraductionsPrix = {
  titrePage: "Preise — Profibereich", surtitre: "Profibereich",
  titre: (mois) => `Preise — ${mois}`,
  resume: (nom, code, plan, tarifs, restrictions) =>
    `${nom} (${code}) · ${plan} · ${tarifs} bepreister Tag${tarifs === 1 ? "" : "e"} · ${restrictions} Aufenthaltsregel${restrictions === 1 ? "" : "n"}`,
  videAide: "Erstellen Sie zuerst eine Unterkunft, um Preise festzulegen.", gererLogements: "Unterkünfte verwalten",
  ok1: "Preis gespeichert.", okRestriction: "Aufenthaltsregel gespeichert.", okRestrictionSupprimee: "Aufenthaltsregel gelöscht.",
  okRestrictionPlage: "Aufenthaltsregeln für den Zeitraum gespeichert.", okRestrictionSupprimeePlage: "Aufenthaltsregeln für den Zeitraum gelöscht.",
  okCutoff: "Mindestvorlauf gespeichert.", okBuffer: "Vorbereitungszeit gespeichert.",
  okPrixPlage: "Preise für den Zeitraum angewendet.",
  okStrategie: (prix) => `Preismodus gespeichert${prix ? ` · ${prix} Preis${Number(prix) > 1 ? "e" : ""} angepasst` : ""}.`,
  okPlanCree: "Tarifplan erstellt.", okPlanModifie: "Tarifplan aktualisiert.", okPlanSupprime: "Tarifplan gelöscht.",
  okDate: (date) => `Preis für ${date} gespeichert`,
  errPrix: "Ungültiger Preis (z. B. 120 oder 120,50).",
  errCutoff: "Ungültiger Vorlauf: Geben Sie eine Anzahl Tage zwischen 0 und 365 ein.",
  errBuffer: "Ungültige Vorbereitungszeit: Geben Sie eine Anzahl Tage zwischen 0 und 7 ein.",
  errStrategie: "Ungültiger Preismodus.",
  errPlan: "Ungültiger Plan: Name (2–80 Zeichen), Kleinbuchstaben-Code, Anpassung -90 bis 500 %, Priorität 0–1000.",
  moisPrecedent: "← Voriger Monat", moisCourant: "Aktueller Monat", moisSuivant: "Nächster Monat →",
  logement: "Unterkunft", plan: "Plan", tarifBase: "Grundtarif", inactif: " (inaktiv)", afficher: "Anzeigen",
  modeTitre: "Preissteuerung",
  modeDescription: "Eine Auswahl pro Unterkunft. Sie legt die Anpassung bestehender Preise, Last-Minute und die Priorität Auslastung / Marge fest. Jede Änderung wird protokolliert.",
  prixInchanges: "Preise unverändert", ajustementMois: (a) => `${a > 0 ? "+" : ""}${a} % auf die Preise des Monats`,
  appliquerAuxPrix: (mois) => `Die Anpassung auch auf bereits eingegebene Preise für ${mois} anwenden. Ohne dieses Kästchen sind nur künftige Preise betroffen.`,
  enregistrerMode: "Preismodus speichern",
  canalTitre: "Kanalkonfiguration",
  cutoffDescription: "Mindestzeit zwischen heute und der Anreise. Nähere Daten sind auf verbundenen Kanälen und bei Direktbuchung geschlossen. 0 deaktiviert den Cut-off.",
  bufferDescription: "Die Vorbereitungszeit schließt die Nächte nach jeder Abreise (Reinigung, Wäsche, Kontrolle). Sie gilt für verbundene Kanäle und Direktbuchung. 0 erlaubt den Wechsel am selben Tag.",
  cutoffJours: "Cut-off (Tage)", preparationJours: "Vorbereitung (Tage)", enregistrer: "Speichern",
  plansTitre: "Tarifpläne",
  plansDescription: "Jeder Plan hat eigene Preise und Aufenthaltsregeln. Ein abgeleiteter Plan wendet seine Anpassung auf Grundpreise an, wenn kein eigener Preis eingegeben ist, und kann Grundregeln erben. Der Basisplan bleibt ohne Konfiguration verfügbar. Benutzerdefinierte Pläne werden an Kanäle gesendet, die mehrere Rate Plans verwalten (Channex).",
  affiche: "(angezeigt)", inactifBadge: "inaktiv",
  derive: (a) => `abgeleitet ${a >= 0 ? "+" : ""}${a} %`, prixIndependants: "unabhängige Preise",
  ratePlanValue: (id) => `Rate Plan ${id}`, nonMappe: "nicht dem Anbieter zugeordnet", priorite: (n) => `Priorität ${n}`,
  configurer: "Konfigurieren", nom: "Name", nomExemple: "Nicht erstattbar", code: "Code", codeExemple: "nicht-erstattbar", mode: "Modus", modeIndependant: "Unabhängige Preise",
  modeDerive: "Vom Grundtarif abgeleitet", ajustement: "Anpassung (%)", heriter: "Grundregeln erben",
  ratePlan: "Anbieter-Rate-Plan", optionnel: "optional", prioriteLabel: "Priorität",
  enregistrerPlan: "Plan speichern", ouvrir: "Öffnen", desactiver: "Deaktivieren", activer: "Aktivieren",
  supprimer: "Löschen", aucunPlan: "Kein benutzerdefinierter Plan. Die Preise unten verwenden den Grundtarif.",
  creerPlan: "Plan erstellen",
  definirTitre: (plan) => `Preis festlegen — ${plan}`,
  definirDescription: "Der Preis gilt pro Nacht und pro Unterkunft. Eine neue Eingabe ersetzt den bestehenden Preis für dieses Datum.",
  date: "Datum", prixNuit: "Preis pro Nacht (€)", supplementPersonne: "Zuschlag / Person (€)",
  personnesIncluses: "Inkludierte Personen", enregistrerPrix: "Preis speichern",
  supplementAide: "Der Zuschlag wird pro Nacht und Gast über die inkludierten Personen hinaus addiert. Leer lassen für einen Pauschalpreis.",
  plageTitre: (plan) => `Preis für einen Zeitraum — ${plan}`,
  plageDescription: "Wendet denselben Preis auf alle Daten des Zeitraums an (maximal 366 Tage), mit optionalem Wochentagsfilter. Bestehende Preise werden ersetzt.",
  du: "Von", au: "Bis", appliquerPrix: "Preise anwenden", joursPlage: "Tage des Zeitraums",
  joursAide: "Tage abwählen, um nur bestimmte Tage zu bepreisen; kein Tag angehakt = alle.",
  reglesTitre: (plan) => `Aufenthaltsregeln — ${plan}`,
  reglesDescription: "Sie werden an Kanäle gesendet, die Verfügbarkeiten und Tarife unterstützen. Eine Regel pro Datum; ein leeres Feld setzt keine Grenze. Alle Felder leer lassen löscht die Regel. „Bis“ angeben wendet dieselbe Regel auf den gesamten Zeitraum an, optional auf angehakte Tage begrenzt.",
  auOptionnel: "Bis (optional)", sejourMin: "Mindestaufenthalt (Nächte)", sejourMax: "Höchstaufenthalt (Nächte)",
  arrivee: "Anreise", depart: "Abreise", vente: "Verkauf", nonPrecise: "Nicht angegeben", nonPreciseF: "Nicht angegeben",
  autorisee: "Erlaubt", interdite: "Nicht erlaubt", autorise: "Erlaubt", interdit: "Nicht erlaubt",
  ouverte: "Offen", arretee: "Gestoppt", enregistrerRegle: "Regel speichern", effacerDate: "Dieses Datum löschen",
  joursRegleAide: "Ohne Enddatum ignoriert. Tage abwählen, um die Regel nur an bestimmten Wochentagen anzuwenden; kein Tag angehakt = alle.",
  jours: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
};

const DICTIONNAIRES: Record<Langue, TraductionsPrix> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsPrix(langue: string): TraductionsPrix {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
