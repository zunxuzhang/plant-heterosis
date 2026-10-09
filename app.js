(function () {
  "use strict";

  const themeAlias = {
    "QTL与基因互作": "杂种优势位点鉴定"
  };
  const papers = (window.HETEROSIS_PAPERS || []).map((paper) => ({
    ...paper,
    teams: paper.teams || [],
    themes: paper.themes.map((theme) => themeAlias[theme] || theme)
  }));
  const storageKey = "plant-heterosis-library-saved";

  const themeMeta = {
    经典假说: { color: "#c49a3a" },
    "杂种优势位点鉴定": { color: "#2f8277" },
    "遗传解析": { color: "#527b65" },
    "转录与代谢": { color: "#5b78b8" },
    表观遗传: { color: "#a45d7a" },
    基因组与预测: { color: "#d76b45" },
    杂种预测: { color: "#81582f" },
    育种应用: { color: "#506f92" }
  };

  const typeMeta = [
    { value: "all", label: "全部类型" },
    { value: "经典论文", label: "经典论文" },
    { value: "机制研究", label: "机制研究" },
    { value: "综述", label: "综述" },
    { value: "育种应用", label: "育种应用" }
  ];

  const cropColors = ["#2f8277", "#c49a3a", "#d76b45", "#5b78b8", "#a45d7a", "#527b65", "#506f92"];

  const traitData = {
    yield: {
      label: "产量",
      values: [72, 68, 100],
      note: "中性模型：F1 综合双亲互补优势，并可能产生非加性效应。"
    },
    biomass: {
      label: "生物量",
      values: [76, 73, 102],
      note: "生物量优势常由多基因互补、发育节律与资源利用效率共同形成。"
    },
    vigor: {
      label: "长势",
      values: [66, 70, 96],
      note: "长势表现更易受发育阶段、环境与器官特异性调控影响。"
    }
  };

  const mechanismData = [
    {
      name: "显性互补",
      detail: "双亲有利等位基因在后代中互补，遮蔽不利隐性效应。",
      themes: ["经典假说", "遗传解析"],
      color: "#edf7ca"
    },
    {
      name: "超显性与上位性",
      detail: "杂合位点优势及多位点互作可形成非加性表型。",
      themes: ["杂种优势位点鉴定", "遗传解析"],
      color: "#dceee9"
    },
    {
      name: "表达与剂量调控",
      detail: "等位基因表达、转录网络与代谢补偿共同塑造杂种表型。",
      themes: ["转录与代谢"],
      color: "#e2e9f7"
    },
    {
      name: "表观遗传重塑",
      detail: "甲基化、小 RNA 和染色质状态在杂交后发生动态改变。",
      themes: ["表观遗传"],
      color: "#f3dfe7"
    },
    {
      name: "基因组选择",
      detail: "利用全基因组标记预测未测组合，缩短杂交育种周期。",
      themes: ["杂种预测"],
      color: "#f6e1d8"
    },
    {
      name: "组学与模型融合",
      detail: "整合基因组、转录组、代谢组与环境信息，提高杂种表现预测稳定性。",
      themes: ["杂种预测", "基因组与预测", "育种应用"],
      color: "#eee3cf"
    }
  ];

  const state = {
    view: "library",
    query: "",
    teams: new Set(),
    themes: new Set(),
    crops: new Set(),
    decade: "all",
    type: "all",
    sort: "relevance",
    compact: false,
    saved: loadSaved()
  };

  const elements = {};
  let lastDialogTrigger = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    renderFilters();
    renderStats();
    renderPerformanceChart("yield");
    renderPapers();
    renderInsights();
    renderSaved();
  }

  function cacheElements() {
    [
      "searchInput",
      "heroPaperCount",
      "heroCropCount",
      "heroThemeCount",
      "performanceChart",
      "chartNote",
      "libraryView",
      "insightsView",
      "savedView",
      "themeFilters",
      "teamFilters",
      "cropFilters",
      "decadeFilters",
      "typeFilters",
      "resetFilters",
      "themeFilterSummary",
      "teamFilterSummary",
      "cropFilterSummary",
      "resultTitle",
      "resultCount",
      "paperGrid",
      "emptyState",
      "activeFilters",
      "sortSelect",
      "compactToggle",
      "clearEmptyFilters",
      "paperDialog",
      "dialogClose",
      "dialogContent",
      "savedNavCount",
      "savedList",
      "savedEmpty",
      "clearSaved",
      "savedExport",
      "goToLibrary",
      "headerExport",
      "insightSummary",
      "timelineChart",
      "themeDistribution",
      "mechanismList",
      "cropMatrix",
      "toastRegion"
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.view));
    });

    document.querySelectorAll(".trait-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".trait-btn").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        renderPerformanceChart(button.dataset.trait);
      });
    });

    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      if (state.view !== "library") {
        switchView("library", false);
      }
      renderPapers();
    });

    elements.resetFilters.addEventListener("click", resetFilters);
    elements.clearEmptyFilters.addEventListener("click", resetFilters);
    elements.sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderPapers();
    });
    elements.compactToggle.addEventListener("click", () => {
      state.compact = !state.compact;
      elements.compactToggle.setAttribute("aria-pressed", String(state.compact));
      renderPapers();
    });

    elements.themeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      toggleSetValue(state.themes, button.dataset.theme);
      renderFilters();
      renderPapers();
    });

    elements.teamFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-team]");
      if (!button) return;
      toggleSetValue(state.teams, button.dataset.team);
      renderFilters();
      renderPapers();
    });

    elements.cropFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-crop]");
      if (!button) return;
      toggleSetValue(state.crops, button.dataset.crop);
      renderFilters();
      renderPapers();
    });

    elements.decadeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-decade]");
      if (!button) return;
      state.decade = button.dataset.decade;
      renderFilters();
      renderPapers();
    });

    elements.typeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;
      state.type = button.dataset.type;
      renderFilters();
      renderPapers();
    });

    elements.activeFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-filter]");
      if (!button) return;
      removeFilter(button.dataset.removeFilter, button.dataset.filterValue);
    });

    elements.paperGrid.addEventListener("click", (event) => {
      const bookmark = event.target.closest("[data-save-paper]");
      if (bookmark) {
        toggleSaved(bookmark.dataset.savePaper);
        return;
      }

      const detail = event.target.closest("[data-open-paper]");
      if (detail) {
        openPaperDialog(detail.dataset.openPaper, detail);
      }
    });

    elements.savedList.addEventListener("click", (event) => {
      const detail = event.target.closest("[data-open-paper]");
      if (detail) {
        openPaperDialog(detail.dataset.openPaper, detail);
        return;
      }

      const remove = event.target.closest("[data-remove-saved]");
      if (remove) {
        toggleSaved(remove.dataset.removeSaved);
      }
    });

    elements.dialogClose.addEventListener("click", closePaperDialog);
    elements.paperDialog.addEventListener("click", (event) => {
      if (event.target === elements.paperDialog) closePaperDialog();
    });

    elements.savedExport.addEventListener("click", () => exportRIS(state.saved, "plant-heterosis-collection.ris"));
    elements.headerExport.addEventListener("click", () => {
      const visible = getFilteredPapers();
      exportRIS(visible.map((paper) => paper.id), "plant-heterosis-filtered.ris");
    });

    elements.clearSaved.addEventListener("click", () => {
      if (!state.saved.size) return;
      const confirmed = window.confirm("确定清空收藏夹吗？");
      if (!confirmed) return;
      state.saved.clear();
      persistSaved();
      renderSaved();
      renderPapers();
      showToast("收藏夹已清空");
    });

    elements.goToLibrary.addEventListener("click", () => switchView("library"));

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable;

      if (event.key === "/" && !typing && elements.paperDialog.open === false) {
        event.preventDefault();
        elements.searchInput.focus();
      }

      if (event.key === "Escape" && elements.paperDialog.open) {
        closePaperDialog();
      }
    });
  }

  function renderFilters() {
    const themeCounts = countBy(papers, "themes");
    const teamCounts = countBy(papers, "teams");
    const cropCounts = countBy(papers, "crops");
    const sortedThemes = Object.keys(themeMeta).filter((theme) => themeCounts[theme]);
    const sortedCrops = Object.keys(cropCounts).sort((a, b) => cropCounts[b] - cropCounts[a] || a.localeCompare(b, "zh-CN"));

    elements.themeFilters.innerHTML = sortedThemes
      .map((theme) => {
        const active = state.themes.has(theme);
        return `
          <button class="filter-option${active ? " is-active" : ""}" type="button" data-theme="${escapeHTML(theme)}">
            <span class="filter-label">
              <i class="filter-bullet" style="--option-color:${themeMeta[theme].color}"></i>
              ${escapeHTML(theme)}
            </span>
            <span class="option-count">${themeCounts[theme]}</span>
          </button>
        `;
      })
      .join("");

    elements.teamFilters.innerHTML = Object.keys(teamCounts)
      .map((team) => {
        const active = state.teams.has(team);
        return `
          <button class="filter-option${active ? " is-active" : ""}" type="button" data-team="${escapeHTML(team)}">
            <span class="filter-label">
              <i class="filter-bullet" style="--option-color:#8aa83e"></i>
              ${escapeHTML(team)}
            </span>
            <span class="option-count">${teamCounts[team]}</span>
          </button>
        `;
      })
      .join("");

    elements.cropFilters.innerHTML = sortedCrops
      .map((crop) => {
        const active = state.crops.has(crop);
        return `
          <button class="filter-chip${active ? " is-active" : ""}" type="button" data-crop="${escapeHTML(crop)}">
            ${escapeHTML(crop)} · ${cropCounts[crop]}
          </button>
        `;
      })
      .join("");

    elements.decadeFilters.querySelectorAll("[data-decade]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.decade === state.decade);
    });

    elements.typeFilters.innerHTML = typeMeta
      .map((item) => {
        const active = state.type === item.value;
        return `
          <button class="radio-option${active ? " is-active" : ""}" type="button" data-type="${escapeHTML(item.value)}">
            <span class="radio-dot"></span>
            <span>${escapeHTML(item.label)}</span>
          </button>
        `;
      })
      .join("");

    elements.themeFilterSummary.textContent = state.themes.size ? `已选 ${state.themes.size}` : "全部";
    elements.teamFilterSummary.textContent = state.teams.size ? `已选 ${state.teams.size}` : "全部";
    elements.cropFilterSummary.textContent = state.crops.size ? `已选 ${state.crops.size}` : "全部";
  }

  function renderStats() {
    const crops = new Set(papers.flatMap((paper) => paper.crops));
    const themes = new Set(papers.flatMap((paper) => paper.themes));
    elements.heroPaperCount.textContent = String(papers.length);
    elements.heroCropCount.textContent = String(crops.size);
    elements.heroThemeCount.textContent = String(themes.size);
  }

  function renderPerformanceChart(trait) {
    const data = traitData[trait] || traitData.yield;
    const max = 115;
    const names = ["亲本 A", "亲本 B", "杂交种 F1"];
    const heights = data.values.map((value) => (value / max) * 100);

    elements.performanceChart.innerHTML = `
      <div class="y-axis">
        <span>120</span>
        <span>90</span>
        <span>60</span>
        <span>30</span>
        <span>0</span>
      </div>
      <div class="bar-stage">
        ${data.values
          .map(
            (value, index) => `
              <div class="bar-column">
                <div class="bar" style="height:${heights[index]}%">
                  <span class="bar-value">${value}</span>
                </div>
                <span class="bar-label">${names[index]}</span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
    elements.chartNote.textContent = data.note;
  }

  function renderPapers() {
    const filtered = getFilteredPapers();
    elements.paperGrid.classList.toggle("is-compact", state.compact);
    elements.paperGrid.innerHTML = filtered.map((paper) => paperCardTemplate(paper)).join("");
    elements.resultCount.textContent = `${filtered.length} 篇`;
    elements.resultTitle.textContent = getResultTitle();
    elements.emptyState.hidden = filtered.length !== 0;
    elements.paperGrid.hidden = filtered.length === 0;
    renderActiveFilters();
  }

  function getFilteredPapers() {
    const queryTokens = normalize(state.query)
      .split(/\s+/)
      .filter(Boolean);

    const filtered = papers.filter((paper) => {
      if (state.themes.size && !paper.themes.some((theme) => state.themes.has(theme))) {
        return false;
      }

      if (state.teams.size && !paper.teams.some((team) => state.teams.has(team))) {
        return false;
      }

      if (state.crops.size && !paper.crops.some((crop) => state.crops.has(crop))) {
        return false;
      }

      if (state.type !== "all" && paper.type !== state.type) {
        return false;
      }

      if (!matchesDecade(paper.year, state.decade)) {
        return false;
      }

      if (queryTokens.length) {
        const haystack = normalize(
          [
            paper.title,
            paper.titleZh,
            paper.authors,
            paper.journal,
            paper.summary,
            paper.finding,
            paper.keywords.join(" "),
            paper.themes.join(" "),
            paper.crops.join(" ")
          ].join(" ")
        );
        return queryTokens.every((token) => haystack.includes(token));
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (state.sort === "year-desc") return b.year - a.year;
      if (state.sort === "year-asc") return a.year - b.year;
      if (state.sort === "title") return a.title.localeCompare(b.title);
      return relevanceScore(b) - relevanceScore(a) || b.year - a.year;
    });
  }

  function relevanceScore(paper) {
    let score = 0;
    if (paper.importance === "奠基") score += 40;
    if (paper.importance === "里程碑") score += 30;
    if (paper.importance === "核心") score += 20;
    if (paper.category === "经典奠基") score += 12;
    if (state.themes.size && paper.themes.some((theme) => state.themes.has(theme))) score += 18;
    if (state.crops.size && paper.crops.some((crop) => state.crops.has(crop))) score += 12;
    score += Math.max(0, 10 - Math.abs(2014 - paper.year) / 15);
    return score;
  }

  function paperCardTemplate(paper) {
    const saved = state.saved.has(paper.id);
    const doiUrl = getPaperUrl(paper);
    const compact = state.compact;

    if (compact) {
      return `
        <article class="paper-card is-compact">
          <div>
            <div class="paper-card-top">
              <div class="paper-year-block">
                <span class="paper-year">${paper.year}</span>
                <span class="importance-badge">${escapeHTML(paper.importance)}</span>
              </div>
              ${paperActionsTemplate(paper, saved)}
            </div>
            <button class="paper-title" type="button" data-open-paper="${paper.id}">${escapeHTML(paper.title)}</button>
            <p class="paper-title-zh">${escapeHTML(paper.titleZh)}</p>
            <p class="paper-summary">${escapeHTML(paper.summary)}</p>
          </div>
          <div class="compact-side">
            <p class="paper-citation">${escapeHTML(paper.authors)}<br />${escapeHTML(paper.journal)} · ${paper.year}</p>
            <div class="tag-row">
              <span class="tag theme-tag">${escapeHTML(paper.themes[0])}</span>
              <span class="tag">${escapeHTML(paper.crops[0])}</span>
            </div>
            <div class="paper-meta-line">
              <span>${escapeHTML(paper.type)}</span>
              <a href="${doiUrl}" target="_blank" rel="noreferrer">${paper.doi ? "DOI" : "检索"}</a>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <article class="paper-card">
        <div class="paper-card-top">
          <div class="paper-year-block">
            <span class="paper-year">${paper.year}</span>
            <span class="importance-badge">${escapeHTML(paper.importance)}</span>
          </div>
          ${paperActionsTemplate(paper, saved)}
        </div>
        <button class="paper-title" type="button" data-open-paper="${paper.id}">${escapeHTML(paper.title)}</button>
        <p class="paper-title-zh">${escapeHTML(paper.titleZh)}</p>
        <p class="paper-citation">${escapeHTML(paper.authors)}<br />${escapeHTML(paper.journal)}${paper.volume ? `, ${escapeHTML(paper.volume)}` : ""} · ${paper.year}</p>
        <p class="paper-summary">${escapeHTML(paper.summary)}</p>
        <div class="tag-row">
          ${paper.themes.map((theme) => `<span class="tag theme-tag">${escapeHTML(theme)}</span>`).join("")}
          ${paper.crops.slice(0, 2).map((crop) => `<span class="tag">${escapeHTML(crop)}</span>`).join("")}
          ${paper.teams.map((team) => `<span class="tag team-tag">${escapeHTML(team)}</span>`).join("")}
        </div>
        <div class="paper-meta-line">
          <span>${escapeHTML(paper.type)}</span>
          <a href="${doiUrl}" target="_blank" rel="noreferrer">
            ${paper.doi ? "原文 / DOI" : "在学术搜索中查找"}
          </a>
        </div>
      </article>
    `;
  }

  function paperActionsTemplate(paper, saved) {
    return `
      <div class="paper-actions">
        <button
          class="paper-action${saved ? " is-saved" : ""}"
          type="button"
          data-save-paper="${paper.id}"
          title="${saved ? "移出收藏夹" : "加入收藏夹"}"
          aria-label="${saved ? "移出收藏夹" : "加入收藏夹"}"
          aria-pressed="${String(saved)}"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z" />
          </svg>
        </button>
        <button
          class="paper-action"
          type="button"
          data-open-paper="${paper.id}"
          title="查看详情"
          aria-label="查看《${escapeHTML(paper.title)}》详情"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </button>
      </div>
    `;
  }

  function renderActiveFilters() {
    const chips = [];

    if (state.query) {
      chips.push(filterChip(`关键词：${state.query}`, "query", state.query));
    }

    state.themes.forEach((theme) => chips.push(filterChip(theme, "theme", theme)));
    state.teams.forEach((team) => chips.push(filterChip(team, "team", team)));
    state.crops.forEach((crop) => chips.push(filterChip(crop, "crop", crop)));

    if (state.decade !== "all") {
      const label = {
        classic: "1900–1979",
        modern: "1980–2009",
        genomic: "2010 至今"
      }[state.decade];
      chips.push(filterChip(label, "decade", state.decade));
    }

    if (state.type !== "all") {
      chips.push(filterChip(state.type, "type", state.type));
    }

    elements.activeFilters.innerHTML = chips.join("");
    elements.activeFilters.hidden = chips.length === 0;
  }

  function filterChip(label, kind, value) {
    return `
      <span class="active-filter">
        ${escapeHTML(label)}
        <button type="button" data-remove-filter="${kind}" data-filter-value="${escapeHTML(value)}" aria-label="移除筛选：${escapeHTML(label)}">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </span>
    `;
  }

  function removeFilter(kind, value) {
    if (kind === "query") {
      state.query = "";
      elements.searchInput.value = "";
    } else if (kind === "theme") {
      state.themes.delete(value);
    } else if (kind === "team") {
      state.teams.delete(value);
    } else if (kind === "crop") {
      state.crops.delete(value);
    } else if (kind === "decade") {
      state.decade = "all";
    } else if (kind === "type") {
      state.type = "all";
    }
    renderFilters();
    renderPapers();
  }

  function resetFilters() {
    state.query = "";
    state.teams.clear();
    state.themes.clear();
    state.crops.clear();
    state.decade = "all";
    state.type = "all";
    state.sort = "relevance";
    elements.searchInput.value = "";
    elements.sortSelect.value = "relevance";
    renderFilters();
    renderPapers();
  }

  function getResultTitle() {
    if (state.query) return "检索结果";
    if (state.teams.size === 1) return Array.from(state.teams)[0];
    if (state.themes.size === 1) return Array.from(state.themes)[0];
    if (state.crops.size === 1 && !state.themes.size) return `${Array.from(state.crops)[0]}文献`;
    return "全部文献";
  }

  function renderInsights() {
    const themeCounts = countBy(papers, "themes");
    const cropCounts = countBy(papers, "crops");
    const crops = Object.keys(cropCounts).filter((crop) => crop !== "综合");
    const themes = Object.keys(themeCounts);

    elements.insightSummary.innerHTML = `
      <div class="summary-stat"><strong>${papers.length}</strong><span>精选文献</span></div>
      <div class="summary-stat"><strong>${themes.length}</strong><span>研究主题</span></div>
      <div class="summary-stat"><strong>${crops.length}</strong><span>作物与模式植物</span></div>
    `;

    const timelineBuckets = [
      { label: "1900–1929", min: 1900, max: 1929 },
      { label: "1930–1959", min: 1930, max: 1959 },
      { label: "1960–1989", min: 1960, max: 1989 },
      { label: "1990–2009", min: 1990, max: 2009 },
      { label: "2010 至今", min: 2010, max: 2099 }
    ].map((bucket) => ({
      ...bucket,
      count: papers.filter((paper) => paper.year >= bucket.min && paper.year <= bucket.max).length
    }));
    const maxTimeline = Math.max(...timelineBuckets.map((bucket) => bucket.count), 1);
    elements.timelineChart.innerHTML = timelineBuckets
      .map(
        (bucket) => `
          <div class="timeline-decade">
            <div class="timeline-bar-wrap">
              <div class="timeline-bar" style="height:${Math.max(6, (bucket.count / maxTimeline) * 100)}%">
                <span class="timeline-value">${bucket.count}</span>
              </div>
            </div>
            <span class="timeline-label">${bucket.label}</span>
          </div>
        `
      )
      .join("");

    const sortedThemes = themes.sort((a, b) => themeCounts[b] - themeCounts[a]);
    const maxTheme = Math.max(...sortedThemes.map((theme) => themeCounts[theme]), 1);
    elements.themeDistribution.innerHTML = sortedThemes
      .map(
        (theme) => `
          <div class="theme-bar-row">
            <span>${escapeHTML(theme)}</span>
            <span class="theme-bar-track">
              <i class="theme-bar-fill" style="width:${(themeCounts[theme] / maxTheme) * 100}%;--bar-color:${themeMeta[theme].color}"></i>
            </span>
            <span class="theme-bar-count">${themeCounts[theme]}</span>
          </div>
        `
      )
      .join("");

    elements.mechanismList.innerHTML = mechanismData
      .map((item, index) => {
        const count = papers.filter((paper) => paper.themes.some((theme) => item.themes.includes(theme))).length;
        return `
          <div class="mechanism-item">
            <span class="mechanism-index" style="--mechanism-color:${item.color}">${String(index + 1).padStart(2, "0")}</span>
            <span class="mechanism-copy">
              <strong>${escapeHTML(item.name)}</strong>
              <span>${escapeHTML(item.detail)}</span>
            </span>
            <span class="mechanism-count">${count} 篇</span>
          </div>
        `;
      })
      .join("");

    elements.cropMatrix.innerHTML = crops
      .sort((a, b) => cropCounts[b] - cropCounts[a])
      .map(
        (crop, index) => `
          <div class="crop-tile" style="--crop-color:${cropColors[index % cropColors.length]}">
            <strong>${escapeHTML(crop)}</strong>
            <span>${cropCounts[crop]} 篇相关文献</span>
          </div>
        `
      )
      .join("");
  }

  function renderSaved() {
    const savedPapers = Array.from(state.saved)
      .map((id) => papers.find((paper) => paper.id === id))
      .filter(Boolean)
      .sort((a, b) => b.year - a.year);

    elements.savedNavCount.textContent = String(savedPapers.length);
    elements.savedNavCount.hidden = savedPapers.length === 0;
    elements.savedEmpty.hidden = savedPapers.length !== 0;
    elements.savedList.hidden = savedPapers.length === 0;

    elements.savedList.innerHTML = savedPapers
      .map(
        (paper) => `
          <article class="saved-item">
            <span class="saved-year">${paper.year}</span>
            <div class="saved-copy">
              <h3>${escapeHTML(paper.title)}</h3>
              <p>${escapeHTML(paper.authors)} · ${escapeHTML(paper.journal)}</p>
            </div>
            <div class="saved-item-actions">
              <button class="paper-action" type="button" data-open-paper="${paper.id}" title="查看详情" aria-label="查看详情">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 17 17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </button>
              <button class="paper-action is-saved" type="button" data-remove-saved="${paper.id}" title="移出收藏" aria-label="移出收藏">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z" />
                </svg>
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function switchView(view, scroll = true) {
    state.view = view;
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });

    elements.libraryView.hidden = view !== "library";
    elements.insightsView.hidden = view !== "insights";
    elements.savedView.hidden = view !== "saved";

    if (view === "insights") renderInsights();
    if (view === "saved") renderSaved();

    if (scroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggleSaved(id) {
    const paper = papers.find((item) => item.id === id);
    if (!paper) return;

    if (state.saved.has(id)) {
      state.saved.delete(id);
      showToast("已移出收藏夹");
    } else {
      state.saved.add(id);
      showToast("已加入收藏夹");
    }

    persistSaved();
    renderPapers();
    renderSaved();
    if (elements.paperDialog.open) {
      updateDialogSavedButton(paper);
    }
  }

  function openPaperDialog(id, trigger) {
    const paper = papers.find((item) => item.id === id);
    if (!paper) return;
    lastDialogTrigger = trigger || document.activeElement;
    elements.dialogContent.innerHTML = dialogTemplate(paper, state.saved.has(id));
    elements.paperDialog.showModal();
    document.body.style.overflow = "hidden";

    const saveButton = elements.dialogContent.querySelector("[data-dialog-save]");
    if (saveButton) {
      saveButton.addEventListener("click", () => toggleSaved(paper.id));
    }
  }

  function closePaperDialog() {
    if (!elements.paperDialog.open) return;
    elements.paperDialog.close();
    document.body.style.overflow = "";
    if (lastDialogTrigger && typeof lastDialogTrigger.focus === "function") {
      lastDialogTrigger.focus();
    }
  }

  function dialogTemplate(paper, saved) {
    const url = getPaperUrl(paper);
    return `
      <div class="dialog-hero">
        <div class="dialog-meta">
          <span>${paper.year}</span>
          <span>·</span>
          <span>${escapeHTML(paper.journal)}</span>
          <span>·</span>
          <span>${escapeHTML(paper.type)}</span>
          <span class="importance-badge">${escapeHTML(paper.importance)}</span>
        </div>
        <h2>${escapeHTML(paper.title)}</h2>
        <p class="dialog-title-zh">${escapeHTML(paper.titleZh)}</p>
        <p class="dialog-authors">${escapeHTML(paper.authors)}</p>
      </div>
      <div class="dialog-body">
        <div class="dialog-copy">
          <h3>研究概览</h3>
          <p>${escapeHTML(paper.summary)}</p>
          <h3>核心发现</h3>
          <div class="finding-callout">${escapeHTML(paper.finding)}</div>
          <h3>为什么值得读</h3>
          <p>${escapeHTML(getReadingValue(paper))}</p>
        </div>
        <aside class="dialog-side">
          <h3>题录信息</h3>
          <div class="side-fact">
            <span>期刊</span>
            <strong>${escapeHTML(paper.journal)}</strong>
          </div>
          <div class="side-fact">
            <span>卷期 / 页码</span>
            <strong>${escapeHTML(paper.volume || "—")} / ${escapeHTML(paper.pages || "—")}</strong>
          </div>
          <div class="side-fact">
            <span>DOI</span>
            <strong>${paper.doi ? escapeHTML(paper.doi) : "历史文献，暂无 DOI"}</strong>
          </div>
          <div class="side-fact">
            <span>主题</span>
            <strong>${paper.themes.map(escapeHTML).join(" · ")}</strong>
          </div>
          <div class="side-fact">
            <span>作物 / 物种</span>
            <strong>${paper.crops.map(escapeHTML).join(" · ")}</strong>
          </div>
          ${
            paper.teams.length
              ? `<div class="side-fact"><span>团队专题</span><strong>${paper.teams.map(escapeHTML).join(" · ")}</strong></div>`
              : ""
          }
          <div class="tag-row dialog-tags">
            ${paper.keywords.slice(0, 4).map((keyword) => `<span class="tag">${escapeHTML(keyword)}</span>`).join("")}
          </div>
          <div class="dialog-actions">
            <a class="dialog-link" href="${url}" target="_blank" rel="noreferrer">
              ${paper.doi ? "打开原文页面" : "在学术搜索中查找"}
            </a>
            <button class="dialog-link secondary" type="button" data-dialog-save="${paper.id}">
              ${saved ? "移出收藏夹" : "加入收藏夹"}
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  function updateDialogSavedButton(paper) {
    const button = elements.dialogContent.querySelector("[data-dialog-save]");
    if (!button) return;
    button.textContent = state.saved.has(paper.id) ? "移出收藏夹" : "加入收藏夹";
  }

  function getReadingValue(paper) {
    const values = {
      经典奠基: "适合作为杂种优势概念史与经典假说的起点，可直接支撑综述中的理论背景。",
      遗传解析: "适合用于梳理显性、超显性与上位性如何被具体实验区分。",
      分子机制: "适合串联转录、代谢和表观层面的证据，理解杂种优势为何不是单一基因现象。",
      表观遗传: "适合讨论 DNA 甲基化、小 RNA 与染色质变化如何参与杂交后的表达重塑。",
      基因组与预测: "适合连接机制研究与育种决策，理解复杂性状预测的统计学基础。",
      位点鉴定: "适合理解如何通过遗传设计把杂种优势拆解为可定位、可估计的位点效应。",
      杂种预测: "适合比较分子标记、基因组选择和组学预测模型，理解如何筛选未测杂交组合。",
      转录机制: "适合分析等位基因表达、非加性转录与亲本互补如何共同塑造杂交种表型。",
      基因组变异: "适合讨论结构变异、存在缺失变异和群体分化如何丰富杂种优势的遗传来源。"
    };
    return values[paper.category] || "适合纳入植物杂种优势主题阅读与方法比较。";
  }

  function exportRIS(ids, filename) {
    const selected = ids
      .map((id) => papers.find((paper) => paper.id === id))
      .filter(Boolean);

    if (!selected.length) {
      showToast("当前没有可导出的文献");
      return;
    }

    const ris = selected.map(risRecord).join("\n\n");
    const blob = new Blob([ris], { type: "application/x-research-info-systems;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${selected.length} 条 RIS 题录`);
  }

  function risRecord(paper) {
    const lines = [
      "TY  - JOUR",
      `TI  - ${paper.title}`,
      ...paper.authors.split(";").map((author) => `AU  - ${author.trim()}`),
      `PY  - ${paper.year}`,
      `JO  - ${paper.journal}`,
      paper.volume ? `VL  - ${paper.volume}` : "",
      paper.pages ? `SP  - ${paper.pages}` : "",
      paper.doi ? `DO  - ${paper.doi}` : "",
      `UR  - ${getPaperUrl(paper)}`,
      ...paper.keywords.slice(0, 8).map((keyword) => `KW  - ${keyword}`),
      `N1  - ${paper.summary}`,
      "ER  -"
    ];
    return lines.filter(Boolean).join("\n");
  }

  function getPaperUrl(paper) {
    if (paper.doi) return `https://doi.org/${paper.doi}`;
    const query = encodeURIComponent(`${paper.title} ${paper.authors}`);
    return `https://scholar.google.com/scholar?q=${query}`;
  }

  function loadSaved() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch (error) {
      return new Set();
    }
  }

  function persistSaved() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(state.saved)));
    } catch (error) {
      showToast("浏览器未允许保存本地收藏");
    }
  }

  function countBy(items, key) {
    return items.reduce((counts, item) => {
      item[key].forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
      });
      return counts;
    }, {});
  }

  function matchesDecade(year, decade) {
    if (decade === "all") return true;
    if (decade === "classic") return year >= 1900 && year <= 1979;
    if (decade === "modern") return year >= 1980 && year <= 2009;
    if (decade === "genomic") return year >= 2010;
    return true;
  }

  function toggleSetValue(set, value) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  }

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase("zh-CN")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      window.setTimeout(() => toast.remove(), 220);
    }, 2400);
  }
})();
