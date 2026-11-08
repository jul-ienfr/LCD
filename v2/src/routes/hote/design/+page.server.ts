import { isRedirect, redirect } from "@sveltejs/kit";
import { requireSuperAdmin } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
  requireSuperAdmin(event);
  redirect(303, "/supervision/apparence");
};
