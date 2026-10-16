# Démo Chiffrage Électricien SpeedArti — V6.2

Cette démo conserve le parcours existant SpeedArti et intègre les règles métier validées avec Guillaume, le catalogue appareillage multi-gammes et les corrections de fiabilisation V6.1.

## Fonctionnement
- Neuf / rénovation et monophasé / triphasé.
- Besoins AUTO par composition réelle du logement, modifiables par l'artisan.
- Métrés par tranche de surface et coefficients de difficulté validés.
- Appareillage sélectionnable indépendamment par famille : marque, gamme, modèle / finition.
- Câbles et gaines au prix moyen ; appareillage au prix de la référence choisie.
- PAC, climatisation, gainable, T.One, IRVE et raccordement PV saisis selon fabricant.
- Rénovation : conserver / remplacer / déplacer / créer.
- Aucun prix manquant n'est inventé.

## V6.1
- protections 2/10/16/20/25/32 A complétées ;
- contacteur jour/nuit chauffe-eau ;
- référence et prix matériel pour équipements fabricant ;
- modification partielle du tableau avec temps et matériel saisis ;
- différenciation Type A / AC / F ;
- coffret communication recalculé après correction RJ45/TV ;
- extérieur complété : type, commande, détecteurs et prix luminaire optionnel ;
- contrôles techniques d'audit disponibles uniquement en interne et jamais affichés dans l'interface artisan.

Démo de validation métier avant intégration dans SpeedArti.

## V6.2 — fiabilisation des chiffrages et tests
- Rénovation : quantités de mécanismes achetés = création + remplacement ; conservation/déplacement non facturés comme articles neufs. Contrôles de cohérence des quantités finales ; longueurs de recâblage réellement mesurées.
- Les références d'appareillage incompatibles ou incomplètes ne sont pas transformées silencieusement en prix d'une autre fonction. Filtre strict de gamme ET génération.
- Coffret multirangées : aucun prix extrapolé depuis le coffret une rangée ; référence et prix réels artisan disponibles.
- Différentiel Type F, câble et protection 3P : référence/prix manuels exacts disponibles. Les équipements fabricant restent non chiffrables définitivement tant que leurs paramètres sont inconnus.
- Extérieur : circuits/protections et métrés artisan, luminaires client fournis ou référence/prix, détecteurs avec prix et temps.
- Contrôles métier `audit()` raccordés aux alertes/bloquants affichés, sans exposer de codes techniques internes.
- Si manque matériel, référence, métrage ou contrôle bloquant : afficher « sous-total connu — incomplet » et empêcher l'interprétation en devis définitif.
- Les données sauvegardées localement en V5/V6.1 restent reprises.
- Tests : `node electricien/tests/engine.test.cjs` puis `node electricien/tests/ui.test.cjs` (Chromium + serveur HTTP local), exécutés par `.github/workflows/electricien-v62.yml`.
- Vérification : parcours automatisé Chromium desktop 1440px et mobile 390px ; ceci ne remplace pas une recette humaine exhaustive sur appareil réel.

## Ángel — dépendance explicite
Consulter `ANGEL_KNOWLEDGE_DELTA_V62.md`. Les évolutions métier doivent être réintégrées dans la base de connaissances Ángel **existante**. Ce dépôt démo ne modifie ni le dépôt source SpeedArti, ni sa base Ángel de production ; l'enrichissement reste À TRAITER avant clôture globale.
