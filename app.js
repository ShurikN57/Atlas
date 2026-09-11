const $ = (id) => document.getElementById(id);

const RULES = {
  ZE2: {
    ground: { maxSurface: 4, maxHeight: 4, ref: "RLPi Metz — ZE2 (prototype)" }
  },
  ZE3: {
    ground: { maxSurface: 6, maxHeight: 6, ref: "RLPi Metz — ZE3 (prototype)" }
  },
  "ZP5-A": {
    ground: { maxSurface: 10.5, maxHeight: 6, ref: "RLPi Metz — ZP5-A (prototype)" }
  }
};

function row(level, title, text) {
  return `<div class="check-row ${level}"><strong>${title}</strong><span>${text}</span></div>`;
}

function analyze() {
  const type = $("deviceType").value;
  const mounting = $("mounting").value;
  const ze = $("ze").value;
  const zp = $("zp").value;
  const width = Number($("width").value || 0);
  const height = Number($("height").value || 0);
  const totalHeight = Number($("totalHeight").value || 0);
  const motorway = $("motorway").checked;
  const digital = $("digital").checked;
  const surface = width * height;

  const zone = type === "enseigne" ? ze : zp;
  const rule = RULES[zone]?.[mounting];
  const results = [];
  let severity = "ok";

  if (!zone) {
    results.push(row("warn", "Zonage", "Zone réglementaire non renseignée."));
    severity = "warn";
  }

  if (!width || !height) {
    results.push(row("warn", "Dimensions", "Largeur et hauteur du dispositif à renseigner."));
    severity = "warn";
  } else {
    results.push(row("ok", "Surface calculée", `${surface.toFixed(2)} m²`));
  }

  if (rule && surface) {
    if (surface <= rule.maxSurface) {
      results.push(row("ok", "Surface", `${surface.toFixed(2)} m² ≤ ${rule.maxSurface} m² — ${rule.ref}`));
    } else {
      results.push(row("bad", "Surface", `${surface.toFixed(2)} m² > ${rule.maxSurface} m² — ${rule.ref}`));
      severity = "bad";
    }

    if (totalHeight) {
      if (totalHeight <= rule.maxHeight) {
        results.push(row("ok", "Hauteur", `${totalHeight.toFixed(2)} m ≤ ${rule.maxHeight} m — ${rule.ref}`));
      } else {
        results.push(row("bad", "Hauteur", `${totalHeight.toFixed(2)} m > ${rule.maxHeight} m — ${rule.ref}`));
        severity = "bad";
      }
    }
  } else if (zone && !rule) {
    results.push(row("warn", "Référentiel", "Cette combinaison zone / implantation n’est pas encore codée dans la v0.1."));
    if (severity !== "bad") severity = "warn";
  }

  if (digital) {
    results.push(row("warn", "Numérique", "Contrôle spécifique requis : type d’activité, zone, surface, luminosité et extinction."));
    if (severity !== "bad") severity = "warn";
  }

  if (motorway) {
    results.push(row("warn", "Autoroute / voie express", "Contrôle complémentaire obligatoire au titre du Code de la route et des règles de visibilité depuis l’axe."));
    if (severity !== "bad") severity = "warn";
  }

  const city = $("city").value.trim() || "Commune non renseignée";
  $("summary").textContent = `${city} · ${type} · ${zone || "zone à déterminer"}${surface ? ` · ${surface.toFixed(2)} m²` : ""}`;
  $("checksResult").innerHTML = results.join("");

  const badge = $("statusBadge");
  badge.className = `badge ${severity}`;
  badge.textContent = severity === "bad" ? "Non conforme / à corriger" : severity === "warn" ? "Vérification requise" : "Pré-analyse conforme";
}

$("analyzeBtn").addEventListener("click", analyze);
