"""statut_h.py — helper /v1/statut (bascule P1/P2/P3), importe par gateway.

Separe pour ne pas toucher au corps de gateway.py a l'editeur : la route
`/v1/statut` et la methode `statut_hebergement` vivent ici, la gateway
n'ajoute qu'un import + 2 lignes de branchement (revue ci-dessous).
"""
import json
import os
import time

SEUILS = {"vercel_bande_go_mois": 100, "vm_cpu_pct_durable": 70,
          "vm_ram_pct_durable": 70, "nb_logements_p3": 10}


def statut_hebergement(eng):
    """Compteurs de bascule P1/P2/P3. Lecture seule, sans secret ni PII."""
    etat = {"mesure": False,
            "uptime_s": int(time.time() - getattr(eng, "_t0", time.time())),
            "nb_logements": sum(
                len(b.get("logements", [])) for b in eng.boxes),
            "nb_boxes": len(eng.boxes)}
    try:
        with open(os.path.join(eng.state_dir, "parc", "statut.json"),
                  encoding="utf-8") as f:
            mes = json.load(f)
        if isinstance(mes, dict):
            etat.update({k: mes[k] for k in
                         ("vercel_bande_go_mois", "vm_cpu_pct",
                          "vm_ram_pct", "vm_disque_pct") if k in mes})
            etat["mesure"] = True
    except (FileNotFoundError, ValueError, OSError):
        pass
    try:
        etat["base_octets"] = os.path.getsize(
            os.path.join(eng.state_dir, "parc", "parc.db"))
    except OSError:
        etat["base_octets"] = None
    outbox = sum((eng.outbox_len(b.get("box_id")) or 0) for b in eng.boxes)
    phase, motif = "p1", "defaut"
    if etat["nb_logements"] >= SEUILS["nb_logements_p3"]:
        phase, motif = "p3", "nb logements >= seuil"
    elif etat.get("mesure"):
        if etat.get("vercel_bande_go_mois", 0) >= 80:
            phase, motif = "p2", "bande passante Vercel ~80 %"
        if (etat.get("vm_cpu_pct", 0) >= SEUILS["vm_cpu_pct_durable"]
                or etat.get("vm_ram_pct", 0) >= SEUILS["vm_ram_pct_durable"]
                or etat.get("vm_disque_pct", 0) >= 90):
            phase, motif = "p3", "VM saturee (CPU/RAM/disque)"
    return {"phase_conseillee": phase, "motif": motif, "seuils": dict(SEUILS),
            "etat": etat, "outbox_total": outbox, "lecture_seule": True}
