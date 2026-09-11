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

const geocodeState = { lat: null, lon: null, citycode: null, postcode: null, label: null };

function setGeoStatus(kind, text) {
  const el = document.getElementById("geoStatus");
  if (!el) return;
  el.className = `geo-status ${kind}`;
  el.textContent = text;
}

function setGeoDetails(properties, coordinates) {
  const [lon, lat] = coordinates || [];
  geocodeState.lon = lon ?? null;
  geocodeState.lat = lat ?? null;
  geocodeState.citycode = properties.citycode || properties.citycode_ || null;
  geocodeState.postcode = properties.postcode || properties.postcode_ || null;
  geocodeState.label = properties.label || properties.name || null;

  const city = properties.city || properties.city_name || properties.name || "";
  if (document.getElementById("city")) document.getElementById("city").value = city;
  if (document.getElementById("address")) document.getElementById("address").value = geocodeState.label || document.getElementById("address").value;

  const postcode = document.getElementById("postcode");
  const coords = document.getElementById("coords");
  const scope = document.getElementById("rlpiScope");
  if (postcode) postcode.textContent = geocodeState.postcode || "—";
  if (coords) coords.textContent = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : "—";

  const key = normalizeName(city);
  if (scope) {
    if (RLPi_EXCLUDED.has(key)) {
      scope.textContent = "Hors périmètre du RLPi actuel (Lorry-Mardigny)";
      scope.className = "scope-badge warn";
    } else if (coveredSet.has(key)) {
      scope.textContent = "Commune couverte par le RLPi";
      scope.className = "scope-badge ok";
    } else {
      scope.textContent = "Commune hors Eurométropole de Metz";
      scope.className = "scope-badge neutral";
    }
  }

  document.dispatchEvent(new CustomEvent("atlas:geocoded", {
    detail: { lat, lon, city, citycode: geocodeState.citycode, postcode: geocodeState.postcode, label: geocodeState.label }
  }));
}

function renderSuggestions(features) {
  const box = document.getElementById("addressSuggestions");
  if (!box) return;
  box.innerHTML = "";
  if (!features.length) {
    box.hidden = true;
    return;
  }
  features.slice(0, 5).forEach((feature) => {
    const p = feature.properties || {};
    const button = document.createElement("button");
    button.type = "button";
    button.className = "address-suggestion";
    button.innerHTML = `<strong>${p.label || p.name || "Adresse"}</strong><span>${p.context || p.city || p.city_name || ""}</span>`;
    button.addEventListener("click", () => {
      setGeoDetails(p, feature.geometry?.coordinates || []);
      box.hidden = true;
      setGeoStatus("ok", "Adresse géocodée. Commune, coordonnées, carte et parcelle mises à jour.");
    });
    box.appendChild(button);
  });
  box.hidden = false;
}

async function geocodeAddress(showSuggestions = false) {
  const input = document.getElementById("address");
  const query = input?.value.trim();
  if (!query || query.length < 3) {
    setGeoStatus("warn", "Saisissez au moins 3 caractères.");
    return [];
  }

  setGeoStatus("loading", "Recherche de l’adresse…");
  try {
    const url = `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query)}&index=address&limit=5`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const features = data.features || [];
    if (!features.length) {
      setGeoStatus("warn", "Aucune adresse trouvée.");
      renderSuggestions([]);
      return [];
    }
    if (showSuggestions && features.length > 1) {
      renderSuggestions(features);
      setGeoStatus("ok", `${features.length} propositions trouvées. Sélectionnez l’adresse exacte.`);
    } else {
      const first = features[0];
      setGeoDetails(first.properties || {}, first.geometry?.coordinates || []);
      renderSuggestions([]);
      setGeoStatus("ok", "Adresse géocodée. Commune, coordonnées, carte et parcelle mises à jour.");
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
