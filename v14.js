// Atlas v1.4 — voies bordant l'activité, import de plans et recherche documentaire
(function () {
  const $ = (id) => document.getElementById(id);
  const ROAD_COUNT_LABELS = { "": "À déterminer", "1": "1 voie", "2": "2 voies", "3plus": "3 voies ou plus" };

  function appendRoadCheck() {
    const box = $("checksResult");
    if (!box) return;
    box.querySelector("#roadCheckV14")?.remove();
    const type = $("deviceType")?.value;
    const mounting = $("mounting")?.value;
    if (type !== "enseigne" || mounting !== "ground") return;

    const count = Number($("count")?.value || 1);
    const activities = Number($("activities")?.value || 1);
    const roads = $("borderingRoads")?.value || "";
    const confidence = $("roadsConfidence")?.value || "manual";
    const note = $("roadsNote")?.value?.trim() || "";
    const div = document.createElement("div");
    div.id = "roadCheckV14";

    let level = "ok";
    let text = "";
    if (!roads) {
      level = "warn";
      text = "Nombre de voies bordant l’activité non déterminé. Vérifier le plan cadastral + le plan de masse avant de conclure sur le nombre d’enseignes au sol.";
      const badge = $("statusBadge");
      if (badge && !badge.classList.contains("bad")) {
        badge.className = "badge neutral";
        badge.textContent = "Impossible de conclure automatiquement";
      }
    } else if (roads === "3plus") {
      level = "warn";
      text = `Au moins 3 voies déclarées. Le plafond exact dépend du nombre réel de voies ouvertes à la circulation publique et du nombre d’activités ; contrôle du plan requis.${note ? ` Note : ${note}` : ""}`;
    } else {
      const n = Number(roads);
      const indicativeMax = n * activities;
      if (count > indicativeMax) {
        level = "warn";
        text = `${count} enseigne(s) au sol pour ${activities} activité(s) et ${n} voie(s) déclarée(s). Le principe « une enseigne par activité et par voie » paraît dépassé : vérifier la règle exacte du secteur avant décision.`;
      } else {
        text = `${count} enseigne(s) au sol pour ${activities} activité(s) et ${n} voie(s) bordant l’activité : cohérent avec le principe « une enseigne par activité et par voie », sous réserve de confirmation du statut des voies.`;
      }
      if (confidence !== "confirmed") {
        level = "warn";
        text += " Nombre de voies renseigné mais non confirmé par les plans.";
      }
      if (note) text += ` Note : ${note}`;
    }

    div.className = `check-row ${level}`;
    div.innerHTML = `<strong>Voies bordant l’activité</strong><span>${text}</span>`;
    box.appendChild(div);
  }

  function syncPlanRoadCount() {
    const planRoads = $("planRoadCount")?.value || "";
    if (planRoads && $("borderingRoads")) $("borderingRoads").value = planRoads;
    if (planRoads && $("roadsConfidence")) $("roadsConfidence").value = "confirmed";
    const noteParts = [];
    if ($("planShowsParcel")?.checked) noteParts.push("limites parcellaires visibles");
    if ($("planShowsPublicRoads")?.checked) noteParts.push("voies publiques identifiées");
    if ($("planShowsInternalRoads")?.checked) noteParts.push("voies internes repérées");
    if (noteParts.length && $("roadsNote")) {
      $("roadsNote").value = `Plan contrôlé : ${noteParts.join(", ")}.`;
    }
    const status = $("planAnalysisStatus");
    if (status) {
      status.className = "geo-status ok";
      status.textContent = planRoads
        ? `${ROAD_COUNT_LABELS[planRoads]} reportée(s) dans le dossier. Le contrôle reste fondé sur votre lecture du plan.`
        : "Checklist enregistrée. Renseignez le nombre de voies si le plan permet de le confirmer.";
    }
  }

  let planObjectUrl = null;
  function previewPlan(file) {
    const preview = $("planPreview");
    const meta = $("planMeta");
    if (!preview || !meta) return;
    if (planObjectUrl) URL.revokeObjectURL(planObjectUrl);
    planObjectUrl = null;
    preview.innerHTML = "";
    if (!file) {
      meta.textContent = "Aucun plan chargé.";
      return;
    }
    const max = 20 * 1024 * 1024;
    if (file.size > max) {
      meta.textContent = "Fichier trop volumineux : 20 Mo maximum.";
      return;
    }
    planObjectUrl = URL.createObjectURL(file);
    meta.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} Mo · ${file.type || "type inconnu"}`;
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = planObjectUrl;
      img.alt = "Aperçu du plan importé";
      img.className = "plan-preview-image";
      preview.appendChild(img);
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const iframe = document.createElement("iframe");
      iframe.src = planObjectUrl;
      iframe.title = "Aperçu du plan PDF";
      iframe.className = "plan-preview-pdf";
      preview.appendChild(iframe);
    } else {
      preview.innerHTML = '<div class="heritage-empty"><strong>Aperçu indisponible.</strong><span>Utilisez un PDF, JPG ou PNG.</span></div>';
    }
    const details = $("planGuidedAnalysis");
    if (details) details.open = true;
  }

  function runPappersSearch() {
    const terms = $("docSearchTerms")?.value?.trim() || "";
    const commune = $("docSearchCommune")?.value?.trim() || $("city")?.value?.trim() || "";
    if (!terms && !commune) {
      const status = $("docSearchStatus");
      if (status) {
        status.className = "geo-status warn";
        status.textContent = "Saisissez un mot-clé ou une commune.";
      }
      return;
    }
    const q = [`site:politique.pappers.fr/commune/document`, commune, terms].filter(Boolean).join(" ");
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    const status = $("docSearchStatus");
    if (status) {
      status.className = "geo-status ok";
      status.textContent = "Recherche publique ouverte dans un nouvel onglet. Les résultats Pappers sont documentaires et ne modifient pas le verdict Atlas.";
    }
  }

  $("analyzeBtn")?.addEventListener("click", () => setTimeout(appendRoadCheck, 0));
  $("planFile")?.addEventListener("change", (event) => previewPlan(event.target.files?.[0] || null));
  $("applyPlanAnalysisBtn")?.addEventListener("click", syncPlanRoadCount);
  $("docSearchBtn")?.addEventListener("click", runPappersSearch);
  $("docSearchTerms")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); runPappersSearch(); }
  });
  $("docSearchCommune")?.addEventListener("focus", () => {
    if (!$("docSearchCommune").value && $("city")?.value) $("docSearchCommune").value = $("city").value;
  });

  window.addEventListener("beforeunload", () => { if (planObjectUrl) URL.revokeObjectURL(planObjectUrl); });
  window.AtlasV14 = { appendRoadCheck, previewPlan, runPappersSearch, syncPlanRoadCount };
})();
