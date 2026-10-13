# Couvreur — Couche d'intégration SpeedArti V0.2.0

Le dépôt `GSTAI-Sp/speedarti-v2` a été audité **uniquement en lecture**. Cette couche prépare le raccordement sans modifier le dépôt source.

## Quantité de tuiles

La V0.2.0 utilise le modèle fabricant exact :

- valeur fabricant exacte quand elle existe ;
- plage fabricant quand elle varie avec recouvrement / pureau ;
- l'artisan peut choisir une valeur dans la plage ;
- sans choix, la borne haute fabricant est retenue avec avertissement pour éviter le sous-chiffrage ;
- donnée absente = poste tuiles bloqué, jamais de valeur inventée.

## Fichiers

- `speedarti-adapter.js` : prépare DonneesChantier, ResultatCalcul, stock et contexte Ángel.
- `catalogue-mapping-template.json` : emplacements à relier aux vrais article_id / code_unique.
- `../speedarti-connector-manifest.json` : écarts production et ordre de raccordement.
- `../angel-knowledge-base.json` : contribution Couvreur à la base Ángel existante.

## Règles absolues

1. Ne pas écrire dans `GSTAI-Sp/speedarti-v2` pendant cette phase.
2. Ne pas convertir artificiellement surface_toiture en surface_au_sol.
3. Pas de longueurs cachées par défaut.
4. Pas de consommation générique quand un modèle exact est choisi.
5. Ne jamais inventer un article_id.
6. Stock uniquement avec identifiants réels.
7. Ángel enrichit la base existante, pas de base runtime parallèle.
8. Chiffrage → devis uniquement sur action explicite de l'artisan.
