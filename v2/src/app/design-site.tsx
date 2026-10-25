import { connection } from "next/server";
import { LireDesignSite } from "@/application/use-cases/design-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { styleDesign } from "@/lib/themes";

export async function DesignSite() {
  await connection();
  const design = await new LireDesignSite(
    new DrizzleParametresSiteRepository(),
  ).executer();
  return (
    <style
      id="design-site"
      dangerouslySetInnerHTML={{ __html: styleDesign(design) }}
    />
  );
}
