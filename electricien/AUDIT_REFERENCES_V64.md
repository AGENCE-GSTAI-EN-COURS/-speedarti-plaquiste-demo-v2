# SpeedArti — Électricien V6.4 — Check-up des références
**Date de vérification : 21 octobre 2026.**  
**Périmètre de travail : démonstration GitHub uniquement. Code source `GSTAI-Sp/speedarti-v2` intégralement en lecture seule.**

## Diagnostic vérifié
- Base de démonstration héritée : 258 références détaillées (Schneider 67, Legrand 107, Hager 84), notamment 97 articles complets, 49 mécanismes, 68 plaques, 19 semi-complets et autres accessoires.
- Seulement 32 références de prises simples de base, dont 18 portent une finition blanche/assimilée ; plusieurs ne sont que des mécanismes (une référence fabricant ne constitue pas forcément une prise complète).
- Le filtre `catalogue-selector.js` ne proposait pas de recherche par couleur ; il utilisait un prix moyen y compris lorsqu'une finition blanche était attendue.
- Les ensembles 2011/2025 Odace ne sont pas interchangeables. Les plaques `Céliane` et mécanismes `Céliane 2024` sont rangés dans des gammes/générations distinctes : recomposition interdite sans compatibilité prouvée.
- Tous les liens historiques ne sont pas des fiches fabricant à référence unique : des liens pointent seulement vers des catégories ou recherches. Le présent audit ne constitue pas une revalidation individuelle des 258 tarifs.

## Ajout en ligne ciblé — sources vérifiées, non synchronisées
La base publique démo `catalogue-en-ligne.json` complète sans écraser le socle initial, via `catalogue-en-ligne-loader.js`, par référence/produit/gamme/génération. **12 nouvelles références** et **2 références actualisées** : **270 références** disponibles si chargement réussi.

| Marque / gamme | Référence | Type et finition | Prix TTC indicatif | Remarque |
|---|---|---|---:|---|
| Schneider Ovalis | S320059-P | prise simple complète blanche | 3,29 € | Plaque comprise |
| Schneider Odace 2011 | S520052-P | prise affleurante complète blanche | 4,60 € | Génération 2011 |
| Schneider Odace 2025 | S920052-P | prise affleurante complète blanc craie | 4,95 € | Génération 2025 |
| Legrand Céliane 2024 | CM0111-CCB | prise simple complète blanche | 7,99 € | Kit avec support, enjoliveur, plaque |
| Hager Essensya | WE100P | prise simple complète blanche | 3,47 € | Pack avec plaque Pure |
| Hager Essensya | WE106P | prise affleurante complète blanche | 3,54 € | Pack avec plaque Pure |
| Hager Essensya | WE122P | prise double complète blanche | 11,75 € | 2 prises |
| Hager Essensya | WE123P | prise triple complète blanche | 21,90 € | 3 prises |
| Hager Essensya | WE228P | RJ45 complète blanche | 15,65 € | Catégorie RJ45 |
| Legrand Mosaic | 278111L-1121-C | prise simple complète blanche | **Non vérifié** | Offre « dès 5,99 € », selon options ; **aucun PU exact inventé** |
| Legrand Mosaic | 277804L-2221-C | prise double complète blanche | 13,54 € | Pack encastré |
| Legrand Mosaic | 277806L-3311-C | prise triple complète blanche | 34,28 € | Pack en saillie, vérifier le mode de pose |
| Legrand Dooxie | 600335-111-C | prise simple complète blanche | 4,09 € | Référence déjà présente, source détaillée actualisée |
| Legrand Dooxie | 600328-111-C | prise EasyRéno complète blanche | 4,70 € | Référence déjà présente, source détaillée actualisée |

Tous les URLs sources, statuts et dates sont stockés ligne par ligne dans le JSON. Les prix sont **des tarifs publics indicatifs, pas des prix d'achat artisan ni des prix temps réel**, et ne remplacent pas les tarifs personnels.

## Correctifs techniques
1. Le chargement du complément JSON précède l'initialisation du sélecteur et du moteur. Si la ressource échoue, la base historique reste disponible ; aucun état de succès fictif.
2. Les familles restent séparées (prise simple/double/triple, RJ45, TV, commandes, extérieurs), sans substitution entre fonctions.
3. La prise simple sélectionne **Blanc** comme finition par défaut, y compris pour le prix moyen multi-marques. La marque, la gamme, la couleur et la référence exacte sont modifiables par l'artisan.
4. Les produits sans prix restent consultables mais **non chiffrés** ; un résultat comportant ces produits n'est pas un devis définitif.
5. Les mécanismes non composés avec enjoliveur/plaque compatibles ne sont pas facturés artificiellement comme produits complets.
6. Les assemblages refusent les mélanges de gammes, de générations et de couleurs connues incompatibles.
7. Les sources des références exactes peuvent être consultées depuis le module.

## Ce qui reste à contrôler (non déclaré terminé)
- **Exhaustivité totale : non acquise.** Un échantillon d'appareillage standard blanc (principales gammes) est complété ; il reste à vérifier systématiquement les autres couleurs/fonctions, la compatibilité de toutes les gammes et la couverture des 258 fiches historiques.
- **Unica :** certains mécanismes blancs sont identifiés chez Elec44 (`NU305918`, `NU303918`), mais les plaques/supports compatibles et le prix de la prise complète restent à établir. Ils ne sont volontairement pas vendus comme un kit complet sans preuve.
- **Mosaic simple :** modèle complet vérifié, prix exact encore inconnu selon options.
- **Éléments de pose et circuit :** il faudra assurer la séparation métier entre simple allumage, va-et-vient, poussoir, permutateur ; l'ancien catalogue de commandes est encore une famille regroupée.
- **Catalogue standard SpeedArti :** une documentation de production (`docs/AUDIT_ACCES_CATALOGUE_STANDARD_2026-07-13.md`) décrit une bibliothèque `catalogue_standards` de 1 015 références au 13 juillet 2026, distincte de la table personnelle `catalogue_items`. Un relevé direct des lignes ACTUELLES de la base Supabase applicative n'a pas été possible depuis cette démo : impossible de dire quelles références précises y sont encore disponibles ou à jour. Aucun article de la production n'a été modifié.
- **Synchronisation future :** l'application SpeedArti source contient déjà `src/services/supplier-connectors/supplierCatalogueSyncService.ts` (connecteurs de catalogue). Son intégration, l'accès éventuel à l'API fournisseur et la tarification personnalisée ne sont pas activés par ce JSON GitHub Pages.

## Connaissances Ángel
Ajouter ces règles et les nouvelles références à la **base existante** d'Ángel lors de l'intégration autorisée. Aucune base de connaissances Ángel parallèle créée. Statut : **dépendance à traiter**.

## Tests
- `node electricien/tests/engine.test.cjs` — moteur et catalogue.
- `node electricien/tests/ui.test.cjs` — Chrome desktop et mobile via GitHub Actions.
- Couverture non équivalente à une recette artisan réelle de toutes les combinaisons de catalogue.
