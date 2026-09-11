const METZ_METROPOLE_COMMUNES = [
  "Amanvillers","Ars-Laquenexy","Ars-sur-Moselle","Augny","Châtel-Saint-Germain","Chesny","Chieulles",
  "Coin-lès-Cuvry","Coin-sur-Seille","Cuvry","Féy","Gravelotte","Jury","Jussy","La Maxe","Laquenexy",
  "Le Ban-Saint-Martin","Lessy","Longeville-lès-Metz","Lorry-lès-Metz","Lorry-Mardigny","Marieulles","Marly",
  "Mécleuves","Metz","Mey","Montigny-lès-Metz","Moulins-lès-Metz","Nouilly","Noisseville","Peltre",
  "Plappeville","Pouilly","Pournoy-la-Chétive","Roncourt","Rozérieulles","Saulny","Saint-Privat-la-Montagne",
  "Scy-Chazelles","Sainte-Ruffine","Saint-Julien-lès-Metz","Vantoux","Vany","Vaux","Vernéville","Woippy"
];

const RLPi_EXCLUDED = new Set(["lorry-mardigny"]);
const normalizeName = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "-").replace(/\s+/g, "-");
const coveredSet = new Set(METZ_METROPOLE_COMMUNES.map(normalizeName));

const geocodeState = { lat: null, lon: null, citycode: null, postcode: null, label: null, precision: "unknown", precisionLabel: "À déterminer", sourceIndex: null };

function setGeoStatus(kind, text) {
  const el = document.getElementById("geoStatus");
  if (!el) return;
  el.className = `geo-status ${kind}`;
  el.textContent = text;
}

function detectAddressPrecision(properties = {}) {
  const sourceIndex = properties._atlasSourceIndex || "address";
  if (sourceIndex === "poi") return { key: "approx", label: "Lieu / établissement · parcelle indicative", kind: "warn" };
  const type = String(properties.type || properties.result_type || "").toLowerCase();
  const housenumber = properties.housenumber || properties.numero || properties.number || "";
  if (housenumber || type === "housenumber") return { key: "exact", label: "Adresse précise · parcelle fiable", kind: "ok" };
  if (["street", "locality", "municipality", "city"].includes(type)) return { key: "street", label: "Voie / secteur · parcelle indicative", kind: "warn" };
  const label = String(properties.label || properties.name || "");
  if (/^\s*\d+[a-zA-Z]?\b/.test(label)) return { key: "exact", label: "Adresse précise · parcelle fiable", kind: "ok" };
  return { key: "approx", label: "Localisation approximative", kind: "warn" };
}

function setAddressPrecision(precision) {
  const el = document.getElementById("addressPrecision");
  if (!el) return;
  el.textContent = precision.label;
  el.className = `scope-badge ${precision.kind}`;
}

function cityFromProperties(properties = {}) {
  return properties.city || properties.city_name || properties.municipality || properties.commune || properties.locality || "";
}

function postcodeFromProperties(properties = {}) {
  return properties.postcode || properties.postcode_ || properties.postalcode || properties.postal_code || "";
}

function setGeoDetails(properties, coordinates) {
  const [lon, lat] = coordinates || [];
  geocodeState.lon = lon ?? null;
  geocodeState.lat = lat ?? null;
  geocodeState.citycode = properties.citycode || properties.citycode_ || properties.insee || null;
  geocodeState.postcode = postcodeFromProperties(properties) || null;
  geocodeState.label = properties.label || properties.name || null;
  geocodeState.sourceIndex = properties._atlasSourceIndex || "address";
  const precision = detectAddressPrecision(properties);
  geocodeState.precision = precision.key;
  geocodeState.precisionLabel = precision.label;

  const city = cityFromProperties(properties);
  if (document.getElementById("city") && city) document.getElementById("city").value = city;
  if (document.getElementById("address")) document.getElementById("address").value = geocodeState.label || document.getElementById("address").value;

  const postcode = document.getElementById("postcode");
  const coords = document.getElementById("coords");
  const scope = document.getElementById("rlpiScope");
  if (postcode) postcode.textContent = geocodeState.postcode || "—";
  if (coords) coords.textContent = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : "—";
  setAddressPrecision(precision);

  const key = normalizeName(city);
  if (scope) {
    if (RLPi_EXCLUDED.has(key)) {
      scope.textContent = "Hors périmètre du RLPi actuel (Lorry-Mardigny)";
      scope.className = "scope-badge warn";
    } else if (coveredSet.has(key)) {
      scope.textContent = "Commune couverte par le RLPi";
      scope.className = "scope-badge ok";
    } else if (!city && geocodeState.sourceIndex === "poi") {
      scope.textContent = "Commune à confirmer pour ce lieu";
      scope.className = "scope-badge warn";
    } else {
      scope.textContent = "Commune hors Eurométropole de Metz";
      scope.className = "scope-badge neutral";
    }
  }

  document.dispatchEvent(new CustomEvent("atlas:geocoded", {
    detail: { lat, lon, city, citycode: geocodeState.citycode, postcode: geocodeState.postcode, label: geocodeState.label, precision: precision.key, precisionLabel: precision.label, sourceIndex: geocodeState.sourceIndex }
  }));
}

function resultStatus(properties = {}) {
  const precision = detectAddressPrecision(properties);
  if (properties._atlasSourceIndex === "poi") {
    return { kind: "warn", text: "Lieu / établissement géocodé. Coordonnées, carte et parcelle mises à jour ; confirmer l’implantation exacte du dispositif sur le site." };
  }
  if (precision.key === "exact") {
    return { kind: "ok", text: "Adresse précise géocodée. Commune, coordonnées, carte et parcelle mises à jour." };
  }
  return { kind: "warn", text: "Localisation par voie/secteur : la parcelle retournée reste indicative tant qu’un numéro précis n’est pas sélectionné." };
}

function renderSuggestions(features) {
  const box = document.getElementById("addressSuggestions");
  if (!box) return;
  box.innerHTML = "";
  if (!features.length) {
    box.hidden = true;
    return;
  }
  features.slice(0, 8).forEach((feature) => {
    const p = feature.properties || {};
    const button = document.createElement("button");
    button.type = "button";
    button.className = "address-suggestion";
    const source = p._atlasSourceIndex === "poi" ? "Lieu / établissement" : "Adresse";
    const context = p.context || cityFromProperties(p) || "";
    button.innerHTML = `<strong>${p.label || p.name || source}</strong><span>${source}${context ? ` · ${context}` : ""}</span>`;
    button.addEventListener("click", () => {
      setGeoDetails(p, feature.geometry?.coordinates || []);
      box.hidden = true;
      const status = resultStatus(p);
      setGeoStatus(status.kind, status.text);
    });
    box.appendChild(button);
  });
  box.hidden = false;
}

async function searchIndex(query, index) {
  const url = `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query)}&index=${encodeURIComponent(index)}&limit=5`;
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return (data.features || []).map((feature) => ({
    ...feature,
    properties: { ...(feature.properties || {}), _atlasSourceIndex: index }
  }));
}

function featureKey(feature) {
  const p = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  return `${p.label || p.name || ""}|${coords[0] ?? ""}|${coords[1] ?? ""}`.toLowerCase();
}

function mergeFeatures(addressFeatures, poiFeatures) {
  const seen = new Set();
  const merged = [];
  for (const feature of [...addressFeatures, ...poiFeatures]) {
    const key = featureKey(feature);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(feature);
  }
  return merged;
}

async function geocodeAddress(showSuggestions = false) {
  const input = document.getElementById("address");
  const query = input?.value.trim();
  if (!query || query.length < 3) {
    setGeoStatus("warn", "Saisissez au moins 3 caractères.");
    return [];
  }

  setGeoStatus("loading", "Recherche de l’adresse ou du lieu…");
  try {
    const [addressResult, poiResult] = await Promise.allSettled([
      searchIndex(query, "address"),
      searchIndex(query, "poi")
    ]);
    const addressFeatures = addressResult.status === "fulfilled" ? addressResult.value : [];
    const poiFeatures = poiResult.status === "fulfilled" ? poiResult.value : [];
    const features = mergeFeatures(addressFeatures, poiFeatures);

    if (!features.length) {
      if (addressResult.status === "rejected" && poiResult.status === "rejected") throw addressResult.reason || poiResult.reason;
      setGeoStatus("warn", "Aucune adresse ni aucun lieu trouvé.");
      renderSuggestions([]);
      return [];
    }

    if (showSuggestions && features.length > 1) {
      renderSuggestions(features);
      const poiCount = poiFeatures.length;
      setGeoStatus("ok", `${features.length} proposition(s) trouvée(s)${poiCount ? `, dont ${poiCount} lieu(x) / établissement(s)` : ""}. Sélectionnez le bon emplacement.`);
    } else {
      const first = features[0];
      setGeoDetails(first.properties || {}, first.geometry?.coordinates || []);
      renderSuggestions([]);
      const status = resultStatus(first.properties || {});
      setGeoStatus(status.kind, status.text);
    }
    return features;
  } catch (error) {
    console.error("Erreur de géocodage", error);
    setGeoStatus("bad", "Le service de géocodage est momentanément indisponible. La saisie manuelle reste possible.");
    return [];
  }
}

let geocodeTimer = null;
const addressInput = document.getElementById("address");
addressInput?.addEventListener("input", () => {
  clearTimeout(geocodeTimer);
  const value = addressInput.value.trim();
  if (value.length < 5) {
    renderSuggestions([]);
    return;
  }
  geocodeTimer = setTimeout(() => geocodeAddress(true), 450);
});

document.getElementById("geocodeBtn")?.addEventListener("click", () => geocodeAddress(true));
addressInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    geocodeAddress(true);
  }
});

window.AtlasGeo = geocodeState;
