# Prix Couvreur — démonstration du 20 novembre 2026

Les 129 modèles techniques sont conservés. Les données commerciales publiées sont anonymisées : aucun nom de négoce, numéro d’article ou lien fournisseur n’est inclus dans les nouveaux tarifs.

- 101 modèles utilisent un prix professionnel HT.
- 21 autres utilisent leur moyenne publique HT.
- 7 restent au prix indicatif explicitement signalé par le moteur.
- 788 accessoires sont disponibles dans le catalogue de chiffrage.

Un coloris tarifé suffit pour le modèle. Les différentes pièces et versions restent distinctes. Les prix au mille sont divisés par 1000 ; une boîte ou un sachet n’est ramené à la pièce que si le nombre de pièces est connu. Sinon l’unité de vente est conservée. Aucune remise simulée ne s’applique aux tarifs professionnels intégrés. Les calculs conservent six décimales sur le prix unitaire et arrondissent le total de ligne au centime.

## Utilisation

À l’étape Options, ouvrir « Catalogue accessoires ». Rechercher une désignation, filtrer par fabricant ou famille, puis ajouter les accessoires et saisir leurs quantités.

Une ligne peut s’ajouter au chiffrage ou remplacer un poste automatique. En remplacement, l’estimation est retirée et la quantité saisie est utilisée. Plusieurs accessoires peuvent remplacer un même poste, par exemple pour chiffrer séparément une rive gauche et une rive droite. Le modèle cité dans une désignation ne suffit pas à établir sa compatibilité ; la version et les dimensions doivent correspondre au chantier.

Les prix manuels et marges restent prioritaires. Les données techniques, la main-d’œuvre et le catalogue VELUX sont conservés. Les identifiants internes anonymes ne sont pas des `article_id` de production ; aucune réservation de stock n’est créée sans raccordement catalogue réel.

## Fichiers et tests

`pricing-data.js` contient les prix anonymisés ; `pricing.js` les applique au catalogue après les corrections techniques. `accessory-picker.js` gère la recherche, la pagination et le panier d’accessoires.

```sh
npm ci --prefix couvreur
npm run test:engine --prefix couvreur
npx --prefix couvreur playwright install --with-deps chromium
npm run test:ui --prefix couvreur
```

Le contrôle d’interface couvre l’ajout, le remplacement, la sauvegarde, la modification du prix, les conditionnements et l’affichage mobile. Le dépôt source de production reste en lecture seule.
