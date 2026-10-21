# Connaissances Ángel — delta Électricien V6.5

Date : 21 octobre 2026. Statut : **PRÉPARÉ — INTÉGRATION DANS LA BASE EXISTANTE À TRAITER**.

Ce document est une proposition de mise à jour des connaissances existantes, pas une base Ángel parallèle. Aucune écriture en production ou dans Supabase, aucun changement de `GSTAI-Sp/speedarti-v2`.

## Règles à rattacher aux connaissances Électricien existantes

1. Une référence de pack fournisseur n'est pas nécessairement une référence fabricant. Utiliser `Référence fournisseur`, `Références fabricant` et la composition pour expliquer ce qui est acheté.
2. Un mécanisme, même précâblé, n'est pas un ensemble complet sans plaque et, selon la gamme, enjoliveur/support. S920062 et S920072 sont des mécanismes ; NU305918 exige plaque et support séparés.
3. Ne pas recomposer automatiquement selon la seule couleur. Utiliser un kit documenté ou l'une des quatre nomenclatures explicitement contrôlées dans le JSON V6.5. Ne pas mélanger Odace 2011/2025 ni Céliane historique/2024.
4. Distinguer simple allumage, va-et-vient, poussoir et permutateur. Le montage à trois commandes retenu dans cette démo utilise deux va-et-vient et un permutateur. Un montage à poussoirs/télérupteur exige une étude et un chiffrage distincts ; il n'est pas déduit automatiquement.
5. Les prix sont des prix publics indicatifs, datés, hors transport et conditions de compte, convertis en HT à TVA fournisseur 20 %. La TVA du chantier relève du devis, pas de cette conversion fournisseur. Ne jamais annoncer un prix d'achat artisan, un stock garanti ou un tarif en direct.
6. Seules les compositions complètes vérifiées avec prix entrent dans les moyennes. Les historiques restent à confirmer. Une référence sauvegardée devenue indisponible ne doit pas être remplacée silencieusement.
7. Pour la rénovation ou un total global manuel ne détaillant pas les types de commandes achetées : demander la répartition ; ne pas présenter le résultat comme définitif.
8. Conserver les règles existantes V6.3/V6.4, dont le forfait VMC à trois bouches ; cette évolution ne les remplace pas.

## Données à intégrer

Source versionnée : `catalogue-en-ligne.json`, accompagnée de `AUDIT_REFERENCES_V65.json` et du rapport V6.5. Importer les références avec leur marque, gamme, génération, fonction, finition, pose, nomenclature, source, date, statut et base HT/TTC. Conserver l'identité existante des articles et l'historique des relevés ; dédupliquer aussi par fournisseur pour les packs.

Ne pas marquer les 122 historiques à confirmer comme vérifiés. Le prix exact du pack Mosaic 278111L-1121-C reste inconnu ; un prix « dès » n'est pas un prix de composition sélectionnée.

## Dépendances avant passage en production

- Anne-Sophie : identifier le point d'import et les identifiants de connaissance Électricien existants ; revoir les écarts de schéma sans créer de nouvelle base.
- Thibault/Guillaume : valider les compositions, la rénovation et la couverture métier restante.
- Accès autorisé de staging : importer en dry-run, comparer avant/après, tester la récupération des références et des règles par Ángel.
- Vérifier les réponses vocales et manuelles, y compris les prix inconnus, puis décider séparément d'une intégration en production.

**Connaissances Ángel : dépendance identifiée ; intégration non effectuée.**
