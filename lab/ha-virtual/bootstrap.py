#!/usr/bin/env python3
# lab/ha-virtual/bootstrap.py — provisionne la box HA virtuelle (lab Docker).
# Stdlib seule. Idempotent : ne fait rien si l'utilisateur lab existe déjà.
# Écrit .storage/auth (admin `lab` + refresh token longue durée CONNU, valeurs
# FICTIVES de lab — même catégorie que branding.lab.yaml, jamais de prod) +
# .storage/onboarding (étape `user` faite, pas d'UI first-boot en lab).
# La batterie forge ensuite des JWT d'accès (HS256, iss = refresh id) — voir
# tests_lab.py `ha_token()`. Exécuté par le service `ha-bootstrap` (one-shot)
# avant le démarrage de `homeassistant`.

import json
import os
import sys

CONFIG_DIR = os.environ.get("HA_CONFIG_DIR", "/config")

# Constantes FICTIVES de lab (box virtuelle jetable, jamais de prod).
USER_ID = "6c6162326f782d7669727475616c2d01"
USER_NAME = "lab"
REFRESH_ID = "6c6162326f782d7669727475616c2d02"
JWT_KEY = "6c61622d7669727475616c2d6a77742d6c61622d30312d6c61622d3032"
CREATED_AT = "2026-10-08T20:00:00+00:00"


def _lire(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return None


def _ecrire(chemin, obj):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def main():
    store = os.path.join(CONFIG_DIR, ".storage")
    auth_path = os.path.join(store, "auth")
    auth = _lire(auth_path)
    if auth and any(u.get("name") == USER_NAME
                    for u in auth.get("data", {}).get("users", [])):
        print(f"bootstrap : utilisateur {USER_NAME!r} déjà présent, rien à faire")
        return 0
    _ecrire(auth_path, {
        "version": 1, "minor_version": 1, "key": "auth", "data": {
            "users": [{
                "id": USER_ID, "group_ids": ["system-admin"],
                "is_owner": True, "is_active": True, "name": USER_NAME,
                "system_generated": False, "local_only": False}],
            "groups": [], "credentials": [],
            "refresh_tokens": [{
                "id": REFRESH_ID, "user_id": USER_ID,
                "client_id": "http://localhost/", "client_name": None,
                "client_icon": None, "token_type": "long_lived_access_token",
                "created_at": CREATED_AT, "access_token_expiration": 1800.0,
                "token": "refresh-" + REFRESH_ID, "jwt_key": JWT_KEY,
                "last_used_at": None, "last_used_ip": None,
                "expire_at": None, "credential_id": None,
                "version": "2026.10.0"}]}})
    _ecrire(os.path.join(store, "onboarding"), {
        "version": 4, "minor_version": 1, "key": "onboarding",
        "data": {"done": ["user", "core_config", "analytics",
                          "integration"]}})
    print(f"bootstrap : utilisateur {USER_NAME!r} + token lab provisionnés")
    return 0


if __name__ == "__main__":
    sys.exit(main())
