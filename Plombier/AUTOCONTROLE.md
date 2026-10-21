# SpeedArti — Plombier v0.8.1 — Auto-contrôle

Date : 2026-10-21

## Résultat

**653 / 653 assertions réussies** sur le code réellement présent sur `main`.

Catalogue Téréva contrôlé :
- 7 456 références ;
- 7 451 prix exploitables.

Balises : `BALISES-ABSOLUES-v1.8`.

## Contrôles Sprint F

- nouveau libellé « distance moyenne salle de bain » présent dans la saisie et le résumé réseau ;
- WC suspendu → WC suspendu : caractéristiques principales, références, accessoires et articles complémentaires recopiés ;
- ID cible conservé ;
- zone cible RDC/R+1 conservée ;
- WC suspendu → WC à poser : copie refusée ;
- évier simple → évier double : copie refusée ;
- éléments spécifiques de désignations différentes : copie refusée ;
- bouton UI et message de confirmation présents ;
- Ángel Plombier v1.8 connaît la nouvelle fonction.

## Correction d'affichage v0.8.1 — retour utilisateur 21/10/2026

- les blocs `c12` de l'étape 3 occupent toute la largeur de la grille ;
- les 12 colonnes de la grille sont définies sans minimum implicite ;
- l'action de copie est maintenant placée en tête de la fiche sanitaire ouverte ;
- en l'absence d'autre sanitaire compatible, une explication est affichée au lieu d'un bouton inutilisable ;
- la logique métier d'appariement et la conservation ID/zone restent inchangées.

**4 assertions UI supplémentaires**, ajoutées aux 649 assertions préexistantes.

## Régressions

Les **634 assertions** de la v0.8.0 restent intégrées dans la suite.

## Limite

Le comportement logique est validé. Un contrôle navigateur humain reste nécessaire pour confirmer l’ergonomie du bouton sur desktop et mobile.
