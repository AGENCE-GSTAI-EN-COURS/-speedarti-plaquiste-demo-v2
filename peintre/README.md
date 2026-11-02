# SpeedArti — Peintre V0.1 (développement isolé)

## Où se trouve le module ?
Le module Peintre est ajouté dans le **dépôt multi-métiers existant**, à côté de Plaquiste, Maçon, Couvreur, Plombier, Électricien et Terrassier. Aucun nouveau dépôt n'est nécessaire.

- Ouvrir localement avec un serveur statique, depuis la racine : python3 -m http.server 8000 puis /peintre/
- Exécuter les tests : node --test peintre/tests.mjs
- Code statique sans Supabase, API, abonnement, catalogue réel ni enregistrement de devis.
- Développer et tester sur la branche feature/peintre-v1-isole ; **ne pas fusionner vers main / GitHub Pages sans validation**, car Pages pourrait publier automatiquement.

## Historique de référence
- Audit **lecture seule** de GSTAI-Sp/speedarti-v2 : PeintreCalculateur.ts, PeintreDimensionsStep.tsx, PeintreOptionsStep.tsx, peintre.rules.json et tests.
- Fonctionnalités reprises : pièce simple/multi-pièces, déduction d'ouvertures, murs/plafonds, sous-couche, préparation, boiseries, plinthes, papier peint, forfaits, temps de main-d'œuvre.
- Les coefficients de prix codés en dur dans le vieux moteur (10 €/L, forfaits, etc.) **ne sont pas repris**.
- Les options « supports/finitions » ne sont pas des contrôles DTU automatiques ; un éventuel contrôle normatif demandera une source documentée.
- Décisions Guillaume historiques de juillet 2026 : préparations en 4 niveaux, pertes peinture 10 %, papier peint 20 %, forfaits boiseries discutés, couleur ×2 historiquement évoqué. **Ces tarifs/coefs historiques ne deviennent pas des prix 2026 confirmés**. Les prix sont saisis par l'artisan / le futur catalogue.

## Calculs V0.1
- Pour chaque pièce rectangulaire : murs bruts = 2 × (longueur + largeur) × hauteur.
- Ouvertures : somme largeur × hauteur × quantité, déduite des murs, pas du plafond.
- Plafond, murs à peindre et murs en papier peint sont des surfaces **distinctes**.
- Peinture : litres théoriques = surface × couches / rendement fabricant ; litres à commander = litres théoriques × (1 + pertes %).
- Conditionnements : pots à acheter = ceil(litres à commander / taille du pot), et coût de fourniture = pots × prix du pot.
- Boiseries : surface dédiée renseignée manuellement, **jamais additionnée aux murs pour être repeinte deux fois**.
- Plinthes : linéaire = somme des périmètres moins largeur des portes ; fourniture de peinture à confirmer.
- Papier peint : nombre de rouleaux **indicatif par surface** et pertes ; nécessite confirmation du calepinage/raccords.
- Main-d'œuvre : heures-homme = quantité × temps unitaire saisi ; durée chantier = heures-homme / effectif.
- Forfaits spéciaux (escaliers, verrières…) : prix unitaire **pose incluse** ; heures à titre de planning, non refacturées comme main-d'œuvre.
- TVA : saisie explicite par l'artisan, **jamais automatique à partir de l'âge du bâtiment**.
- Si un prix ou un rendement obligatoire manque : « À confirmer ». **Ne jamais présenter un sous-total partiel comme total de devis**.

## Limites et à faire avant toute intégration
1. Vérification humaine des calculs et des scénarios de terrain (portes, plafond, plusieurs pièces, devis complexes).
2. Matériaux de préparation / peinture plinthes : références, quantités et conditionnements à compléter ; éviter tout faux devis « complet ».
3. Calepinage professionnel des lés (raccords, hauteurs de lés, motifs) à enrichir.
4. Catalogue personnel/standard, suivi stock, vrai devis, TVA chantier, clients et historiques : **adaptateur non connecté**.
5. Connaissances métier Ángel : dossier de delta préparé, **à intégrer dans la base Ángel existante uniquement**, aucune base parallèle ni assistant autonome.
6. Revoir les prix historiques avec les fournisseurs en novembre 2026 avant toute suggestion automatique.

## Sécurité
- GSTAI-Sp/speedarti-v2 : **LECTURE SEULE ABSOLUE**.
- Rien ici n'est déployé dans SpeedArti et aucun code backend n'est appelé.
- Code ouvert sur branche isolée, sans intervention sur les autres métiers du dépôt.
