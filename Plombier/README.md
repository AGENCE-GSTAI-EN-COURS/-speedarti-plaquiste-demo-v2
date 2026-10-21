# SpeedArti — Plombier v0.8.1 — Sprint F duplication de configuration

## Sprint F v0.8.1

- libellé remplacé par **« Chauffe-eau → distance moyenne salle de bain (m) »** ; la règle de calcul EF + EC reste inchangée ;
- ajout dans l’étape 3 du bouton **« Appliquer les caractéristiques aux éléments similaires »** lorsqu’au moins un autre sanitaire compatible existe ;
- éléments similaires = même famille + même sous-type ; pour les éviers, même configuration simple/double ; pour un élément spécifique, même désignation ;
- la copie reprend références catalogue, accessoires, options, dimensions/configuration, articles complémentaires et temps ;
- l’ID et la zone RDC/R+1 de chaque sanitaire cible sont toujours conservés ;
- un WC suspendu ne peut pas appliquer ses caractéristiques à un WC à poser.

Cette version reprend l’intégralité du retour Guillaume après la v0.7.1.

## Sprint E v0.8.0

### Réseau EF + EC selon les distances chauffe-eau

Règle Guillaume : les nourrices étant généralement proches du chauffe-eau, les distances chauffe-eau → salle de bains et chauffe-eau → cuisine alimentent désormais **EF et EC**, lorsque les équipements correspondants existent.

Exemple avec douche + évier :
- SDB 5 m + cuisine 8 m → EF 29 ml et EC 29 ml ;
- SDB 10 m + cuisine 10 m → EF 36 ml et EC 36 ml.

Les overrides artisan restent prioritaires.

### Lave-main

Le lave-main passe en **EF + EC par défaut**.
- 1 point EF ;
- 1 point EC ;
- 1 platine EF+EC ;
- évacuation locale DN40 inchangée.

L’ancien choix « EF seul / eau chaude prévue » est supprimé.

### Robinetterie rapide

Choix rapide **Oui / Non** ajouté ou harmonisé sur :
- lavabo / vasque ;
- meuble vasque ;
- lave-main.

Priorité :
1. choix chantier ;
2. habitude entreprise ;
3. aucun défaut arbitraire si aucune référence fiable n’existe.

Pour un meuble double vasque, la quantité automatique reste 2 robinets.

### Composants automatiques visibles

Les composants automatiques déjà calculés (siphons, bondes, vidages, fixations validées) sont maintenant affichés dans un résumé visible immédiatement dans la configuration : l’artisan voit ce qui est déjà inclus au chiffrage sans devoir ouvrir la composition détaillée.

Exemples conservés :
- lavabo / meuble vasque : siphon `1054371`, bonde `2864095` ;
- lave-main : siphon logique lavabo + bonde `997361L` ;
- évier simple : bonde `4272991`, siphon `1066748` ;
- évier double : bonde `4273023`, siphon `1066748`.

### Habitudes artisan étendues

Les habitudes entreprise ne sont plus limitées aux composants automatiques principaux.
Après sélection réelle dans Téréva, un accessoire configurable peut être mémorisé comme habitude :
- flexible ;
- fixation ;
- collier ;
- joint ;
- autre composant configurable présent dans la nomenclature.

Aucune référence n’est inventée : l’habitude provient toujours d’une sélection catalogue réelle.

### Catalogue visuel

L’étape 3 affiche maintenant un accès catalogue par familles avec pictogrammes :
WC, douche, baignoire, lavabo/vasque, meuble vasque, lave-main, évier, robinetterie, siphons, bondes/vidages, platines et raccords.

### Préparation multi-fournisseurs

- Téréva reste le seul catalogue actif et chiffrable.
- CCL et un fournisseur générique sont présents uniquement comme connecteurs **inactifs**, sans prix ni références inventés.
- chaque sélection catalogue transporte désormais son identifiant fournisseur ;
- le payload approvisionnement passe en `PLB-APPRO-V2` avec le fournisseur par ligne.

### Correctifs UI étape 3

Renforcement responsive :
- protection anti-débordement des grilles ;
- cartes et champs avec largeur bornée ;
- passage du layout configuration + panier en empilé sous 1180 px ;
- composants automatiques et catalogue adaptés tablette/mobile ;
- réduction des risques de chevauchement signalés par Guillaume.

## Validation logique

**634 / 634 assertions réussies** sur le code réellement poussé sur `main`.

Ángel Plombier : **v1.7**.

Un nouveau contrôle navigateur humain reste requis pour valider visuellement la disparition des chevauchements et la fluidité du nouveau catalogue.
