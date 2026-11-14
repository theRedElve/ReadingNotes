/* 拾页 · 更新内容后台 */
(function () {
  "use strict";

  var S = window.SHIYE;
  var esc = S.esc;

  var data = S.loadExcerpts();
  var hasDraft = Boolean(S.readDraft());
  var editingId = null;
  var listQuery = "";
  var filterType = "all";
  var filterMonth = "all";

  var els = {
    form: document.getElementById("excerptForm"),
    formTitle: document.getElementById("formTitle"),
    editBadge: document.getElementById("editBadge"),
    saveBtn: document.getElementById("saveBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    deleteBtn: document.getElementById("deleteBtn"),
    saveState: document.getElementById("saveState"),
    list: document.getElementById("adminList"),
    listCount: document.getElementById("listCount"),
    search: document.getElementById("adminSearch"),
    filterType: document.getElementById("filterType"),
    filterMonth: document.getElementById("filterMonth"),
    clearFilters: document.getElementById("clearFilters"),
    exportJs: document.getElementById("exportJs"),
    exportJson: document.getElementById("exportJson"),
    importFile: document.getElementById("importFile"),
    resetFile: document.getElementById("resetFile"),
    newBtn: document.getElementById("newBtn"),
    labels: {
      book: document.getElementById("f-label-book"),
      author: document.getElementById("f-label-author"),
      publisher: document.getElementById("f-label-publisher"),
      year: document.getElementById("f-label-year"),
      place: document.getElementById("f-label-place"),
      chapter: document.getElementById("f-label-chapter"),
      quote: document.getElementById("f-label-quote")
    },
    fields: {
      type: document.getElementById("f-type"),
      theme: document.getElementById("f-theme"),
      book: document.getElementById("f-book"),
      author: document.getElementById("f-author"),
      publisher: document.getElementById("f-publisher"),
      year: document.getElementById("f-year"),
      dynasty: document.getElementById("f-dynasty"),
      chapter: document.getElementById("f-chapter"),
      era: document.getElementById("f-era"),
      medium: document.getElementById("f-medium"),
      date: document.getElementById("f-date"),
      quote: document.getElementById("f-quote"),
      note: document.getElementById("f-note"),
      featured: document.getElementById("f-featured")
    }
  };

  var TYPE_COPY = {
    book: {
      book: "书名 *",
      author: "作者 *",
      publisher: "出版社",
      year: "出版年份",
      place: "朝代 / 年代",
      chapter: "篇目 / 章节",
      quote: "原文摘录 *",
      bookPlaceholder: "例如：世说新语",
      authorPlaceholder: "例如：刘义庆",
      publisherPlaceholder: "例如：中华书局",
      yearPlaceholder: "例如：2011",
      placePlaceholder: "例如：南朝宋",
      chapterPlaceholder: "例如：品藻",
      quotePlaceholder: "贴入你想留下的句子……"
    },
    film: {
      book: "片名 *",
      author: "导演 *",
      publisher: "出品方",
      year: "上映年份",
      place: "国家 / 地区",
      chapter: "场次 / 台词出处",
      quote: "台词原文 *",
      bookPlaceholder: "例如：肖申克的救赎",
      authorPlaceholder: "例如：弗兰克·德拉邦特",
      publisherPlaceholder: "例如：Castle Rock Entertainment",
      yearPlaceholder: "例如：1994",
      placePlaceholder: "例如：美国",
      chapterPlaceholder: "例如：安迪写给瑞德的信",
      quotePlaceholder: "贴入你想留下的台词……"
    }
  };

  /* ---------- helpers ---------- */

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
    var ok = S.saveDraft(data);
    if (!ok) {
      S.toast("浏览器存储不可用，改动未能保存");
      return;
    }
    hasDraft = true;
    setSaveState();
    renderMonthOptions();
    renderList();
    if (message) S.toast(message);
  }

  function themeColor(name) {
    return S.themeOf(name).color;
  }

  function typeOf(item) {
    return item && item.type === "film" ? "film" : "book";
  }

  function makeId() {
    var existing = new Set(data.map(function (item) { return item.id; }));
    var id;
    do {
      id = "ex-" + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
    } while (existing.has(id));
    return id;
  }

  function normalize(item) {
    var type = typeOf(item);
    return {
      id: item.id || makeId(),
      type: type,
      theme: S.THEME_MAP[item.theme] ? item.theme : "自我",
      book: String(item.book || "未命名").trim(),
      chapter: String(item.chapter || item.page || "").trim(),
      author: String(item.author || "佚名").trim(),
      publisher: String(item.publisher || "").trim(),
      year: String(item.year || "").trim(),
      era: type === "film" ? "近现代" : (item.era === "近现代" ? "近现代" : "古代"),
      dynasty: String(item.dynasty || "").trim(),
      medium: type === "film" ? (item.medium === "剧集" ? "剧集" : "电影") : "",
      quote: String(item.quote || "").trim(),
      note: String(item.note || "").trim(),
      date: item.date || S.todayISO(),
      featured: type === "book" ? Boolean(item.featured) : false
    };
  }

  /* ---------- render ---------- */

  function renderThemeOptions() {
    els.fields.theme.innerHTML = S.THEMES.map(function (theme) {
      return '<option value="' + esc(theme.name) + '">' + esc(theme.name) + "</option>";
    }).join("");
  }

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
      return [item.quote, item.book, item.chapter, item.author, item.theme, item.note,
        item.publisher, item.year, item.dynasty]
        .join(" ")
        .toLowerCase()
        .indexOf(q) !== -1;
    });

    var filtering = Boolean(q) || filterType !== "all" || filterMonth !== "all";
    els.listCount.textContent = filtering ? list.length + " / " + data.length + " 则" : data.length + " 则";
    els.clearFilters.hidden = !filtering;

    if (!list.length) {
      els.list.innerHTML = '<p class="field-hint" style="padding:1.2rem .2rem;">没有匹配的内容。</p>';
      return;
    }

    els.list.innerHTML = list.map(function (item) {
      var isFilm = typeOf(item) === "film";
      var edition = isFilm
        ? [item.publisher, item.year, item.dynasty, item.medium].filter(Boolean).join(" · ")
        : [item.publisher, item.year].filter(Boolean).join(" · ");
      return (
        '<div class="admin-row' + (item.id === editingId ? " is-editing" : "") + '" data-id="' + esc(item.id) + '">' +
          '<div class="admin-row-main">' +
            '<div class="admin-row-top">' +
              '<span class="type-chip' + (isFilm ? " is-film" : "") + '">' + (isFilm ? "影视" : "书籍") + "</span>" +
              '<span class="theme-chip is-' + themeColor(item.theme) + '">' + esc(item.theme) + "</span>" +
              "<strong>" + esc(item.book) + "</strong>" +
            "</div>" +
            "<p>" + esc(item.quote) + "</p>" +
            "<small>" + esc(item.author) + (item.chapter ? " · " + esc(item.chapter) : "") +
              " · " + esc(S.formatDate(item.date)) + (item.featured ? " · 今日候选" : "") +
              (edition ? " · " + esc(edition) : "") + "</small>" +
          "</div>" +
          '<div class="admin-row-actions">' +
            '<button type="button" data-action="edit" data-id="' + esc(item.id) + '">编辑</button>' +
            '<button class="is-danger" type="button" data-action="delete" data-id="' + esc(item.id) + '">删除</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  /* ---------- form ---------- */

  function applyType() {
    var type = els.fields.type.value === "film" ? "film" : "book";
    var copy = TYPE_COPY[type];

    document.querySelectorAll("[data-for]").forEach(function (node) {
      node.hidden = node.getAttribute("data-for") !== type;
    });

    els.labels.book.textContent = copy.book;
    els.labels.author.textContent = copy.author;
    els.labels.publisher.textContent = copy.publisher;
    els.labels.year.textContent = copy.year;
    els.labels.place.textContent = copy.place;
    els.labels.chapter.textContent = copy.chapter;
    els.labels.quote.textContent = copy.quote;

    els.fields.book.placeholder = copy.bookPlaceholder;
    els.fields.author.placeholder = copy.authorPlaceholder;
    els.fields.publisher.placeholder = copy.publisherPlaceholder;
    els.fields.year.placeholder = copy.yearPlaceholder;
    els.fields.dynasty.placeholder = copy.placePlaceholder;
    els.fields.chapter.placeholder = copy.chapterPlaceholder;
    els.fields.quote.placeholder = copy.quotePlaceholder;

    els.formTitle.textContent = (editingId ? "编辑" : "新增") + (type === "film" ? "一则影视台词" : "一则书籍摘录");
  }

  function fillForm(item) {
    els.fields.type.value = typeOf(item);
    applyType();
    els.fields.theme.value = item.theme;
    els.fields.book.value = item.book;
    els.fields.author.value = item.author;
    els.fields.publisher.value = item.publisher || "";
    els.fields.year.value = item.year || "";
    els.fields.dynasty.value = item.dynasty || "";
    els.fields.chapter.value = item.chapter || "";
    els.fields.era.value = item.era || "古代";
    els.fields.medium.value = item.medium === "剧集" ? "剧集" : "电影";
    els.fields.date.value = item.date || S.todayISO();
    els.fields.quote.value = item.quote;
    els.fields.note.value = item.note || "";
    els.fields.featured.checked = Boolean(item.featured);
  }

  function resetForm(focus) {
    editingId = null;
    els.form.reset();
    els.fields.type.value = "book";
    els.fields.theme.value = S.THEMES[0].name;
    els.fields.era.value = "古代";
    els.fields.medium.value = "电影";
    els.fields.date.value = S.todayISO();
    els.fields.featured.checked = false;
    applyType();
    els.formTitle.textContent = "新增一则书摘 / 台词";
    els.editBadge.hidden = true;
    els.cancelBtn.hidden = true;
    els.deleteBtn.hidden = true;
    els.saveBtn.textContent = "保存内容";
    renderList();
    if (focus) els.fields.book.focus();
  }

  function startEdit(id) {
    var item = data.find(function (row) { return row.id === id; });
    if (!item) return;
    editingId = id;
    fillForm(item);
    els.formTitle.textContent = "编辑" + (typeOf(item) === "film" ? "影视台词" : "书籍摘录");
    els.editBadge.hidden = false;
    els.cancelBtn.hidden = false;
    els.deleteBtn.hidden = false;
    els.saveBtn.textContent = "保存修改";
    renderList();
    document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    els.fields.book.focus({ preventScroll: true });
  }

  function readForm() {
    return {
      type: els.fields.type.value,
      theme: els.fields.theme.value,
      book: els.fields.book.value.trim(),
      author: els.fields.author.value.trim(),
      publisher: els.fields.publisher.value.trim(),
      year: els.fields.year.value.trim(),
      dynasty: els.fields.dynasty.value.trim(),
      chapter: els.fields.chapter.value.trim(),
      era: els.fields.era.value,
      medium: els.fields.medium.value,
      date: els.fields.date.value || S.todayISO(),
      quote: els.fields.quote.value.trim(),
      note: els.fields.note.value.trim(),
      featured: els.fields.featured.checked
    };
  }

  els.fields.type.addEventListener("change", applyType);

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
    var draft = readForm();
    var isFilm = draft.type === "film";

    if (!draft.theme || !draft.book || !draft.author || !draft.quote) {
      S.toast("请填写" + (isFilm ? "片名、导演与台词" : "书名、作者与原文摘录"));
      if (!draft.book) els.fields.book.focus();
      else if (!draft.author) els.fields.author.focus();
      else if (!draft.quote) els.fields.quote.focus();
      return;
    }

    if (editingId) {
      var index = data.findIndex(function (row) { return row.id === editingId; });
      if (index !== -1) {
        draft.id = editingId;
        data[index] = normalize(draft);
      }
      persist("已保存修改");
    } else {
      draft.id = makeId();
      data.unshift(normalize(draft));
      persist(isFilm ? "已新增一则影视台词" : "已新增一则书籍摘录");
    }

    resetForm(false);
  });

  els.cancelBtn.addEventListener("click", function () {
    resetForm(false);
    S.toast("已取消编辑");
  });

  els.deleteBtn.addEventListener("click", function () {
    if (!editingId) return;
    var item = data.find(function (row) { return row.id === editingId; });
    if (!item) return;
    if (!window.confirm("确定删除「" + item.book + "」这一则内容吗？")) return;
    data = data.filter(function (row) { return row.id !== editingId; });
    persist("已删除");
    resetForm(false);
  });

  els.list.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var id = button.getAttribute("data-id");
    if (button.getAttribute("data-action") === "edit") {
      startEdit(id);
      return;
    }
    if (button.getAttribute("data-action") === "delete") {
      var item = data.find(function (row) { return row.id === id; });
      if (!item) return;
      if (!window.confirm("确定删除「" + item.book + "」这一则内容吗？")) return;
      data = data.filter(function (row) { return row.id !== id; });
      if (editingId === id) resetForm(false);
      persist("已删除");
    }
  });

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

  els.newBtn.addEventListener("click", function () {
    resetForm(true);
    document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- import / export ---------- */

  els.exportJs.addEventListener("click", function () {
    var content =
      "/* 拾页 · 书摘数据\n" +
      " * 由「更新内容」后台导出于 " + new Date().toLocaleString("zh-CN") + "\n" +
      " * 用本文件覆盖站点的 data/excerpts.js 即可发布。\n" +
      " */\n" +
      "window.EXCERPTS = " + JSON.stringify(data, null, 2) + ";\n";
    S.download("excerpts.js", content, "text/javascript;charset=utf-8");
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
        editingId = null;
        persist("导入成功，已保存到本地草稿");
        resetForm(false);
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
    hasDraft = false;
    data = S.fileExcerpts().map(normalize);
    editingId = null;
    listQuery = "";
    filterType = "all";
    filterMonth = "all";
    els.search.value = "";
    els.filterType.value = "all";
    setSaveState();
    renderMonthOptions();
    renderList();
    resetForm(false);
    S.toast("已恢复文件数据");
  });

  document.querySelector('label[for="importFile"]').addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.importFile.click();
    }
  });

  /* ---------- init ---------- */

  renderThemeOptions();
  setSaveState();
  resetForm(false);
  applyType();
  renderMonthOptions();
  renderList();
})();
