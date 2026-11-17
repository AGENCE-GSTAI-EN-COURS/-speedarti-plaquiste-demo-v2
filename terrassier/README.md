# SPEEDARTI — TERRASSIER V1.3 | Chantiers multi-prestations

## Demande Guillaume du 16 novembre 2026

L'utilisateur compose un seul chantier à partir de **plusieurs familles** et de **plusieurs prestations par famille**.

- **Étape 1** : sélectionner plusieurs familles puis cocher toutes les prestations nécessaires dans chacune. Les prestations déjà sélectionnées sont conservées.
- **Étape 2** : paramétrer chaque prestation indépendamment : dimensions, type de sol, engin (dont pelle 4 t à prix manuel), distance d'évacuation, stockage sur place, conducteur seul ou avec 1–3 aides, TVA.
- **Étape 3** : options additionnelles par prestation, quantité paramétrable, rejet des doublons si la ligne figure déjà dans la recette.
- **Récapitulatif** : détail par ouvrage et total global HT/TVA/TTC, sauvegarde locale, exports CSV et JSON.

**Démo historique V1.2 conservée** dans `terrassier/v12-single.html`.

## Base de données

- `database/referentiel-v13.json` : extraction datée des fichiers existants : **5 familles, 25 prestations, 17 types de champs, 59 tarifs**. Aucun tarif 2026 inventé.
- `database/schema-staging.sql` : proposition de tables relationnelles PostgreSQL : familles, prestations, champs, prix, recettes, options, chantiers et lignes multiples.
- `database/seed-staging.sql` : peuplement des référentiels historiques et des champs. **AUCUN SQL N'A ÉTÉ EXÉCUTÉ**, aucun raccordement Supabase/production.
- Le moteur de calcul utilise directement les référentiels `assets/v12-data.mjs` et `assets/v12-engine.mjs` de la démo validée, encapsulés par `assets/v13-model.mjs`.
- L'interface sauvegarde les chantiers dans le navigateur (`localStorage`), clé `speedarti.terrassier.demo.v13`, et réutilise les **prix personnalisés V1.2** présents dans ce navigateur.

## Précautions

- Prix historiques 2024–2025 et provisions de démonstration ; consulter `AUDIT_PRIX_2026.md`.
- Pelle 4 t : **aucun prix confirmé dans la BPU actuelle**. Le choix de cette machine affiche un poste explicitement non tarifé jusqu'à saisie manuelle du prix HT/jour.
- Les effectifs sont modélisés en hypothèse de coût : conducteur seul => reprise des heures d'aide par le conducteur ; avec aides => multiplication des heures d'aide. Ce n'est pas un calcul de productivité chantier certifié.
- Certaines recettes restent **partielles** (fondations, ANC, réseaux spécialisés, etc.) : le chiffrage affiché est marqué incomplet ; export CSV/impression désactivé tant que l'ensemble n'est pas exploitable.
- Aucune connexion au dépôt `GSTAI-Sp/speedarti-v2` en écriture. Aucun envoi de données, aucune modification de production.
- Sauvegarde locale seulement ; l'export JSON est conseillé pour partager un chantier ou éviter sa perte.

## Tests

```bash
npm install --prefix terrassier
npm run test --prefix terrassier
npx --prefix terrassier playwright install chromium
python3 -m http.server 8020
npm run test:e2e --prefix terrassier
```

Les tests du moteur V1.2 sont conservés et ceux de sélection multiple V1.3 ajoutés ; les tests navigateur valident les deux parcours.

## À faire pour Guillaume avant intégration

1. Examiner/valider le schéma et la migration sur une copie staging, avec droits et RLS adaptés.
2. Obtenir les cotes et rendements métier définitifs, prix fournisseurs 2026, conditions d'achat et unités.
3. Définir précisément les options supplémentaires propres à chaque ouvrage de l'étape 3.
4. Faire valider l'hypothèse conducteur seul / avec aides par un terrassier.
5. Ajouter ces nouvelles connaissances à la **base existante** d'Ángel, sans créer de base parallèle.
