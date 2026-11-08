import { beforeEach, describe, expect, it } from "vitest";
import type {
  AjouterMessageFilInput,
  CreerFilInterneInput,
  FilInterne,
  FilInterneDetail,
  FilsInternesRepository,
  MessageFilInterne,
} from "@/application/ports/fils-internes-repository";
import { GererFilsInternes } from "@/application/use-cases/fils-internes";
import type {
  CanalFilInterne,
  StatutFilInterne,
} from "@/domain/fil-interne";
import type { TenantId } from "@/domain/tenant";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";

class FilsMemoire implements FilsInternesRepository {
  fils: FilInterneDetail[] = [];

  async lister(_tenantId: string, canal?: CanalFilInterne) {
    return this.fils.filter((fil) => !canal || fil.canal === canal);
  }

  async trouver(_tenantId: string, id: string) {
    return this.fils.find((fil) => fil.id === id) ?? null;
  }

  async creer(input: CreerFilInterneInput): Promise<FilInterne> {
    const maintenant = new Date();
    const fil: FilInterneDetail = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      logementId: input.logementId,
      logementNom: null,
      canal: input.canal,
      sujet: input.sujet,
      statut: "ouvert",
      creePar: input.creePar,
      dernierMessageAt: maintenant,
      createdAt: maintenant,
      updatedAt: maintenant,
      messages: [],
    };
    this.fils.push(fil);
    return fil;
  }

  async ajouterMessage(
    input: AjouterMessageFilInput,
  ): Promise<MessageFilInterne | null> {
    const fil = this.fils.find((entree) => entree.id === input.filId);
    if (!fil || fil.statut !== "ouvert") return null;
    const message: MessageFilInterne = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      filId: fil.id,
      auteurEmail: input.auteurEmail,
      auteurRole: input.auteurRole,
      corps: input.corps,
      createdAt: new Date(),
    };
    fil.messages.push(message);
    fil.dernierMessageAt = message.createdAt;
    return message;
  }

  async changerStatut(
    _tenantId: string,
    id: string,
    statut: StatutFilInterne,
  ) {
    const fil = this.fils.find((entree) => entree.id === id);
    if (!fil) return false;
    fil.statut = statut;
    return true;
  }
}

describe("fils internes", () => {
  let repo: FilsMemoire;
  let logements: LogementRepositoryMemoire;
  let gerer: GererFilsInternes;

  beforeEach(() => {
    repo = new FilsMemoire();
    logements = new LogementRepositoryMemoire();
    gerer = new GererFilsInternes(repo, logements);
  });

  async function creerFil() {
    return gerer.creer({
      tenantId: TENANT,
      logementId: null,
      canal: "proprietaire",
      sujet: "  Clé du portail  ",
      auteurEmail: "admin@lcd.test",
    });
  }

  it("crée un fil avec un sujet normalisé", async () => {
    const fil = await creerFil();
    expect(fil.sujet).toBe("Clé du portail");
    expect(fil.canal).toBe("proprietaire");
    expect(repo.fils).toHaveLength(1);
  });

  it("rattache un logement du tenant et refuse un logement étranger", async () => {
    const logement = await logements.creer({
      tenantId: TENANT as TenantId,
      code: "LOG-1",
      nom: "Studio mer",
    });
    const fil = await gerer.creer({
      tenantId: TENANT,
      logementId: logement.id,
      canal: "voyageur",
      sujet: "Arrivée tardive",
      auteurEmail: "admin@lcd.test",
    });
    expect(fil.logementId).toBe(logement.id);

    const autre = await logements.creer({
      tenantId: "22222222-2222-4222-8222-222222222222" as TenantId,
      code: "LOG-2",
      nom: "Maison ailleurs",
    });
    await expect(
      gerer.creer({
        tenantId: TENANT,
        logementId: autre.id,
        canal: "voyageur",
        sujet: "Arrivée tardive",
        auteurEmail: "admin@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FIL_INTERNE_INVALIDE" });
  });

  it("ajoute une réponse et met à jour l’activité", async () => {
    const fil = await creerFil();
    const message = await gerer.repondre({
      tenantId: TENANT,
      filId: fil.id,
      corps: "  Remplacement prévu mardi.  ",
      auteurEmail: "hote@lcd.test",
      auteurRole: "hote",
    });
    expect(message.corps).toBe("Remplacement prévu mardi.");
    expect(repo.fils[0]?.messages).toHaveLength(1);
  });

  it("refuse une réponse dans un fil fermé", async () => {
    const fil = await creerFil();
    await gerer.changerStatut(TENANT, fil.id, "ferme");
    await expect(
      gerer.repondre({
        tenantId: TENANT,
        filId: fil.id,
        corps: "Trop tard",
        auteurEmail: "hote@lcd.test",
        auteurRole: "hote",
      }),
    ).rejects.toMatchObject({ code: "FIL_INTERNE_INVALIDE" });
  });

  it("rejette un canal, un sujet ou un message invalide", async () => {
    await expect(
      gerer.creer({
        tenantId: TENANT,
        logementId: null,
        canal: "inconnu",
        sujet: "Sujet",
        auteurEmail: "admin@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FIL_INTERNE_INVALIDE" });

    await expect(
      gerer.creer({
        tenantId: TENANT,
        logementId: null,
        canal: "voyageur",
        sujet: "  ",
        auteurEmail: "admin@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FIL_INTERNE_INVALIDE" });

    const fil = await creerFil();
    await expect(
      gerer.repondre({
        tenantId: TENANT,
        filId: fil.id,
        corps: "   ",
        auteurEmail: "hote@lcd.test",
        auteurRole: "hote",
      }),
    ).rejects.toMatchObject({ code: "FIL_INTERNE_INVALIDE" });
  });
});
