# SpeedArti — Terrassier (démonstration autonome)

Module inséré dans le dépôt partagé des démonstrations métiers, chemin public `/terrassier/`.

Source étudiée **uniquement en lecture** : `GSTAI-Sp/speedarti-v2` — TerrassierDimensionsStep, TerrassierOptionsStep, TerrassierCalculateur, terrassier.bpu et terrassier.rules.json.

Contenu : 5 familles (terrassement/fondations, chemins/parkings, enrobés, réseaux, démolition), dimensions, nature du sol, location d'engins, fournitures, main-d'œuvre, TVA, alertes, export CSV et impression.

**Attention :** adaptation isolée du fonctionnement V2, pas une copie à l'identique ou un moteur certifié. Tarifs de référence 2024–2025 non vérifiés pour 2026. Les options non chiffrées sont signalées. Aucune donnée envoyée en production et aucun accès Supabase.

Tests : `node --test terrassier/tests/engine.test.mjs`.

Règle d'intégration ultérieure : actualiser la base de connaissances EXISTANTE d'Ángel, sans créer de base parallèle. SpeedArti V2 doit rester en lecture seule.
