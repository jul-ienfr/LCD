import { APP_VERSION } from "@/lib/version";

export const GET = () =>
  new Response(
    JSON.stringify({ ok: true, stack: "sveltekit-3", version: APP_VERSION }),
    {
      headers: { "content-type": "application/json" },
    },
  );
