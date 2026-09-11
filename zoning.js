// Atlas v0.6 — carte, cadastre et zonage assisté avec méthode et niveau de confiance
const ZP_TO_ZE = {
  "ZP1": "ZE1", "ZP2": "ZE1", "ZP3": "ZE2", "ZP4-A": "ZE2", "ZP4-B": "ZE2",
  "ZP5-A": "ZE3", "ZP5-B": "ZE2", "ZP5-C": "ZE3"
};

let atlasMap = null;
let atlasMarker = null;
let ZONING = null;
let currentParcelId = null;

const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function loadZoningReference() {
  try {
    const res = await fetch("data/zoning-sectors.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ZONING = await res.json();
  } catch (e) {
    console.warn("Référentiel zonage indisponible", e);
  }
}

function initAtlasMap() {
  const el = document.getElementById("map");
  if (!el || !window.L || atlasMap) return;
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

function setZoneMethod(text, kind = "neutral") {
  const el = document.getElementById("zoneMethod");
  if (!el) return;
  el.textContent = text || "Non déterminée";
  el.className = `scope-badge ${kind}`;
}

function setConfidence(level, detail = "") {
  const el = document.getElementById("zoneConfidence");
  if (!el) return;
  const labels = {
    high: ["Élevée", "ok"],
    medium: ["Moyenne", "warn"],
    manual: ["À confirmer", "neutral"]
  };
  const [label, cls] = labels[level] || labels.manual;
  el.textContent = detail ? `${label} · ${detail}` : label;
  el.className = `scope-badge ${cls}`;
}

function applyZone(zp, reason, confidence = "manual", method = "Sélection manuelle") {
  const zpSelect = document.getElementById("zp");
  const zeSelect = document.getElementById("ze");
  if (!zpSelect || !zeSelect || !zp) return;
  zpSelect.value = zp;
  zeSelect.value = ZP_TO_ZE[zp] || "";
  const kind = confidence === "high" ? "ok" : confidence === "medium" ? "warn" : "neutral";
  setZoneStatus(`${zp} proposée · ${ZP_TO_ZE[zp] || "ZE à déterminer"} · ${reason}`, kind === "neutral" ? "warn" : kind);
  setConfidence(confidence,
    confidence === "high" ? "intersection géographique" :
    confidence === "medium" ? "indice textuel à confirmer" :
    "plan officiel requis"
  );
  setZoneMethod(method, kind);
}

function inferZoneFromAddress() {
  if (!ZONING) return null;
  const address = document.getElementById("address")?.value || "";
  const city = document.getElementById("city")?.value || "";
  const raw = normalize(`${address} ${city}`);
  const cityNorm = normalize(city);

  for (const [zp, sectors] of Object.entries(ZONING.zones || {})) {
    for (const sector of sectors) {
      const cityOk = !sector.communes?.length || sector.communes.some((c) => normalize(c) === cityNorm);
      const hit = (sector.aliases || []).some((a) => raw.includes(normalize(a)));
      if (cityOk && hit) {
        return {
          zp,
          reason: `${sector.name} identifié dans l’adresse`,
          confidence: "medium",
          method: "Nom de secteur / voie"
        };
      }
    }
  }

  const rule = (ZONING.commune_rules || []).find((r) => normalize(r.commune) === cityNorm);
  if (rule) {
    return {
      zp: rule.candidate,
      reason: rule.reason,
      confidence: "manual",
      method: "Règle communale indicative"
    };
  }
  return null;
}

async function lookupParcel(lat, lon) {
  currentParcelId = null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  setParcel("Recherche…", "neutral");
  try {
    const url = `https://data.geopf.fr/geocodage/reverse?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&index=parcel&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) {
      setParcel("Parcelle non identifiée", "warn");
      return null;
    }
    const p = f.properties || {};
    currentParcelId = p.id || p.parcel_id || p.parcelle || p.name || p.label || null;
    setParcel(currentParcelId || "Parcelle trouvée", "ok");
    return currentParcelId;
  } catch (e) {
    console.warn("Cadastre indisponible", e);
    setParcel("Cadastre indisponible", "warn");
    return null;
  }
}

function updateAutomaticZoning() {
  const inferred = inferZoneFromAddress();
  if (inferred) {
    applyZone(
      inferred.zp,
      `${inferred.reason}${currentParcelId ? ` · parcelle ${currentParcelId} enregistrée comme référence` : ""}`,
      inferred.confidence,
      inferred.method
    );
    return;
  }

  const zp = document.getElementById("zp")?.value;
  const ze = zp ? ZP_TO_ZE[zp] : "";
  if (zp && ze) {
    document.getElementById("ze").value = ze;
    setZoneStatus(`${ze} déduite automatiquement de ${zp}. La ZP reste une sélection manuelle à confirmer avec le plan officiel${currentParcelId ? ` pour la parcelle ${currentParcelId}` : ""}.`, "warn");
    setConfidence("manual", "ZP sélectionnée manuellement");
    setZoneMethod("Sélection manuelle", "neutral");
  } else {
    setZoneStatus(`Aucune zone fiable détectée automatiquement${currentParcelId ? ` pour la parcelle ${currentParcelId}` : ""}. Consultez le plan officiel puis sélectionnez la ZP ; Atlas calculera la ZE.`, "warn");
    setConfidence("manual", "plan officiel requis");
    setZoneMethod(currentParcelId ? "Parcelle connue · zonage à confirmer" : "Non déterminée", "neutral");
  }
}

document.getElementById("zp")?.addEventListener("change", updateAutomaticZoning);

document.addEventListener("atlas:geocoded", async (event) => {
  const d = event.detail || {};
  updateAtlasMap(d.lat, d.lon, d.label);
  await lookupParcel(d.lat, d.lon);
  updateAutomaticZoning();
});

window.AtlasZoning = {
  updateAtlasMap,
  lookupParcel,
  updateAutomaticZoning,
  ZP_TO_ZE,
  getParcelId: () => currentParcelId
};

window.addEventListener("load", async () => {
  initAtlasMap();
  await loadZoningReference();
  updateAutomaticZoning();
});
