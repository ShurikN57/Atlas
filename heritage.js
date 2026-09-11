// Atlas v0.8 — protections patrimoniales via Géoportail de l'Urbanisme (SUP)
const heritageState = { status: "idle", protections: [], rawCount: 0, checkedAt: null };

const HERITAGE_CATEGORIES = {
  AC1: { title: "Monuments historiques / abords", short: "AC1", note: "Servitude patrimoniale liée aux monuments historiques et à leurs abords. Vérification ABF / autorisation à prévoir selon le projet." },
  AC2: { title: "Site inscrit ou classé", short: "AC2", note: "Protection des monuments naturels et des sites. La publicité peut être interdite ou très encadrée selon le statut et le RLPi." },
  AC4: { title: "Site patrimonial remarquable", short: "AC4", note: "Site patrimonial remarquable / dispositif patrimonial associé. Prescriptions particulières et avis patrimonial à vérifier." },
  "AC4 BIS": { title: "Site patrimonial remarquable", short: "AC4 bis", note: "Protection patrimoniale complémentaire liée aux sites patrimoniaux remarquables." }
};

function heritageEl(id) { return document.getElementById(id); }
function normalizeHeritageCategory(value = "") {
  const s = String(value).toUpperCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  if (/\bAC4\s*BIS\b/.test(s)) return "AC4 BIS";
  if (/\bAC4\b/.test(s)) return "AC4";
  if (/\bAC2\b/.test(s)) return "AC2";
  if (/\bAC1\b/.test(s)) return "AC1";
  return null;
}
function detectCategory(feature) {
  const p = feature?.properties || {};
  const candidates = [p.categorie,p.CATEGORIE,p.category,p.code_cat,p.CODE_CAT,p.nom_sup,p.NOM_SUP,p.libelle,p.LIBELLE,p.nom,p.NOM,p.name,p.NAME].filter(Boolean);
  for (const candidate of candidates) { const cat = normalizeHeritageCategory(candidate); if (cat) return cat; }
  return normalizeHeritageCategory(JSON.stringify(p));
}
function featureLabel(feature, fallback) {
  const p = feature?.properties || {};
  return p.nom_sup || p.NOM_SUP || p.libelle || p.LIBELLE || p.nom || p.NOM || p.name || p.NAME || fallback;
}
function setHeritageBadge(text, kind = "neutral") {
  const el = heritageEl("heritageBadge"); if (!el) return; el.textContent = text; el.className = `scope-badge ${kind}`;
}
function setHeritageStatus(text, kind = "neutral") {
  const el = heritageEl("heritageStatus"); if (!el) return; el.textContent = text; el.className = `geo-status ${kind}`;
}
function setHeritageDetails(open) {
  const details = heritageEl("heritageDetails"); if (details) details.open = !!open;
}
function renderProtections(protections) {
  const box = heritageEl("heritageResults"); if (!box) return; box.innerHTML = "";
  if (!protections.length) {
    box.innerHTML = '<div class="heritage-empty"><strong>Aucune protection AC1 / AC2 / AC4 détectée au point.</strong><span>Résultat informatif : ouvrir le détail seulement si une vérification complémentaire est utile.</span></div>';
    return;
  }
  protections.forEach((item) => {
    const meta = HERITAGE_CATEGORIES[item.category] || { title: item.category, short: item.category, note: "Protection patrimoniale à vérifier." };
    const div = document.createElement("div"); div.className = "heritage-item";
    div.innerHTML = `<div class="heritage-item-head"><span class="heritage-code">${meta.short}</span><strong>${meta.title}</strong></div><div class="heritage-label">${item.label || meta.title}</div><p>${meta.note}</p>`;
    box.appendChild(div);
  });
}
function dedupeProtections(items) {
  const seen = new Set();
  return items.filter((item) => { const key = `${item.category}|${item.label}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

async function checkHeritage(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  heritageState.status = "loading"; heritageState.protections = []; heritageState.rawCount = 0;
  setHeritageBadge("Recherche…", "neutral"); setHeritageStatus("Recherche des servitudes patrimoniales au point géocodé…", "loading");
  setHeritageDetails(false); renderProtections([]);
  try {
    const params = new URLSearchParams({ lon: String(lon), lat: String(lat) });
    const response = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/feature-info/sup?${params.toString()}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    heritageState.rawCount = features.length;
    const protections = dedupeProtections(features.map((feature) => {
      const category = detectCategory(feature); if (!category) return null;
      const meta = HERITAGE_CATEGORIES[category];
      return { category, label: featureLabel(feature, meta?.title || category), properties: feature.properties || {} };
    }).filter(Boolean));
    heritageState.status = "done"; heritageState.protections = protections; heritageState.checkedAt = new Date().toISOString();
    if (protections.length) {
      setHeritageBadge(`${protections.length} protection${protections.length > 1 ? "s" : ""} détectée${protections.length > 1 ? "s" : ""}`, "warn");
      setHeritageStatus("Protection patrimoniale détectée : contrôle complémentaire nécessaire avant de conclure sur le dossier.", "warn");
      setHeritageDetails(true);
    } else {
      setHeritageBadge("Aucune détectée", "ok");
      setHeritageStatus("Aucune servitude AC1 / AC2 / AC4 détectée au point. Le détail est replié pour alléger l’affichage.", "ok");
      setHeritageDetails(false);
    }
    renderProtections(protections);
  } catch (error) {
    console.warn("Contrôle patrimonial indisponible", error);
    heritageState.status = "error"; heritageState.protections = [];
    setHeritageBadge("À vérifier", "warn");
    setHeritageStatus("Le contrôle patrimonial automatique est momentanément indisponible. Vérification manuelle requise sur le Géoportail de l’Urbanisme.", "warn");
    setHeritageDetails(true); renderProtections([]);
  }
}

document.addEventListener("atlas:geocoded", (event) => { const d = event.detail || {}; checkHeritage(d.lat, d.lon); });
window.AtlasHeritage = { state: heritageState, checkHeritage };
