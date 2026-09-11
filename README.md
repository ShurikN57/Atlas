# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.4

La v0.4 ajoute une vraie couche géographique au moteur réglementaire.

Principales évolutions :

- géocodage d’adresse via la Géoplateforme IGN ;
- carte interactive Leaflet / OpenStreetMap ;
- recherche automatique de la parcelle cadastrale via le géocodage inverse IGN ;
- affichage commune, code postal, coordonnées et périmètre RLPi ;
- déduction automatique de la zone enseigne ZE à partir de la ZP ;
- reconnaissance assistée de plusieurs secteurs d’activités explicitement nommés dans le RLPi (notamment ZP5-A et ZP5-B) ;
- conservation d’une sélection manuelle de la ZP lorsque la géométrie officielle ne permet pas encore une détermination automatisée fiable.

### Correspondance ZP → ZE utilisée

- ZP1 / ZP2 → ZE1 ;
- ZP3 / ZP4-A / ZP4-B / ZP5-B → ZE2 ;
- ZP5-A / ZP5-C → ZE3.

Cette correspondance est issue de la définition des zones d’enseignes du RLPi.

## Référentiel réglementaire

Le moteur de pré-analyse repose sur `data/rules.json` et couvre les zones de publicité ZP1 à ZP5-C ainsi que les zones d’enseignes ZE1 à ZE3.

Source principale : règlement écrit officiel du RLPi de l’Eurométropole de Metz, approuvé le 3 février 2025.

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_07_2024/REGLT_VF.pdf

## Architecture

- `index.html` : interface ;
- `styles.css` : présentation responsive ;
- `geocode.js` : recherche d’adresse et localisation ;
- `zoning.js` : carte, parcelle et aide au zonage ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles locales structurées et versionnées.

## Limite actuelle

Le plan réglementaire officiel existe en PDF, mais un jeu de polygones RLPi officiel directement exploitable par Atlas n’a pas encore été identifié. La v0.4 ne prétend donc pas déterminer automatiquement toutes les ZP : elle automatise ce qui peut l’être de manière fiable et demande une confirmation lorsque le zonage exact reste incertain.

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. intégrer les polygones officiels du zonage RLPi dès qu’une source SIG exploitable est disponible ;
2. afficher les zones RLPi directement sur la carte ;
3. intégrer plus finement les règles nationales ;
4. générer une fiche d’instruction exportable ;
5. historique des dossiers.
