# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## v0.7

La v0.7 ajoute un contrôle patrimonial automatique au point géocodé, en complément du zonage RLPi et de la parcelle cadastrale.

Principales évolutions :

- interrogation automatique des Servitudes d’Utilité Publique du Géoportail de l’Urbanisme après sélection d’une adresse ;
- détection des catégories **AC1** : monuments historiques et abords ;
- détection des catégories **AC2** : sites inscrits et classés ;
- détection des catégories **AC4 / AC4 bis** : sites patrimoniaux remarquables et protections associées ;
- affichage séparé des protections patrimoniales détectées ;
- alerte lorsqu’un contrôle complémentaire patrimonial / ABF peut être nécessaire ;
- conservation du géocodage, de la parcelle, de la carte, du zonage assisté et du moteur RLPi des versions précédentes.

## Sources patrimoniales

Atlas interroge l’API du Géoportail de l’Urbanisme :

`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup`

Les catégories suivies correspondent notamment à :

- AC1 : servitudes relatives aux monuments historiques ;
- AC2 : sites inscrits et classés ;
- AC4 / AC4 bis : sites patrimoniaux remarquables, PVAP et protections patrimoniales associées.

Ces résultats sont informatifs. Une absence de résultat automatique ne vaut pas preuve juridique de l’absence de protection : les documents opposables, les actes de servitude et, lorsque nécessaire, l’avis de l’Architecte des Bâtiments de France restent à vérifier.

## Zonage RLPi

La logique prudente de la v0.6 est conservée :

- **Élevée** : réservée à une intersection géographique fiable avec une couche officielle ;
- **Moyenne** : indice par nom de secteur ou voie explicitement reconnu ;
- **À confirmer** : règle indicative ou sélection manuelle.

La parcelle cadastrale reste la référence géographique du dossier.

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
- `heritage.js` : interrogation des protections patrimoniales AC1 / AC2 / AC4 ;
- `app.js` : moteur de pré-analyse ;
- `data/rules.json` : règles réglementaires structurées ;
- `data/zoning-sectors.json` : référentiel textuel de zonage.

## Important

Atlas fournit une pré-analyse. Une instruction définitive doit également prendre en compte les dispositions nationales du Code de l’environnement, le Code de la route, les protections patrimoniales, les autorisations administratives et les particularités du terrain.

## Prochaines étapes

1. intégrer les alertes patrimoniales directement dans le résultat d’analyse ;
2. intégrer plus finement les règles nationales du Code de l’environnement ;
3. améliorer la détection des axes ZP4-A / ZP4-B ;
4. générer une fiche d’instruction exportable ;
5. ajouter l’historique des dossiers.
