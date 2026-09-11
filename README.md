# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## Version actuelle — v1.2

Atlas combine désormais :

- géocodage d’adresse avec distinction adresse précise / voie indicative ;
- parcelle cadastrale ;
- zonage RLPi avec niveau de confiance ;
- contrôles patrimoniaux AC1 / AC2 / AC4 via le Géoportail de l’Urbanisme ;
- moteur de pré-analyse RLPi ;
- première couche de règles nationales ciblées ;
- fiche de pré-analyse exportable ;
- historique local des dossiers ;
- tests automatiques GitHub Actions.

## v1.0 — règles nationales ciblées

La v1.0 ajoute des contrôles prudents sur :

- publicité hors agglomération — Code de l’environnement, art. L.581-7 ;
- publicité / préenseigne sur arbre — art. L.581-4 ;
- certains dispositifs publicitaires non lumineux au sol visibles depuis autoroute, bretelle, route express, déviation ou voie hors agglomération — art. R.581-31 ;
- autres cas de visibilité autoroutière : réserve et contrôle complémentaire au titre des règles nationales / Code de la route.

Ces contrôles ne couvrent pas toutes les exceptions et dispositions nationales.

## v1.1 — fiche exportable

Après analyse, Atlas permet :

- **Imprimer / PDF** via la fonction d’impression du navigateur ;
- **Copier la fiche** sous forme de synthèse texte avec adresse, parcelle, zonage, dispositif, conclusion et contrôles.

## v1.2 — historique des dossiers

Atlas peut enregistrer jusqu’à 30 dossiers dans le stockage local du navigateur.

Fonctions :

- enregistrer un dossier analysé ;
- restaurer les champs et l’instantané du résultat ;
- supprimer un dossier ;
- effacer l’historique complet.

Un dossier restauré doit être regéocodé avant une nouvelle analyse afin de réactualiser parcelle, zonage et patrimoine. L’historique reste local au navigateur et peut disparaître si les données du site sont effacées.

## Sources patrimoniales

Atlas interroge :

`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup`

Catégories suivies :

- AC1 : monuments historiques / abords ;
- AC2 : sites inscrits / classés ;
- AC4 / AC4 bis : sites patrimoniaux remarquables et protections associées.

Une absence de résultat automatique ne constitue pas une preuve juridique d’absence de protection.

## Zonage RLPi

Niveaux de confiance :

- **Élevée** : réservée à une intersection géographique fiable avec une couche officielle ;
- **Moyenne** : indice textuel par voie ou secteur ;
- **À confirmer** : règle indicative ou sélection manuelle.

## Tests automatiques

Le workflow GitHub Actions **Atlas self-test** vérifie :

- les adresses de référence ;
- la précision du géocodage ;
- les services parcelle / patrimoine ;
- la présence des fonctions critiques de la version courante.

## Référentiel

Règlement écrit RLPi de l’Eurométropole de Metz :

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_07_2024/REGLT_VF.pdf

Plan officiel :

https://www.eurometropolemetz.eu/fileadmin/user_upload/mediatheque_metropole/telechargement/RLPi/Docs_arret/Zonage_pubs_V5_compressed.pdf

Code de l’environnement — publicité, enseignes et préenseignes :

https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074220/LEGISCTA000006159442/

## Architecture

- `index.html` : interface ;
- `styles.css` : présentation responsive ;
- `geocode.js` : adresse et précision ;
- `zoning.js` : carte, parcelle et zonage ;
- `heritage.js` : protections patrimoniales ;
- `app.js` : moteur RLPi + contrôles nationaux ciblés ;
- `export.js` : fiche d’instruction ;
- `history.js` : historique local ;
- `scripts/selftest.mjs` : tests automatiques ;
- `data/rules.json` : règles structurées ;
- `data/zoning-sectors.json` : référentiel textuel du zonage.

## Important

Atlas fournit une pré-analyse. Une décision définitive doit être confrontée aux documents opposables, au Code de l’environnement, au Code de la route, aux protections patrimoniales, aux autorisations applicables et aux particularités du terrain.

## Prochaines étapes

1. améliorer la détection des axes ZP4-A / ZP4-B ;
2. intégrer une couche SIG officielle de zonage si une géométrie exploitable devient disponible ;
3. enrichir progressivement les contrôles nationaux et cas particuliers ;
4. envisager un stockage synchronisé multi-appareils pour les dossiers.
