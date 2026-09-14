import fs from 'node:fs/promises';

const tests = JSON.parse(await fs.readFile(new URL('../data/test-cases.json', import.meta.url), 'utf8'));
const indexHtml = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const appJs = await fs.readFile(new URL('../app.js', import.meta.url), 'utf8');
const exportJs = await fs.readFile(new URL('../export.js', import.meta.url), 'utf8');
const historyJs = await fs.readFile(new URL('../history.js', import.meta.url), 'utf8');
const geocodeJs = await fs.readFile(new URL('../geocode.js', import.meta.url), 'utf8');
const v14Js = await fs.readFile(new URL('../v14.js', import.meta.url), 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Contrôle statique manquant : ${label}`);
}

function runStaticChecks() {
  requireText(indexHtml, 'v1.4.1', 'version v1.4.1');
  requireText(indexHtml, 'id="outsideAgglomeration"', 'case hors agglomération');
  requireText(indexHtml, 'id="treeSupport"', 'case support sur arbre');
  requireText(appJs, 'function addNationalChecks', 'moteur de règles nationales');
  requireText(appJs, 'R.581-31', 'contrôle R.581-31');
  requireText(appJs, 'L.581-7', 'contrôle L.581-7');
  requireText(indexHtml, 'id="printBtn"', 'bouton impression/PDF');
  requireText(indexHtml, 'id="copyReportBtn"', 'bouton copie fiche');
  requireText(exportJs, 'function atlasReportText', 'générateur de fiche');
  requireText(indexHtml, 'id="saveCaseBtn"', 'bouton enregistrement dossier');
  requireText(indexHtml, 'id="historyList"', 'liste historique');
  requireText(indexHtml, 'history.js?v=1.4.1', 'chargement historique v1.4.1');
  requireText(historyJs, 'ATLAS_HISTORY_KEY', 'clé stockage historique');
  requireText(historyJs, 'borderingRoads', 'historisation du nombre de voies');
  requireText(geocodeJs, 'searchIndex(query, "poi")', 'recherche POI Géoplateforme');
  requireText(geocodeJs, 'Promise.allSettled', 'recherche parallèle adresse + POI');
  requireText(geocodeJs, 'function firstText', 'normalisation des propriétés POI');
  requireText(geocodeJs, 'function normalizeFeature', 'normalisation des résultats POI');
  requireText(geocodeJs, 'function scoreFeature', 'classement de pertinence');
  requireText(indexHtml, 'id="borderingRoads"', 'champ nombre de voies bordant l’activité');
  requireText(indexHtml, 'id="planFile"', 'import de plan');
  requireText(indexHtml, 'id="docSearchBtn"', 'recherche documentaire Pappers');
  requireText(v14Js, 'function appendRoadCheck', 'contrôle voies v1.4');
  requireText(v14Js, 'function previewPlan', 'aperçu plan local');
  requireText(v14Js, 'function runPappersSearch', 'recherche documentaire publique');
  requireText(v14Js, 'politique.pappers.fr/commune/document', 'ciblage Pappers Politique');
  requireText(indexHtml, 'v14.js?v=1.4.1', 'chargement outils v1.4.1');
  requireText(indexHtml, '05_REGLEMENT_GRAPHIQUE_ENSEIGNES.pdf', 'plan graphique officiel ZE');
  requireText(indexHtml, 'Plan ZE · Enseignes', 'accès utilisateur au plan ZE');
  console.log('✅ Contrôles statiques v1.4.1');
}

function firstText(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    if (value && typeof value === 'object') {
      const nested = firstText(value.name, value.label, value.value, value.text);
      if (nested) return nested;
      continue;
    }
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return '';
}

function precisionOf(properties = {}, sourceIndex = 'address') {
  if (sourceIndex === 'poi') return 'approx';
  const type = firstText(properties.type, properties.result_type).toLowerCase();
  const housenumber = firstText(properties.housenumber, properties.numero, properties.number);
  if (housenumber || type === 'housenumber') return 'exact';
  if (['street', 'locality', 'municipality', 'city'].includes(type)) return 'street';
  const label = firstText(properties.label, properties.name);
  if (/^\s*\d+[a-zA-Z]?\b/.test(label)) return 'exact';
  return 'approx';
}

async function json(url, timeoutMs = 10000) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Atlas-selftest/1.4.1' }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

function cityOf(p = {}) {
  return firstText(p.city, p.city_name, p.municipality, p.commune, p.locality);
}

function postcodeOf(p = {}) {
  return firstText(p.postcode, p.postcode_, p.postalcode, p.postal_code);
}

async function runCase(test) {
  const index = test.index || 'address';
  const search = await json(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(test.query)}&index=${encodeURIComponent(index)}&limit=5`);
  const feature = search.features?.[0];
  if (!feature) throw new Error(`Aucun résultat de géocodage dans l’index ${index}`);
  const p = feature.properties || {};
  const lon = Number(feature.geometry?.coordinates?.[0]);
  const lat = Number(feature.geometry?.coordinates?.[1]);
  const precision = precisionOf(p, index);
  const city = cityOf(p);
  const postcode = postcodeOf(p);
  const label = firstText(p.label, p.name, p.toponym, p.poi_name);

  if (test.expected?.city && city !== test.expected.city) throw new Error(`Commune attendue ${test.expected.city}, reçue ${city}`);
  if (test.expected?.postcode && postcode !== test.expected.postcode) throw new Error(`Code postal attendu ${test.expected.postcode}, reçu ${postcode}`);
  if (test.expected?.precision && precision !== test.expected.precision) throw new Error(`Précision attendue ${test.expected.precision}, reçue ${precision}`);
  if (test.expected?.precisionNot && precision === test.expected.precisionNot) throw new Error(`Précision ne devait pas être ${test.expected.precisionNot}`);
  if (test.expected?.sourceIndex && index !== test.expected.sourceIndex) throw new Error(`Index attendu ${test.expected.sourceIndex}, reçu ${index}`);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Coordonnées absentes');

  if (test.expected?.near) {
    const { lat: expectedLat, lon: expectedLon, tolerance = 0.05 } = test.expected.near;
    if (Math.abs(lat - expectedLat) > tolerance || Math.abs(lon - expectedLon) > tolerance) {
      throw new Error(`POI trop éloigné : ${lat.toFixed(6)}, ${lon.toFixed(6)} au lieu d’environ ${expectedLat}, ${expectedLon}`);
    }
  }

  let parcel = null;
  try {
    const parcelData = await json(`https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&index=parcel&limit=1`);
    const pp = parcelData.features?.[0]?.properties || {};
    parcel = firstText(pp.id, pp.parcel_id, pp.parcelle, pp.name, pp.label) || null;
  } catch (error) { parcel = `indisponible (${error.message})`; }

  let heritage = 'non testé';
  try {
    const sup = await json(`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}`, 8000);
    heritage = Array.isArray(sup.features) ? `${sup.features.length} SUP au point` : 'réponse reçue';
  } catch (error) { heritage = `indisponible (${error.message})`; }

  return { name: test.name, label, city, postcode, precision, index, lat, lon, parcel, heritage };
}

let failed = 0;
console.log(`Atlas self-test v${tests.version}\n`);
try { runStaticChecks(); } catch (error) { failed += 1; console.error(`❌ ${error.message}`); }
for (const test of tests.cases) {
  try {
    const result = await runCase(test);
    console.log(`✅ ${result.name}`);
    console.log(`   [${result.index}] ${result.label}`);
    console.log(`   ${result.city || 'commune non fournie'} ${result.postcode || ''} · ${result.precision} · ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
    console.log(`   parcelle: ${result.parcel || 'non trouvée'} · patrimoine: ${result.heritage}`);
  } catch (error) { failed += 1; console.error(`❌ ${test.name}: ${error.message}`); }
}
if (failed) { console.error(`\n${failed} test(s) en échec.`); process.exit(1); }
console.log('\nTous les tests Atlas sont passés.');
