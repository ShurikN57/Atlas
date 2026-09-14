// Atlas v1.4.2 — historique local des dossiers
const ATLAS_HISTORY_KEY = "atlas_history_v1_2";
const ATLAS_HISTORY_MAX = 30;

const HISTORY_VALUE_FIELDS = [
  "address", "city", "zp", "zePlan", "ze", "deviceType", "mounting", "width", "height", "totalHeight",
  "count", "frontage", "activities", "facadeSurface", "projection", "borderingRoads", "roadsConfidence", "roadsNote", "planType"
];
const HISTORY_CHECK_FIELDS = [
  "lit", "digital", "fuelStation", "emergency", "noFacadeSign", "motorway", "outsideAgglomeration", "treeSupport"
];

function readAtlasHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(ATLAS_HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn("Historique Atlas illisible", error);
    return [];
  }
}

function writeAtlasHistory(items) {
  localStorage.setItem(ATLAS_HISTORY_KEY, JSON.stringify(items.slice(0, ATLAS_HISTORY_MAX)));
}

function currentCaseSnapshot() {
  const values = {};
  const checks = {};
  HISTORY_VALUE_FIELDS.forEach((id) => { values[id] = document.getElementById(id)?.value ?? ""; });
  HISTORY_CHECK_FIELDS.forEach((id) => { checks[id] = Boolean(document.getElementById(id)?.checked); });
  const text = (id) => document.getElementById(id)?.textContent?.trim() || "";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    values,
    checks,
    result: {
      status: text("statusBadge"),
      statusClass: document.getElementById("statusBadge")?.className || "badge neutral",
      summary: text("summary"),
      checksHtml: document.getElementById("checksResult")?.innerHTML || ""
    },
    context: {
      postcode: text("postcode"), coords: text("coords"), parcel: text("parcel"),
      precision: text("addressPrecision"), confidence: text("zoneConfidence"), method: text("zoneMethod")
    }
  };
}

function saveAtlasCase() {
  const result = document.getElementById("checksResult");
  if (!result?.children?.length) {
    alert("Lancez d’abord l’analyse avant d’enregistrer le dossier.");
    return;
  }
  const item = currentCaseSnapshot();
  const history = readAtlasHistory();
  history.unshift(item);
  writeAtlasHistory(history);
  renderAtlasHistory();
  const button = document.getElementById("saveCaseBtn");
  if (button) {
    const old = button.textContent;
    button.textContent = "Dossier enregistré";
    setTimeout(() => { button.textContent = old; }, 1400);
  }
}

function restoreAtlasCase(id) {
  const item = readAtlasHistory().find((entry) => entry.id === id);
  if (!item) return;
  HISTORY_VALUE_FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (el) el.value = item.values?.[field] ?? "";
  });
  HISTORY_CHECK_FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (el) el.checked = Boolean(item.checks?.[field]);
  });
  const badge = document.getElementById("statusBadge");
  if (badge) { badge.className = item.result?.statusClass || "badge neutral"; badge.textContent = item.result?.status || "Historique"; }
  const summary = document.getElementById("summary");
  if (summary) summary.textContent = item.result?.summary || "Dossier historique";
  const checksResult = document.getElementById("checksResult");
  if (checksResult) checksResult.innerHTML = item.result?.checksHtml || "";
  const geoStatus = document.getElementById("geoStatus");
  if (geoStatus) {
    geoStatus.className = "geo-status warn";
    geoStatus.textContent = "Dossier historique restauré. Relancez la recherche d’adresse avant une nouvelle analyse afin de réactualiser parcelle, zonages et patrimoine.";
  }
  window.AtlasZoning?.applyZePlanRules?.(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteAtlasCase(id) {
  writeAtlasHistory(readAtlasHistory().filter((entry) => entry.id !== id));
  renderAtlasHistory();
}

function clearAtlasHistory() {
  if (!readAtlasHistory().length) return;
  if (!confirm("Effacer tout l’historique Atlas enregistré sur cet appareil ?")) return;
  localStorage.removeItem(ATLAS_HISTORY_KEY);
  renderAtlasHistory();
}

function escapeHistoryText(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function renderAtlasHistory() {
  const box = document.getElementById("historyList");
  if (!box) return;
  const history = readAtlasHistory();
  if (!history.length) {
    box.innerHTML = '<div class="heritage-empty"><strong>Aucun dossier enregistré.</strong><span>L’historique est conservé uniquement dans ce navigateur.</span></div>';
    return;
  }
  box.innerHTML = history.map((item) => {
    const date = new Date(item.savedAt).toLocaleString("fr-FR");
    const address = escapeHistoryText(item.values?.address || "Adresse non renseignée");
    const status = escapeHistoryText(item.result?.status || "Sans statut");
    return `<div class="check-row"><div><strong>${address}</strong><span>${date} · ${status}</span></div><div class="history-actions"><button class="secondary" type="button" data-history-restore="${item.id}">Restaurer</button><button class="secondary" type="button" data-history-delete="${item.id}">Supprimer</button></div></div>`;
  }).join("");
  box.querySelectorAll("[data-history-restore]").forEach((button) => button.addEventListener("click", () => restoreAtlasCase(button.dataset.historyRestore)));
  box.querySelectorAll("[data-history-delete]").forEach((button) => button.addEventListener("click", () => deleteAtlasCase(button.dataset.historyDelete)));
}

document.getElementById("saveCaseBtn")?.addEventListener("click", saveAtlasCase);
document.getElementById("clearHistoryBtn")?.addEventListener("click", clearAtlasHistory);
renderAtlasHistory();
window.AtlasHistory = { read: readAtlasHistory, save: saveAtlasCase, restore: restoreAtlasCase, remove: deleteAtlasCase };
