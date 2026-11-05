# SpeedArti — Métier Peintre V2.2 (démo commune)

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
- Références historiques de démonstration préremplies depuis l'ancien calculateur de SpeedArti V2 (en lecture seule) : peinture acrylique 10 m²/L/couche, glycéro 12, satiné 9, 10 % de pertes, pot de 10 L à 100 € HT (ancien repère de 10 €/L), 0,15 h/m²/couche, 42 €/h ; papier peint 0,53 × 10 m à 25 €/rouleau, 0,25 h/m² de pose. Toutes sont modifiables et NON VALIDÉES comme prix fournisseurs actuels 2026.
- Le résultat affiche séparément les besoins en litres, les pots à acheter, les fournitures HT et les heures-homme par mur/plafond.
- Aucun tarif fournisseur 2026 n'est inventé ni aucune TVA réduite automatiquement décidée.
- Consommations peinture = (surface nette × couches / rendement fabricant) × (1 + pertes).
- Les surfaces avec peintures identiques sont groupées avant arrondi aux pots entiers.
- Papier peint standard : estimation des lés selon largeur brute, hauteur du mur et raccord ; panoramique : panneaux à saisir après calepinage.
- Une ouverture peut être « déduction », « menuiserie en supplément » ou « les deux » sans double comptage.
- Les heures-homme ne sont pas divisées par le nombre d'ouvriers ; seule la durée l'est.
- Les murs désactivés n'ont aucun effet sur le résultat ni les plinthes automatiques.

## Tests
À la racine du dépôt : node --test peintre/tests-v2.mjs
Les 31 scénarios V2/V2.1 ont été exécutés avec succès sur le moteur, ainsi qu'une vérification de 9 interactions ciblées de l'application par simulation du DOM pour le correctif V2.1 (en complément des contrôles V2).
Cela ne remplace pas une recette complète sur navigateur réel (mobile/desktop) ni une validation métier.

## Gardes-fous SpeedArti
- Jamais de modification sur GSTAI-Sp/speedarti-v2, consulté exclusivement en lecture seule.
- Aucune connexion Supabase, API applicative, catalogue/stock/devis ni production.
- Modification autorisée du seul site GitHub Pages de démonstration multi-métiers.
- Pas de création d'une deuxième base de connaissances Ángel ; seulement un delta à intégrer dans la base centrale existante, après validation.
- L'enrichissement réel d'Ángel, les connecteurs, l'audit des prix et la validation humaine sont encore des dépendances : V2 démo ≠ module finalisé pour intégration production.

## Correctif V2.1 — chiffrage automatique
- Répare les résultats vides dus aux rendements, prix et temps non renseignés par défaut.
- Une pièce de 5 × 4 × 2,5 m, avec plafond et peinture acrylique deux couches, produit une estimation de démonstration : 14,3 L, 2 pots, 19,5 heures-homme et 1 019 € HT avec les anciens repères indiqués ci-dessus.
- Prix, rendements, références, temps et TVA à vérifier avant vrai devis. Une préparation avec consommables non tarifés reste « à confirmer » sans présenter un sous-total incomplet comme montant définitif.

## Sprint V2.2 — retour Guillaume du 4 novembre 2026

- Étape 1 : modèle géométrique identique à Plaquiste (Rectangle, L, T, U), murs A à H suivant la forme, plafond indépendant, murs simples et surfaces simples.
- Étape 2 : réglages avancés de peinture, papier peint, préparations, menuiseries et plinthes dans des panneaux engrenage + clé.
- Préparations par support : aucune par défaut, léger 1 €/m², rattrapage 3 €/m², complet 5 €/m². Temps estimatifs de démonstration : 0,10 / 0,25 / 0,45 h/m², modifiables et non validés comme normes.
- Menuiserie : Réparation profonde (sans refabrication) remplace Ratissage complet.
- Plinthes : uniquement les murs peints actifs ; fourniture de bois exclue par défaut.
- Étape 3 Options : six familles, 64 prestations ; fournitures, unités et heures libres à renseigner, aucun prix inventé.
- Étape 4 : choix des ouvriers dans les résultats ; seule la durée du chantier change, pas les heures-homme ni leur coût.
- TVA : taux 10 % seulement si rénovation d'un logement éligible confirmée, 20 % par défaut dans la démonstration ; règles fiscales à contrôler avant devis.
- Plafond L/T/U en papier peint : calepinage non validé, total incomplet avec alerte.
- Vérification : 31 tests historiques adaptés + 17 nouveaux = 48 tests moteur réussis, 13 simulations d'interaction réussies. Recette navigateur réel toujours nécessaire.
- GitHub uniquement : aucune modification de GSTAI-Sp/speedarti-v2, aucune connexion de la production.
- Connaissances Ángel : delta préparé, import dans la base EXISTANTE en attente, aucune base parallèle.
