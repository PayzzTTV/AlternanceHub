# Features — AlternanceHub

_Dernière mise à jour : 8 mai 2026_

---

## Livré ✅

- **Filtres avancés** — localisation, tags, date de publication, durée (côté client)
- **Export CSV** — télécharger les offres filtrées
- **Modal offre** — description complète, compétences, bouton Postuler
- **Score de matching CV** — badge % sur chaque carte + barre dans le modal
- **Forces & gaps** — mots-clés forts du CV vs ce qui manque par rapport à l'offre
- **Kanban suivi** — drag-and-drop, notes, dates de relance, 6 colonnes
- **Score dans le Kanban** — badge % sur les cartes de candidature
- **Auth Supabase** — login/signup/logout, kanban privé par utilisateur
- **Matching CLI** — `python tools/run_matching.py --cv mon_cv.pdf`
- **Descriptions enrichies** — scraper stocke description + compétences souhaitées

---

## Prochaines features

### Impact fort
- [ ] **Refonte UI/UX** — design system Tailwind v4, mobile-first, animations
- [ ] **Alertes email** — mail quand nouvelles offres matchent ton CV (Resend + Edge Function)
- [ ] **Nouvelles sources** — WTTJ, Hellowork — objectif 500+ offres

### Impact moyen
- [ ] **Historique des statuts kanban** — voir les changements de statut par candidature
- [ ] **Rappels de relance** — notification navigateur (Web Push) à l'échéance
- [ ] **Dashboard admin** — stats scraper (nb offres/jour, erreurs) sans ouvrir Supabase
- [ ] **Détection doublons intelligente** — fuzzy matching titre+company (Levenshtein)

### Long terme
- [ ] **API publique** — `/api/v1/offers` JSON + RSS pour intégrations tierces
- [ ] **Extension Chrome** — bouton "Suivre" directement sur Indeed/APEC/WTTJ
- [ ] **Mode PWA hors-ligne** — mise en cache IndexedDB pour consultation sans réseau
- [ ] **Matching IA** — embeddings locaux (sentence-transformers) pour scores sémantiques
