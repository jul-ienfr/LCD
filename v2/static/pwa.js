// Îlot PWA optionnel (T610) : installation et notifications.
// Chargé uniquement sur /hote/installation, jamais sur les routes voyageur.
(() => {
  const installer = document.querySelector("[data-pwa-installer]");
  const notifications = document.querySelector("[data-pwa-notifications]");
  const statut = document.querySelector("[data-pwa-statut]");
  const dire = (texte) => {
    if (statut) statut.textContent = texte;
  };

  const autonome =
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.navigator.standalone === true;
  if (autonome) dire("Application installée.");

  let invite = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    invite = event;
    if (installer) installer.hidden = false;
  });

  installer?.addEventListener("click", async () => {
    if (!invite) return;
    invite.prompt();
    await invite.userChoice;
    invite = null;
    installer.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    dire("Application installée.");
    if (installer) installer.hidden = true;
  });

  if (!("Notification" in window)) {
    if (notifications) notifications.disabled = true;
    dire("Les notifications ne sont pas prises en charge par ce navigateur.");
    return;
  }
  if (Notification.permission === "granted") dire("Notifications activées.");

  notifications?.addEventListener("click", async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      dire("Notifications activées.");
      const registration = await navigator.serviceWorker?.ready;
      await registration?.showNotification("LCD Parc", {
        body: "Les notifications sont activées sur cet appareil.",
        icon: "/icons/icon-192.png",
      });
      return;
    }
    dire(
      permission === "denied"
        ? "Notifications refusées dans le navigateur."
        : "Notifications non activées.",
    );
  });
})();
