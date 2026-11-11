# SpeedArti — Métier Peintre V2.7 (démo commune)

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

## Correctifs V2.3 — audit final
- Plinthes : les fournitures de peinture sont calculées avec la hauteur peinte (0,10 m de démonstration ajustable) et les mêmes pots que les autres supports ; la fourniture de bois et les consommables supplémentaires sont facultatifs.
- Temps incomplets : afficher les heures-homme connues et la durée minimale correspondante sans inventer le temps manquant des options ; avertissement explicite et total incomplet.
- Consommables courants : ruban de masquage, bâches de protection et abrasifs configurables, exclus par défaut ; quantité et coût HT renseignés par l’artisan.
- Peinture couleur : la référence couleur et le prix doivent être confirmés ; le prix blanc historique ne se propage plus automatiquement à une teinte ni après changement de finition/famille.
- Menuiseries : temps de préparation bois spécifiques de démonstration : léger 0,15, rattrapage 0,35, réparation profonde 0,65 h/m². Les coûts par défaut 1/3/5 € HT/m² restent modifiables. Ces durées ne sont PAS des normes validées.
- Les tarifs, ratios d'usage, conditions TVA et catalogue fournisseur doivent encore faire l'objet d'une validation métier avant intégration à SpeedArti principal.
- Tests : 31 historiques + 17 V2.2 + 14 correctifs V2.3 = 62/62, avec contrôle d'interface simulé ; recette sur vrai navigateur mobile/PC non encore réalisée.
- Connaissances Ángel : les nouvelles règles sont ajoutées au delta documentaire existant, PAS encore importées dans la base de connaissances centrale. Le module demeure non finalisé pour la production.


## Sprint V2.4 — barèmes Guillaume, 6 novembre 2026
- 92 lignes PDF conservées dans guillaume-bareme-v2-4.mjs : 67 depuis « peinture.pdf » (3 pages), 25 depuis « peinture 2.pdf » (1 page). Unité, fournitures HT, heures/unité, note de limites et référence ligne/page traçables. Les titres visuellement tronqués ont été reconstitués.
- Les 64 options historiques restent présentes. 62/64 ont une correspondance explicite à une référence PDF ; les deux correspondances trop ambiguës restent manuelles, sans prix inventé.
- Les 92 variantes PDF sont consultables séparément (m², ml, unité, forfait). L’ajout d’une option reprend unité et données du PDF, modifiables par l’artisan. Aucun passage automatique m² ↔ ml ou forfait n’est effectué.
- Les groupes de prestations équivalentes sont sélectionnables une fois seulement ; le moteur bloque les doublons de variantes, notamment les plinthes au ml et au m². Les plinthes automatiques ne se cumulent pas avec l’option « Peinture des plinthes ».
- Les montants de fourniture égaux à 0 € dans le PDF restent des 0 € de fourniture, sans supprimer le temps. Les majorations commerciales comme « Intervention en urgence » demandent un prix explicitement chiffré, car 0 € n'est pas un montant final.
- Étape 2 : prix HT/rouleau de papier peint immédiatement visible ; prix HT/panneau pour panoramique. Largeur, longueur, raccord, pertes et temps restent dans Paramètres.
- Étape 3 : sélection des prestations, barèmes, prix personnalisables, consommables courants. Contexte fiscal supprimé de cette étape.
- Étape 4 : contexte fiscal et éventuelle éligibilité TVA 10 %, choix ouvriers, résultats et avertissements.
- Consommables courants — prix indicatifs HT modifiables, facultatifs : ruban LIMA 48×50 m (Bati-Avenue 2,47 €), bâche L’Outil Parfait 4×5 m (Bati-Avenue 3,55 €), 10 abrasifs (Tecnomat 2,92 €). Ces produits et formats représentent des exemples d’offres, pas une moyenne de marché certifiée ni une facture entreprise.
- Démo seulement : pas de connexion du catalogue, de l’authentification, des stocks, des devis, ni des paramètres réels artisan. Pas de modification de production, ni de GSTAI-Sp/speedarti-v2.
- Tests automatisés : 62 anciens + 15 nouveaux = 77 tests moteur ; un test de parcours interface Node ; workflow GitHub Actions Peintre dédié.
- La base Ángel existante n'est PAS encore mise à jour ; delta documentaire ci-dessous à traiter et revoir.


## Sprint V2.5 — Étape 3 conforme aux six familles Guillaume
- Les 64 options métier existantes et **les 92 lignes du barème PDF** sont désormais accessibles au sein des **six familles Guillaume**. Aucune septième catégorie « Barème Guillaume » distincte.
- Les 92 identifiants PDF uniques sont couverts, avec leur unité, coût fournitures HT, temps h/unité, note métier et source d'origine. Les variantes physiques d'un même service (par exemple ml vs m²) sont proposées dans une seule fiche pour limiter les doublons.
- Chaque famille dispose d'un panneau déployable et d'une barre de recherche indépendante, insensible à la casse et aux accents.
- Un **panier latéral fixe durant le défilement** montre immédiatement les prestations ajoutées. Sur mobile, un volet inférieur rétractable suit l'utilisateur.
- Le panier permet de modifier quantités, coût fournitures HT et heures par unité, de retirer des postes et de consulter le sous-total indicatif. Pour une référence Guillaume, l'unité est verrouillée : choisir l'autre variante au lieu de convertir implicitement les tarifs.
- La sélection d'un équivalent déjà présent est désactivée et refusée par le moteur. La suppression le rend de nouveau disponible. La position de défilement interne du panier est conservée, la dernière prestation ajoutée est amenée dans le panier.
- En haut de l'étape 3 : **type de chantier, effectif, TVA conditionnelle**, taux horaire entreprise indiqué comme paramètre externe. Dans cette démo isolée, son réglage de simulation demeure repliable, sans prétendre à une connexion aux paramètres de production.
- Les mêmes paramètres fiscaux peuvent être revérifiés à l'étape 4 Résultats ; une seule source de calcul est utilisée.
- Tests : 77 tests moteur V2 à V2.4 inchangés, nouveaux contrôles V2.5 de couverture du catalogue, filtres, variantes, panier et parcours d'étape. Workflow GitHub Actions étendu.
- L'interface réelle sur navigateur PC/mobile et l'import dans la base de connaissances **existante** d'Ángel restent à valider. Aucun changement dans GSTAI-Sp/speedarti-v2 ou la production.


## Correctif V2.6 — surfaces visibles et options liées à un support
- Étape 1 : afficher sur chaque ouvrage ses surfaces nettes en m² ; pour les pièces Rectangle/L/T/U, afficher la surface de chaque mur actif/inactif et du plafond.
- Étape 2 : afficher **Surface nette (m²)** en face du mur simple, mur A-H, plafond ou surface simple ; mise à jour dès la saisie des dimensions. Surface nette = longueur × hauteur (ou aire géométrique du plafond) moins les ouvertures déduites.
- Étape 3 : au-dessus des catégories, sélectionner le **support concerné par les options au m²**. Si l'utilisateur a choisi un mur à l'étape 2, ce mur est présélectionné. Si un seul support est disponible, l'automatisme s'applique à celui-ci.
- Les options ayant comme unité physique m² utilisent la surface **nette du support lié** : par exemple 5 m × 2,5 m = 12,50 m², moins une ouverture déduite de 2 m² = 10,50 m² ; l'option Ratissage est chiffrée sur 10,50 m².
- Modifier les dimensions, ouvertures ou la forme de pièce recalcule la quantité de l'option, les fournitures et les heures automatiquement. Une surface non sélectionnée, désactivée ou supprimée ne peut jamais être facturée sur la base fictive de 1 m² ; le devis devient incomplet avec explication.
- Le panier permet de voir/changer le support de chaque prestation au m², ou de basculer vers une saisie **libre** si la surface traitée diffère de celle du mur entier.
- Une prestation identique peut être sélectionnée sur plusieurs murs **distincts**, sans permettre un doublon sur le même mur. Les options au ml, à l'unité et au forfait ne deviennent pas automatiquement des prestations au m².
- Sont préservées les six familles de Guillaume, les 92 références, le catalogue métiers et les règles fiscales existantes. Démo isolée, aucune production modifiée.
- Tests automatisés V2.6 : 12 nouveaux scénarios moteur + 2 parcours UI Node ; ajout au workflow GitHub en complément des 77 tests moteur historiques et six parcours UI antérieurs.
- Limites : tests navigateur réel PC/mobile et intégration aux paramètres entreprise, devis et base centrale Ángel restent à valider.


## V2.7 — quantité de prestation personnalisable dans le panier
- Chaque prestation possède désormais un champ « Quantité » directement éditable, y compris celles préremplies en m² nets depuis un mur ou plafond.
- La saisie d’une quantité différente sur une prestation liée passe uniquement cette prestation en mode quantité personnalisée, sans perdre son lien avec le support.
- Un bouton « ↺ Reprendre les m² du support » restaure le mode automatique ; il récupère alors la dernière superficie nette du support, déductions comprises.
- Modifier les cotes ensuite n’écrase pas la quantité personnalisée. Une prestation restant en automatique continue de suivre la surface du support.
- Prix des fournitures et heures-homme sont recalculés à partir de la quantité retenue. Les options au ml, à l’unité et au forfait restent directement modifiables.
- Les contrôles anti-doublon restent basés sur le support même lorsque sa quantité est personnalisée ; un mur désactivé invalide encore une option qui lui est liée.
- Tests dédiés : 8 tests métier + 1 parcours interface, ajoutés au workflow GitHub. La recette sur navigateur réel reste nécessaire.
