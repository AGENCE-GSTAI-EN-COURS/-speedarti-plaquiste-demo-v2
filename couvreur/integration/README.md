# Couvreur — Couche d'intégration SpeedArti V0.3.0

Le dépôt `GSTAI-Sp/speedarti-v2` a été audité **uniquement en lecture**. Cette couche prépare le raccordement sans modifier le dépôt source.

## Quantité de tuiles

La V0.3.0 utilise le modèle fabricant exact :

- valeur fabricant exacte quand elle existe ;
- plage fabricant quand elle varie avec recouvrement / pureau ;
- l'artisan peut choisir une valeur dans la plage ;
- sans choix, la moyenne de la plage fabricant est retenue ;
- les 129 références de la démo disposent désormais d'une consommation exploitable ; une future référence incomplète resterait sélectionnable avec poste tuiles bloqué plutôt qu'une valeur inventée.

## Fenêtres de toit VELUX

La démo V0.3.0 ajoute une bibliothèque VELUX avec modèle/gamme, code dimension, dimensions physiques et prix web public sourcé. Le prix artisan affiché applique une estimation de -15 % demandée pour le chiffrage de démonstration. Ce n'est pas un tarif professionnel VELUX contractuel : un tarif fournisseur/pro réel doit toujours primer.

## Sécurité

Toutes les options et dimensions de sécurité sont regroupées dans un seul bloc sur l'étape Options.

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
