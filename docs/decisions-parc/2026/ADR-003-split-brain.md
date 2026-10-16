# ADR-003 — Split-brain : last-writer-wins proposé, humain tranche

Date : 2026-10-13. Statut : accepté (G4-b, batterie lab §65 tests_lab.py : `== 65. passerelle parc : offline cross-box + split-brain`, 28/28).

Contexte : box autonome + centrale qui filent chacune leur prix en coupure.
Décision : `last-writer-wins` = PROPOSITION affichée (les deux versions),
`tranche=None` jusqu'au geste humain motivé `POST /parc/conflits/trancher`
(`qui` + `motif` tracés), reconvergence = 2ᵉ `/v1/action` explicite.
Jamais d'écrasement silencieux. Journal sans montants.
