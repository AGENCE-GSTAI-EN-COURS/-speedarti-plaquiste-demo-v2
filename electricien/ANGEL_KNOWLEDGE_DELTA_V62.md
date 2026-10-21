# Connaissances Ángel existantes — modifications à intégrer pour Électricien V6.2

**STATUT : À INTÉGRER DANS LA BASE EXISTANTE D'ÁNGEL, PAS ENCORE PROPAGÉ EN PRODUCTION.**
Ce document n'est PAS une nouvelle base de connaissances ni un nouvel index. Il représente le diff métier à intégrer dans la source unique d'Ángel, après autorisation sur le dispositif de production. Le dépôt source \`GSTAI-Sp/speedarti-v2\` est intouchable ici.

## Principes à apprendre / appliquer
1. Les besoins AUTO par composition du logement, les longueurs moyennes par tranche de surface, le coefficient de difficulté (0,80 / 1 / 1,25), la main-d'œuvre et les paliers tableau mono/tri restent gouvernés par les annexes validées par Guillaume.
2. Le chiffrage rénovation distingue toujours **conserver / remplacer / déplacer / créer / déposer**. Les mécanismes conservés et simplement déplacés ne sont pas achetés à nouveau. Les mécanismes remplacés ou créés sont achetés. Les créations/déplacements de câbles utilisent les longueurs mesurées par l'artisan ; aucune longueur automatique fictive n'est appliquée à l'existant.
3. La somme conserver + remplacer + déplacer + créer doit être cohérente avec le total final des prises, commandes, éclairages, RJ45 et TV. « Déposer » est hors total final.
4. Une répartition de blocs doubles/triples d'un logement entier ne peut pas être assimilée sans contrôle à la seule fourniture neuve lors d'une rénovation partielle.
5. Les gammes composées sont facturées uniquement si l'ensemble mécanisme + enjoliveur éventuel + plaque est compatible et tarifé. Ne pas mélanger gammes, générations, finitions incompatibles (notamment Odace 2011 / Odace 2025 et Céliane).
6. La hiérarchie des prix est : prix fournisseur personnel artisan (à raccorder en production) > prix référence exacte > moyenne marque/gamme/fonction > moyenne générale de la même fonction. La démo statique ne dispose pas encore des prix personnels. Aucun prix d'une autre fonction ou d'un autre calibre ne sert de substitution.
7. Les câbles triphasés et disjoncteurs tétrapolaires d'un fabricant nécessitent une référence, une longueur/quantité et un prix saisis ou une source exacte. Pour PAC, climatisation, gainable, T.One, IRVE, PV : modèle, section, disjoncteur, différentiel exact et prix matériels doivent être explicités. Pas de dimensionnement fabricant inventé.
8. Un coffret tableau multirangées ne doit jamais reprendre le prix du coffret une rangée ; renseigner le modèle et son prix réel. Pour un différentiel Type F, demander la référence exacte et le prix.
9. L'extérieur nécessite section, calibre, nombre de circuits, longueur réelle, matériels et temps. Éclairage client fourni = pose seule ; sinon le prix des luminaires doit être connu. Détecteurs : référence, prix et temps artisan.
10. Si un article reste non chiffré, le total est un **sous-total connu provisoire**, et ne doit pas être présenté comme devis définitif.
11. Les codes internes \`ELEC_...\` et tableaux QA ne sont **jamais** prononcés ni montrés à l'artisan. Seules les alertes métier en français sont accessibles à l'utilisateur.

## Exigence pour la livraison
- Réutiliser le dispositif de connaissance Ángel existant, sans index ou base parallèle.
- Vérifier la cohérence de chaque règle avec les annexes métier d'origine.
- Après intégration et tests, tracer la date/la version/la confirmation dans le dispositif de pilotage.
- Tant que ce raccordement n'est pas réalisé, état **DÉPENDANCE À TRAITER**, jamais TERMINÉ.

## Traçabilité
- Dépôt de démonstration uniquement : \`thibaultmourlane7/-speedarti-plaquiste-demo-v2/electricien/\`.
- Version cible : V6.2.
- Code source SpeedArti production : aucune modification, aucun push.

## Complément V6.3 — à intégrer dans les connaissances Ángel EXISTANTES
- Les simples allumages, les va-et-vient et les éclairages à trois points de commande sont des quantités modifiables indépendamment, avec retour à l'AUTO en vidant le champ.
- 1 simple allumage = 1 commande ; 1 va-et-vient = 2 commandes ; 1 éclairage à trois points = 3 commandes. Recalculer les points lumineux, les commandes et tous les postes de chiffrage liés ; ne pas cumuler un ancien total manuel global et une répartition détaillée.
- Forfait VMC autoréglable / hygro / double flux : **3 bouches comprises, 1 cuisine + 1 WC + 1 salle de bains ou salle d'eau**. Le cellier n'est pas une quatrième bouche incluse.
- Si plusieurs cuisines, WC ou salles de bains/salles d'eau : toute bouche au-delà de la première dans chaque famille s'ajoute au forfait au prix validé **115 € HT par bouche**. Le champ manuel est réservé aux autres bouches et ne doit pas doubler celles déjà calculées d'après la composition.
- Le récapitulatif doit préciser explicitement les 3 bouches incluses, les suppléments automatiques, les ajouts manuels et le total. Aucune base Ángel parallèle ; ce delta reste à intégrer en production.

## Complément V6.4 — catalogue références d'appareillage
- Les prises blanches simples doivent être proposées, avec marque, gamme, génération, couleur, référence exacte et statut de prix (confirmé / indicatif / absent).
- Une entrée du catalogue représentant un mécanisme seul n'est jamais facturée comme une prise complète sans mécanisme, finition, enjoliveur éventuel, plaque et support compatibles.
- Distinguer Odace 2011 et 2025 ; contrôler génération et finition dans chaque composition.
- Ne jamais inventer un prix : Mosaic 278111L-1121-C est un exemple de kit blanc complet sans prix unitaire public exact prouvé.
- Priorité inchangée : tarif personnel fournisseur artisan > référence exacte > moyenne même famille/fonction. N'utiliser le prix moyen que pour les produits complets compatibles.
- Les **références supplémentaires sont documentées** dans `catalogue-en-ligne.json` et l'audit `AUDIT_REFERENCES_V64.md` ; aucune mise à jour de la base Ángel de production n'a été effectuée. Complément à intégrer dans les connaissances existantes et à tracer.
