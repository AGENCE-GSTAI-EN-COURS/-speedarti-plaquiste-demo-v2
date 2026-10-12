# Plaquiste — Couche d'intégration SpeedArti V1.6.2

## Principe de gel

Le moteur métier de référence reste **Plaquiste V1.6.1**.

La V1.6.2 n'ajoute aucune formule et ne modifie ni :
- la géométrie Rectangle / L / T / U ;
- les murs générés ;
- les surfaces ;
- les plafonds ;
- les matériaux ;
- la main-d'œuvre ;
- les alertes ;
- les totaux.

Le fichier `speedarti-adapter.js` est un adaptateur pur. Il reçoit l'état et le résultat déjà calculés par la V1.6.1 et prépare les contrats d'intégration SpeedArti.

## Fichiers

- `speedarti-adapter.js` : adaptateur pur V1.6.2.
- `catalogue-mapping-template.json` : emplacements à compléter avec de vrais `article_id/code_unique`.
- `../speedarti-connector-manifest.json` : cartographie complète des raccordements et blocages connus.
- `../angel-knowledge-base.json` : base métier Ángel existante.

## Règles absolues

1. Ne jamais recalculer la géométrie dans l'adaptateur.
2. Ne jamais aplatir une pièce L/T/U en rectangle.
3. Ne jamais inventer un `article_id`.
4. Ne jamais exporter les lignes `billable=false` vers devis ou stock.
5. Conserver la TVA par ligne pour le devis.
6. Conserver les forfaits / lignes de vente.
7. Ángel explique et assiste ; il ne remplace pas le moteur.
8. `GSTAI-Sp/speedarti-v2` reste en lecture seule pour ce travail.

## Compatibilité avec SpeedArti actuel

L'adaptateur bloque volontairement la finalisation quand le contrat de production actuel ne peut pas représenter fidèlement la V1.6.1.

Cas actuellement bloquants :
- formes L/T/U : le type `MurConfig` de production limite les IDs à A/B/C/D ;
- plafond L/T/U : le calculateur actuel recalcule encore longueur × largeur ;
- catalogue : tout matériau facturable doit recevoir un vrai `article_id` ;
- devis : le taux de TVA de la main-d'œuvre doit être fourni explicitement.

Un blocage de compatibilité est préférable à une conversion silencieuse fausse.

## Tests

`SpeedArtiPlaquisteAdapter.runContractTests()` couvre :
- non-mutation de l'état/résultat ;
- rectangle compatible ;
- L/T/U bloqué plutôt qu'aplati ;
- aucun identifiant catalogue inventé ;
- coûts internes exclus devis/stock ;
- TVA conservée par ligne ;
- forfaits conservés ;
- package final déclaré prêt uniquement si tous les prérequis sont résolus.

Le moteur Plaquiste conserve séparément sa propre suite de tests d'intégrité.
