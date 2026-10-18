#!/usr/bin/env python3
# custom/runtime-box/runtime.py — adaptateur runtime box v0 (stdlib seule).
# ADR-007 / REQ-S-006 : runtime box pluggable (HA :8123 par défaut, Moli
# :8790 option). Idée centrale (§20.4) : les moteurs ne parlent
# JAMAIS à HA ni à Moli en direct — ils appellent CE contrat, l'adaptateur
# traduit vers le runtime de la box (clé `logements.yaml runtime: ha|moli`).
#
# Contrat v0 (les 4 fonctions du §20.4/ADR-007, même forme pour les 2
# backends, 0 lib externe :
#   health()                     -> {backend, ok, version|}
#   etat(objet_logique)          -> {backend, point, value, ts}|refus dict
#   commande(objet, value, actor)-> {backend, point, status}|refus dict
#   journal(limit)               -> [{ts, point, action, value, decision|}]
#
# objet_logique = id STABLE `logX_objet_fonction` (regle §T1/§20.4) :
# il est traduit par une mapping versionnée (runtime-config JSON, 0 secret)
# vers le point natif du runtime (`sensor.…` HA / `hue:…/on` Moli).
# Un objet absent du mapping = refus LOCAL, sans requête réseau (jamais
# d'ID runtime en dur dans un moteur).
#
# Secrets : JAMAIS dans ce fichier ni dans la mapping. HA = provider de
# jeton (lab : JWT forgé jetable, box réelle : Bearer vault). Moli = session
# PIN ouverte à l'appel (le code n'apparaît jamais en clair ; le lab passe
# un PIN FAUX par env). Feu : le coffre reste côté runtime.
#
# Usage CLI (v0 diagnostic, sans serveur) :
#   python3 runtime.py --config runtime-config.example.json --backend moli --pin 246810 health
#   python3 runtime.py --config runtime-config.example.json --backend ha etat log1_prix_nuit
# (L'assemblage à la passerelle/moteurs reste P2+ : plan-only, batterie lab
#  `lab/tests_runtime.py` pour la preuve du contrat sur les 2 backends.)
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


# ---------------------------------------------------------------- helpers —

class Session:
    """Micro-client HTTP stdlib avec cookies (session humaine Moli)."""

    def __init__(self, base: str, extra_headers: dict | None = None):
        self.base = base.rstrip("/")
        self.extra = dict(extra_headers or {})
        self.jar = {}

    def req(self, method: str, path: str, body=None, headers=None,
            cookies: bool = True, timeout: int = 15):
        data = None
        entetes = dict(self.extra)
        if headers:
            entetes.update(headers)
        if body is not None:
            data = json.dumps(body).encode()
            entetes.setdefault("content-type", "application/json")
        if cookies and self.jar:
            pair = "; ".join(f"{k}={v}" for k, v in self.jar.items())
            entetes.setdefault("Cookie", pair)
        requ = urllib.request.Request(self.base + path, data=data,
                                      headers=entetes, method=method)
        try:
            with urllib.request.urlopen(requ, timeout=timeout) as r:
                for champ in r.headers.get_all("Set-Cookie") or []:
                    nom, _, reste = champ.partition("=")
                    val = reste.split(";", 1)[0]
                    if val:
                        self.jar[nom.strip()] = val
                brut = r.read().decode("utf-8", "replace")
                te = r.headers.get("Content-Type", "")
                try:
                    return r.status, json.loads(brut) if "json" in te else brut
                except ValueError:
                    return r.status, brut
        except urllib.error.HTTPError as e:
            brut = e.read().decode("utf-8", "replace")
            try:
                return e.code, json.loads(brut)
            except ValueError:
                return e.code, brut
        except Exception as e:
            return 0, str(e)


def refus(backend: str, erreur: str) -> dict:
    """Refus local uniforme : AUCUNE requête réseau ne part ."""
    return {"backend": backend, "status": "refuse", "erreur": erreur,
            "point": None, "value": None}


def maintenant_ms() -> int:
    return int(time.time() * 1000)


# ------------------------------------------------------------- backends ——

class MoliBackend:
    """Runtime Moli OS (REST /api/*). L'agent passe par /mcp côté SaaS
    applicatif ; ici le contrat moteur = REST (journalisé origin=api)."""

    kind = "moli"

    def __init__(self, base: str, pin: str | None = None):
        self.base = base.rstrip("/")
        self.pin = pin
        self.http = Session(self.base)

    def health(self) -> dict:
        c, r = self.http.req("GET", "/api/health")
        return {"backend": self.kind, "ok": c == 200
                and isinstance(r, dict) and r.get("name") == "moli-os",
                "version": (r or {}).get("version") if isinstance(r, dict)
                else None}

    def _snapshot(self) -> dict:
        c, s = self.http.req("GET", "/api/devices")
        return s if c == 200 and isinstance(s, dict) else {}

    def etat(self, point: str) -> dict:
        devid, cle = point.split("/", 1)
        for d in self._snapshot().get("devices", []):
            if d.get("id") == devid:
                ech = (d.get("state") or {}).get(cle) or {}
                val = ech.get("value")
                ts = ech.get("ts")
                if ts is None:
                    ts = maintenant_ms()  # cache d'age : demo dev sans ts
                return {"backend": self.kind, "point": point, "value": val,
                        "ts": ts}
        return {"backend": self.kind, "point": point, "value": None,
                "ts": None, "inconnu": True}

    def commande(self, point: str, value, actor: str) -> dict:
        c, r = self.http.req("POST", "/api/command",
                             {"point": point, "value": value,
                              "actor": actor})
        if c == 200 and isinstance(r, dict) and r.get("ok") is True:
            return {"backend": self.kind, "point": point, "value": value,
                    "status": "ok", "actor": actor}
        if c == 202 and isinstance(r, dict) and r.get("pending"):
            return {"backend": self.kind, "point": point, "value": value,
                    "status": "retenu", "pending": r["pending"],
                    "raison": r.get("reason"), "actor": actor}
        return {"backend": self.kind, "point": point, "value": value,
                "status": "refuse", "code": c,
                "erreur": (r or {}).get("error") if isinstance(r, dict)
                else r, "actor": actor}

    def journal(self, limit: int = 25) -> list:
        c, j = self.http.req("GET", f"/api/journal?limit={limit}")
        out = []
        for e in j if isinstance(j, list) else []:
            a = e.get("action") or {}
            out.append({
                "ts": e.get("ts"), "origin": e.get("origin"),
                "actor": e.get("actor") or "", "kind": a.get("kind"),
                "point": a.get("point"), "value": a.get("value"),
                "decision": a.get("decision"),
            })
        # normalisation : decision a aussi son écho dans outcome (2 faces)
        for ligne, e in zip(out, j):
            if ligne["decision"] is None:
                outcome = e.get("outcome") or {}
                if outcome.get("result") == "pending":
                    ligne["decision"] = "pending"
        return out

    def ouvrir_session(self, pin: str | None = None) -> dict:
        c, r = self.http.req("POST", "/api/session", {"pin": pin or self.pin})
        return {"ok": c == 200, "reponse": r}


class HaBackend:
    """Runtime Home Assistant (REST /api/*). Lab : jeton = JWT forgé
    (clé/refresh id du bootstrap) ; box réelle : Bearer long-lived (vault).
    Écriture v0 = POST /api/states (même canal que les moteurs §40),
    journal lu via /api/logbook (trace état native HA)."""

    kind = "ha"

    def __init__(self, base: str, token_provider=None):
        self.base = base.rstrip("/")
        self._jeton = token_provider or (lambda: os.environ.get("HA_TOKEN"))

    def _auth(self):
        tok = self._jeton() or ""
        return {"Authorization": f"Bearer {tok}"} if tok else {}

    def health(self) -> dict:
        c, r = Session(self.base, self._auth()).req("GET", "/api/config")
        return {"backend": self.kind, "ok": c == 200
                and isinstance(r, dict) and bool(r.get("location_name")),
                "version": (r or {}).get("version") if isinstance(r, dict)
                else None}

    def etat(self, entite: str) -> dict:
        c, s = Session(self.base, self._auth()).req(
            "GET", f"/api/states/{urllib.parse.quote(entite)}")
        if c == 200 and isinstance(s, dict):
            try:
                ts = int(datetime.fromisoformat(
                    s.get("last_updated", "")).timestamp() * 1000)
            except Exception:
                ts = None
            return {"backend": self.kind, "point": entite,
                    "value": s.get("state"), "ts": ts}
        return {"backend": self.kind, "point": entite, "value": None,
                "ts": None, "inconnu": c in (404,)}

    def commande(self, entite: str, value, actor: str) -> dict:
        c, s = Session(self.base, self._auth()).req(
            "POST", f"/api/states/{urllib.parse.quote(entite)}",
            {"state": value, "attributes": {"source": "lcd-runtime-box",
                                            "que": actor}})
        if c in (200, 201) and isinstance(s, dict) and \
                str(s.get("state")) == str(value):
            return {"backend": self.kind, "point": entite, "value": value,
                    "status": "ok", "actor": actor}
        return {"backend": self.kind, "point": entite, "value": value,
                "status": "refuse", "code": c,
                "erreur": s if not isinstance(s, dict) else {}, "actor": actor}

    def journal(self, entite: str, limit: int = 25) -> list:
        """Journal HA : /api/logbook?entity=<id> (la forme /path exige un
        datetime de début, refusée s'il est absent — 'Invalid datetime')."""
        c, j = Session(self.base, self._auth()).req(
            "GET", f"/api/logbook?limit={limit}"
            f"&entity={urllib.parse.quote(entite)}")
        out = []
        for e in j if isinstance(j, list) else []:
            try:
                ts = int(datetime.fromisoformat(
                    e.get("when", "")).timestamp() * 1000)
            except Exception:
                ts = None
            out.append({"ts": ts, "origin": "ha_logbook",
                        "actor": (e.get("context_user_id") or ""),
                        "kind": "state", "point": e.get("entity_id"),
                        "value": e.get("state"), "decision": None})
        return out


# ------------------------------------------------------------ adaptateur —

class RuntimeAdapter:
    """La porte que toute écriture moteur doit franchir : mapping
    objet_logique -> point runtime, refus local hors mapping, 0 lib."""

    def __init__(self, backend, mapping: dict, backend_name: str):
        self.backend = backend
        self.points = mapping     # {objet_logique: point_natif}
        self.name = backend_name

    @staticmethod
    def factory(backend_name: str, cfg: dict, pins: dict | None = None):
        """Config JSON : runtimes.{backend}.base + .mapping ({objet: point})."""
        spec = cfg["runtimes"][backend_name]
        if backend_name == "moli":
            b = MoliBackend(spec["base"], pin=(pins or {}).get("moli")
                            or os.environ.get("LCD_MOLI_PIN"))
            ad = RuntimeAdapter(b, spec.get("mapping", {}), "moli")
        else:
            b = HaBackend(spec["base"],
                          token_provider=spec.get("token", "lab"))
            if spec.get("token") == "lab":          # forgé : valeur FAUSSE
                b._jeton = _jeton_lab
            ad = RuntimeAdapter(b, spec.get("mapping", {}), "ha")
        return ad

    # contract ----
    def health(self) -> dict:
        return self.backend.health()

    def etat(self, objet: str) -> dict:
        pt = self.points.get(objet)
        if not pt:
            return refus(self.name, f"{objet}: hors mapping runtime-box")
        return self.backend.etat(pt)

    def commande(self, objet: str, value, actor: str) -> dict:
        pt = self.points.get(objet)
        if not pt:
            return refus(self.name, f"{objet}: hors mapping runtime-box")
        return self.backend.commande(pt, value, actor)

    def journal(self, objet: str | None = None, limit: int = 25) -> list:
        if self.name == "ha":
            pts = [self.points[objet]] if objet and objet in self.points \
                else []
            return self.backend.journal(pts[0], limit) if pts else []
        j = self.backend.journal(limit)
        return [e for e in j if e.get("point") in self.points.values()]


# ------------------------------------------------- jeton lab (forge JWT) ——

HA_REFRESH_ID = "6c6162326f782d7669727475616c2d02"
HA_JWT_KEY = "6c61622d7669727475616c2d6a77742d6c61622d30312d6c61622d3032"


def _b64url(o) -> str:
    return base64.urlsafe_b64encode(
        json.dumps(o).encode()).rstrip(b"=").decode()


def _jeton_lab(duree_s: int = 900) -> str:
    now = int(time.time())
    head = _b64url({"alg": "HS256", "typ": "JWT"})
    pay = _b64url({"iss": HA_REFRESH_ID, "iat": now, "exp": now + duree_s})
    sig = base64.urlsafe_b64encode(
        hmac.new(HA_JWT_KEY.encode(), f"{head}.{pay}".encode(),
                 hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{head}.{pay}.{sig}"


# ------------------------------------------------------------------- CLI —

if __name__ == "__main__":  # usage diagnostic v0 : --health / --etat / try
    import argparse
    p = argparse.ArgumentParser(description="adaptateur runtime-box v0")
    p.add_argument("--config", required=True)
    p.add_argument("--backend", choices=["ha", "moli"], required=True)
    p.add_argument("--pin", default=None, help="PIN lab (jamais en prod)")
    p.add_argument(
        "action", nargs="?", default="health",
        help="health | etat <objet> | commande <objet> <value> <actor>")
    a = p.parse_args()
    cfg = json.loads(open(a.config, encoding="utf-8").read())
    ad = RuntimeAdapter.factory(
        a.backend, cfg, pins={"moli": a.pin} if a.pin else None)
    act = a.action.split() if " " in a.action else [a.action]
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if act[0] == "health":
        print(json.dumps(ad.health(), ensure_ascii=False))
    elif act[0] == "etat" and len(act) >= 2:
        print(json.dumps(ad.etat(act[1]), ensure_ascii=False))
    elif act[0] == "commande" and len(act) >= 4:
        print(json.dumps(ad.commande(act[1], act[2], act[3]),
                         ensure_ascii=False))
    else:
        p.error("action: health | etat <objet> | commande <obj> <value> <actor>")
