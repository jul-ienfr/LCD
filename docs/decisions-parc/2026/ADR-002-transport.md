# ADR-002 — HTTPS JSON fan-out + file-queue, MQTT reste LAN

Date : 2026-10-09. Statut : accepté.

Contexte : transporter box→VPS sans broker global en v1.
Décision : HTTPS JSON fan-out + `outbox/<box_id>/*.json` atomique
`tmp+os.replace`, replay idempotent par `ref`, digest au retour. MQTT
(Mosquitto/Z2M/OTBR) reste LAN box.
Écarté : NATS/JetStream global (ops inutile à 2-20 box, polling 15 min).
Conséquences : traverse pare-feu, timeouts 8-10 s, retry 1, RPO 15 min.
