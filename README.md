# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.3

La v0.3 ajoute la localisation automatique à partir d’une adresse, tout en conservant le moteur réglementaire structuré introduit en v0.2.

Principales évolutions :

- recherche d’adresse via le service public de géocodage de la Géoplateforme ;
- propositions d’adresses pendant la saisie ;
- remplissage automatique de la commune ;
- affichage du code postal et des coordonnées géographiques ;
- contrôle automatique de l’appartenance à l’Eurométropole de Metz ;
- prise en compte du fait que Lorry-Mardigny n’est pas couverte par le RLPi approuvé en 2025 ;
- conservation de la sélection manuelle des zones ZP / ZE en attendant l’intégration de géométries officielles exploitables ;
- interface responsive améliorée pour téléphone.

## Référentiel réglementaire

Le moteur de pré-analyse repose sur `data/rules.json` et couvre les zones de publicité ZP1 à ZP5-C ainsi que les zones d’enseignes ZE1 à ZE3.

Source principale : règlement écrit officiel du RLPi de l’Eurométropole de Metz, approuvé le 3 février 2025.

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_07_2024/REGLT_VF.pdf

## Architecture

- `index.html` : interface ;
- `styles.css` : présentation responsive ;
- `geocode.js` : recherche d’adresse, commune, coordonnées et périmètre ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles locales structurées et versionnées.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. détermination automatique des zones ZP / ZE à partir de géométries officielles ;
2. ajout d’une carte interactive ;
3. identification de la parcelle cadastrale ;
4. intégration plus fine des règles nationales ;
5. génération d’une fiche d’instruction exportable ;
6. historique des dossiers.
