/**
 * Vérifie la présence du formulaire de demande de séjour public et le drapeau
 * attendu. Usage : node .artifacts/ergonomie/sonde-demande-sejour.mjs
 */
const base = process.env.SONDE_BASE ?? "http://127.0.0.1:4173";

for (const chemin of ["/site/lcd", "/site/lcd?demande=1"]) {
  const reponse = await fetch(`${base}${chemin}`);
  const html = await reponse.text();
  const compte = (html.match(/\?\/demande/g) ?? []).length;
  const phrase = /demandes? de séjour (?:est|sont) (?:fermée|désactivée)/i.test(html)
    ? "bandeau « demandes fermées » présent"
    : "aucun bandeau de fermeture";
  console.log(
    `${chemin} → ${reponse.status}, occurrences de « ?/demande » : ${compte}, ${phrase}`,
  );
}
console.log(
  "ENQUIRY_ENABLED côté sonde :",
  JSON.stringify(process.env.ENQUIRY_ENABLED ?? null),
);
