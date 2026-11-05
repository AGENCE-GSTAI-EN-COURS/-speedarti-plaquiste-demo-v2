# SpeedArti — Démo Chiffrage Maçon V2 + Catalogue

## Principe absolu

Le module Maçon reste le module V2 validé. L'intégration catalogue ne remplace aucun calcul métier : elle se branche uniquement après le calcul des quantités, à l'étape **Prix / catalogue**.

## Catalogue Maçon SpeedArti

- 227 articles métier intégrés dans `catalogue-macon.js` ;
- catalogue neutre : aucune enseigne d'origine n'est exposée dans l'interface, le code ou les tests ;
- marque fabricant, produit, référence catalogue, unité de vente et prix artisan moyen HT restent disponibles ;
- le meilleur article compatible et tarifé est retenu automatiquement par SpeedArti ;
- le prix personnel artisan reste prioritaire uniquement lorsqu’il souhaite le modifier ;
- l’absence d’un prix catalogue ne bloque plus l’accès au résultat ; le poste est signalé « à confirmer » sans inventer de valeur ;
- le prix peut être modifié directement depuis le résultat final.

## Correspondance automatique

Le moteur propose des articles selon le poste calculé :

- blocs béton / parpaings ;
- briques terre cuite ;
- béton cellulaire ;
- mortiers / colles ;
- fibres ;
- coffrage ;
- aciers / armatures ;
- étanchéité / protection ;
- enduits / façade ;
- drainage, caniveaux, assainissement, scellement et éléments préfabriqués lorsque le poste le permet.

La sélection est automatique par défaut et reste toujours modifiable par l'artisan.

## Conditionnements

Conversions automatiques autorisées uniquement lorsque l'unité est démontrable :

- unité ↔ pièce ;
- unité ↔ tarif au cent ;
- kg ↔ sac / sachet / boîte avec poids explicite ;
- m² ↔ m², rouleau ou panneau avec surface explicite ;
- m / ml ↔ mètre ou pièce avec longueur explicite ;
- m³ ↔ m³.

Si la conversion n'est pas fiable, le poste reste « à confirmer » sans bloquer l'accès au résultat. L'artisan peut saisir un prix personnel ou choisir un autre article.

## Priorité des prix

1. prix personnel renseigné par l'artisan ;
2. article sélectionné dans le Catalogue Maçon SpeedArti avec conversion compatible ;
3. prix de référence SpeedArti lorsque sa source est démontrable ; sinon poste « à confirmer », sans blocage.

## Balisage

Chaque contrôle généré par `core.js` possède un `data-trace`. Le sélecteur catalogue utilise la trace `catalogSelection` et reste soumis à la règle absolue de balisage.

## Tests

Lancer :

```bash
node tests.mjs
```

Les tests couvrent la V2 métier existante et l'intégration catalogue :

- persistance des sélections ;
- 40 ouvrages accessibles et calculables ;
- prix manquants non bloquants et clairement signalés ;
- parité simple / multi ;
- conditionnement au cent ;
- arrondi des sacs au conditionnement complet ;
- conversion m² ;
- prix personnel prioritaire ;
- incompatibilité d'unité bloquante ;
- absence d'enseigne source dans les fichiers Git Maçon.

## v2.2 — correction correspondance catalogue

Cette version renforce la sélection des articles à l'étape « Prix / catalogue » :

- la catégorie calculée (Béton, Ferraillage, Coffrage, etc.) est prioritaire sur les mots présents dans le libellé de l'ouvrage ;
- une famille catalogue incompatible est exclue avant classement ;
- une unité de vente incompatible est exclue avant affichage ;
- le coffrage exprimé en m² propose uniquement des panneaux/contreplaqués compatibles, jamais des accessoires de coffrage à la pièce ;
- les armatures sont filtrées par rôle métier (chaînage horizontal, vertical, linteau, semelle, treillis, etc.) ;
- lorsque l'ouvrage fournit un linéaire physique, ce linéaire est conservé pour convertir un besoin en armatures de longueur connue, tout en gardant le poids calculé pour le chiffrage ;
- les références dépendantes d'une zone sismique ne sont pas proposées automatiquement tant que cette zone n'est pas renseignée ;
- une ancienne sélection devenue incompatible est ignorée et ne peut plus alimenter le prix.

Les contrôles fonctionnels incluent désormais des scénarios de non-régression dédiés à ces cas.


## v2.3 — audit humain complet et balisage absolu

Corrections issues du contrôle exhaustif du module :

- ajout d’un champ **épaisseur réelle de dalle associée** pour micro-pieux, vide sanitaire et terre-plein ;
- ajout des contrôles **treillis soudé / fibres / type de fibres / dosage** sur les dalles associées ;
- balisage des boutons **Précédent / Suivant** et des retours vers les métiers ;
- suppression des traces mortes du registre de balisage ;
- suppression d’une double ligne d’isolation du plancher sur vide sanitaire ;
- correction du filtrage catalogue des **fibres béton**, afin de proposer uniquement des conditionnements réellement compatibles et d’exclure les lamelles carbone ;
- `assertBalisage()` contrôle désormais aussi les liens interactifs.

Contrôles après correction :

- **53/53 tests fonctionnels** ;
- audit de **208 états d’interface** ;
- **3 289 contrôles interactifs** analysés ;
- 0 contrôle sans balise ;
- 0 balise inconnue ;
- 0 balise morte ;
- 0 contrôle sans liaison ;
- **23/23 contrôles Chromium réels** sur les zones corrigées, sans alerte ni exception JavaScript.


## v2.4 — correction cheminée simple

- le nombre de conduits par défaut `1` est désormais réellement présent dans l’état ;
- le reset du mode simple conserve ce défaut ;
- le calcul d’une cheminée simple ne bloque plus à tort si l’utilisateur ne touche pas au champ.

## v2.5 — modifications Guillaume + séparation des contrôles métier / DTU

La v2.5 reste une évolution du module existant : aucun moteur n’a été recréé depuis zéro. Les décisions métier retournées par Guillaume sont intégrées avec des valeurs visibles et modifiables. Les estimations métier ne sont jamais présentées comme des règles DTU.

### Béton par ouvrage

- suppression du choix de classe béton unique dans les paramètres généraux ;
- classe béton portée par chaque ouvrage béton concerné ;
- compatibilité conservée avec les anciens états v2.4 qui possèdent encore une classe globale enregistrée ;
- aucune classe béton n’est inventée pour un nouveau chiffrage.

### Fondations et soubassements

- vide sanitaire / terre-plein : hauteur de bloc limitée au référentiel Guillaume **20 cm / 25 cm** ;
- hauteur totale calculée automatiquement à partir de la hauteur du bloc et du nombre de rangs ;
- consommations blocs et temps de pose déplacés dans les réglages métier avancés au lieu d’être supprimés du moteur ;
- terre-plein : retrait des choix **poutrelles-hourdis** et **prédalles** de la dalle associée ;
- choix de treillis Guillaume disponible sur les dalles concernées ; **ST25C** proposé comme valeur métier modifiable, sans prétention de dimensionnement structurel.

### Micro-pieux / longrines

- prix micro-pieu proposé selon profondeur : 600 / 900 / 1 300 / 1 700 / 2 200 / 3 000 / 5 000 € HT selon les tranches validées ;
- le prix micro-pieu est traité comme **fourniture + main-d’œuvre incluse** : aucune seconde main-d’œuvre facturée ;
- profondeur utilisée uniquement pour le chiffrage, jamais pour dimensionner automatiquement les micro-pieux ;
- longrine conservée en poste séparé avec référence Guillaume **135 €/ml**, modifiable ;
- quantités physiques béton/acier/coffrage de la longrine restent visibles comme incluses dans le forfait afin de ne pas perdre la traçabilité.

### Murs

- mur préfabriqué : suppression de l’ancien prix de base et de la règle `+30 %` ;
- prix préfabriqué par défaut **350 €/m² HT posé, livré et gruté**, modifiable, hors terrassement, drainage, remblai et fondations éventuelles ;
- heures de pose conservées pour le planning sans double facturation ;
- béton banché : méthodes **Coulé sur place / Préfabriqué** ; les choix Collé / Traditionnel restent réservés aux matériaux maçonnés ;
- chaînage horizontal prérempli à partir du linéaire connu et modifiable ;
- chaînage vertical proposé selon le ratio Guillaume `ceil(périmètre / 3,50) × hauteur`, explicitement affiché comme **estimation réalisée à partir de ratios** et non comme règle DTU ;
- parcours simple Murs / Cloisons qualifié par nature d’ouvrage pour permettre des contrôles normatifs distincts à terme.

### Fibres, transport béton et toupies

- le dosage exact des fibres reste une donnée du moteur, car la quantité = volume béton × dosage ;
- pompe : **950 € HT** par défaut, modifiable ;
- toupie : **190 €/m³ HT**, minimum facturé **6 m³ = 1 140 €**, modifiable ;
- capacité logistique retenue avec Guillaume : **7 m³ maximum par toupie** ;
- mode automatique selon le volume béton ou saisie manuelle du nombre de toupies ;
- prix commercial et estimation du nombre de camions sont conservés comme deux notions distinctes.

### Contrôles v2.5

- **69/69 tests fonctionnels** ;
- audit de **208 états d’interface** ;
- **3 446 contrôles interactifs** analysés ;
- 0 contrôle sans balise ;
- 0 balise inconnue ;
- 0 balise morte ;
- 0 contrôle sans liaison ;
- **6/6 parcours Chromium ciblés v2.5** : terre-plein, micro-pieux, préfabriqué, béton banché, transport béton et chaînage vertical ;
- aucune exception JavaScript observée sur ces parcours ciblés.


## Base de connaissances Angèle Maçon

Le fichier `angel-knowledge.js` expose `SpeedArtiAngelMaconKnowledge` et fournit une base métier interrogeable directement dérivée des règles présentes dans `references.js` et `core.js`.

La base contient notamment :
- les **40 ouvrages Maçon** générés depuis `WORKS`, afin d’éviter toute copie divergente des ratios béton / acier / coffrage / main-d’œuvre ;
- les treillis, fibres, cheminées et tranches de prix micro-pieux présentes dans le référentiel ;
- les règles de toupie, pompe, camion-benne, longrine, murs préfabriqués, chaînages, ouvertures, heures-homme et prix catalogue ;
- les limites de sécurité : aucune réponse Angèle ne doit transformer une estimation de chiffrage en dimensionnement structurel.

API disponible :
- `searchAngelMacon(query, limit)` ;
- `answerAngelMacon(query)` ;
- `getAngelMaconEntry(id)`.

Priorité de connaissance : **moteur réel SpeedArti → référentiel validé → base Angèle → connecteurs → raisonnement IA**. En absence de règle vérifiée, Angèle doit signaler qu’elle ne possède pas la règle au lieu de l’inventer.


## v2.6 — sécurisation audit complet

- double facturation béton/toupie neutralisée ;
- formule des pignons corrigée ;
- prix de référence béton 190 €/m³ et acier générique converti au kg ;
- catalogue inconnu non associé au hasard ;
- recherche Angèle sécurisée ;
- retour en haut à chaque changement d’étape ;
- affichage V2.6 aligné.


## Sprint UX — paramètres SpeedArti

- le taux horaire, la TVA et le nombre d’ouvriers ne sont plus demandés à l’entrée du parcours Maçon ;
- la démo utilise en interne 50 €/h et 1 ouvrier afin de rester testable hors production ;
- le code réel SpeedArti reste la source prévue pour l’intégration : `parametres_utilisateur.taux_horaire`, `taux_par_metier` et `nb_ouvriers_defaut` ;
- aucune modification n’a été faite dans le dépôt SpeedArti de production ;
- la TVA chantier sera qualifiée dans l’étape de vérification dédiée avant le résultat.


## Sprint UX — vérification et TVA

- nouvelle étape **Vérification** entre Prix / catalogue et Résultat ;
- résumé du chantier et raccourcis pour revenir corriger l’ouvrage, les options ou les prix sans perdre les saisies ;
- qualification TVA au dernier moment : neuf 20 %, rénovation/entretien logement < 2 ans 20 %, logement > 2 ans 10 %, rénovation énergétique 5,5 % avec avertissement d’éligibilité ;
- comportement aligné sur le service TVA déjà présent dans SpeedArti, sans connexion à la production depuis la démo ;
- indication explicite du volume réel de béton et du minimum de facturation toupie lorsqu’il s’applique.


## Sprint UX — prix et parcours humain

- les fibres génériques ne récupèrent plus automatiquement un prix de produit dont le dosage fabricant n’est pas validé avec le dosage métier ; elles restent « à confirmer » sans blocage ;
- une référence fibre peut toujours être choisie explicitement par l’artisan ;
- la toupie affiche maintenant le volume réellement nécessaire et le minimum fournisseur lorsqu’il s’applique ;
- l’étape Prix / catalogue montre d’abord le produit retenu et le prix ; références et conditionnements sont repliés dans « Voir / modifier le produit » ;
- le résultat sépare matériaux, transport/livraison, options/prestations, main-d’œuvre et TVA ;
- saisie numérique améliorée sur mobile et retour d’étape renforcé avec défilement vers le haut du wizard.


## Sprint raccordements SpeedArti

Le fichier `speedarti-integration.js` formalise les futurs raccordements sans ouvrir aucune connexion vers la production.

Préparés : paramètres artisan, catalogue personnel/fournisseur/standard, stocks, client, chantier, mesures satellite, calepinage, historique des chiffrages, création de devis, moteur TVA et Angèle.

Le payload d’intégration conserve les unités, quantités, sources de prix, références catalogue, heures-homme, ventilation HT/TVA/TTC et identifie explicitement les postes « à confirmer ».

**Statut : prepared-not-connected.** Le dépôt réel SpeedArti a uniquement été consulté en lecture seule.


## Sprint Angèle — contexte de chiffrage

Angèle Maçon passe en base **MAC-ANGEL-KB-v1.1**.

- contexte courant exposé à chaque rendu : étape, mode, ouvrage, TVA, totaux, heures, lignes, unités, sources de prix et postes à confirmer ;
- réponses contextuelles pour toupie, fibres, TVA, prix à confirmer, total et étape actuelle ;
- les nouvelles règles UX (paramètres artisan automatiques, TVA en vérification, fibres à confirmer, minimum toupie, raccordements SpeedArti) sont ajoutées à la base ;
- les protections structurelles restent prioritaires sur toute réponse contextuelle ;
- futur raccordement prévu avec l’Angèle réelle de SpeedArti via le contrat d’intégration, sans seconde IA indépendante.


## S6.1 — correctifs du test humain Work

Correctifs appliqués exclusivement à la démo Maçon :

- **Murs d’élévation** : la classe béton est maintenant visible pour les chaînages et les ouvrages BA, y compris avec un mur en parpaing ;
- **Ratios parpaing** : proposition préremplie à **10 blocs/m²** et **0,80 h-homme/m²**, toujours modifiable ; aucun ratio automatique n’est appliqué aux autres matériaux sans référentiel validé ;
- **Réglages métier** : la section maçonnerie reste ouverte pendant la saisie pour éviter sa fermeture après chaque modification ;
- **Cheminée** : sélectionner une souche ou un chapeau propose automatiquement une quantité de **1** ; une référence sélectionnée avec quantité nulle produit une alerte explicite ;
- **Arrondis** : HT, TVA et TTC sont arrondis au centime, avec **TTC = HT arrondi + TVA arrondie** ;
- **Angèle Maçon** : base mise à jour en **MAC-ANGEL-KB-v1.2** avec ces nouvelles règles.

Contrôles après correction :

- **117/117 tests fonctionnels** ;
- audit de **209 états d’interface** ;
- **3 452 contrôles interactifs** analysés ;
- 0 contrôle sans balise ;
- 0 balise inconnue ;
- 0 balise morte ;
- 0 contrôle sans liaison.

Le dépôt réel SpeedArti n’a pas été modifié.


## S6.3 — catalogue mur : conditionnements et mortier chantier

- armatures : séparation entre **besoin métier** (ex. kg Guillaume) et **conditionnement fournisseur** (pièce, barre, panneau) ;
- linteau catalogue réf. 1880758 : prix corrigé sur la seule référence vérifiée à **54,00 € HT / pièce de 6 m** (64,80 € TTC public vérifié le 08/10/2026) ;
- une armature vendue à la pièce est facturée par **nombre de pièces réellement commandées**, jamais par kg × prix pièce ;
- prix manuel : lorsqu’un article catalogue est conditionné, le prix saisi suit l’unité de vente réelle du produit ;
- mur parpaing 20 cm traditionnel : suppression du mortier prêt à l’emploi ; décomposition automatique en **ciment + sable 0/4** ;
- proposition de chiffrage : **10,4 kg ciment/m² + 0,0322 m³ sable 0/4/m²**, modifiable ; dosage ciment ≈ **323 kg/m³ de sable**, dans la plage DTU 20.1 **300–350 kg/m³** ;
- Angèle Maçon mise à jour en **MAC-ANGEL-KB-v1.3** ;
- interface estampillée **v2.6.3**.

Cette correction ne remplace pas l’audit complet du catalogue Maçon, prévu séparément après S6.3.


## S6.4 — navigation et référentiels internes

- la démo démarre toujours à **l’étape 1** : l’étape courante n’est plus sauvegardée dans le navigateur ;
- les étapes déjà parcourues sont directement accessibles pour revenir en arrière ;
- les consommations par m², temps unitaires et dosages internes sont des **données SpeedArti** et ne sont plus affichés comme réglages artisan ;
- murs parpaing : les référentiels internes continuent d’alimenter automatiquement blocs, main-d’œuvre, ciment et sable ;
- soubassements et refends : les valeurs internes SpeedArti sont appliquées automatiquement lorsque aucun ancien override n’est présent ;
- Angèle Maçon : **MAC-ANGEL-KB-v1.4** ;
- interface : **v2.6.4**.


## S6.5 — pré-production Guillaume

- **Escalier retiré** du module Maçon : plus de parcours simple, plus de carte multi, plus d’accès indirect via Ouvrage BA ; les anciennes sessions contenant un escalier sont nettoyées au chargement.
- **Mur de refend en soubassement** : ajout d’une semelle filante sous le refend, avec largeur/hauteur reprises de la semelle principale par défaut et modifiables.
- **Coffres tunnels** : ajout des variantes brique et résine, chiffrées au ml avec prix HT/ml explicite en attendant l’audit catalogue.
- **Seuil BA** : la hauteur de baie n’est plus demandée ; seule la largeur utile au seuil est conservée.
- **Mobile / options fondations** : les saisies numériques sont enregistrées sans rerendu complet du formulaire ; seuls les choix structurants continuent de rerendre l’écran.
- **Isolation plancher / dalle VS** : prix HT/m² obligatoire et repris dans le calcul.
- **Génoise simple / double** : prix HT/ml obligatoire et repris dans le calcul.
- Angèle Maçon : **MAC-ANGEL-KB-v1.5**.
- Interface : **v2.6.5**.

Ces prix manuels temporaires (coffres tunnels, isolation, génoises) restent à auditer avec le catalogue Maçon avant toute intégration production.


## v2.6.6 — retour Guillaume du 5 novembre 2026

- micro-pieux : longrines avec becquet et sans becquet utilisables simultanément ;
- sections de longrines laissées explicites et modifiables, sans dimensionnement structurel automatique ;
- appui fenêtre BA : suppression de la hauteur d’ouverture inutile ;
- linteau BA : un seul choix métier, avec longueur + référence courant/renforcé ;
- talonnettes : quantité + forfait unitaire 150 € HT par défaut ;
- accordéons Options / Préparation / Finitions conservés ouverts après sélection ;
- contrôles bloquants remontés dès l’étape de saisie ;
- fibres dalle courante et traitement anti-termite raccordés au catalogue existant ;
- connaissances Ángel enrichies (MAC-ANGEL-KB-v1.6) ;
- tests de non-régression S6.6 ajoutés.

La liste des sections prédéfinies de longrines n’est pas inventée par SpeedArti : elle doit provenir d’un référentiel validé par Guillaume / étude structure avant d’être proposée automatiquement.
