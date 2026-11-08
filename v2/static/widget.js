(function () {
  var script = document.currentScript;
  if (!script) return;
  var tenant = script.getAttribute("data-tenant");
  if (!tenant) {
    console.error("[LCD widget] data-tenant est obligatoire.");
    return;
  }
  var base = new URL(script.src).origin;
  var params = "tenant=" + encodeURIComponent(tenant) + "&widget=1";
  var transmis = ["utm_source", "utm_medium", "utm_campaign", "code"];
  var recherche = new URLSearchParams(window.location.search);
  for (var i = 0; i < transmis.length; i++) {
    var valeur = recherche.get(transmis[i]);
    if (valeur) params += "&" + transmis[i] + "=" + encodeURIComponent(valeur);
  }
  var iframe = document.createElement("iframe");
  iframe.src = base + "/api/widget?" + params;
  iframe.title = script.getAttribute("data-titre") || "Réserver un séjour";
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.maxWidth = "720px";
  iframe.style.height = script.getAttribute("data-hauteur") || "720px";
  iframe.style.border = "0";
  iframe.style.display = "block";
  iframe.style.margin = "0 auto";
  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
