import { redirect } from "@sveltejs/kit";
import { resoudreLangue } from "@/lib/i18n-staff";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url, cookies }) => {
  const langue = resoudreLangue(url.searchParams.get("lang"));
  cookies.set("lcd_langue", langue, {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    secure: url.protocol === "https:",
  });
  const retour = url.searchParams.get("retour") ?? "/hote";
  redirect(303, retour.startsWith("/") && !retour.startsWith("//") ? retour : "/hote");
};
