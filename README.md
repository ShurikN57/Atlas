# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.2

La v0.2 introduit un véritable référentiel réglementaire séparé du code de l’interface (`data/rules.json`).

Principales évolutions :

- intégration des zones de publicité ZP1, ZP2, ZP3, ZP4-A, ZP4-B, ZP5-A, ZP5-B et ZP5-C ;
- intégration des zones d’enseignes ZE1, ZE2 et ZE3 ;
- contrôle des surfaces, hauteurs, densités et interdictions principales ;
- règles distinctes pour les dispositifs au sol, muraux, perpendiculaires, sur clôture, toiture, mobilier urbain, bâche et palissade de chantier ;
- prise en compte des dispositifs numériques ;
- exception des stations-service affichant les tarifs carburants et des services d’urgence en ZE1 / ZE2 ;
- contrôle du seuil de 20 m de linéaire pour certains dispositifs publicitaires au sol ;
- prise en compte du nombre d’activités sur une même unité foncière pour les dispositifs mutualisés ;
- rappel de l’extinction des enseignes lumineuses ;
- alerte renforcée en cas de visibilité depuis une autoroute ou une voie express.

## Source réglementaire

Référentiel construit à partir du règlement écrit officiel du RLPi de l’Eurométropole de Metz, approuvé le 3 février 2025 :

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_07_2024/REGLT_VF.pdf

## Architecture

- `index.html` : interface ;
- `styles.css` : présentation ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles locales structurées et versionnées.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. géocodage automatique de l’adresse ;
2. détermination automatique des zones ZP / ZE depuis les cartes du RLPi ;
3. intégration plus fine des règles nationales ;
4. carte interactive ;
5. génération d’une fiche d’instruction exportable ;
6. historique des dossiers.
