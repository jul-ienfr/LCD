# Registre — À trancher (seule liste vivante, v2 plan-only)

> R5 : seul TODO vivant. Les annexes *-A/*-B des v4 sont gelées, non reprises.
> Chaque ligne = 1 décision, 1 owner, 1 échéance, 1 batterie bloquante si code.

| # | Question | Options | Owner | Échéance | Statut |
|---|---|---|---|---|---|
| T-01 | Moteur direct Phase 1 : QloApps (cf. benchmark OSS) vs maison minimale | QloApps OSL-3.0 adapté / maison `booking:8095` seul | super_admin | avant P2-12 | ouvert |
| T-02 | Serrure log1 : Nuki + Keypad (officiel HA) vs Z-Wave + KeyMaster (HACS) | Nuki Web/MQTT/Bridge vs Z-Wave Yale/Schlage | super_admin | avant achat box-log1 | ouvert — voir `docs/decision-serrure-acces.md` + benchmark KeyMaster |
| T-03 | Channel Manager 2-way maison : non (v1 ICS seul) vs Vik Channel Manager commercial | ICS pull 15min seul / Vik €149+ plus tard | super_admin | P10 | ouvert — Won't v1 confirmé en 00 §00.6 |
| T-04 | Compta : ERPNext + Frappe Hospitality vs Odoo Rental/Hotel vs `compta:8100` maison | ERPNext / Odoo / maison + export Chorus/PDP | comptable + expert-comptable | avant 1er mandat tiers | ouvert |
| T-05 | Copro log1/log2 `verifiee:false` → accord écrit syndic + Cerfa + DPE | bloque mise en ligne (REQ-L-001) | super_admin | avant go-live | ouvert |
| T-06 | Carte G Hoguet + GALIAN/SOCAF + RCP si mandat tiers payant | 2-3 mois bloquant P10-8 | juriste | avant 1er client | ouvert |
| T-07 | Hébergement P1→P2→P3 : seuils uniques confirmés (BW 80Go / build 100h / p95 >800ms 7j ; puis CPU/RAM >70% 14j ou >15 logements ou outbox >200) | seuils §S4 | super_admin | revue mensuelle | ouvert |
| T-08 | Voix : `ollama-local/qwen2.5-7b` vs `gateway-4000/lcd-chat-fast` en primary par usage | voir `llm.yaml` 9 usages | super_admin | G2 | ouvert |
