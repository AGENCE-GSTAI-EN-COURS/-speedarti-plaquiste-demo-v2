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
