# Features à étudier

---

## Valeur immédiate

- [ ] **Filtres avancés** — filtrer par durée, localisation, date de publication, tags — côté client sur les données déjà chargées, zéro backend
- [ ] **Alertes email** — recevoir un mail quand une nouvelle offre match des mots-clés définis (ex: "SOC", "pentest") — cron scraper existant + Resend (gratuit)
- [ ] **Export CSV** — télécharger les offres filtrées ou ses candidatures en `.csv`
- [ ] **Notes globales** — bloc de texte libre par offre sur la page principale sans passer par le kanban

---

## Valeur élevée

- [ ] **Nouvelles sources** — APEC, Welcome to the Jungle, LinkedIn — plus d'offres cyber
- [ ] **Page offre détaillée** — `/offres/[id]` avec description complète + bouton candidater + notes
- [ ] **Détection de doublons intelligente** — actuellement SHA256 titre+company, certaines offres identiques passent avec des titres légèrement différents
- [ ] **Mode hors-ligne PWA** — mise en cache des offres dans IndexedDB pour consultation sans réseau

---

## Confort développeur

- [ ] **Dashboard admin** — stats du scraper (nb offres/jour, taux déduplication, erreurs) sans ouvrir Supabase
- [ ] **Historique des statuts** — dans le kanban, voir l'historique des changements de statut par candidature (table `application_events`)
- [ ] **Rappels de relance** — notification navigateur (Web Push) quand une date de relance arrive à échéance

---

## Long terme

- [ ] **Multi-utilisateurs** — Supabase Auth + RLS par `user_id`, partager le site avec d'autres étudiants
- [ ] **API publique** — exposer les offres en JSON/RSS pour que d'autres outils puissent les consommer
- [ ] **Extension Chrome** — bouton "Suivre" directement sur Indeed/APEC/LinkedIn sans passer par le site
