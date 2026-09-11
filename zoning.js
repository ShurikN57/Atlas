// Atlas v0.4 — cadastre, carte et aide au zonage
// La zone ZE peut être déduite de la ZP selon le règlement officiel :
// ZP1/ZP2 -> ZE1 ; ZP3/ZP4-A/ZP4-B/ZP5-B -> ZE2 ; ZP5-A/ZP5-C -> ZE3.

const ZP_TO_ZE = {
  "ZP1": "ZE1",
  "ZP2": "ZE1",
  "ZP3": "ZE2",
  "ZP4-A": "ZE2",
  "ZP4-B": "ZE2",
  "ZP5-A": "ZE3",
  "ZP5-B": "ZE2",
  "ZP5-C": "ZE3"
};

const KNOWN_ZP5A_HINTS = [
  "berlange", "saint-vincent", "saint vincent", "route de thionville", "deux fontaines",
  "actisud", "belle fontaine", "technopole", "technopôle", "sebastopol", "sébastopol",
  "grimont", "nouveau port", "ikea", "general metman", "général metman", "rue de l'abattoir", "rue de l’abattoir"
];

const KNOWN_ZP5B_HINTS = [
  "tannerie", "saussaie-aux-dames", "saussaie aux dames", "patrotte", "muse", "kinepolis", "kinépolis",
  "haut-rhele", "haut-rhêle", "dr schweitzer"
];

let atlasMap = null;
let atlasMarker = null;

function initAtlasMap() {
  const el = document.getElementById("map");
  if (!el || !window.L) return;
  if (atlasMap) return;
  atlasMap = L.map("map", { zoomControl: true }).setView([49.12, 6.18], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(atlasMap);
}

function updateAtlasMap(lat, lon, label) {
  initAtlasMap();
  if (!atlasMap || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
  if (atlasMarker) atlasMarker.remove();
  atlasMarker = L.marker([lat, lon]).addTo(atlasMap).bindPopup(label || "Adresse sélectionnée").openPopup();
  atlasMap.setView([lat, lon], 18);
}

function setParcel(text, kind = "neutral") {
  const el = document.getElementById("parcel");
  if (!el) return;
  el.textContent = text || "—";
  el.className = `scope-badge ${kind}`;
}

function setZoneStatus(text, kind = "neutral") {
  const el = document.getElementById("zoneStatus");
  if (!el) return;
  el.textContent = text;
  el.className = `geo-status ${kind}`;
}

function setZones(zp, sourceText) {
  const zpSelect = document.getElementById("zp");
  const zeSelect = document.getElementById("ze");
  if (!zpSelect || !zeSelect || !zp) return;
  zpSelect.value = zp;
  zeSelect.value = ZP_TO_ZE[zp] || "";
  setZoneStatus(`${zp} détectée${ZP_TO_ZE[zp] ? ` · ${ZP_TO_ZE[zp]} déduite automatiquement` : ""}${sourceText ? ` · ${sourceText}` : ""}`, "ok");
}

function inferZoneFromAddress() {
  const raw = `${document.getElementById("address")?.value || ""} ${document.getElementById("city")?.value || ""}`.toLowerCase();
  if (KNOWN_ZP5A_HINTS.some((x) => raw.includes(x))) return { zp: "ZP5-A", reason: "secteur d’activités majeur identifié" };
  if (KNOWN_ZP5B_HINTS.some((x) => raw.includes(x))) return { zp: "ZP5-B", reason: "secteur d’activités diffus identifié" };
  return null;
}

async function lookupParcel(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  setParcel("Recherche…", "neutral");
  try {
    const url = `https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&index=parcel&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) {
      setParcel("Parcelle non identifiée", "warn");
      return;
    }
    const p = f.properties || {};
    const id = p.id || p.parcel_id || p.parcelle || p.name || p.label || "Parcelle trouvée";
    setParcel(id, "ok");
  } catch (e) {
    console.warn("Cadastre indisponible", e);
    setParcel("Cadastre indisponible", "warn");
  }
}

function updateAutomaticZoning() {
  const inferred = inferZoneFromAddress();
  if (inferred) {
    setZones(inferred.zp, inferred.reason);
  } else {
    const zp = document.getElementById("zp")?.value;
    const ze = zp ? ZP_TO_ZE[zp] : "";
    if (zp && ze) {
      document.getElementById("ze").value = ze;
      setZoneStatus(`${ze} déduite automatiquement de ${zp}. ZP à confirmer avec le plan officiel si elle n’a pas été détectée automatiquement.`, "warn");
    } else {
      setZoneStatus("ZP non déterminée automatiquement : sélectionner la zone d’après le plan officiel. La ZE sera ensuite calculée automatiquement.", "warn");
    }
  }
}

document.getElementById("zp")?.addEventListener("change", updateAutomaticZoning);

document.addEventListener("atlas:geocoded", (event) => {
  const d = event.detail || {};
  updateAtlasMap(d.lat, d.lon, d.label);
  lookupParcel(d.lat, d.lon);
  updateAutomaticZoning();
});

window.AtlasZoning = { updateAtlasMap, lookupParcel, updateAutomaticZoning, ZP_TO_ZE };
window.addEventListener("load", initAtlasMap);
