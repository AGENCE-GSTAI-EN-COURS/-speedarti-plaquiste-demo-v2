# SpeedArti — Plombier v0.8.1 — Sources Sprint F

## Demande métier — 21 octobre 2026

- remplacer le libellé « Distance chauffe-eau → salle de bain » par « Distance chauffe-eau → distance moyenne salle de bain » ;
- pouvoir répliquer toute la configuration d’un sanitaire complet vers les autres éléments similaires.

## Règle de copie sécurisée

Une cible est similaire si :
- même `kind` ;
- même `subtype` ;
- pour un évier : même `config` ;
- pour un élément spécifique : même désignation.

La copie conserve toujours :
- `id` cible ;
- `zone` cible.

Tout le reste des caractéristiques configurables du sanitaire source est recopié. Aucun rapprochement entre sous-types différents n’est autorisé.

## Source métier principale

Retour Guillaume transmis le 8 octobre 2026.

Règles ajoutées :
- distance chauffe-eau appliquée à EF et EC car nourrices généralement proches du chauffe-eau ;
- lave-main alimenté en EF + EC avec platine double ;
- choix rapide robinet Oui/Non sur lavabo/vasque, meuble vasque et lave-main ;
- automatisation et visibilité renforcées des composants déjà validés ;
- habitudes entreprise généralisées aux accessoires réellement sélectionnés ;
- navigation catalogue plus visuelle ;
- préparation future de CCL et d’autres fournisseurs sans données inventées.

## Sources catalogue

### Actif
- Téréva 2026 embarqué ;
- 7 456 références ;
- 7 451 prix exploitables.

### Préparés mais inactifs
- CCL ;
- autre fournisseur.

Aucune référence, aucun prix et aucun stock CCL ne sont ajoutés tant qu’un catalogue réel n’est pas importé.

## Références automatiques conservées

- siphon lavabo/vasque : `1054371` ;
- bonde lavabo/vasque : `2864095` ;
- bonde lave-main : `997361L` ;
- douche standard : `4273010` ;
- douche extra-plate : `4281682` ;
- baignoire : `767547L` + `4273012` ;
- évier simple : `4272991` + `1066748` ;
- évier double : `4273023` + `1066748` ;
- WC à poser : fixation `1085426`.

## Règles de prudence conservées

- pas de temps sanitaire inventé ;
- pas de référence technique inventée ;
- pas de produit CCL inventé ;
- pas de pipe WC automatique ;
- pas de bonde générique imposée à la douche italienne ;
- pas de DN inventé sur élément spécifique ;
- sélection chantier > habitude entreprise > défaut SpeedArti validé.
