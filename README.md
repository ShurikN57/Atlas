# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.9

La v0.9 croise désormais le résultat réglementaire avec la qualité de localisation du dossier.

Principales évolutions :

- intégration de la précision de l’adresse dans la conclusion ;
- prise en compte de la fiabilité du zonage RLPi ;
- intégration directe du contrôle patrimonial AC1 / AC2 / AC4 dans le résultat ;
- une adresse sans numéro précis ou une parcelle indicative empêche une conclusion automatique ;
- une ZP/ZE non déterminée ou un zonage restant à confirmer est signalé explicitement ;
- une protection patrimoniale détectée entraîne une réserve et un contrôle complémentaire ;
- un service patrimonial indisponible entraîne une conclusion « Impossible de conclure automatiquement » ;
- quatre états de conclusion sont désormais distingués :
  - **Conforme RLPi** ;
  - **Conforme sous réserves / à vérifier** ;
  - **Non conforme / à corriger** ;
  - **Impossible de conclure automatiquement**.

## Sources patrimoniales

Atlas interroge l’API du Géoportail de l’Urbanisme :

`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup`

Les catégories suivies correspondent notamment à :

- AC1 : servitudes relatives aux monuments historiques ;
- AC2 : sites inscrits et classés ;
- AC4 / AC4 bis : sites patrimoniaux remarquables, PVAP et protections patrimoniales associées.

Ces résultats sont informatifs. Une absence de résultat automatique ne vaut pas preuve juridique de l’absence de protection : les documents opposables, les actes de servitude et, lorsque nécessaire, l’avis de l’Architecte des Bâtiments de France restent à vérifier.

## Zonage RLPi

La logique prudente est conservée :

- **Élevée** : réservée à une intersection géographique fiable avec une couche officielle ;
- **Moyenne** : indice par nom de secteur ou voie explicitement reconnu ;
- **À confirmer** : règle indicative ou sélection manuelle.

La parcelle cadastrale reste la référence géographique du dossier lorsqu’une adresse précise a été géocodée.

## Tests automatiques

Le workflow GitHub Actions **Atlas self-test** vérifie automatiquement des adresses de référence et les services de géocodage, parcelle et patrimoine. Il permet de contrôler les régressions sans dépendre uniquement des tests manuels sur mobile.

## Référentiel réglementaire

Le moteur de pré-analyse repose sur :

- `data/rules.json` : règles locales ZP1 à ZP5-C et ZE1 à ZE3 ;
- `data/zoning-sectors.json` : secteurs explicitement nommés et règles communales utiles au zonage assisté.

Source principale : règlement écrit officiel du RLPi de l’Eurométropole de Metz, approuvé le 3 février 2025.

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_07_2024/REGLT_VF.pdf

Plan officiel :

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_arret/Zonage_pubs_V5_compressed.pdf

## Architecture

- `index.html` : interface ;
- `styles.css` : présentation responsive ;
- `geocode.js` : recherche d’adresse, précision et périmètre ;
- `zoning.js` : carte, cadastre, parcelle, méthode et niveau de confiance du zonage ;
- `heritage.js` : interrogation des protections patrimoniales AC1 / AC2 / AC4 ;
- `app.js` : moteur de pré-analyse et croisement des contraintes ;
- `data/rules.json` : règles réglementaires structurées ;
- `data/zoning-sectors.json` : référentiel textuel de zonage ;
- `scripts/selftest.mjs` : tests automatiques des services et adresses de référence.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les autorisations administratives, les documents patrimoniaux opposables et les particularités du terrain.

## Prochaines étapes

1. intégrer plus finement les règles nationales du Code de l’environnement et du Code de la route ;
2. améliorer la détection des axes ZP4-A / ZP4-B ;
3. générer une fiche d’instruction exportable ;
4. ajouter l’historique des dossiers ;
5. intégrer une couche SIG officielle de zonage si elle devient disponible.
