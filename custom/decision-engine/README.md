# custom/decision-engine/README.md — orchestrateur maison pyscript/AppDaemon (Phase 2, §5.11 P2-8).
# 100 % gratuit, 0 € logiciel. Lit `custom/logements.yaml` (flags) + `custom/acces.yaml` (RBAC).
# Règles prioritaires : sécurité > occupation > énergie > confort > prix.
# Log JSONL : `/config/logs/decision.logX.jsonl` (qui/quand/quoi + llm/jev backend, 90 j accès).
# Bornes prix 75/290 inviolables en code. LLM/Jev consultatifs seuls, jamais d'action directe.
#
# ## Events émis (contrats stables — déclencheurs blueprints P1-8)
# - `lcd_j2_envoi_acces {logement_id, pin, slot_nom, arrivee, depart, message}`
#   (J-2 ; log2 smart_lock off → pin vide + message boîte à clés).
# - `lcd_j1_rappel {logement_id, message}` (J-1 15h).
# - `lcd_checkout {logement_id, pin, deadline_menage, message}` (checkout ; révocation + todo).
# - Messages composés ici (langue voyageur socle + auto §5.7-ter), jamais par les blueprints.
#
# ## Règles
# - Ne génère JAMAIS de PIN (KeyMaster + Nuki Hub seuls, §1.6) ; ne fait JAMAIS de tool-calling
#   serrure/vanne/portail direct — passe par blueprints + vérif état.
# - `copro.verifiee: false` → mise en ligne BLOQUÉE + `sensor.logX_config_ok` rouge.
# - RBAC double filtre : `acces.yaml` + `visibility:` dashboards ; journal tagué rôle+marque.
# - Hors bornes prix / hors scope RBAC (`hors_bornes>0,5`) → blocage + log, jamais d'auto.
# - Secrets (tokens webhook) dans `secrets.yaml`, jamais ici.
#
# ## Schéma decision.logX.jsonl (P1-10/P2-8/P7-7 — runtime `/config/logs/`, gitignoré, 90 j accès)
# {"ts": "...", "logement_id": "log1", "ref": "...", "qui": "decision-engine|humain:<role>", "quoi": "prix|acces|ics|energie|securite|llm|jev|menage|compta", "canal": "direct|airbnb|booking|abritel|expedia", "commission": 0.0, "net_hote": 0.0, "llm": {"alias": "...", "fournisseur": "...", "modele": "...", "tokens": 0, "latence_ms": 0}, "jev": {"backend": "...", "confidence": 0.0, "noul": 0.0}, "motif": "..."}
