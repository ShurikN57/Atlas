// Atlas v1.4.2 — carte, cadastre et zonages ZP / ZE séparés
const OUTSIDE_AGGLO = "HORS_AGGLO";
const ZP_TO_ZE = {
  "ZP1": "ZE1", "ZP2": "ZE1", "ZP3": "ZE2", "ZP4-A": "ZE2", "ZP4-B": "ZE2",
  "ZP5-A": "ZE3", "ZP5-B": "ZE2", "ZP5-C": "ZE3"
};

let atlasMap = null;
let atlasMarker = null;
let ZONING = null;
let currentParcelId = null;

const normalize = (value = "") => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

function syncOutsideAgglomeration() {
  const zp = document.getElementById("zp")?.value || "";
  const zePlan = document.getElementById("zePlan")?.value || "";
  const box = document.getElementById("outsideAgglomeration");
  if (box) box.checked = zp === OUTSIDE_AGGLO || zePlan === OUTSIDE_AGGLO;
}

function applyZePlanRules(showStatus = true) {
  const zePlan = document.getElementById("zePlan");
  const zeRules = document.getElementById("ze");
  if (!zePlan || !zeRules) return;

  if (zePlan.value === OUTSIDE_AGGLO) {
    zeRules.value = "ZE2";
    if (showStatus) setZoneStatus("Plan ZE : Hors agglomération · règles enseignes préremplies en ZE2. Vérifier si le secteur fait partie d’une exception explicitement classée ZE3.", "warn");
  } else if (["ZE1", "ZE2", "ZE3"].includes(zePlan.value)) {
    zeRules.value = zePlan.value;
    if (showStatus) setZoneStatus(`Plan ZE : ${zePlan.value} · règles enseignes applicables : ${zePlan.value}.`, "ok");
  }
  syncOutsideAgglomeration();
}

function applyZone(zp, reason, confidence = "manual", method = "Sélection manuelle") {
  const zpSelect = document.getElementById("zp");
  const zePlan = document.getElementById("zePlan");
  const zeRules = document.getElementById("ze");
  if (!zpSelect || !zePlan || !zeRules || !zp) return;

  zpSelect.value = zp;
  if (zp === OUTSIDE_AGGLO) {
    zePlan.value = OUTSIDE_AGGLO;
    zeRules.value = "ZE2";
    setZoneStatus(`ZP : Hors agglomération · ZE du plan préremplie : Hors agglomération · règles enseignes : ZE2 par défaut · ${reason}`, "warn");
  } else {
    const candidateZe = ZP_TO_ZE[zp] || "";
    zePlan.value = candidateZe;
    zeRules.value = candidateZe;
    const kind = confidence === "high" ? "ok" : confidence === "medium" ? "warn" : "neutral";
    setZoneStatus(`${zp} proposée · ZE préremplie ${candidateZe || "à déterminer"} · ${reason}. Confirmer séparément sur le plan ZE officiel.`, kind === "neutral" ? "warn" : kind);
  }

  const kind = confidence === "high" ? "ok" : confidence === "medium" ? "warn" : "neutral";
  setConfidence(confidence,
    confidence === "high" ? "intersection géographique" :
    confidence === "medium" ? "indice textuel à confirmer" :
    "plans officiels requis"
  );
  setZoneMethod(method, kind);
  syncOutsideAgglomeration();
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

  const zp = document.getElementById("zp")?.value || "";
  const zePlan = document.getElementById("zePlan");
  const zeRules = document.getElementById("ze");

  if (zp === OUTSIDE_AGGLO) {
    if (zePlan && !zePlan.value) zePlan.value = OUTSIDE_AGGLO;
    if (zeRules && !zeRules.value) zeRules.value = "ZE2";
    setZoneStatus(`ZP du plan : Hors agglomération${currentParcelId ? ` · parcelle ${currentParcelId}` : ""}. Confirmer aussi la ZE sur son plan ; si elle est également « Hors agglomération », Atlas applique ZE2 par défaut pour les enseignes, sauf secteur explicitement ZE3.`, "warn");
    setConfidence("manual", "plans ZP + ZE à confirmer");
    setZoneMethod("Sélection manuelle", "neutral");
    syncOutsideAgglomeration();
    return;
  }

  const candidateZe = zp ? ZP_TO_ZE[zp] : "";
  if (zp && candidateZe) {
    if (zePlan && !zePlan.value) zePlan.value = candidateZe;
    if (zeRules && !zeRules.value) zeRules.value = candidateZe;
    setZoneStatus(`${candidateZe} proposée à partir de ${zp}. Les zonages ZP et ZE restent deux lectures distinctes : confirmer la ZE sur le plan officiel${currentParcelId ? ` pour la parcelle ${currentParcelId}` : ""}.`, "warn");
    setConfidence("manual", "ZP sélectionnée manuellement");
    setZoneMethod("Sélection manuelle", "neutral");
  } else if (!zp && !zePlan?.value) {
    setZoneStatus(`Aucun zonage fiable détecté automatiquement${currentParcelId ? ` pour la parcelle ${currentParcelId}` : ""}. Consultez séparément le plan ZP et le plan ZE officiels.`, "warn");
    setConfidence("manual", "plans officiels requis");
    setZoneMethod(currentParcelId ? "Parcelle connue · zonages à confirmer" : "Non déterminée", "neutral");
  }
  syncOutsideAgglomeration();
}

document.getElementById("zp")?.addEventListener("change", updateAutomaticZoning);
document.getElementById("zePlan")?.addEventListener("change", () => applyZePlanRules(true));
document.getElementById("ze")?.addEventListener("change", syncOutsideAgglomeration);

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
  applyZePlanRules,
  ZP_TO_ZE,
  OUTSIDE_AGGLO,
  getParcelId: () => currentParcelId
};

window.addEventListener("load", async () => {
  initAtlasMap();
  await loadZoningReference();
  updateAutomaticZoning();
});
