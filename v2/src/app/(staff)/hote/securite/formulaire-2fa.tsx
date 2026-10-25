"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth-client";

type DonneesActivation = {
  totpURI: string;
  backupCodes: string[];
};

export function Formulaire2FA({ actif }: { actif: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [donnees, setDonnees] = useState<DonneesActivation | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!donnees?.totpURI) return;
    QRCode.toDataURL(donnees.totpURI, { margin: 1, width: 240 })
      .then(setQr)
      .catch(() => setErreur("Impossible de générer le QR code."));
  }, [donnees]);

  async function activer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);

    const { data, error } = await authClient.twoFactor.enable({ password });

    if (error) {
      setErreur(error.message ?? "Activation impossible.");
      setEnCours(false);
      return;
    }

    setDonnees(data as DonneesActivation);
    setPassword("");
    setEnCours(false);
  }

  async function verifier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);

    const { error } = await authClient.twoFactor.verifyTotp({ code });

    if (error) {
      setErreur(error.message ?? "Code refusé.");
      setEnCours(false);
      return;
    }

    setMessage("2FA activée. Conservez vos codes de secours.");
    setDonnees(null);
    setQr(null);
    setCode("");
    setEnCours(false);
    router.refresh();
  }

  async function desactiver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);

    const { error } = await authClient.twoFactor.disable({ password });

    if (error) {
      setErreur(error.message ?? "Désactivation impossible.");
      setEnCours(false);
      return;
    }

    setMessage("2FA désactivée.");
    setPassword("");
    setEnCours(false);
    router.refresh();
  }

  if (actif) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          2FA active sur ce compte.
        </p>

        <form className="space-y-3" onSubmit={desactiver}>
          <label className="block space-y-1 text-sm font-medium">
            <span>Mot de passe pour désactiver</span>
            <input
              className="w-full rounded-xl border border-bordure p-3 text-base"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {erreur ? (
            <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
              {erreur}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
              {message}
            </p>
          ) : null}
          <button
            className="rounded-full border border-danger px-5 py-3 text-sm font-medium text-danger disabled:opacity-50"
            type="submit"
            disabled={enCours}
          >
            Désactiver la 2FA
          </button>
        </form>
      </div>
    );
  }

  if (donnees) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-encre-douce">
          Scannez ce QR code avec votre application d’authentification
          (Google Authenticator, 1Password, Aegis…), puis saisissez le code
          à 6 chiffres.
        </p>

        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="QR code TOTP"
            className="rounded-xl border border-bordure bg-surface p-3"
            height={240}
            src={qr}
            width={240}
          />
        ) : null}

        <details className="text-sm text-encre-douce">
          <summary className="cursor-pointer font-medium">
            Saisie manuelle
          </summary>
          <code className="mt-2 block break-all rounded-xl bg-surface-2 p-3 text-xs">
            {donnees.totpURI}
          </code>
        </details>

        <div className="rounded-xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          <p className="font-medium">Codes de secours (à conserver hors ligne)</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
            {donnees.backupCodes.map((backupCode) => (
              <li key={backupCode}>{backupCode}</li>
            ))}
          </ul>
        </div>

        <form className="space-y-3" onSubmit={verifier}>
          <label className="block space-y-1 text-sm font-medium">
            <span>Code TOTP</span>
            <input
              className="w-full rounded-xl border border-bordure p-3 text-center font-mono text-2xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </label>
          {erreur ? (
            <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
              {erreur}
            </p>
          ) : null}
          <button
            className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
            type="submit"
            disabled={enCours || code.length !== 6}
          >
            {enCours ? "Vérification…" : "Vérifier et activer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={activer}>
      <p className="text-sm text-encre-douce">
        Ajoutez une deuxième étape à la connexion. Vous aurez besoin de votre
        mot de passe et d’une application d’authentification.
      </p>
      <label className="block space-y-1 text-sm font-medium">
        <span>Mot de passe actuel</span>
        <input
          className="w-full rounded-xl border border-bordure p-3 text-base"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {erreur ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
          {erreur}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
          {message}
        </p>
      ) : null}
      <button
        className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond disabled:opacity-50"
        type="submit"
        disabled={enCours}
      >
        {enCours ? "Préparation…" : "Activer la 2FA"}
      </button>
    </form>
  );
}
