# test-perimetres.ps1 - CHAQUE ROLE NE VOIT QUE SES BIENS (cloisonnement reel).
#
# Doctrine (demande explicite) : « un proprietaire doit voir uniquement SES
# biens, un operateur uniquement ceux qu'il a a gerer ». La regle est declaree
# dans custom/acces.yaml (champ logements) et la passerelle la fait respecter
# sur les ECRITURES (403 hors perimetre). Cette batterie verifie ce qui manque
# le plus souvent : les LECTURES. Un cloisonnement qui ne tient que sur les
# ecritures laisse voir tout le parc a tout le monde.
#
# Mesure par le reseau interne (la passerelle n'est pas publiee) : le programme
# Node tourne DANS le conteneur web, qui partage le reseau lcd-deploy.
#
# Usage : cd deploy ; powershell -ExecutionPolicy Bypass -File ./test-perimetres.ps1
$ErrorActionPreference = "Stop"
$KO = 0
function Verif([string]$label, [bool]$ok, [string]$detail) {
    if ($ok) { Write-Host "[OK] $label" } else { Write-Host "[KO] $label -- $detail"; $script:KO++ }
}

# --- perimetres DECLARES (source : custom/acces.yaml) -----------------------
$declare = @{
    personne_05 = @("log1", "log2")   # proprietaire : SES logements seuls
    personne_03 = @("log1")           # operateur : ceux qu'il gere
}
$autres = @{
    personne_05 = @("log3", "log66496", "xq6649701")
    personne_03 = @("log2", "log3", "log66496")
}

$js = @'
const cibles = [
  ["/etat-parc?qui=personne_05", "personne_05"],
  ["/etat-parc?qui=personne_03", "personne_03"],
  ["/parc/logements?qui=personne_05", "personne_05"],
  ["/parc/logements?qui=personne_03", "personne_03"],
  ["/portail-proprio?qui=personne_05&logement=log3", "personne_05"]
];
for (const [url, qui] of cibles) {
  try {
    const r = await fetch("http://gateway-parc:8443" + url);
    const t = await r.text();
    const logs = [...new Set([...t.matchAll(/log[0-9]+|xq[0-9]+/g)].map(m => m[0]))].sort();
    console.log(JSON.stringify({ url, qui, code: r.status, logements: logs, taille: t.length }));
  } catch (e) {
    console.log(JSON.stringify({ url, qui, code: 0, logements: [], erreur: e.message }));
  }
}
'@
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js))
$sortie = docker exec lcd-deploy-web-1 sh -c "echo $b64 | base64 -d > /tmp/perim.mjs && node /tmp/perim.mjs" 2>&1
$lignes = @($sortie | Where-Object { $_ -match '^\{"url"' } | ForEach-Object { $_ | ConvertFrom-Json })

Write-Host "== Lecture : chaque role ne doit voir QUE son perimetre =="
foreach ($qui in @("personne_05", "personne_03")) {
    $mes = @($lignes | Where-Object { $_.qui -eq $qui })
    if ($mes.Count -eq 0) { Verif "$qui : reponse mesurable" $false "aucune reponse exploitable"; continue }

    # Seules les reponses SERVIES (200) peuvent fuiter. Un 403 cite le logement
    # refuse dans son message (« hors perimetre : ... n'a pas log3 ») : compter
    # ces mots comme une fuite ferait echouer la batterie sur son propre refus.
    $servies = @($mes | Where-Object { $_.code -eq 200 })
    $vus = @($servies | ForEach-Object { $_.logements } | Sort-Object -Unique)

    # 1. Les logements du perimetre SONT servis (controle positif : sinon, page vide).
    $dedans = @($declare[$qui] | Where-Object { $vus -contains $_ })
    Verif "$qui : ses propres logements sont servis ($($declare[$qui] -join ', '))" ($dedans.Count -gt 0) "aucun des siens dans la reponse"

    # 2. Aucun logement HORS perimetre ne doit apparaitre (le vrai cloisonnement).
    $fuites = @($vus | Where-Object { $declare[$qui] -notcontains $_ })
    Verif "$qui : aucun logement hors perimetre dans les reponses" ($fuites.Count -eq 0) ("fuite : " + ($fuites -join ", "))
}

Write-Host "== Portail proprietaire : un logement hors perimetre ne doit pas etre servi =="
$p = @($lignes | Where-Object { $_.url -match "logement=log3" })[0]
if ($p) {
    Verif "portail-proprio sur log3 (hors perimetre) refuse" ($p.code -eq 403) "HTTP $($p.code) -- la demande est acceptee, le parametre est ignore"
} else { Verif "portail-proprio sur log3 : mesurable" $false "pas de reponse" }

Write-Host "== Ecriture : le 403 hors perimetre existe deja (temoin) =="
$js2 = @'
const r = await fetch("http://gateway-parc:8443/v1/action", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ qui: "personne_05", logement: "log3", action: "statut", params: {} })
});
const t = await r.text();
console.log(JSON.stringify({ code: r.status, corps: t.slice(0, 160) }));
'@
$b64b = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js2))
$s2 = docker exec lcd-deploy-web-1 sh -c "echo $b64b | base64 -d > /tmp/perim2.mjs && node /tmp/perim2.mjs" 2>&1 | Where-Object { $_ -match '^\{"code"' }
if ($s2) {
    $e = $s2 | ConvertFrom-Json
    Verif "ecriture hors perimetre refusee (403 attendu)" ($e.code -eq 403) "HTTP $($e.code)"
} else { Verif "ecriture hors perimetre : mesurable" $false "pas de reponse" }

if ($KO -gt 0) { Write-Host "RESULTAT : $KO ECHEC(S) -- cloisonnement des LECTURES non tenu"; exit 1 }
Write-Host "RESULTAT : perimetres tenus (lecture + ecriture)"
