(function () {
  "use strict";

  var S = window.SHIYE;
  var data = S.loadExcerpts().map(normalize);
  var hasDraft = Boolean(S.readDraft());

  var els = {
    saveState: document.getElementById("saveState"),
    list: document.getElementById("adminList"),
    listCount: document.getElementById("listCount"),
    search: document.getElementById("adminSearch"),
    filterType: document.getElementById("filterType"),
    filterMonth: document.getElementById("filterMonth"),
    clearFilters: document.getElementById("clearFilters"),
    trashPanel: document.getElementById("trashPanel"),
    trashCount: document.getElementById("trashCount"),
    trashList: document.getElementById("trashList"),
    exportJs: document.getElementById("exportJs"),
    exportJson: document.getElementById("exportJson"),
    importFile: document.getElementById("importFile"),
    resetFile: document.getElementById("resetFile")
  };

  var listQuery = "";
  var filterType = "all";
  var filterMonth = "all";

  /* ---------- helpers ---------- */

  function typeOf(item) {
    return item && item.type === "film" ? "film" : "book";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function makeId() {
    var existing = new Set((data || []).map(function (item) { return item.id; }));
    var id;
    do {
      id = "ex-" + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
    } while (existing.has(id));
    return id;
  }

  function normalize(item) {
    var type = typeOf(item);
    var themes = S.themesOf(item);
    return {
      id: item.id || makeId(),
      type: type,
      theme: themes[0],
      themes: themes,
      book: String(item.book || "未命名").trim(),
      chapter: String(item.chapter || item.page || "").trim(),
      author: String(item.author || "佚名").trim(),
      publisher: String(item.publisher || "").trim(),
      year: String(item.year || "").trim(),
      era: String(item.era || "").trim(),
      country: String(item.country || item.dynasty || "").trim(),
      medium: type === "film" ? (item.medium === "剧集" ? "剧集" : "电影") : "",
      quote: String(item.quote || "").trim(),
      translation: String(item.translation || "").trim(),
      doubanTag: String(item.doubanTag || "").trim(),
      whyThis: String(item.whyThis || "").trim(),
      date: item.date || S.todayISO(),
      featured: type === "book" ? Boolean(item.featured) : false
    };
  }

  function setSaveState() {
    els.saveState.classList.remove("is-draft", "is-file");
    if (hasDraft) {
      els.saveState.classList.add("is-draft");
      els.saveState.textContent = "草稿已保存 · 仅当前浏览器";
    } else {
      els.saveState.classList.add("is-file");
      els.saveState.textContent = "已载入文件数据";
    }
  }

  function persist(message) {
    if (!S.saveDraft(data)) {
      S.toast("浏览器存储不可用，改动未能保存");
      return;
    }
    hasDraft = true;
    setSaveState();
    renderMonthOptions();
    renderList();
    if (message) S.toast(message);
  }

  /* ---------- render ---------- */

  function monthKey(item) {
    return String(item.date || "").slice(0, 7);
  }

  function renderMonthOptions() {
    var months = Array.from(new Set(data.map(monthKey).filter(function (value) {
      return /^\d{4}-\d{2}$/.test(value);
    }))).sort().reverse();

    els.filterMonth.innerHTML = '<option value="all">全部月份</option>' + months.map(function (value) {
      var parts = value.split("-");
      return '<option value="' + esc(value) + '">' + parts[0] + " 年 " + Number(parts[1]) + " 月</option>";
    }).join("");
    if (months.indexOf(filterMonth) === -1) filterMonth = "all";
    els.filterMonth.value = filterMonth;
  }

  function renderList() {
    var q = listQuery.trim().toLowerCase();
    var list = data.filter(function (item) {
      if (filterType !== "all" && typeOf(item) !== filterType) return false;
      if (filterMonth !== "all" && monthKey(item) !== filterMonth) return false;
      if (!q) return true;
      return [item.quote, item.book, item.chapter, item.author, item.themes.join(" "), item.translation,
        item.publisher, item.year, item.country, item.doubanTag, item.whyThis]
        .join(" ")
        .toLowerCase()
        .indexOf(q) !== -1;
    });

    var filtering = Boolean(q) || filterType !== "all" || filterMonth !== "all";
    var worksCount = S.loadWorks().length;
    els.listCount.textContent = (filtering ? list.length + " / " + data.length + " 则" : data.length + " 则") +
      " · 作品库 " + worksCount + " 个";
    els.clearFilters.hidden = !filtering;

    if (!list.length) {
      els.list.innerHTML = '<p class="field-hint" style="padding:1.2rem .2rem;">没有匹配的内容。</p>';
      return;
    }

    els.list.innerHTML = list.map(function (item) {
      var isFilm = typeOf(item) === "film";
      var edition = isFilm
        ? [item.publisher, item.year, item.country, item.medium].filter(Boolean).join(" · ")
        : [item.publisher, item.year].filter(Boolean).join(" · ");
      return (
        '<div class="admin-row" data-id="' + esc(item.id) + '">' +
          '<div class="admin-row-main">' +
            '<div class="admin-row-top">' +
              '<span class="type-chip' + (isFilm ? " is-film" : "") + '">' + (isFilm ? "影视" : "书籍") + "</span>" +
              item.themes.map(function (name) {
                return '<span class="theme-chip is-' + S.themeOf(name).color + '">' + esc(name) + "</span>";
              }).join("") +
              "<strong>" + esc(item.book) + "</strong>" +
            "</div>" +
            "<p>" + esc(item.quote) + "</p>" +
            "<small>" + esc(item.author) + (item.chapter ? " · " + esc(item.chapter) : "") +
              " · " + esc(S.formatDate(item.date)) + (item.featured ? " · 今日候选" : "") +
              (edition ? " · " + esc(edition) : "") + "</small>" +
          "</div>" +
          '<div class="admin-row-actions">' +
            '<a href="admin-form.html?edit=' + encodeURIComponent(item.id) + '">编辑</a>' +
            '<button class="is-danger" type="button" data-action="delete" data-id="' + esc(item.id) + '">删除</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderTrash() {
    var list = S.loadTrash();
    els.trashPanel.hidden = !list.length;
    els.trashCount.textContent = list.length + " 则";
    els.trashList.innerHTML = list.map(function (entry) {
      var item = entry.item;
      var isFilm = typeOf(item) === "film";
      var when = new Date(entry.deletedAt).toLocaleString("zh-CN", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
      return (
        '<div class="admin-row" data-id="' + esc(item.id) + '">' +
          '<div class="admin-row-main">' +
            '<div class="admin-row-top">' +
              '<span class="type-chip' + (isFilm ? " is-film" : "") + '">' + (isFilm ? "影视" : "书籍") + "</span>" +
              "<strong>" + esc(item.book || "未命名") + "</strong>" +
            "</div>" +
            "<p>" + esc(item.quote || "") + "</p>" +
            "<small>" + esc(item.author || "") + " · 删除于 " + esc(when) + "</small>" +
          "</div>" +
          '<div class="admin-row-actions">' +
            '<button type="button" data-action="restore" data-id="' + esc(item.id) + '" data-at="' + esc(entry.deletedAt) + '">恢复</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  /* ---------- events ---------- */

  els.search.addEventListener("input", function () {
    listQuery = els.search.value;
    renderList();
  });

  els.filterType.addEventListener("change", function () {
    filterType = els.filterType.value;
    renderList();
  });

  els.filterMonth.addEventListener("change", function () {
    filterMonth = els.filterMonth.value;
    renderList();
  });

  els.clearFilters.addEventListener("click", function () {
    filterType = "all";
    filterMonth = "all";
    listQuery = "";
    els.filterType.value = "all";
    els.filterMonth.value = "all";
    els.search.value = "";
    renderList();
  });

  els.list.addEventListener("click", function (event) {
    var button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    var id = button.getAttribute("data-id");
    var item = data.find(function (row) { return row.id === id; });
    if (!item) return;
    S.addTrash(item);
    data = data.filter(function (row) { return row.id !== id; });
    persist("已删除，可在「最近删除」恢复");
    renderTrash();
  });

  els.trashList.addEventListener("click", function (event) {
    var button = event.target.closest('[data-action="restore"]');
    if (!button) return;
    var id = button.getAttribute("data-id");
    var at = button.getAttribute("data-at");
    var trash = S.loadTrash();
    var index = trash.findIndex(function (entry) {
      return entry.item.id === id && entry.deletedAt === at;
    });
    if (index === -1) {
      renderTrash();
      return;
    }
    var restored = normalize(trash[index].item);
    if (data.some(function (row) { return row.id === restored.id; })) restored.id = makeId();
    trash.splice(index, 1);
    S.saveTrash(trash);
    data.unshift(restored);
    persist("已恢复「" + restored.book + "」");
    renderTrash();
  });

  /* ---------- import / export ---------- */

  els.exportJs.addEventListener("click", function () {
    S.download("excerpts.js", S.buildScript(data, S.loadWorks()), "text/javascript;charset=utf-8");
    S.toast("已导出 excerpts.js，请覆盖 data/excerpts.js");
  });

  els.exportJson.addEventListener("click", function () {
    S.download("excerpts.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    S.toast("已导出 excerpts.json");
  });

  els.importFile.addEventListener("change", function () {
    var file = els.importFile.files && els.importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || "");
        var parsed;
        try {
          parsed = JSON.parse(text);
        } catch (error) {
          var start = text.indexOf("[");
          var end = text.lastIndexOf("]");
          if (start === -1 || end === -1) throw new Error("not array");
          parsed = JSON.parse(text.slice(start, end + 1));
        }
        if (!Array.isArray(parsed)) throw new Error("not array");
        var cleaned = parsed.filter(function (item) {
          return item && typeof item === "object" && String(item.quote || "").trim();
        }).map(normalize);

        if (!cleaned.length) {
          S.toast("文件里没有可用的内容");
          return;
        }
        if (!window.confirm("导入 " + cleaned.length + " 则内容，并替换当前全部内容？")) return;

        var seen = new Set();
        cleaned.forEach(function (item) {
          if (seen.has(item.id)) item.id = makeId();
          seen.add(item.id);
        });

        data = cleaned;
        persist("导入成功，已保存到本地草稿");
      } catch (error) {
        S.toast("导入失败，请选择 excerpts.js 或 excerpts.json");
      } finally {
        els.importFile.value = "";
      }
    };
    reader.readAsText(file);
  });

  els.resetFile.addEventListener("click", function () {
    if (!hasDraft) {
      S.toast("当前已经在使用文件数据");
      return;
    }
    if (!window.confirm("放弃本地草稿，恢复为 data/excerpts.js 里的内容？")) return;
    S.clearDraft();
    S.clearWorksDraft();
    hasDraft = false;
    data = S.fileExcerpts().map(normalize);
    listQuery = "";
    filterType = "all";
    filterMonth = "all";
    els.search.value = "";
    els.filterType.value = "all";
    setSaveState();
    renderMonthOptions();
    renderList();
    S.toast("已恢复文件数据");
  });

  document.querySelector('label[for="importFile"]').addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.importFile.click();
    }
  });

  /* ---------- init ---------- */

  setSaveState();
  renderMonthOptions();
  renderList();
  renderTrash();
})();
