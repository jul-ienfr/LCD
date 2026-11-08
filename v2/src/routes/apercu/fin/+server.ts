import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { effacerCookieApercuApparence } from "@/lib/server/apercu-apparence";

export const POST: RequestHandler = (event) => {
  effacerCookieApercuApparence(event);
  redirect(303, "/");
};
