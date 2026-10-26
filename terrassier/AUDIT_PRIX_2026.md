# Audit technique et tarifaire Terrassier V1.2 — 26 octobre 2026

## Tarifs dans le dépôt

Le fichier `assets/v12-data.mjs` liste **des montants unitaires HT** et leur origine. Les prix 2024–2025 proviennent de `src/services/chiffrage/regles/terrassier.bpu.ts` dans le dépôt production consulté en lecture seule. Les lignes complémentaires sont notées `Provision interne V1.2, non sourcée fournisseur`.

La bibliothèque personnalisée permet de définir le tarif sur l'appareil, et de noter sa provenance manuellement. La sauvegarde s'effectue dans `localStorage`, non en production. L'export JSON contient les paramètres et les corrections par prestation.

## Comparaisons indicatives 2026

- Location de mini-pelle 3 t : les prix publics varient fortement selon loueur, ville, durée et prestations incluses. Le prix historique de 350 €/jour ne constitue pas un prix de marché garanti en 2026. Relevés de certaines grilles Loxam 2026 : https://pellejaune.fr/prix-location-mini-pelle/ ; comparatif complémentaire : https://www.travaux.com/demolition-evacuation/guide-des-prix/prix-de-location-dengins-de-terrassement
- Béton prêt à l'emploi : selon Hellopro, environ 120–180 €/m³ en moyenne en octobre 2026, avec de larges écarts selon les transports et les classes. Le tarif B25 hérité de 120 €/m³ est susceptible d'être inférieur au prix livré réellement applicable. https://conseils.hellopro.fr/combien-coute-le-beton-pret-a-l-emploi-4395.html

Pour la plupart des lignes (enrobés par tonne, décharges, regards, tuyaux, drains, bordures, transports, finisseur, consommables), les sources disponibles ne permettent pas de certifier une valeur 2026 locale et comparable. **Conserver les prix historiques/provisions visibles**, et demander à l'artisan de confirmer un prix fournisseur.

## Mise en garde sur le calcul

Les 25 sous-types possèdent des recettes distinctes, mais celles-ci sont des estimations et non des bordereaux DTU contractuels. Ne jamais utiliser ces prix pour créer directement un devis signé sans validation des quantités, pertes, fournitures complémentaires, transports, sécurité et prix fournisseurs. Les prestations partielles affichent des avertissements explicites.

## Travaux supplémentaires avant mise en production

1. Sources fournisseurs 2026 vérifiées, avec unités, HT/TTC, date, région, livraison et remise
2. Adaptation locale des rendements, prise en compte évacuation transport/décharge, rotations et disponibilité des engins
3. Études et postes obligatoires pour fondations profondes, eau potable, réseaux secs, ANC, diagnostics démolition
4. Couverture automatisée des variantes matériaux et prévention des doubles comptes entre fourniture et pose
5. Qualification avec terrassiers et validation des règles de sécurité et réglementation à date
