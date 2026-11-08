import type {
  CreerPromotionData,
  PromotionsRepository,
} from "@/application/ports/promotions-repository";
import { normaliserCodePromo, type Promotion } from "@/domain/promotion";

export class PromotionsRepositoryMemoire implements PromotionsRepository {
  readonly rows: Promotion[] = [];

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Promotion | null> {
    const normalise = normaliserCodePromo(code);
    return this.rows.find((p) => p.code === normalise) ?? null;
  }

  async listerActives(_tenantId: string, date: string): Promise<Promotion[]> {
    return this.rows.filter((p) => {
      if (!p.actif) return false;
      if (p.debutAt && date < p.debutAt.toISOString().slice(0, 10)) return false;
      if (p.finAt && date > p.finAt.toISOString().slice(0, 10)) return false;
      return true;
    });
  }

  async listerParTenant(_tenantId: string): Promise<Promotion[]> {
    return [...this.rows];
  }

  async basculerActif(
    _tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Promotion | null> {
    const promotion = this.rows.find((p) => p.id === id);
    if (!promotion) return null;
    promotion.actif = actif;
    return promotion;
  }

  async creer(data: CreerPromotionData): Promise<Promotion> {
    const promotion: Promotion = {
      id: crypto.randomUUID(),
      code: normaliserCodePromo(data.code),
      type: data.type,
      valeur: data.valeur,
      conditions: data.conditions ?? {},
      actif: data.actif ?? true,
      debutAt: data.debutAt ?? null,
      finAt: data.finAt ?? null,
    };
    this.rows.push(promotion);
    return promotion;
  }
}
