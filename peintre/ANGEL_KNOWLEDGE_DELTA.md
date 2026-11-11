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

## Delta V2.2 / V2.3 à fusionner dans les connaissances EXISTANTES d’Ángel (NON IMPORTÉ)
- PNT-GEO-019 : les pièces Rectangle, L, T et U se décrivent par segments de murs A à H, le plafond se calcule selon l’aire du polygone.
- PNT-PREP-020 : préparation par support avec aucune par défaut ; consommables de démonstration 1, 3 ou 5 € HT/m², temps différents et modifiables.
- PNT-WOOD-021 : sur menuiserie, la préparation profonde est nommée « Réparation profonde (sans refabrication) » ; temps de démonstration spécifiques boiseries 0,15 / 0,35 / 0,65 h/m², non normatifs, modifiables.
- PNT-PLINTH-022 : plinthes automatiques sur murs actifs peints uniquement ; peinture calculée avec linéaire × hauteur peinte, mutualisée par produit et conditionnement ; bois hors prestation par défaut.
- PNT-OPTIONS-023 : 64 options facultatives réparties en six familles, avec quantités, unités, fournitures, temps à renseigner ; montant incomplet si référence non connue.
- PNT-VAT-024 : contexte fiscal avec TVA 20 % par défaut ; 10 % seulement si éligibilité du logement et des travaux confirmée, non automaticité fiscale.
- PNT-WORKERS-025 : ouvriers choisis dans les résultats ; effectif ne change pas les heures-homme ni le coût, seulement la durée.
- PNT-SUPPLIES-026 : ruban de masquage, bâches et abrasifs complémentaires facultatifs ; ne pas créer de prix sans référence et éviter les doubles comptes.
- PNT-HOURS-027 : lorsqu'une option manque de temps, conserver le total des heures connues comme minimum partiel et signaler explicitement les tâches non estimées.
- PNT-COLOR-028 : une peinture colorée doit avoir sa référence RAL/NCS et un prix vérifié selon produit et teinte ; ne jamais reprendre automatiquement le prix blanc historique ; revalidation si changement de teinte, famille ou finition.
- PNT-SAFETY-029 : valeurs V2.3 = estimations de démonstration, pas de catalogue officiel ; ne pas considérer l’intégration Ángel comme terminée avant une fusion dans la base existante et une validation.

Statut : PENDING_REVIEW / NOT_IMPORTED. Ce fichier est un delta documentaire, pas une base parallèle ni une connexion à la base d'Ángel.

## Delta V2.4 — Connaissances centrales Ángel à fusionner (NON IMPORTÉ)
- PNT-GUILLAUME-030 : 92 références métier sourcées dans peinture.pdf (67) et peinture 2.pdf (25) : unités physiques, fournitures HT, heures par unité, hypothèses d’application et pages/lignes, non validées fournisseur.
- PNT-GUILLAUME-031 : garder distinctes les variantes m², ml, unité, forfait ; la sélection d'un service équivalent dans deux unités ne doit pas engendrer un double comptage.
- PNT-GUILLAUME-032 : 62/64 options générales ont un rattachement métier explicite ; les deux sans équivalence sûre nécessitent une saisie manuelle et non une déduction automatique.
- PNT-GUILLAUME-033 : un coût fournitures 0 € n'annule pas les heures de main-d’œuvre ; une majoration d'urgence/horaires décalés doit être chiffrée explicitement, même si le PDF inscrit 0 € de fournitures.
- PNT-GUILLAUME-034 : le prix HT du rouleau de papier peint est un élément essentiel à demander ; le panoramique exige un prix par panneau et le nombre de panneaux.
- PNT-GUILLAUME-035 : les trois consommables courants utilisent des repères publics de départ en HT (2,47 / 3,55 / 2,92), modifiables, distincts des prix négociés de l'artisan.
- PNT-GUILLAUME-036 : le contexte TVA et effectif sont à expliquer au moment des résultats ; 10 % de TVA uniquement si conditions d'éligibilité confirmées.

Ne pas créer de nouvelle base Ángel, ni déclarer le statut terminé sans raccordement effectif, test et validation humaine.


## Delta V2.5 — À IMPORTER dans les connaissances Ángel EXISTANTES (pas de base parallèle)
- PNT-OPTIONS-037 : les options sont classées uniquement en six familles métier Guillaume : traitements spécifiques, finitions décoratives, boiseries intérieures, revêtements/décoration complémentaires, prestations techniques/spécialisées, services complémentaires facturables.
- PNT-OPTIONS-038 : les 92 barèmes PDF deviennent des variantes de ces familles, jamais une catégorie métier séparée, et leurs unités ne sont pas converties implicitement.
- PNT-OPTIONS-039 : l'assistant demande le libellé, l'unité/variante (m², ml, unité, forfait), la quantité, puis fournitures et temps ; il évite de compter plusieurs variantes du même ouvrage.
- PNT-OPTIONS-040 : l'interface expose un panier de sélection consultable en continu, avec modification et suppression de chaque option et sous-total indicatif.
- PNT-FISCAL-041 : contexte du chantier, effectif et TVA doivent être visibles avant les options, tout en restant contrôlables au récapitulatif ; le taux horaire vient des paramètres entreprise lors de l'intégration réelle.
Statut : DOCUMENTATION À VALIDER ET IMPORTER DANS LA BASE CENTRALE. Aucun import runtime réalisé.
