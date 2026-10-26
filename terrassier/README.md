# Terrassier — SpeedArti, démo indépendante V1.1

**Dépôt de travail :** AGENCE-GSTAI-EN-COURS/-speedarti-plaquiste-demo-v2, dossier `/terrassier/`.

SpeedArti source `GSTAI-Sp/speedarti-v2` **consulté exclusivement en lecture seule**. Le module de démonstration est une adaptation indépendante de l'existant, pas une copie identique du moteur de production. Aucune connexion production/Supabase, aucune donnée client.

## Fonctionnalités

- 5 familles : terrassement et fondations, chemins et parkings, enrobés, réseaux, démolition
- Prestations types préconfigurées et modifiables, puis saisie libre
- Champs de métrés contextuels : L × l × profondeur pour fouilles et réseaux, surface m² pour revêtements
- Schéma de coupe interactif avec valeurs et matériaux indicatifs
- Aperçu du chiffrage recalculé à chaque saisie sans bouton
- Plusieurs couches d'enrobé : classe, épaisseur, tonnage et prix couche par couche (2 à 5)
- Fosse incluse automatiquement lors du choix « fosse septique » ; choix du modèle
- Blindage, pompage, bordures chiffrés selon **hypothèses de prix de simulation non validées** ; montants à remplacer
- Récapitulatif modifiable : quantités, prix HT, journées de location (ligne de matériel), heures de main-d'œuvre
- Validation locale d'un récapitulatif, export CSV et impression (pas de devis ou facture en production)

## Risques et limites

Les références de prix sont historiques (2024–2025) et ne sont pas validées pour 2026. Les simulations d'options (blindage, bordures, pompage) utilisent des hypothèses provisoires ; elles n'établissent ni un devis conforme ni les coûts réglementaires. Vérifier au cas par cas la stabilité des fouilles, les réseaux DT/DICT, les contraintes géotechniques, les filières de déchets, le dimensionnement d'assainissement et la TVA. Les données ne sont pas persistées.

## Tests

`node --test terrassier/tests/engine.test.mjs`

Test navigateur avec Chromium : `npm install --prefix terrassier`, `npx --prefix terrassier playwright install chromium` puis servir la racine du dépôt sur le port 8020 et `npm run test:e2e --prefix terrassier`. Un workflow GitHub Actions exécute les deux suites.

L'intégration future dans l'application SpeedArti doit enrichir la base de connaissances **existante** d'Ángel, sans base parallèle.
