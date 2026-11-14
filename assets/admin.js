(function () {
  "use strict";

  var S = window.SHIYE;
  var data = S.loadExcerpts().map(normalize);
  var hasDraft = Boolean(S.readDraft());

  var els = {
    saveState: document.getElementById("saveState"),
    form: document.getElementById("excerptForm"),
    formTitle: document.getElementById("formTitle"),
    editBadge: document.getElementById("editBadge"),
    saveBtn: document.getElementById("saveBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    deleteBtn: document.getElementById("deleteBtn"),
    labels: {
      book: document.getElementById("f-label-book"),
      newBook: document.getElementById("f-label-new-book"),
      author: document.getElementById("f-label-author"),
      publisher: document.getElementById("f-label-publisher"),
      year: document.getElementById("f-label-year"),
      place: document.getElementById("f-label-place"),
      chapter: document.getElementById("f-label-chapter"),
      quote: document.getElementById("f-label-quote")
    },
    newBookField: document.getElementById("newBookField"),
    bookHint: document.getElementById("bookHint"),
    fields: {
      type: document.getElementById("f-type"),
      themes: document.getElementById("f-themes"),
      book: document.getElementById("f-book"),
      newBook: document.getElementById("f-new-book"),
      author: document.getElementById("f-author"),
      publisher: document.getElementById("f-publisher"),
      year: document.getElementById("f-year"),
      country: document.getElementById("f-country"),
      chapter: document.getElementById("f-chapter"),
      era: document.getElementById("f-era"),
      medium: document.getElementById("f-medium"),
      date: document.getElementById("f-date"),
      quote: document.getElementById("f-quote"),
      translation: document.getElementById("f-translation"),
      douban: document.getElementById("f-douban"),
      doubanNew: document.getElementById("f-douban-new"),
      doubanNewField: document.getElementById("newDoubanField"),
      why: document.getElementById("f-why"),
      whyNew: document.getElementById("f-why-new"),
      whyNewField: document.getElementById("newWhyField"),
      featured: document.getElementById("f-featured")
    }
  };

  var TYPE_COPY = {
    book: {
      book: "书名 *",
      newBook: "新书名 *",
      author: "作者 *",
      publisher: "出版社",
      year: "出版年份",
      place: "国家",
      chapter: "篇目 / 章节",
      quote: "原文摘录 *",
      newBookPlaceholder: "输入新的书名",
      authorPlaceholder: "例如：刘义庆",
      publisherPlaceholder: "例如：中华书局",
      yearPlaceholder: "例如：2011",
      placePlaceholder: "例如：中国",
      chapterPlaceholder: "例如：品藻",
      quotePlaceholder: "贴入你想留下的句子……",
      hint: "每本书只保留一条摘录。新增请选「＋ 新增书籍…」；要修改已收录的书，请到「全部内容」点「编辑」。"
    },
    film: {
      book: "片名 *",
      newBook: "新片名 *",
      author: "导演 *",
      publisher: "出品方",
      year: "上映年份",
      place: "国家",
      chapter: "场次 / 台词出处",
      quote: "台词原文 *",
      newBookPlaceholder: "输入新的片名",
      authorPlaceholder: "例如：弗兰克·德拉邦特",
      publisherPlaceholder: "例如：Castle Rock Entertainment",
      yearPlaceholder: "例如：1994",
      placePlaceholder: "例如：美国",
      chapterPlaceholder: "例如：安迪写给瑞德的信",
      quotePlaceholder: "贴入你想留下的台词……",
      hint: "每部影视只保留一条台词。新增请选「＋ 新增影视作品…」；要修改已收录的作品，请到「全部内容」点「编辑」。"
    }
  };

  var editingId = null;

  /* ---------- helpers ---------- */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeOf(item) {
    return item && item.type === "film" ? "film" : "book";
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
      return false;
    }
    hasDraft = true;
    setSaveState();
    if (message) S.toast(message);
    if (S.getGhToken()) {
      S.publishExcerpts(data).then(function () {
        S.toast("已保存并提交上线，约 1 分钟后生效");
      }).catch(function (error) {
        S.toast("已保存本地，上线失败：" + error.message);
      });
    }
    return true;
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
      era: type === "film" ? "近现代" : (item.era === "近现代" ? "近现代" : "古代"),
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

  /* ---------- form ---------- */

  function renderThemePicker() {
    els.fields.themes.innerHTML = S.THEMES.map(function (theme) {
      return '<label class="theme-option"><input type="checkbox" value="' + esc(theme.name) + '"><span>' +
        esc(theme.name) + "</span></label>";
    }).join("");
  }

  function getThemes() {
    return Array.from(els.fields.themes.querySelectorAll("input:checked")).map(function (input) {
      return input.value;
    });
  }

  function setThemes(list) {
    var names = Array.isArray(list) ? list : [];
    els.fields.themes.querySelectorAll("input").forEach(function (input) {
      input.checked = names.indexOf(input.value) !== -1;
    });
  }

  function tagValues(key) {
    var seen = {};
    return data.reduce(function (acc, item) {
      var value = String(item[key] || "").trim();
      if (value && !seen[value]) {
        seen[value] = true;
        acc.push(value);
      }
      return acc;
    }, []);
  }

  function fillTagSelect(select, values, newLabel) {
    var current = select.value;
    select.innerHTML = '<option value="">未选择</option>' +
      values.map(function (value) {
        return '<option value="' + esc(value) + '">' + esc(value) + "</option>";
      }).join("") +
      '<option value="__new__">' + newLabel + "</option>";
    select.value = current && (current === "__new__" || values.indexOf(current) !== -1) ? current : "";
  }

  function renderTagOptions() {
    fillTagSelect(els.fields.douban, tagValues("doubanTag"), "＋ 新增标签…");
    fillTagSelect(els.fields.why, tagValues("whyThis"), "＋ 新增选项…");
    syncTagFields();
  }

  function syncTagFields() {
    els.fields.doubanNewField.hidden = els.fields.douban.value !== "__new__";
    els.fields.whyNewField.hidden = els.fields.why.value !== "__new__";
  }

  function tagValue(select, input) {
    return select.value === "__new__" ? input.value.trim() : select.value;
  }

  function selectedWorkName() {
    if (els.fields.book.value === "__new__") return els.fields.newBook.value.trim();
    return els.fields.book.value;
  }

  function toggleNewBook() {
    els.newBookField.hidden = els.fields.book.value !== "__new__";
  }

  function renderWorkOptions(type, selected) {
    var works = Array.from(new Set(data.filter(function (item) {
      return typeOf(item) === type;
    }).map(function (item) {
      return item.book;
    }))).sort(function (a, b) { return a.localeCompare(b, "zh"); });

    var options = '<option value="">' + (type === "film" ? "请选择影视作品" : "请选择书名") + "</option>";
    options += works.map(function (name) {
      return '<option value="' + esc(name) + '">' + esc(name) + "</option>";
    }).join("");
    options += '<option value="__new__">＋ 新增' + (type === "film" ? "影视作品" : "书籍") + "…</option>";
    els.fields.book.innerHTML = options;

    if (selected && works.indexOf(selected) !== -1) els.fields.book.value = selected;
    else if (selected === "__new__") els.fields.book.value = "__new__";
    else els.fields.book.value = "";
    toggleNewBook();
  }

  function clearWorkFields() {
    els.fields.author.value = "";
    els.fields.publisher.value = "";
    els.fields.year.value = "";
    els.fields.country.value = "";
    els.fields.chapter.value = "";
    els.fields.newBook.value = "";
    els.fields.era.value = "古代";
    els.fields.medium.value = "电影";
  }

  function fillFromWork(name) {
    var type = els.fields.type.value === "film" ? "film" : "book";
    var sample = data.find(function (item) {
      return typeOf(item) === type && item.book === name;
    });
    if (!sample) return;
    els.fields.author.value = sample.author || "";
    els.fields.publisher.value = sample.publisher || "";
    els.fields.year.value = sample.year || "";
    els.fields.country.value = sample.country || sample.dynasty || "";
    els.fields.era.value = sample.era || "古代";
    els.fields.medium.value = sample.medium === "剧集" ? "剧集" : "电影";
  }

  function applyType(selectedBook) {
    var type = els.fields.type.value === "film" ? "film" : "book";
    var copy = TYPE_COPY[type];

    document.querySelectorAll("[data-for]").forEach(function (node) {
      node.hidden = node.getAttribute("data-for") !== type;
    });

    els.labels.book.textContent = copy.book;
    els.labels.newBook.textContent = copy.newBook;
    els.labels.author.textContent = copy.author;
    els.labels.publisher.textContent = copy.publisher;
    els.labels.year.textContent = copy.year;
    els.labels.place.textContent = copy.place;
    els.labels.chapter.textContent = copy.chapter;
    els.labels.quote.textContent = copy.quote;

    els.fields.newBook.placeholder = copy.newBookPlaceholder;
    els.fields.author.placeholder = copy.authorPlaceholder;
    els.fields.publisher.placeholder = copy.publisherPlaceholder;
    els.fields.year.placeholder = copy.yearPlaceholder;
    els.fields.country.placeholder = copy.placePlaceholder;
    els.fields.chapter.placeholder = copy.chapterPlaceholder;
    els.fields.quote.placeholder = copy.quotePlaceholder;
    els.bookHint.textContent = copy.hint;

    renderWorkOptions(type, selectedBook);

    els.formTitle.textContent = (editingId ? "编辑" : "新增") + (type === "film" ? "一则影视台词" : "一则书籍摘录");
  }

  function fillForm(item) {
    els.fields.type.value = typeOf(item);
    applyType(item.book);
    setThemes(S.themesOf(item));
    els.fields.newBook.value = "";
    els.fields.author.value = item.author;
    els.fields.publisher.value = item.publisher || "";
    els.fields.year.value = item.year || "";
    els.fields.country.value = item.country || item.dynasty || "";
    els.fields.chapter.value = item.chapter || "";
    els.fields.era.value = item.era || "古代";
    els.fields.medium.value = item.medium === "剧集" ? "剧集" : "电影";
    els.fields.date.value = item.date || S.todayISO();
    els.fields.quote.value = item.quote;
    els.fields.translation.value = item.translation || "";
    els.fields.douban.value = item.doubanTag || "";
    els.fields.why.value = item.whyThis || "";
    els.fields.doubanNew.value = "";
    els.fields.whyNew.value = "";
    syncTagFields();
    els.fields.featured.checked = Boolean(item.featured);
  }

  function resetForm(focus) {
    editingId = null;
    els.form.reset();
    els.fields.type.value = "book";
    setThemes([S.THEMES[0].name]);
    els.fields.era.value = "古代";
    els.fields.medium.value = "电影";
    els.fields.date.value = S.todayISO();
    els.fields.featured.checked = true;
    els.fields.newBook.value = "";
    els.fields.douban.value = "";
    els.fields.why.value = "";
    els.fields.doubanNew.value = "";
    els.fields.whyNew.value = "";
    syncTagFields();
    applyType();
    els.formTitle.textContent = "新增一则书摘 / 台词";
    els.editBadge.hidden = true;
    els.cancelBtn.hidden = true;
    els.deleteBtn.hidden = true;
    els.saveBtn.textContent = "保存内容";
    if (focus) els.fields.book.focus();
  }

  function startEdit(id, scroll) {
    var item = data.find(function (row) { return row.id === id; });
    if (!item) return false;
    editingId = id;
    fillForm(item);
    els.formTitle.textContent = "编辑" + (typeOf(item) === "film" ? "影视台词" : "书籍摘录");
    els.editBadge.hidden = false;
    els.cancelBtn.hidden = false;
    els.deleteBtn.hidden = false;
    els.saveBtn.textContent = "保存修改";
    if (scroll !== false) {
      document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      els.fields.book.focus({ preventScroll: true });
    }
    return true;
  }

  function readForm() {
    var themes = getThemes();
    return {
      type: els.fields.type.value,
      theme: themes[0] || "",
      themes: themes,
      book: selectedWorkName(),
      author: els.fields.author.value.trim(),
      publisher: els.fields.publisher.value.trim(),
      year: els.fields.year.value.trim(),
      country: els.fields.country.value.trim(),
      chapter: els.fields.chapter.value.trim(),
      era: els.fields.era.value,
      medium: els.fields.medium.value,
      date: els.fields.date.value || S.todayISO(),
      quote: els.fields.quote.value.trim(),
      translation: els.fields.translation.value.trim(),
      doubanTag: tagValue(els.fields.douban, els.fields.doubanNew),
      whyThis: tagValue(els.fields.why, els.fields.whyNew),
      featured: els.fields.featured.checked
    };
  }

  /* ---------- events ---------- */

  els.fields.type.addEventListener("change", function () {
    clearWorkFields();
    applyType();
  });

  els.fields.book.addEventListener("change", function () {
    toggleNewBook();
    if (els.fields.book.value === "__new__") {
      els.fields.newBook.focus();
      return;
    }
    fillFromWork(els.fields.book.value);
  });

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
    var draft = readForm();
    var isFilm = draft.type === "film";

    if (!draft.book) {
      S.toast(isFilm ? "请选择或新增一个影视作品" : "请选择或新增一本书");
      if (els.fields.book.value === "__new__") els.fields.newBook.focus();
      else els.fields.book.focus();
      return;
    }

    if (!draft.themes.length) {
      S.toast("请至少选择一个主题");
      return;
    }

    if (!draft.author || !draft.quote) {
      S.toast("请填写" + (isFilm ? "导演与台词" : "作者与原文摘录"));
      if (!draft.author) els.fields.author.focus();
      else els.fields.quote.focus();
      return;
    }

    var duplicate = data.find(function (row) {
      return typeOf(row) === draft.type && row.book === draft.book && row.id !== editingId;
    });
    if (duplicate) {
      S.toast("「" + draft.book + "」已经有一条摘录，请到「全部内容」里编辑它");
      return;
    }

    if (editingId) {
      var index = data.findIndex(function (row) { return row.id === editingId; });
      if (index !== -1) {
        draft.id = editingId;
        data[index] = normalize(draft);
      }
      persist("已保存修改，可到「全部内容」查看");
    } else {
      draft.id = makeId();
      data.unshift(normalize(draft));
      persist(isFilm ? "已新增一则影视台词" : "已新增一则书籍摘录");
    }

    renderTagOptions();
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
    S.addTrash(item);
    data = data.filter(function (row) { return row.id !== editingId; });
    persist("已删除，可在「全部内容 → 最近删除」恢复");
    renderTagOptions();
    resetForm(false);
  });

  /* ---------- init ---------- */

  renderThemePicker();
  renderTagOptions();
  els.fields.douban.addEventListener("change", syncTagFields);
  els.fields.why.addEventListener("change", syncTagFields);
  setSaveState();
  resetForm(false);

  var editId = new URLSearchParams(window.location.search).get("edit");
  if (editId && !startEdit(editId, false)) {
    S.toast("没有找到要编辑的内容");
  }
})();
