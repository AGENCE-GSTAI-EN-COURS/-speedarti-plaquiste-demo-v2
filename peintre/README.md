# SpeedArti — Métier Peintre V2 (démo commune)

## Périmètre
Refonte de l'interface V0.1 selon le parcours Plaquiste V2 demandé par Guillaume.
Cette V2 est hébergée dans le dépôt multi-métiers déjà utilisé par Plaquiste, Maçon, Terrassier, Couvreur, Électricien et Plombier.

### Fichiers actifs
- index.html : page de démonstration Peintre V2 ;
- app-v2.mjs : interface 4 étapes, sélection individuelle de chaque support et schéma A/B/C/D ;
- engine-v2.mjs : moteur physique pur, non raccordé à la production ;
- styles-v2.css : design conforme aux principes Plaquiste V2 ;
- tests-v2.mjs : contrôles automatisés des règles et non-régression ;
- ANGEL_KNOWLEDGE_DELTA.md : préparation à l'enrichissement des connaissances EXISTANTES d'Ángel, pas une nouvelle base.

L'ancienne V0.1 (app.mjs, engine.mjs, tests.mjs, styles.css) est conservée à titre d'historique et n'est plus chargée dans la démonstration.

## Parcours
1. Ajouter une pièce, un mur simple ou une surface simple. On peut mélanger plusieurs ouvrages.
2. Sur une pièce, le schéma A/B/C/D et Plafond permet d'activer/désactiver et configurer chaque support sans contamination des autres supports.
3. Pour les surfaces simples, saisie longueur × largeur ou m² directs (pour peinture ; longueur et largeur obligatoires en papier peint).
4. Par support : peinture (famille, finition, teinte blanc/couleur, référence et couches), papier peint (classique/intissé/vinyle/panoramique), ouvertures déduites / menuiseries peintes / les deux et préparation indépendante (aucune / ponçage léger / ponçage + rattrapage / ratissage complet).
5. Plinthes automatiques selon les murs actifs avec déduction des largeurs de portes ; ajout manuel possible.
6. Résultat par surface : métrés nets, fournitures, heures-homme et montants à confirmer.

## Sécurité des calculs
- La préparation est un poste de calcul explicite par support ; ses ratios de temps et consommables sont renseignés par l'artisan ou le catalogue futur. Sans prix/temps, le résultat reste incomplet.
- Pas de prix fictif, d'article fournisseur inventé, de taux horaire implicite ni de TVA 5,5/10% décidée automatiquement.
- Consommations peinture = (surface nette × couches / rendement fabricant) × (1 + pertes).
- Les surfaces avec peintures identiques sont groupées avant arrondi aux pots entiers.
- Papier peint standard : estimation des lés selon largeur brute, hauteur du mur et raccord ; panoramique : panneaux à saisir après calepinage.
- Une ouverture peut être « déduction », « menuiserie en supplément » ou « les deux » sans double comptage.
- Les heures-homme ne sont pas divisées par le nombre d'ouvriers ; seule la durée l'est.
- Les murs désactivés n'ont aucun effet sur le résultat ni les plinthes automatiques.

## Tests
À la racine du dépôt : node --test peintre/tests-v2.mjs
Les 28 scénarios V2 ont été exécutés avec succès sur le moteur, ainsi qu'une vérification de 10 interactions de l'application par simulation du DOM.
Cela ne remplace pas une recette complète sur navigateur réel (mobile/desktop) ni une validation métier.

## Gardes-fous SpeedArti
- Jamais de modification sur GSTAI-Sp/speedarti-v2, consulté exclusivement en lecture seule.
- Aucune connexion Supabase, API applicative, catalogue/stock/devis ni production.
- Modification autorisée du seul site GitHub Pages de démonstration multi-métiers.
- Pas de création d'une deuxième base de connaissances Ángel ; seulement un delta à intégrer dans la base centrale existante, après validation.
- L'enrichissement réel d'Ángel, les connecteurs, l'audit des prix et la validation humaine sont encore des dépendances : V2 démo ≠ module finalisé pour intégration production.
