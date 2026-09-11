# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.6

La v0.6 renforce la fiabilité du zonage assisté et fait de la parcelle cadastrale la référence géographique du dossier.

Principales évolutions :

- la parcelle cadastrale est conservée comme référence du dossier ;
- le zonage affiche désormais explicitement la méthode utilisée ;
- une correspondance par nom de voie ou secteur n’est plus classée « élevée » ;
- les correspondances textuelles passent en confiance **moyenne** et doivent être confirmées sur le plan officiel ;
- les règles communales générales restent classées **à confirmer** ;
- le niveau **élevé** est réservé à une future intersection géographique fiable entre un point/parcelle et une couche officielle de zonage ;
- la ZE continue d’être déduite automatiquement de la ZP ;
- la carte, le géocodage, le cadastre et le moteur réglementaire des versions précédentes sont conservés.

## Niveaux de confiance

- **Élevée** : intersection géographique fiable avec une couche officielle de zonage. Ce niveau est volontairement réservé et n’est pas attribué sur la seule base d’un nom de rue.
- **Moyenne** : nom de secteur ou de voie explicitement reconnu dans le référentiel du RLPi. La ZP proposée doit être confirmée sur le plan officiel.
- **À confirmer** : règle communale indicative ou sélection manuelle.

## Important sur le zonage

Les documents officiels du RLPi diffusent les plans de zonage sous forme cartographique/PDF. Aucune couche SIG officielle exploitable directement en GeoJSON/WFS n’a été identifiée dans les sources publiques consultées.

Atlas ne fabrique donc pas de faux polygones réglementaires. La parcelle permet d’identifier précisément le terrain concerné et servira de clé pour une future intersection géographique dès qu’une couche officielle exploitable sera disponible.

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
- `zoning.js` : carte, cadastre, parcelle, méthode et niveau de confiance du zonage ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles réglementaires structurées ;
- `data/zoning-sectors.json` : référentiel textuel de zonage.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. intégrer une couche SIG officielle si elle devient disponible ;
2. exploiter la parcelle comme clé d’intersection avec le zonage ;
3. améliorer la détection des axes ZP4-A / ZP4-B ;
4. ajouter les protections patrimoniales ;
5. intégrer plus finement les règles nationales ;
6. générer une fiche d’instruction exportable ;
7. historique des dossiers.
