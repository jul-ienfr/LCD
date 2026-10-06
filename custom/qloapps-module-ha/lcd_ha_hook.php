<?php
// custom/qloapps-module-ha/lcd_ha_hook.php — hook maison QloApps -> ics-sync (P2-2, §4-bis).
// Transitoire Phase 1 (moteur_direct: qloapps). Seul code QloApps/PHP du projet.
// Install : copier dans /modules/lcdha/lcdha.php (module QloApps minimal) OU
// coller le corps de buildPayload()/pushWithRetry() dans un override
// actionValidateOrderAfter existant.
//
// Chaîne réelle (contrat stable, aligné sur custom/ics-sync/ics_sync.py) :
//   QloApps --POST /resa-direct--> ics-sync (même LXC, 127.0.0.1:8090)
//     --events + calendar--> HA (LAN, token ha_api_token, <60 s, P2-14).
// Jamais de POST direct vers HA ici : l'idempotence par ref + l'arbitrage
// direct>OTA + le JSONL vivent dans ics-sync (ne PAS changer sans MAJ ics-sync).
//
// Payload POST /resa-direct (JSON, champs plats — pas de "dates") :
//   {ref, logement_id, debut, fin (AAAA-MM-JJ), voyageurs, langue,
//    heure_arrivee (HH:MM), taxe_sejour (€ CASA hors CA), montant, extras[],
//    src (P2-12 : vitrine d'origine ?src=<id>, transmis tel quel par le tunnel)}
// Champs custom P2-3 : spec champs_custom.md (lcd_langue, lcd_heure_arrivee,
// lcd_voyageurs_*, lcd_taxe_sejour, lcd_extras) ; gabarits docs/templates/.
// Réponses : 201 enregistree (+net_hote) / 200 deja_enregistree (retry idempotent)
//   / 400 champ manquant / 404 logement inconnu.
// Retry 3x / 5 min. Logs module. Secrets : URL ics-sync en config BO, jamais en dur.
//
// NOTE box : renseigner LCDICS_URL dans la config du module
// (BO QloApps > Modules > LCD ics-sync), jamais en dur ici.

if (!defined('_PS_VERSION_')) {
    exit;
}

class LcdHa extends Module
{
    public function __construct()
    {
        $this->name = 'lcdicsync';
        $this->tab = 'administration';
        $this->version = '1.0.0';
        $this->author = 'LCD maison';
        $this->bootstrap = true;
        parent::__construct();
        $this->displayName = 'LCD -> ics-sync (resa directe)';
        $this->description = 'Pousse chaque commande validée vers ics-sync POST /resa-direct.';
    }

    public function install()
    {
        return parent::install() && $this->registerHook('actionValidateOrderAfter');
    }

    /**
     * Hook QloApps : appelé après validation commande.
     * $params['order'] = Order validée (ref = $order->reference).
     */
    public function hookActionValidateOrderAfter($params)
    {
        if (empty($params['order'])) {
            return;
        }
        $order = $params['order'];
        $payload = $this->buildPayload($order);
        if (!$payload) {
            return; // logement non mappé -> log + stop (jamais de POST aveugle)
        }
        $this->pushWithRetry($payload);
    }

    /**
     * Mappe commande QloApps -> payload contrat stable.
     * Champs custom P2-3 : spec champs_custom.md (lcd_langue, lcd_heure_arrivee,
     * lcd_voyageurs_adultes/enfants, lcd_taxe_sejour, lcd_extras).
     * Dates séjour = HotelReservation (pas dates commande) — schéma exact
     * à valider sur box P2-1 (noms tables/colonnes marqués TODO-BOX).
     * Règles métier versionnées ici (récupérable OSL 3.0, jamais le PHP).
     */
    private function buildPayload($order)
    {
        // TODO-BOX : mapper vos id_product QloApps -> log1/log2 (ex: array(1 => 'log1')).
        $map_produit_logement = array(); // ex: array(12 => 'log1', 34 => 'log2');
        $logement_id = null;
        $id_product = null;
        foreach ($order->getProducts() as $p) {
            if (isset($map_produit_logement[(int) $p['product_id']])) {
                $logement_id = $map_produit_logement[(int) $p['product_id']];
                $id_product = (int) $p['product_id'];
                break;
            }
        }
        if (!$logement_id) {
            PrestaShopLogger::addLog('LCD-icsync : produit non mappé, order ' . $order->id,
                2, null, 'LcdIcsync');
            return null;
        }
        // Dates séjour : check-in/out HotelReservation, format AAAA-MM-JJ.
        // TODO-BOX : valider les noms table/colonnes sur box P2-1
        // (htl_booking_detail / date_from / date_to ici = hypothèse QloApps standard).
        list($debut, $fin) = $this->lireDatesSejour($order->id);
        // Champs custom : lus sur le produit commandé (fallback défauts spec).
        // TODO-BOX : valider le mécanisme custom sur box (customization / feature
        //  / champ produit) — les getters ci-dessous sont les points d'adaptation.
        $langue = $this->lireCustom($order->id, $id_product, 'lcd_langue', 'fr');
        $heure_arrivee = $this->lireCustom($order->id, $id_product, 'lcd_heure_arrivee', '17:00');
        $adultes = (int) $this->lireCustom($order->id, $id_product, 'lcd_voyageurs_adultes', 2);
        $enfants = (int) $this->lireCustom($order->id, $id_product, 'lcd_voyageurs_enfants', 0);
        $taxe_sejour = (float) $this->lireCustom($order->id, $id_product, 'lcd_taxe_sejour', 0.0);
        $extras = $this->lireExtras($order->id, $id_product);
        // voyageurs = adultes+enfants réel (jamais un id) ; taxe hors CA (§12.5).
        // P2-12 : src = vitrine d'origine (?src=<id> stocké en custom au tunnel).
        // TODO-BOX : lire le vrai custom le jour où le tunnel stocke le src.
        $src = $this->lireCustom($order->id, $id_product, 'lcd_src_vitrine', '');
        return array(
            'ref' => pSQL($order->reference),           // idempotence côté ics-sync
            'logement_id' => $logement_id,
            'debut' => $debut,                           // AAAA-MM-JJ (HotelReservation)
            'fin' => $fin,                               // AAAA-MM-JJ (HotelReservation)
            'voyageurs' => max(1, $adultes + $enfants),
            'langue' => $langue,                         // ISO tel quel (socle validé, sinon auto)
            'heure_arrivee' => $heure_arrivee,            // HH:MM -> pré-chauffe/ECS (§5.11)
            'taxe_sejour' => $taxe_sejour,               // € CASA, jamais du CA
            'montant' => (float) $order->total_paid,
            'extras' => $extras,                         // refs catalogue prix TTC, cut-off J-1 18h
            'src' => $src,                               // '' = direct pur, sinon id vitrine
        );
    }

    /**
     * Lit check-in/out HotelReservation pour une commande.
     * TODO-BOX : valider table/colonnes sur box P2-1. Retour ['', ''] si introuvable
     * (-> 400 côté ics-sync, jamais de POST aveugle avec des dates inventées).
     */
    private function lireDatesSejour($id_order)
    {
        // TODO-BOX : adapter aux noms réels (SHOW TABLES LIKE '%booking%' sur box).
        $row = Db::getInstance()->getRow(
            'SELECT `date_from`, `date_to` FROM `' . _DB_PREFIX_ . 'htl_booking_detail` '
            . 'WHERE `id_order` = ' . (int) $id_order . ' ORDER BY `date_from` ASC');
        if (!$row) {
            return array('', '');
        }
        return array(
            substr($row['date_from'], 0, 10),  // AAAA-MM-JJ exigé par /resa-direct
            substr($row['date_to'], 0, 10),
        );
    }

    /**
     * Lit un champ custom P2-3 (lcd_*). TODO-BOX : brancher sur le mécanisme réel
     * de la box (customized_data / feature_value / champ produit) ; le défaut spec
     * s'applique tant que le champ n'existe pas (jamais de POST bloqué pour ça).
     */
    private function lireCustom($id_order, $id_product, $slug, $defaut)
    {
        // TODO-BOX : remplacer par la lecture réelle (ex: customized_data.value).
        // En attendant : défaut spec (fr / 17:00 / 2+0 / 0.0).
        return $defaut;
    }

    /**
     * Lit les extras cochés (lcd_extras : kit, minibar_*, late, early, transfert,
     * courses, pack_teletravail…). TODO-BOX : brancher sur les cases BO réelles.
     * Retour : liste de refs catalogue (prix TTC affichés avant résa, §12.2).
     */
    private function lireExtras($id_order, $id_product)
    {
        // TODO-BOX : remplacer par la lecture réelle des cases cochées.
        return array();
    }

    /** POST JSON + retry 3x espacés 5 min. 200/201 = OK (retry idempotent par ref). */
    private function pushWithRetry($payload)
    {
        $url = rtrim(Configuration::get('LCDICSYNC_URL'), '/') . '/resa-direct';
        for ($essai = 1; $essai <= 3; $essai++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, array(
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
                CURLOPT_POSTFIELDS => json_encode($payload),
            ));
            $code = curl_exec($ch) ? (int) curl_getinfo($ch, CURLINFO_HTTP_CODE) : 0;
            curl_close($ch);
            if ($code === 201 || $code === 200) {
                return true; // 201 créée, 200 déjà connue (idempotent)
            }
            PrestaShopLogger::addLog('LCD-icsync : push essai ' . $essai . ' ref '
                . $payload['ref'] . ' code ' . $code, 2, null, 'LcdIcsync');
            if ($essai < 3) {
                sleep(300); // 5 min entre essais
            }
        }
        // TODO-BOX : alerte humain (mail gestionnaire) après 3 échecs — jamais silencieux.
        return false;
    }
}
