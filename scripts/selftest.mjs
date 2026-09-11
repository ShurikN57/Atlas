import fs from 'node:fs/promises';

const tests = JSON.parse(await fs.readFile(new URL('../data/test-cases.json', import.meta.url), 'utf8'));
const indexHtml = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const appJs = await fs.readFile(new URL('../app.js', import.meta.url), 'utf8');
const exportJs = await fs.readFile(new URL('../export.js', import.meta.url), 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Contrôle statique manquant : ${label}`);
}

function runStaticChecks() {
  requireText(indexHtml, 'v1.1', 'version v1.1');
  requireText(indexHtml, 'id="outsideAgglomeration"', 'case hors agglomération');
  requireText(indexHtml, 'id="treeSupport"', 'case support sur arbre');
  requireText(appJs, 'function addNationalChecks', 'moteur de règles nationales');
  requireText(appJs, 'R.581-31', 'contrôle R.581-31');
  requireText(appJs, 'L.581-7', 'contrôle L.581-7');
  requireText(indexHtml, 'id="printBtn"', 'bouton impression/PDF');
  requireText(indexHtml, 'id="copyReportBtn"', 'bouton copie fiche');
  requireText(indexHtml, 'export.js?v=1.1', 'chargement export v1.1');
  requireText(exportJs, 'function atlasReportText', 'générateur de fiche');
  requireText(exportJs, 'window.print()', 'impression navigateur');
  console.log('✅ Contrôles statiques v1.1');
}

function precisionOf(properties = {}) {
  const type = String(properties.type || properties.result_type || '').toLowerCase();
  const housenumber = properties.housenumber || properties.numero || properties.number || '';
  if (housenumber || type === 'housenumber') return 'exact';
  if (['street', 'locality', 'municipality', 'city'].includes(type)) return 'street';
  const label = String(properties.label || properties.name || '');
  if (/^\s*\d+[a-zA-Z]?\b/.test(label)) return 'exact';
  return 'approx';
}

async function json(url, timeoutMs = 10000) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Atlas-selftest/1.1' }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function runCase(test) {
  const search = await json(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(test.query)}&index=address&limit=5`);
  const feature = search.features?.[0];
  if (!feature) throw new Error('Aucun résultat de géocodage');
  const p = feature.properties || {};
  const [lon, lat] = feature.geometry?.coordinates || [];
  const precision = precisionOf(p);
  const city = p.city || p.city_name || p.name || '';
  const postcode = p.postcode || p.postcode_ || '';
  if (test.expected?.city && city !== test.expected.city) throw new Error(`Commune attendue ${test.expected.city}, reçue ${city}`);
  if (test.expected?.postcode && postcode !== test.expected.postcode) throw new Error(`Code postal attendu ${test.expected.postcode}, reçu ${postcode}`);
  if (test.expected?.precision && precision !== test.expected.precision) throw new Error(`Précision attendue ${test.expected.precision}, reçue ${precision}`);
  if (test.expected?.precisionNot && precision === test.expected.precisionNot) throw new Error(`Précision ne devait pas être ${test.expected.precisionNot}`);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Coordonnées absentes');
  let parcel = null;
  try {
    const parcelData = await json(`https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&index=parcel&limit=1`);
    const pp = parcelData.features?.[0]?.properties || {};
    parcel = pp.id || pp.parcel_id || pp.parcelle || pp.name || pp.label || null;
  } catch (error) { parcel = `indisponible (${error.message})`; }
  let heritage = 'non testé';
  try {
    const sup = await json(`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}`, 8000);
    heritage = Array.isArray(sup.features) ? `${sup.features.length} SUP au point` : 'réponse reçue';
  } catch (error) { heritage = `indisponible (${error.message})`; }
  return { name: test.name, label: p.label || p.name || '', city, postcode, precision, lat, lon, parcel, heritage };
}

let failed = 0;
console.log(`Atlas self-test v${tests.version}\n`);
try { runStaticChecks(); } catch (error) { failed += 1; console.error(`❌ ${error.message}`); }
for (const test of tests.cases) {
  try {
    const result = await runCase(test);
    console.log(`✅ ${result.name}`);
    console.log(`   ${result.label}`);
    console.log(`   ${result.city} ${result.postcode} · ${result.precision} · ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
    console.log(`   parcelle: ${result.parcel || 'non trouvée'} · patrimoine: ${result.heritage}`);
  } catch (error) { failed += 1; console.error(`❌ ${test.name}: ${error.message}`); }
}
if (failed) { console.error(`\n${failed} test(s) en échec.`); process.exit(1); }
console.log('\nTous les tests Atlas sont passés.');
