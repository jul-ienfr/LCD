(function () {
  var CLE = "lcd-outbox-incidents";
  var form = document.querySelector('form[action="?/incident"]');
  if (!form) return;

  function lire() {
    try {
      return JSON.parse(localStorage.getItem(CLE) || "[]");
    } catch {
      return [];
    }
  }

  function ecrire(entrees) {
    localStorage.setItem(CLE, JSON.stringify(entrees));
  }

  function zone() {
    var existante = document.getElementById("outbox-etat");
    if (existante) return existante;
    var p = document.createElement("p");
    p.id = "outbox-etat";
    p.className = "ui-alerte ui-alerte--alerte";
    p.setAttribute("role", "status");
    form.parentNode.insertBefore(p, form);
    return p;
  }

  function afficher(texte, succes) {
    var p = zone();
    p.textContent = texte;
    p.className = succes
      ? "ui-alerte ui-alerte--succes"
      : "ui-alerte ui-alerte--alerte";
  }

  function envoyer(entree) {
    return fetch("/api/voyageur/incident", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: entree.token,
        ref: entree.ref,
        message: entree.message,
      }),
    });
  }

  async function rejouer() {
    var entrees = lire();
    if (!entrees.length) return;
    var restants = [];
    var envoyes = 0;
    for (var i = 0; i < entrees.length; i += 1) {
      try {
        var reponse = await envoyer(entrees[i]);
        if (reponse.ok) {
          envoyes += 1;
        } else if (reponse.status >= 500) {
          restants.push(entrees[i]);
        }
      } catch {
        restants.push(entrees[i]);
      }
    }
    ecrire(restants);
    if (envoyes > 0) {
      afficher("Signalement envoyé. L’hôte en est informé.", true);
      form.querySelector('textarea[name="message"]').value = "";
    }
  }

  form.addEventListener("submit", function (event) {
    if (navigator.onLine) return;
    event.preventDefault();
    var donnees = new FormData(form);
    var entree = {
      token: String(donnees.get("token") || ""),
      ref: String(donnees.get("ref") || ""),
      message: String(donnees.get("message") || ""),
      createdAt: new Date().toISOString(),
    };
    if (!entree.message.trim()) return;
    var entrees = lire();
    entrees.push(entree);
    ecrire(entrees);
    afficher(
      "Hors ligne : signalement mis en attente. Il sera envoyé au retour du réseau.",
      false,
    );
  });

  window.addEventListener("online", rejouer);
  rejouer();
})();
