# SPEEDARTI — Électricien V6.5 — rapport catalogue

Date des relevés : 21 octobre 2026. Dépôt de démonstration `thibaultmourlane7/-speedarti-plaquiste-demo-v2`, branche `main`, dossier `/electricien/`.

## État vérifié et résultats

Départ confirmé : V6.4, commit `f24e5d5b`, 258 historiques + 12 nouvelles entrées = 270. L'appendice V6.4 comportait aussi deux mises à jour du socle, sans constituer deux articles supplémentaires. Des modifications d'autres modules intervenues depuis sont préservées ; aucun fichier de production SpeedArti n'est modifié.

| Indicateur | Résultat |
|---|---:|
| Entrées examinées par l'audit de données, accessoires compris | 297 |
| Entrées ajoutées en V6.5 | 27 |
| Entrées existantes mises à jour (sources, statuts, nomenclatures ou prix) | 150 |
| Entrées confirmées par fiche individuelle / nomenclature contrôlée | 175 |
| Entrées avec prix et fiche confirmés | 174 |
| Prix historiques corrigés | 66 |
| Entrées historiques encore à confirmer | 122 |
| Prix exact inconnu, même dans le fichier | 1 |

**L'audit de données porte sur toutes les 297 entrées. Il ne constitue pas une revalidation fournisseur de toutes les entrées : 122 restent à confirmer.** Les 122 prix historiques ne sont pas comptés parmi les 174 prix vérifiés. Le nombre total de références fabricant manquantes sur le marché ne peut pas être déduit de ce catalogue ; les lacunes par gamme figurent ci-dessous.

L'inventaire [AUDIT_REFERENCES_V65.json](./AUDIT_REFERENCES_V65.json) contient une ligne par entrée : marque, gamme, génération, fonction, finition, type, références fabricant, prix HT/TTC, ancien TTC, URL, date et réserves. Le socle `catalogue-appareillage.js` est conservé intact ; le JSON complémentaire applique les corrections sans effacer l'historique Git.

## Anomalies corrigées

- **Confusions HT/TTC dans des packs V6.4.** WE100P : ancien 3,47 € TTC → relevé 4,17 € TTC / 3,48 € HT. WE106P : 3,54 → 4,25 € TTC. WE122P : 11,75 → 14,09 € TTC. S320059-P : 3,29 → 3,95 € TTC. S920052-P : 4,95 → 5,94 € TTC. Ce sont des écarts constatés entre l'ancien fichier et les fiches actuelles, pas une preuve de changement de prix fournisseur.
- **S920062/S920072 faussement complets** : mécanismes pré-câblés, plaque séparée. Leur sélection seule reste non chiffrée comme ensemble fini.
- **Famille commandes trop large** : poussoirs, permutateurs et doubles commandes ne servent plus à établir le prix d'un va-et-vient simple.
- **Trois points de commande** : deux va-et-vient + un permutateur par montage, avec quantités, choix et prix séparés. Aucun télérupteur ou montage poussoir implicite.
- **Assemblages automatiques non établis** : supprimés. Les composants seuls restent consultables sans être facturés comme ensembles complets.
- **Référence sauvegardée introuvable** : prix inconnu et demande de nouveau choix ; plus de remplacement silencieux par une moyenne.
- **Pose/génération/finition** : filtres explicites. Une plaque grise avec mécanisme blanc n'entre pas dans la finition blanche par défaut. Le Mosaic triple en saillie n'entre pas dans une sélection encastrée.
- **État des connaissances** : les références historiques non confirmées sont exclues des moyennes. Leur sélection exacte garde le résultat provisoire.
- **Cache navigateur** : ressources CSS/JS versionnées (`v=6.5.1`) pour éviter une page V6.5 avec des scripts de V6.4 restés en cache.
- **Réseau** : délai de chargement limité à huit secondes, repli explicite sur le socle, contrôle des origines/prix/collisions ID. Un échec du complément ne signifie pas un catalogue à jour.

## Compositions contrôlées ajoutées

| Composition | Contenu par ensemble | Prix public HT calculé |
|---|---|---:|
| Odace 2025 | S920062 ×1 + S920704 ×1 | 13.83 € |
| Odace 2025 | S920072 ×1 + S920706 ×1 | 20.45 € |
| Odace 2011 | S520205 ×1 + S520702 ×1 | 14.79 € |
| Dooxie  | 600333 ×1 + 600803 ×1 | 18.58 € |

Ces quatre lignes sont des **compositions SpeedArti**, pas des références de kit fabricant inventées. Leur prix est la somme HT des composants ; chaque composant conserve son URL et son prix. Compatibilité : même collection/génération, mécanisme avec support de fixation, plaque au nombre de postes et à entraxe 71 mm correspondant. Les boîtes sont traitées séparément dans le moteur existant, qui conserve son calcul de boîtes Ø67 : la nomenclature exacte des boîtes multipostes reste à faire valider avant intégration en production.

## Couverture et réserves

Au niveau de chacune des trois marques, au moins une solution blanche encastrée complète et chiffrée couvre chaque famille courante demandée. Cela ne signifie pas que chaque gamme ou génération couvre chaque fonction. Les poussoirs sont sélectionnables et consultables au catalogue ; le montage courant trois commandes utilise le permutateur. Un montage à télérupteur n'est pas développé par cette évolution.

| Marque / gamme | Familles courantes complètes, blanches et chiffrées | Familles sans ensemble validé blanc encastré |
|---|---|---|
| Schneider Electric / Mureva Styl | Aucune | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Schneider Electric / Odace | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV | Commandes volets roulants, Commandes VMC |
| Schneider Electric / Ovalis | Prises simples, Simples allumages, Va-et-vient, Poussoirs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC | Prises doubles, Prises triples, Permutateurs |
| Schneider Electric / Unica | Aucune | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Legrand / Céliane | Simples allumages, Va-et-vient, Poussoirs | Prises simples, Prises doubles, Prises triples, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Legrand / Céliane 2024 | Prises simples | Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Legrand / Dooxie | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC | Aucune au niveau gamme, générations à distinguer |
| Legrand / Mosaic | Prises doubles, Simples allumages, Va-et-vient, Poussoirs | Prises simples, Prises triples, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Legrand / Plexo | Aucune | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Hager / Cubyko | Aucune | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |
| Hager / Essensya | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC | Aucune au niveau gamme, générations à distinguer |
| Hager / Gallery | Aucune | Prises simples, Prises doubles, Prises triples, Simples allumages, Va-et-vient, Poussoirs, Permutateurs, Prises RJ45, Prises TV, Commandes volets roulants, Commandes VMC |


- Hager Gallery/Cubyko : sources historiques à reprendre avec le fabricant ou un distributeur documentant ces références. La recherche Elec44 « Hager Gallery » n'a renvoyé aucun résultat dans cette session ; cela ne démontre pas que la gamme est obsolète.
- Unica NU305918 : mécanisme blanc et prix confirmés, mais support/plaque complets non établis. Aucun kit extrapolé.
- Céliane : ne pas rapprocher automatiquement les références historiques et 2024, même si les couleurs semblent proches. Le kit CM0111-CCB est documenté avec support, mécanisme, enjoliveur et plaque.
- Mosaic 278111L-1121-C : composition identifiable mais prix exact retenu inconnu (offre/configuration « dès »), pas de valeur fabriquée.
- Rénovation et anciens totaux globaux : les achats agrégés de commandes ne permettent pas d'inférer la répartition des types. Le résultat reste provisoire tant que cette répartition n'est pas confirmée.
- La démo chiffre les boîtes selon sa logique existante ; la répartition des boîtes multipostes n'est pas une nomenclature d'exécution complète.

## Tests

- Tests moteur et catalogue locaux : **59 contrôles PASS**.
- Tests chargement local : **4 scénarios PASS** (complément réel ; indisponibilité réseau ; prix/origine/ID invalides ; schéma inconnu).
- `git diff --check` et vérifications de syntaxe JavaScript : PASS.
- Tests Chromium automatisés ordinateur 1440 × 900 et mobile 390 × 844 : **PASS sur le commit `09ffb00e`**, [exécution 39621142881](https://github.com/thibaultmourlane7/-speedarti-plaquiste-demo-v2/actions/runs/39621142881), captures desktop/mobile conservées dans les artefacts.
- Parcours dans le navigateur connecté sur la démo publiée : **contrôle visuel effectué** : nouvelle interface V6.5 chargée (commandes séparées, prix HT, pose/génération et recherche des 297 entrées). Les sélections, calculs et sauvegardes sur ordinateur/mobile sont couverts par les tests Chromium ci-dessus ; pas de recette exhaustive de chaque référence sur téléphone physique..

Les tests automatiques ne valent pas une recette artisan de chaque combinaison ni un essai sur téléphone physique.

## Actualisation des prix fournisseurs

Aucune API officielle 123elec/Elec44 n'a été identifiée ou activée dans ce travail. Le JSON n'est pas un service de synchronisation temps réel. Méthode recommandée : recevoir un export fournisseur autorisé (CSV/catalogue ou API contractuelle si confirmée), le déposer en staging, conserver la base HT/TTC et la TVA, rapprocher par fournisseur + référence de pack ou référence fabricant + génération + composition, puis présenter les écarts avant publication. Revalider les changements de composition, de génération, les offres « dès », les lots et les grands écarts ; ne pas remplacer un tarif artisan négocié par un tarif public.

Conserver une trace de chaque relevé et du prix précédent, puis exécuter les contrôles de schéma, prix, doublons, compositions et non-régression. À défaut d'export, poursuivre les relevés manuels sur fiches individuelles ; pas de scraping continu présenté comme API. La fréquence se décide avec les droits d'utilisation du fournisseur et les besoins du catalogue.

## Connaissances Ángel

**PRÉPARÉ — dépendance à traiter.** [Delta V6.5](./ANGEL_KNOWLEDGE_DELTA_V65.md) destiné à enrichir la base existante, sans base parallèle et sans écriture en production. L'intégration en staging et la validation par l'équipe restent nécessaires.

## Commit livré

Code fonctionnel V6.5 : `09ffb00e2e9eccf5f8928cf53390ffb5e72408c7`, poussé sur `main`. Correctif de cache : `112917a68e98ebbbd71bac3904e811e0912ddfd5`, validé par la seconde exécution. Le commit courant du rapport est visible dans son historique GitHub ; les résultats ne sont pas présumés pour un commit non testé.


Correctif de cache publié : `112917a68e98ebbbd71bac3904e811e0912ddfd5`. Les 59 contrôles moteur et 4 scénarios de chargement sont également PASS après ce correctif. Le site public affiche la nouvelle interface. Le [second passage GitHub Actions 39621757298](https://github.com/thibaultmourlane7/-speedarti-plaquiste-demo-v2/actions/runs/39621757298) est PASS sur ce correctif : moteur, chargement, parcours ordinateur et mobile. Les captures sont disponibles dans les artefacts de cette exécution.
