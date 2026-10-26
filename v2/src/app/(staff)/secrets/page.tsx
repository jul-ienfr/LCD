import { connection } from "next/server";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import {
  compteParEtat,
  etatSecrets,
  type EtatSecret,
} from "@/domain/etats-secrets";
import { env } from "@/lib/env";
import { requireSuperAdmin } from "@/lib/session";

export const instant = false;

const STYLE: Record<EtatSecret, string> = {
  configure: "bg-accent-douce text-accent",
  absent: "bg-fond text-encre-faine",
  defaut_local: "bg-alerte-douce text-alerte",
  alerte: "bg-danger-douce text-danger",
};

const LIBELLE: Record<EtatSecret, string> = {
  configure: "configuré",
  absent: "absent",
  defaut_local: "défaut local",
  alerte: "alerte",
};

export default async function PageSecrets() {
  await connection();
  await requireSuperAdmin();
  const items = etatSecrets({
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    auth2faRequis: env.AUTH_2FA_REQUIRED,
    migrationUrlConfiguree: Boolean(env.MIGRATION_DATABASE_URL),
    smtpUrl: env.SMTP_URL,
    emailActive: env.EMAIL_ENABLED,
    smsActive: env.SMS_ENABLED,
    brevoKeyConfiguree: Boolean(env.BREVO_API_KEY),
    stripeCleConfiguree: Boolean(env.STRIPE_SECRET_KEY),
    stripeWebhookConfigure: Boolean(env.STRIPE_WEBHOOK_SECRET),
    llmUrlConfiguree: Boolean(env.LLM_API_URL),
    llmCleConfiguree: Boolean(env.LLM_API_KEY),
    s3Endpoint: env.S3_ENDPOINT,
    s3CleConfiguree: Boolean(env.S3_ACCESS_KEY_ID),
    cronSecretConfigure: Boolean(env.CRON_SECRET),
    relanceAutoActivee: env.RELANCE_AUTO_ENABLED,
    sentryDsnConfigure: Boolean(env.SENTRY_DSN),
    boxRuntimeConfigure: Boolean(env.BOX_RUNTIME_CONFIG),
    superAdminEmails: env.SUPER_ADMIN_EMAILS,
  });
  const compte = compteParEtat(items);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <NavSuperAdmin actif="/secrets" />

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Plateforme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Secrets et connecteurs
        </h1>
        <p className="text-encre-douce">
          État de configuration uniquement : aucune valeur de secret n’est lue
          par la page ni rendue au navigateur.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(compte) as EtatSecret[]).map((etat) => (
          <span
            className={`rounded-full px-3 py-1 font-medium ${STYLE[etat]}`}
            key={etat}
          >
            {LIBELLE[etat]} : {compte[etat]}
          </span>
        ))}
      </div>

      {env.NODE_ENV === "production" && compte.alerte > 0 ? (
        <p className="rounded-2xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          {compte.alerte} alerte(s) en production : corriger les variables
          d’environnement avant d’ouvrir l’accès public.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
            <tr>
              <th className="p-4">Variable</th>
              <th className="p-4">État</th>
              <th className="p-4">Constat</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-bordure last:border-0" key={item.cle}>
                <td className="p-4 font-mono text-xs">{item.cle}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STYLE[item.etat]}`}
                  >
                    {LIBELLE[item.etat]}
                  </span>
                </td>
                <td className="p-4 text-encre-douce">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-bordure bg-surface p-6 text-sm text-encre-douce">
        <h2 className="text-lg font-semibold text-encre">Rotation</h2>
        <p className="mt-2">
          Les secrets se modifient dans l’environnement d’hébergement, jamais
          dans l’interface. Après rotation : redémarrer l’application,
          vérifier <code>/api/ready</code> puis se reconnecter. Les sessions
          Better Auth peuvent être révoquées depuis{" "}
          <a className="underline" href="/hote/securite">
            Sécurité
          </a>
          .
        </p>
        <p className="mt-2">
          <code>MIGRATION_DATABASE_URL</code> donne un accès owner : le
          restreindre au runtime de supervision et aux migrations, jamais au
          navigateur.
        </p>
      </section>
    </main>
  );
}
