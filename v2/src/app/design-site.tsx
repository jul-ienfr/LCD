import { connection } from "next/server";
import { LireDesignSite } from "@/application/use-cases/design-site";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { styleIdentite } from "@/domain/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { styleDesign } from "@/lib/themes";

export async function DesignSite() {
  await connection();
  const repo = new DrizzleParametresSiteRepository();
  const [design, identite] = await Promise.all([
    new LireDesignSite(repo).executer(),
    new LireIdentiteSite(repo).executer(),
  ]);
  return (
    <>
      <style
        id="design-site"
        dangerouslySetInnerHTML={{ __html: styleDesign(design) }}
      />
      {identite.accent ? (
        <style
          id="identite-site"
          dangerouslySetInnerHTML={{ __html: styleIdentite(identite.accent) }}
        />
      ) : null}
    </>
  );
}
