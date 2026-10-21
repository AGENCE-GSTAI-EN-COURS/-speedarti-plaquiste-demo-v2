# Démo Chiffrage Électricien SpeedArti — V6.3

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

## V6.3 — commandes d'éclairage et forfait VMC à 3 bouches
- Étape Points : quantités « simples allumages », « va-et-vient » et « éclairages à 3 points de commande » indépendantes, éditables (champ vide = retour à l'AUTO).
- Le moteur recalcule les points lumineux, les commandes (1/simple, 2/va-et-vient, 3/éclairage 3 points), les métrés, les circuits, les fournitures, les temps et le total. Les anciennes corrections globales de points lumineux/commandes sont mises de côté dès qu'un groupe est personnalisé.
- Bouton « Réinitialiser les éclairages en AUTO ». Les autres réglages et les choix d'appareillage restent conservés.
- Forfait VMC : **3 bouches incluses**, affectées à **1 cuisine, 1 WC et 1 SDB ou SDE** (aucune quatrième bouche cellule incluse).
- Pour une pièce supplémentaire de ces catégories (autre cuisine, WC, SDB/SDE), +1 bouche automatique et +115 € HT ; l'artisan peut saisir d'autres bouches (cellier, buanderie, etc.) dans un champ distinct. Chaque supplément n'est compté qu'une seule fois.
- Les 3 bouches et le détail des ajouts apparaissent à l'étape Circuits et au résultat, sans ligne fictive à 0 €.
- Tests de non-régression moteur et tests Chromium desktop/mobile étendus à ces fonctionnalités.

## V6.4 — Audit des références et complément catalogue en ligne
- Audit effectué sur les 258 entrées d'appareillage déjà présentes ; voir [AUDIT_REFERENCES_V64.md](./AUDIT_REFERENCES_V64.md) pour les défauts, références confirmées et limites.
- Ajout d'un **JSON public versionné** [catalogue-en-ligne.json](./catalogue-en-ligne.json), alimenté à partir de fiches spécifiques 123elec et Elec44, sous forme d'appendice à la base historique : 12 nouveaux produits et 2 sources de fiches actualisées (270 entrées au total).
- **Prises simples blanches** disponibles en premier par défaut, y compris en prix moyen multi-marques ; sélection par marque/gamme/couleur/modèle exact et accès à la fiche fournisseur.
- Contrôle de composition marque, gamme, génération et finition avant d'additionner mécanisme / enjoliveur / plaque. Un produit sans prix (dont Mosaic blanc simple) reste affiché comme **prix à compléter**, jamais converti en devis définitif.
- Chargement séquentiel : base historique → JSON complément (avec repli si indisponible) → sélecteur → moteur → interface.
- La démo n'est **pas un service de synchronisation de fournisseurs en temps réel**. Le catalogue personnel/standard de la production SpeedArti n'a pas été modifié ; intégration à planifier avec l'équipe.
