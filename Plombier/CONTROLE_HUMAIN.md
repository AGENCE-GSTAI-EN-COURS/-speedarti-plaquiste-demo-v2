# SpeedArti — Plombier v0.8.1 — Contrôle humain ciblé

Date : 2026-10-21

## À vérifier dans le navigateur

1. Étape 1 : le champ doit afficher **« Chauffe-eau → distance moyenne salle de bain (m) »**.
2. Ajouter deux WC suspendus dans des zones différentes.
3. Configurer entièrement le premier WC suspendu : produit, accessoires, options et temps.
4. Vérifier que le bouton **« Appliquer les caractéristiques aux éléments similaires »** apparaît directement dans la fiche sanitaire ouverte si une cible compatible existe. Sinon, vérifier le message expliquant qu'aucun sanitaire compatible n'est disponible.
5. Cliquer sur le bouton.
6. Vérifier que le second WC suspendu récupère les caractéristiques mais conserve sa propre zone.
7. Ajouter un WC à poser : vérifier qu’il n’est pas modifié par la copie depuis le WC suspendu.
8. Tester la même logique sur deux éviers identiques ; vérifier qu’un évier simple ne copie pas vers un double.
9. Tester sur desktop, tablette et mobile, y compris avec le panier chantier visible, sans colonne écrasée ni texte vertical dans les sections Équipement principal, PMR et Temps de pose.
10. Vérifier qu'après avoir modifié le sous-type d'un des deux WC, la copie n'est plus proposée tant que les sous-types diffèrent.

## Statut logique

**653 / 653 assertions réussies en auto-contrôle (logique + garde-fous CSS/HTML).**

La validation ergonomique finale dépend du contrôle navigateur ci-dessus.
