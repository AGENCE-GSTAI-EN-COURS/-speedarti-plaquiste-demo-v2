# SPEEDARTI — PEINTRE — Delta des connaissances Ángel (NON IMPORTÉ)

**Statut : PENDING_REVIEW / NOT_IMPORTED.**
Ce document est une **liste de connaissances à fusionner dans la base Ángel EXISTANTE**, et non une nouvelle base parallèle. Le code de la démo ne charge ni ne modifie les mémoires d'Ángel.

## Entrées candidates (source : moteur Peintre de démonstration, audit ancien moteur SpeedArti V2)

- PNT-GEOM-001 : surface brute des 4 murs d'une pièce rectangle = 2 × (longueur + largeur) × hauteur. Déduire **chaque ouverture dimensionnée** une seule fois.
- PNT-SURF-002 : surfaces de murs peints, plafonds peints, boiseries et murs revêtus de papier peint sont indépendantes ; pas de double comptage.
- PNT-PEINT-003 : calcul des litres = surface × couches / rendement fabricant ; pertes appliquées ensuite ; arrondir en **pots entiers achetés** au conditionnement réel. Rendement d'une fiche produit indispensable.
- PNT-BOIS-004 : les boiseries sont chiffrées sur leurs faces et surfaces réellement peintes ; ne jamais estimer par défaut une porte comme 3,5 m² sans justification.
- PNT-WALL-005 : le nombre de rouleaux calculé par simple surface est une **estimation** ; contrôler raccord du motif, nombre de lés, largeur et hauteur réelle avant achat.
- PNT-PLAN-006 : heures-homme totales ne sont pas divisées par l'effectif ; seule la durée en heures de chantier l'est.
- PNT-PRIX-007 : si prix, rendement, conditionnement ou coût incomplet, Ángel doit demander les données manquantes, sans inventer de chiffres.
- PNT-PRIX-008 : les prix historiques Guillaume 2026 sont des **repères datés à vérifier**, pas un catalogue fournisseur temps réel.
- PNT-FORFAIT-009 : un forfait avec pose incluse ne doit pas être refacturé en main-d'œuvre ; conserver ses heures en planning seulement.
- PNT-TVA-010 : Ángel ne peut pas déduire automatiquement 5,5 % ou 10 % sur le seul âge du logement ; demander l'éligibilité et passer par le futur service TVA SpeedArti.

## Procédure obligatoire
1. Vérifier les entrées déjà présentes dans le référentiel Ángel (ne pas dupliquer).
2. Comparer avec les règles et validations métier courantes.
3. Soumettre la revue humaine au responsable métier.
4. Enrichir **les connaissances existantes**, avec version, source et statuts.
5. Dans le pilotage SpeedArti, ligne obligatoire « Connaissances Ángel » : ne pas déclarer le métier TERMINÉ avant import validé ou dépendance explicite.


## Delta V2 — ajout du 2 novembre 2026 (NON IMPORTÉ)
- PNT-V2-SURFACE-011 : pièce avec murs A/B/C/D et plafond activables indépendamment ; peinture, papier peint et préparation spécifiques à chaque support.
- PNT-V2-WORK-012 : mur simple = longueur × hauteur ; surface simple = longueur × largeur ; ne pas déduire un état global à la place des supports indépendants.
- PNT-V2-OPENING-013 : ouvertures en déduction, menuiseries en supplément, ou les deux ; jamais compter deux fois une déduction ni omettre les faces réellement peintes.
- PNT-V2-PLINTH-014 : plinthes automatiques uniquement sur les murs actifs ; retrancher les largeurs de portes déduites ; une ligne manuelle reste distincte.
- PNT-V2-PREP-015 : préparation par support avec aucune par défaut, ponçage léger, ponçage + rattrapage et ratissage complet. Ces intitulés métiers ne donnent pas à eux seuls des rendements fournisseurs ou un temps normatif ; demander les paramètres validés.
- PNT-V2-WALL-016 : papier peint panoramique = nombre réel de panneaux, largeur/hauteur/raccord du produit à vérifier ; le mode classique peut estimer des lés, mais ne doit pas assimiler toute surface nette à des rouleaux commercialement exacts.
- PNT-V2-PRICE-017 : regrouper les quantités de même produit avant arrondi aux conditionnements ; conserver une référence de teinte distincte par couleur.
- PNT-V2-SAFETY-018 : une démo GitHub Pages ne constitue jamais une connexion à la base de connaissances centrale. Statut « connaissances Ángel à intégrer », pas « terminé ».
