# Atlas

Application web d’assistance à la pré-analyse des dispositifs de publicité, enseignes et préenseignes sur le territoire de l’Eurométropole de Metz.

## Version actuelle — v1.4

Atlas combine désormais :

- géocodage d’adresse avec distinction adresse précise / voie indicative ;
- recherche de lieux et établissements via l’index POI de la Géoplateforme ;
- parcelle cadastrale ;
- zonage RLPi avec niveau de confiance ;
- contrôles patrimoniaux AC1 / AC2 / AC4 via le Géoportail de l’Urbanisme ;
- moteur de pré-analyse RLPi ;
- première couche de règles nationales ciblées ;
- fiche de pré-analyse exportable ;
- historique local des dossiers ;
- prise en compte du nombre de voies bordant l’activité ;
- import local de plans PDF/JPG/PNG avec analyse guidée ;
- recherche documentaire Pappers Politique ;
- tests automatiques GitHub Actions.

## v1.4 — voies, plans et recherche documentaire

### Voies bordant l’activité

Atlas permet de renseigner :

- 1 voie ;
- 2 voies ;
- 3 voies ou plus ;
- à déterminer.

Un niveau de confirmation distingue une valeur déclarée d’une valeur confirmée par le plan cadastral et le plan de masse. Pour les enseignes au sol, Atlas ajoute un contrôle complémentaire fondé sur le principe « une enseigne par activité et par voie », sans remplacer la lecture du règlement applicable au secteur.

Plusieurs files d’une même route ne sont pas comptées comme plusieurs voies. Les dessertes internes ne sont pas automatiquement considérées comme des voies distinctes bordant l’activité.

### Import de plans

Atlas accepte localement :

- PDF ;
- JPG / JPEG ;
- PNG ;
- WebP.

Le plan est prévisualisé dans le navigateur et une checklist permet de formaliser la lecture : limites parcellaires, voies ouvertes à la circulation publique, voies internes et nombre de voies retenu.

Le fichier n’est pas envoyé à un serveur par Atlas v1.4. L’analyse visuelle automatique par IA n’est donc pas activée : elle nécessiterait un backend sécurisé afin de ne jamais exposer une clé API dans GitHub Pages.

### Recherche Pappers Politique

Un bloc de recherche documentaire permet de saisir une commune et des mots-clés puis d’ouvrir une recherche publique ciblée sur les documents de `politique.pappers.fr/commune/document`.

Cette fonction reste volontairement séparée du verdict réglementaire. L’API Pappers Politique n’est pas appelée directement depuis le navigateur car son accès nécessite une offre/API dédiée et une clé ne doit pas être exposée dans un dépôt ou un site public.

## v1.3.1 — fiabilisation POI

Les propriétés hétérogènes renvoyées par les POI sont normalisées avant traitement. La sélection d’un lieu déclenche correctement la chaîne carte → parcelle → périmètre → zonage → patrimoine et les résultats sont mieux classés selon la commune et l’intention de recherche.

## v1.3 — recherche de lieux / POI

Atlas interroge en parallèle :

- l’index `address` de la Géoplateforme ;
- l’index `poi` pour les lieux, équipements et établissements.

Exemple de régression : **Aire de Saint-Rémy, Woippy**.

Un POI reste une localisation indicative du site : il ne prouve pas l’implantation exacte du dispositif. La parcelle et le point précis doivent être contrôlés avant décision.

## v1.0 — règles nationales ciblées

La v1.0 ajoute des contrôles prudents sur :

- publicité hors agglomération — Code de l’environnement, art. L.581-7 ;
- publicité / préenseigne sur arbre — art. L.581-4 ;
- certains dispositifs publicitaires non lumineux au sol visibles depuis autoroute, bretelle, route express, déviation ou voie hors agglomération — art. R.581-31 ;
- autres cas de visibilité autoroutière : réserve et contrôle complémentaire au titre des règles nationales / Code de la route.

## v1.1 — fiche exportable

Après analyse, Atlas permet **Imprimer / PDF** et **Copier la fiche**.

## v1.2 — historique des dossiers

Atlas peut enregistrer jusqu’à 30 dossiers dans le stockage local du navigateur. La v1.4 ajoute également les champs liés au nombre de voies à l’historique et à la fiche exportée.

## Sources patrimoniales

Atlas interroge :

`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup`

Catégories suivies : AC1, AC2, AC4 / AC4 bis. Une absence de résultat automatique ne constitue pas une preuve juridique d’absence de protection.

## Zonage RLPi

Niveaux de confiance :

- **Élevée** : réservée à une intersection géographique fiable avec une couche officielle ;
- **Moyenne** : indice textuel par voie ou secteur ;
- **À confirmer** : règle indicative ou sélection manuelle.

## Tests automatiques

Le workflow GitHub Actions **Atlas self-test** vérifie notamment les adresses de référence, le POI de l’Aire de Saint-Rémy à Woippy, les fonctions critiques des versions courantes et les nouveaux outils v1.4.

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
- `v14.css` : styles des outils v1.4 ;
- `geocode.js` : adresses, lieux/POI et précision ;
- `zoning.js` : carte, parcelle et zonage ;
- `heritage.js` : protections patrimoniales ;
- `app.js` : moteur RLPi + contrôles nationaux ciblés ;
- `v14.js` : voies, plans et recherche documentaire ;
- `export.js` : fiche d’instruction ;
- `history.js` : historique local ;
- `scripts/selftest.mjs` : tests automatiques ;
- `data/test-cases.json` : cas de régression adresse / POI ;
- `data/rules.json` : règles structurées ;
- `data/zoning-sectors.json` : référentiel textuel du zonage.

## Important

Atlas fournit une pré-analyse. Une décision définitive doit être confrontée aux documents opposables, au Code de l’environnement, au Code de la route, aux protections patrimoniales, aux autorisations applicables et aux particularités du terrain.

## Prochaines étapes

1. backend sécurisé pour analyse IA réelle des plans ;
2. accès API Pappers si une offre et une clé serveur sont disponibles ;
3. amélioration de la détection des axes ZP4-A / ZP4-B ;
4. intégration d’une couche SIG officielle de zonage si une géométrie exploitable devient disponible.
