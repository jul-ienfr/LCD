export interface ResultatDeclenchementSync {
  total: number;
  erreurs: number;
}

export type ExecuteurSync = (cible: {
  tenantId: string;
  logementId: string;
}) => Promise<ResultatDeclenchementSync>;

export class PlanificateurSync {
  private readonly planifications = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private readonly executer: ExecuteurSync,
    private readonly delaiParDefaut = 1_500,
  ) {}

  planifier(
    tenantId: string,
    logementId: string,
    delaiMs = this.delaiParDefaut,
  ): void {
    const cle = `${tenantId}:${logementId}`;
    const existante = this.planifications.get(cle);
    if (existante) clearTimeout(existante);
    const timer = setTimeout(
      () => {
        this.planifications.delete(cle);
        void this.executer({ tenantId, logementId });
      },
      Math.max(0, delaiMs),
    );
    timer.unref?.();
    this.planifications.set(cle, timer);
  }

  annulerTout(): void {
    for (const timer of this.planifications.values()) clearTimeout(timer);
    this.planifications.clear();
  }
}
