const $ = (id) => document.getElementById(id);
let RULES = null;

function row(level, title, text) {
  return `<div class="check-row ${level}"><strong>${title}</strong><span>${text}</span></div>`;
}

function worsen(current, next) {
  const rank = { ok: 0, warn: 1, bad: 2 };
  return rank[next] > rank[current] ? next : current;
}

function num(id) { return Number($(id)?.value || 0); }

function checkLimit(results, label, value, max, unit, ref) {
  if (!value || max == null) return "ok";
  if (value <= max) {
    results.push(row("ok", label, `${value.toFixed(2)} ${unit} ≤ ${max} ${unit} — ${ref}`));
    return "ok";
  }
  results.push(row("bad", label, `${value.toFixed(2)} ${unit} > ${max} ${unit} — ${ref}`));
  return "bad";
}

async function loadRules() {
  try {
    const response = await fetch("data/rules.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    RULES = await response.json();
  } catch (error) {
    console.error("Impossible de charger le référentiel Atlas", error);
  }
}

function analyzeAdvertising(ctx, results) {
  let severity = "ok";
  const zone = RULES.advertising[ctx.zp];
  if (!zone) {
    results.push(row("warn", "Zonage", "Zone publicité / préenseigne non renseignée ou inconnue."));
    return "warn";
  }
  if (ctx.zp === "ZP1") {
    const exception = zone.exceptions?.[ctx.mounting];
    if (!exception?.allowed) {
      results.push(row("bad", "Implantation", `Publicité interdite en ${ctx.zp}, hors exceptions prévues — Partie 1, art. 2.1.`));
      return "bad";
    }
    severity = worsen(severity, checkLimit(results, "Surface", ctx.surface, exception.maxSurface, "m²", exception.ref));
    if (ctx.count > exception.maxCount) { results.push(row("bad", "Nombre", `${ctx.count} dispositifs > ${exception.maxCount} autorisé — ${exception.ref}`)); severity = "bad"; }
    return severity;
  }
  if (ctx.digital) {
    const digital = zone.digital;
    if (!digital?.allowed) { results.push(row("bad", "Numérique", `Publicité numérique interdite en ${ctx.zp} — ${digital?.ref || "RLPi"}`)); return "bad"; }
    results.push(row("ok", "Numérique", `Autorisé en ${ctx.zp} sous conditions — ${digital.ref}`));
    severity = worsen(severity, checkLimit(results, "Surface numérique", ctx.surface, digital.maxSurface, "m²", digital.ref));
    severity = worsen(severity, checkLimit(results, "Hauteur numérique", ctx.totalHeight, digital.maxHeight, "m", digital.ref));
  }
  const rule = zone.rules?.[ctx.mounting];
  if (!rule) { results.push(row("warn", "Référentiel", `Implantation non traitée automatiquement pour ${ctx.zp}.`)); return worsen(severity, "warn"); }
  if (rule.allowed === false) { results.push(row("bad", "Implantation", `Dispositif interdit en ${ctx.zp} pour cette implantation — ${rule.ref}`)); return "bad"; }
  results.push(row("ok", "Implantation", `Implantation admise en ${ctx.zp} — ${rule.ref}`));
  severity = worsen(severity, checkLimit(results, "Surface", ctx.surface, rule.maxSurface, "m²", rule.ref));
  severity = worsen(severity, checkLimit(results, "Hauteur", ctx.totalHeight, rule.maxHeight, "m", rule.ref));
  if (rule.maxCount != null && ctx.count > rule.maxCount) { results.push(row("bad", "Densité", `${ctx.count} dispositifs > ${rule.maxCount} autorisé — ${rule.ref}`)); severity = "bad"; }
  else if (rule.maxCount != null) results.push(row("ok", "Densité", `${ctx.count} dispositif(s) ≤ ${rule.maxCount} — ${rule.ref}`));
  if (rule.minFrontage != null) {
    if (!ctx.frontage) { results.push(row("warn", "Linéaire de façade", `À renseigner : un dispositif au sol est interdit si le linéaire visible est inférieur à ${rule.minFrontage} m — ${rule.ref}`)); severity = worsen(severity, "warn"); }
    else if (ctx.frontage < rule.minFrontage) { results.push(row("bad", "Linéaire de façade", `${ctx.frontage.toFixed(1)} m < ${rule.minFrontage} m : dispositif au sol interdit — ${rule.ref}`)); severity = "bad"; }
    else results.push(row("ok", "Linéaire de façade", `${ctx.frontage.toFixed(1)} m ≥ ${rule.minFrontage} m — ${rule.ref}`));
  }
  return severity;
}

function analyzeSign(ctx, results) {
  let severity = "ok";
  const zone = RULES.signs[ctx.ze];
  if (!zone) { results.push(row("warn", "Zonage", "Zone enseigne non renseignée ou inconnue.")); return "warn"; }
  const general = RULES.general.enseigne;
  if (general.forbiddenMountings.includes(ctx.mounting)) { results.push(row("bad", "Implantation", `Enseigne interdite sur toiture ou terrasse en tenant lieu — ${general.forbiddenMountingsRef}`)); return "bad"; }
  if (ctx.mounting === "window") {
    const win = RULES.general.windowLight;
    if (!ctx.lit) { results.push(row("warn", "Vitrine", "Le contrôle automatisé vise les supports lumineux visibles depuis la voie publique.")); return "warn"; }
    severity = worsen(severity, checkLimit(results, "Surface cumulée vitrine", ctx.surface * ctx.count, win.maxCumulativeSurface, "m²", win.ref));
    if (ctx.count > win.maxCount) { results.push(row("bad", "Nombre en vitrine", `${ctx.count} dispositifs > ${win.maxCount} — ${win.ref}`)); severity = "bad"; }
    else results.push(row("ok", "Nombre en vitrine", `${ctx.count} dispositif(s) ≤ ${win.maxCount} — ${win.ref}`));
    return severity;
  }
  if (ctx.digital) {
    const digital = zone.digital;
    if (digital.allowed === false) { results.push(row("bad", "Numérique", `Enseigne numérique interdite en ${ctx.ze} — ${digital.ref}`)); severity = "bad"; }
    else if (digital.allowed === "fuel_or_emergency") {
      if (ctx.fuelStation || ctx.emergency) results.push(row("ok", "Numérique", `Exception admise pour service d’urgence ou station-service affichant les tarifs — ${digital.ref}`));
      else { results.push(row("bad", "Numérique", `Autorisé uniquement pour les services d’urgence et les stations-service affichant les tarifs — ${digital.ref}`)); severity = "bad"; }
    } else {
      results.push(row("ok", "Numérique", `Enseigne numérique admise en ${ctx.ze} sous conditions — ${digital.ref}`));
      severity = worsen(severity, checkLimit(results, "Surface numérique", ctx.surface, digital.maxSurface, "m²", digital.ref));
      if (ctx.mounting === "ground") severity = worsen(severity, checkLimit(results, "Hauteur numérique", ctx.totalHeight, digital.maxGroundHeight, "m", digital.ref));
    }
  }
  const rule = zone.rules?.[ctx.mounting];
  if (!rule) { results.push(row("warn", "Référentiel", `Implantation non traitée automatiquement pour ${ctx.ze}.`)); return worsen(severity, "warn"); }
  if (rule.allowed === false) { results.push(row("bad", "Implantation", `Enseigne interdite pour cette implantation en ${ctx.ze} — ${rule.ref}`)); return "bad"; }
  results.push(row("ok", "Implantation", `Implantation admise en ${ctx.ze} — ${rule.ref}`));
  if (ctx.mounting === "ground") {
    if (ctx.surface <= 1 && ctx.surface > 0) severity = worsen(severity, checkLimit(results, "Hauteur", ctx.totalHeight, rule.smallMaxHeight, "m", rule.ref));
    else if (ctx.surface > 1) {
      if (rule.largeAllowed === false) { results.push(row("bad", "Surface", `Enseigne au sol > 1 m² interdite en ${ctx.ze} — ${rule.ref}`)); severity = "bad"; }
      else {
        const grouped = ctx.activities >= 2;
        severity = worsen(severity, checkLimit(results, grouped ? "Surface cumulée" : "Surface", ctx.surface, grouped ? rule.groupedMaxSurface : rule.largeMaxSurface, "m²", rule.ref));
        severity = worsen(severity, checkLimit(results, "Hauteur", ctx.totalHeight, grouped ? rule.groupedMaxHeight : rule.largeMaxHeight, "m", rule.ref));
      }
    }
    if (ctx.count > 1) { results.push(row("warn", "Nombre", `Le RLPi prévoit en principe une enseigne au sol par activité et par voie : vérifier le nombre de voies bordant le terrain — ${rule.ref}`)); severity = worsen(severity, "warn"); }
  }
  if (ctx.mounting === "wall") {
    const largeFacade = ctx.facadeSurface > 200;
    const maxH = largeFacade ? (rule.maxHeightLargeFacade ?? rule.letterHeightLargeFacade) : (rule.maxHeight ?? rule.letterHeight);
    if (ctx.height && maxH != null) severity = worsen(severity, checkLimit(results, rule.letterHeight != null ? "Hauteur du lettrage" : "Hauteur de l’enseigne", ctx.height, maxH, "m", rule.ref));
    if (ctx.projection && rule.maxProjection != null) severity = worsen(severity, checkLimit(results, "Saillie", ctx.projection, rule.maxProjection, "m", rule.ref));
  }
  if (ctx.mounting === "perpendicular") {
    severity = worsen(severity, checkLimit(results, "Hauteur", ctx.height, rule.maxHeight, "m", rule.ref));
    severity = worsen(severity, checkLimit(results, "Saillie", ctx.projection, rule.maxProjection, "m", rule.ref));
    if (rule.maxCountPerActivity != null && ctx.count > rule.maxCountPerActivity) { results.push(row("bad", "Nombre", `${ctx.count} dispositifs > ${rule.maxCountPerActivity} maximum par activité — ${rule.ref}`)); severity = "bad"; }
  }
  if (ctx.mounting === "fence") {
    if (rule.requiresNoFacadeSign && !ctx.noFacadeSign) { results.push(row("bad", "Condition clôture", `En ${ctx.ze}, l’enseigne sur clôture n’est admise que si aucune enseigne ne peut être installée sur la façade — ${rule.ref}`)); severity = "bad"; }
    severity = worsen(severity, checkLimit(results, ctx.activities >= 2 ? "Surface cumulée" : "Surface", ctx.surface, ctx.activities >= 2 ? rule.groupedMaxSurface : rule.maxSurface, "m²", rule.ref));
  }
  if (ctx.lit) { results.push(row("warn", "Extinction lumineuse", `${general.extinction} — ${general.extinctionRef}`)); severity = worsen(severity, "warn"); }
  return severity;
}

function addLocationAndHeritageChecks(ctx, results) {
  let severity = "ok";
  let inconclusive = false;
  const geo = window.AtlasGeo || {};
  if (geo.precision === "exact") results.push(row("ok", "Adresse / parcelle", `Adresse précise${window.AtlasZoning?.getParcelId?.() ? ` · parcelle ${window.AtlasZoning.getParcelId()}` : ""}.`));
  else if (geo.precision === "street" || geo.precision === "approx") { results.push(row("warn", "Adresse / parcelle", "Localisation par voie ou secteur : la parcelle reste indicative. Confirmer l’implantation exacte avant de conclure.")); severity = "warn"; inconclusive = true; }
  else { results.push(row("warn", "Adresse / parcelle", "Adresse précise non vérifiée. Géocoder le dossier avant de conclure.")); severity = "warn"; inconclusive = true; }

  const confidence = $("zoneConfidence")?.textContent || "";
  if (!ctx.zp || !ctx.ze) { results.push(row("warn", "Fiabilité du zonage", "Zonage incomplet : impossible de conclure automatiquement tant que la ZP/ZE n’est pas déterminée.")); severity = "warn"; inconclusive = true; }
  else if (confidence.startsWith("Élevée")) results.push(row("ok", "Fiabilité du zonage", `${confidence}.`));
  else if (confidence.startsWith("Moyenne")) { results.push(row("warn", "Fiabilité du zonage", `${confidence}. Confirmer la zone sur le plan officiel avant décision.`)); severity = "warn"; }
  else { results.push(row("warn", "Fiabilité du zonage", `${confidence || "À confirmer"}. Le plan officiel doit être vérifié avant décision.`)); severity = "warn"; inconclusive = true; }

  const heritage = window.AtlasHeritage?.state;
  if (!heritage || heritage.status === "idle" || heritage.status === "loading") { results.push(row("warn", "Protection patrimoniale", "Contrôle AC1 / AC2 / AC4 non terminé. Impossible de conclure automatiquement.")); severity = "warn"; inconclusive = true; }
  else if (heritage.status === "error") { results.push(row("warn", "Protection patrimoniale", "Service patrimonial indisponible : vérification manuelle requise sur le Géoportail de l’Urbanisme.")); severity = "warn"; inconclusive = true; }
  else if (heritage.protections?.length) { const cats = [...new Set(heritage.protections.map((p) => p.category))].join(", "); results.push(row("warn", "Protection patrimoniale", `${heritage.protections.length} protection(s) détectée(s) (${cats}). Contrôle complémentaire / avis patrimonial requis avant décision.`)); severity = "warn"; }
  else results.push(row("ok", "Protection patrimoniale", "Aucune servitude AC1 / AC2 / AC4 détectée au point par le Géoportail de l’Urbanisme. Résultat informatif, à rapprocher des documents opposables."));
  return { severity, inconclusive };
}

function addNationalChecks(ctx, results) {
  let severity = "ok";
  let inconclusive = false;
  const isAd = ctx.type === "publicite" || ctx.type === "preenseigne";

  if (ctx.treeSupport && isAd) {
    results.push(row("bad", "Règle nationale · arbre", "Publicité et préenseigne interdites sur les arbres — Code de l’environnement, art. L.581-4."));
    severity = "bad";
  }

  if (ctx.outsideAgglomeration && ctx.type === "publicite") {
    results.push(row("bad", "Règle nationale · hors agglomération", "La publicité est en principe interdite hors agglomération, sous réserve des exceptions prévues par le Code de l’environnement — art. L.581-7."));
    severity = "bad";
  } else if (ctx.outsideAgglomeration && ctx.type === "preenseigne") {
    results.push(row("warn", "Règle nationale · préenseigne hors agglomération", "Les préenseignes hors agglomération relèvent de régimes et exceptions spécifiques : vérification manuelle obligatoire avant décision."));
    severity = worsen(severity, "warn");
    inconclusive = true;
  }

  if (ctx.motorway && isAd && ctx.mounting === "ground" && !ctx.lit) {
    results.push(row("bad", "Règle nationale · autoroute / route express", "Un dispositif publicitaire non lumineux scellé ou installé au sol est interdit lorsqu’il est visible d’une autoroute, bretelle, route express, déviation ou voie hors agglomération dans les cas visés — Code de l’environnement, art. R.581-31."));
    severity = "bad";
  } else if (ctx.motorway) {
    results.push(row("warn", "Autoroute / voie express", "Contrôle complémentaire requis au titre du Code de la route et des règles nationales de visibilité. Atlas ne conclut pas automatiquement pour ce cas."));
    severity = worsen(severity, "warn");
    inconclusive = true;
  }

  if (!ctx.outsideAgglomeration) results.push(row("ok", "Règle nationale · agglomération", "Aucun signalement « hors agglomération » renseigné. Vérifier la limite d’agglomération du site si elle est incertaine."));
  return { severity, inconclusive };
}

function analyze() {
  const results = [];
  let severity = "ok";
  let inconclusive = false;
  if (!RULES) { $("checksResult").innerHTML = row("bad", "Référentiel", "Le fichier des règles n’a pas pu être chargé. Rechargez la page."); return; }

  const ctx = {
    type: $("deviceType").value, mounting: $("mounting").value, ze: $("ze").value, zp: $("zp").value,
    width: num("width"), height: num("height"), totalHeight: num("totalHeight"), count: num("count") || 1,
    frontage: num("frontage"), activities: num("activities") || 1, facadeSurface: num("facadeSurface"), projection: num("projection"),
    lit: $("lit").checked, digital: $("digital").checked, fuelStation: $("fuelStation").checked, emergency: $("emergency").checked,
    noFacadeSign: $("noFacadeSign").checked, motorway: $("motorway").checked,
    outsideAgglomeration: $("outsideAgglomeration").checked, treeSupport: $("treeSupport").checked
  };
  ctx.surface = ctx.width * ctx.height;

  if (!ctx.width || !ctx.height) { results.push(row("warn", "Dimensions", "Largeur et hauteur du dispositif à renseigner pour contrôler la surface.")); severity = "warn"; }
  else results.push(row("ok", "Surface calculée", `${ctx.surface.toFixed(2)} m²`));

  if (ctx.type === "enseigne") severity = worsen(severity, analyzeSign(ctx, results));
  else severity = worsen(severity, analyzeAdvertising(ctx, results));

  const contextCheck = addLocationAndHeritageChecks(ctx, results);
  severity = worsen(severity, contextCheck.severity); inconclusive = contextCheck.inconclusive;

  const nationalCheck = addNationalChecks(ctx, results);
  severity = worsen(severity, nationalCheck.severity); inconclusive = inconclusive || nationalCheck.inconclusive;

  results.push(row("warn", "Portée de l’analyse", "Pré-analyse automatisée RLPi + contrôles nationaux ciblés : les autres règles, autorisations et particularités du site restent à vérifier."));
  severity = worsen(severity, "warn");

  const city = $("city").value.trim() || "Commune non renseignée";
  const zone = ctx.type === "enseigne" ? ctx.ze : ctx.zp;
  $("summary").textContent = `${city} · ${ctx.type} · ${zone || "zone à déterminer"}${ctx.surface ? ` · ${ctx.surface.toFixed(2)} m²` : ""}`;
  $("checksResult").innerHTML = results.join("");

  const badge = $("statusBadge");
  if (severity === "bad") { badge.className = "badge bad"; badge.textContent = "Non conforme / à corriger"; }
  else if (inconclusive) { badge.className = "badge neutral"; badge.textContent = "Impossible de conclure automatiquement"; }
  else if (severity === "warn") { badge.className = "badge warn"; badge.textContent = "Conforme sous réserves / à vérifier"; }
  else { badge.className = "badge ok"; badge.textContent = "Conforme RLPi"; }
}

$("analyzeBtn").addEventListener("click", analyze);
loadRules();
