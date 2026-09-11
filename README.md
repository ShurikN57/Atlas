# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.5

La v0.5 renforce le zonage assisté sans simuler de précision géographique qui n’est pas disponible dans les sources publiques exploitées.

Principales évolutions :

- référentiel de secteurs de zonage séparé dans `data/zoning-sectors.json` ;
- reconnaissance des secteurs ZP5-A et ZP5-B explicitement nommés dans le règlement ;
- contrôle de cohérence avec la commune ;
- règles communales assistées pour Vaux, Gravelotte et Ars-sur-Moselle ;
- affichage d’un niveau de confiance : élevé, moyen ou à confirmer ;
- déduction automatique ZE depuis la ZP ;
- lien direct vers le plan officiel des zonages ;
- conservation de la carte, du géocodage et de la recherche cadastrale introduits en v0.4 ;
- interface mobile adaptée à l’iPhone.

## Important sur le zonage

Les documents officiels du RLPi diffusent les plans de zonage sous forme cartographique/PDF. Aucune couche SIG officielle exploitable directement en GeoJSON/WFS n’a été identifiée dans les sources publiques consultées.

Atlas ne fabrique donc pas de faux polygones réglementaires :

- niveau **élevé** : secteur explicitement nommé dans le règlement et reconnu dans l’adresse ;
- niveau **moyen** : règle communale générale issue du règlement, à confirmer ;
- niveau **à confirmer** : consultation du plan officiel nécessaire.

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
- `geocode.js` : recherche d’adresse et périmètre ;
- `zoning.js` : carte, cadastre et zonage assisté ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles réglementaires structurées ;
- `data/zoning-sectors.json` : référentiel textuel de zonage.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. intégrer une couche SIG officielle si elle devient disponible ;
2. améliorer la détection des axes ZP4-A / ZP4-B ;
3. ajouter les protections patrimoniales ;
4. intégrer plus finement les règles nationales ;
5. générer une fiche d’instruction exportable ;
6. historique des dossiers.
