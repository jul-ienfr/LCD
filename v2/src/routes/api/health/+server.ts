import { versionDeployee } from "@/lib/server/version-deployee";

export const GET = () =>
  new Response(
    JSON.stringify({ ok: true, stack: "sveltekit-3", version: versionDeployee() }),
    {
      headers: { "content-type": "application/json" },
    },
  );
