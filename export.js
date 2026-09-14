// Atlas v1.4.2 — export de la fiche d'instruction
function atlasReportText() {
  const value = (id) => document.getElementById(id)?.textContent?.trim() || "—";
  const field = (id) => document.getElementById(id)?.value?.trim() || "—";
  const selected = (id) => document.getElementById(id)?.selectedOptions?.[0]?.textContent?.trim() || "À déterminer";
  const address = field("address") === "—" ? "Adresse non renseignée" : field("address");
  const city = field("city") === "—" ? "Commune non renseignée" : field("city");
  const device = selected("deviceType");
  const mounting = selected("mounting");
  const roads = selected("borderingRoads");
  const roadsConfidence = selected("roadsConfidence");
  const rows = [...document.querySelectorAll("#checksResult .check-row")].map((node) => {
    const title = node.querySelector("strong")?.textContent?.trim() || "Contrôle";
    const text = node.querySelector("span")?.textContent?.trim() || "";
    return `- ${title} : ${text}`;
  });
  return [
    "ATLAS — FICHE DE PRÉ-ANALYSE",
    `Date : ${new Date().toLocaleString("fr-FR")}`,
    `Adresse : ${address}`,
    `Commune : ${city}`,
    `Parcelle : ${value("parcel")}`,
    `Précision adresse : ${value("addressPrecision")}`,
    `Zone ZP du plan : ${selected("zp")}`,
    `Zone ZE du plan : ${selected("zePlan")}`,
    `Règles enseignes applicables : ${selected("ze")}`,
    `Confiance zonage : ${value("zoneConfidence")}`,
    `Voies bordant l’activité : ${roads}`,
    `Confirmation des voies : ${roadsConfidence}`,
    `Observation voies : ${field("roadsNote")}`,
    `Type : ${device}`,
    `Implantation : ${mounting}`,
    `Conclusion : ${value("statusBadge")}`,
    `Synthèse : ${value("summary")}`,
    "",
    "CONTRÔLES",
    ...(rows.length ? rows : ["- Analyse non lancée"]),
    "",
    "Document de pré-analyse : vérifier les documents opposables et autorisations applicables avant décision."
  ].join("\n");
}

async function copyAtlasReport() {
  const button = document.getElementById("copyReportBtn");
  try {
    await navigator.clipboard.writeText(atlasReportText());
    if (button) {
      const old = button.textContent;
      button.textContent = "Copié";
      setTimeout(() => { button.textContent = old; }, 1400);
    }
  } catch (error) {
    console.warn("Copie impossible", error);
    alert("La copie automatique n’est pas disponible sur ce navigateur.");
  }
}

document.getElementById("printBtn")?.addEventListener("click", () => window.print());
document.getElementById("copyReportBtn")?.addEventListener("click", copyAtlasReport);
window.AtlasExport = { reportText: atlasReportText, copy: copyAtlasReport };
