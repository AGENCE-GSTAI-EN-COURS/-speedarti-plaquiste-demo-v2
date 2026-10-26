# SPEEDARTI — TERRASSIER V1.2 (DEMO INDÉPENDANTE)

Dépôt autorisé : `AGENCE-GSTAI-EN-COURS/-speedarti-plaquiste-demo-v2`, dossier `/terrassier/`. Branche `main`. Version source `GSTAI-Sp/speedarti-v2` **LECTURE SEULE absolue**, aucune modification faite sur la production.

## Couverture réelle

- 5 catégories, **25 prestations disposant chacune d'une recette distincte** : terrassements/fondations, chemins/parkings, enrobés, réseaux, démolition
- Formulaire contextuel pour chaque prestation : dimensions, profondeur, épaisseurs, regards, pente, bordures, souches, etc.
- BPU historique et provisions, calculs indicatifs par unité HT : engins, matériaux, main-d'œuvre, transport/évacuation
- Chiffrage réactif à chaque saisie, tarif global personnalisable ou correction du prix/quantité d'une ligne
- Conservation locale (`localStorage`) des prix, dimensions et corrections par prestation ; export/import JSON et export CSV
- Avertissements explicites sur les devis incomplets (fondations profondes, réseaux eau potable, réseaux secs, ANC)
- Des tests pour les recettes métier et un parcours de navigation en navigateur Chromium (actions GitHub)

## Limites métiers et commerciales

**Ce n'est pas un catalogue tarifaire vérifié en 2026.** Les valeurs de base proviennent du BPU SpeedArti V2 (moyennes 2024–2025) et de quelques **provisions internes non sourcées**. Les loueurs, décharges, distributeurs et centrales béton appliquent des tarifs locaux différents. Prix et quantités doivent être vérifiés avant devis. Les résultats ne sont pas destinés à être intégrés automatiquement aux documents facturables.

Attention :
- Fondations profondes : pas de forage spécialisé, armatures, béton spécifique, essais et études structure.
- ANC : pas de filière d'épandage, contrôle SPANC, étude de sol ni accessoires complets.
- Réseaux eau potable / secs : raccords, vannes, gestionnaire, tests et câblage non chiffrés.
- Démolition : diagnostics, désamiantage, contraintes structurelles et éventuelles autorisations hors chiffrage.
- Les tarifs d'engins sont sans opérateur et la MO reste séparée ; vérifier que le devis du loueur ne contient pas déjà un conducteur.
- Les prix personnalisés sont conservés **sur le navigateur seulement** : vider les données du site les supprime. Exporter JSON pour les garder.

## Sources de contexte 2026 (comparaisons, non prix contractuels)

- Relevés d'offres de location : https://pellejaune.fr/prix-location-mini-pelle/
- Fourchettes béton prêt à l'emploi : https://conseils.hellopro.fr/combien-coute-le-beton-pret-a-l-emploi-4395.html
- Ces recherches ne remplacent pas une collecte de devis fournisseurs localisés pour chaque article.

## Commandes de test

```bash
npm install --prefix terrassier
npm run test --prefix terrassier
npx --prefix terrassier playwright install chromium
python3 -m http.server 8020
npm run test:e2e --prefix terrassier
```

## Sprint futur d'intégration

La réintégration éventuelle dans SpeedArti requiert audit de compatibilité par Anne-Sophie et enrichissement de la base de connaissances existante d'Ángel — jamais de base parallèle. Aucun lien Supabase ou API n'est configuré pour cette démo.
