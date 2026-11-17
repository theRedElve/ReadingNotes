(function () {
  "use strict";

  var S = window.SHIYE;
  var data = S.loadExcerpts().map(normalize);
  var hasDraft = Boolean(S.readDraft());

  var els = {
    saveState: document.getElementById("saveState"),
    form: document.getElementById("excerptForm"),
    formTitle: document.getElementById("formTitle"),
    typeField: document.getElementById("typeField"),
    saveBtn: document.getElementById("saveBtn"),
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
    workLinkHint: document.getElementById("workLinkHint"),
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
      eraNew: document.getElementById("f-era-new"),
      medium: document.getElementById("f-medium"),
      date: document.getElementById("f-date"),
      quote: document.getElementById("f-quote"),
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
      hint: "同一本书可添加多条摘录。新增时选已有书名，或选「＋ 新增书籍…」；已收录的摘录不支持修改，如需调整请先删除再重新添加。"
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
      hint: "同一部影视可添加多条台词。新增时选已有片名，或选「＋ 新增影视作品…」；已收录的台词不支持修改，如需调整请先删除再重新添加。"
    }
  };

  var params = new URLSearchParams(window.location.search);
  var paramType = params.get("type");
  var lockedType = paramType === "film" ? "film" : (paramType === "book" ? "book" : "");
  var workId = params.get("work") || "";

  if (!workId && !params.get("edit")) {
    window.location.replace("works.html");
  }

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
    if (message) S.toast(message + "（确认页面无误后到「发布上线」页点「立即发布」）");
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
      isbn: type === "book" ? String(item.isbn || "").trim() : "",
      year: String(item.year || "").trim(),
      era: String(item.era || "").trim(),
      translator: type === "book" ? String(item.translator || "").trim() : "",
      cover: String(item.cover || ""),
      country: String(item.country || item.dynasty || "").trim(),
      medium: type === "film" ? (item.medium === "剧集" ? "剧集" : "电影") : "",
      quote: String(item.quote || "").trim(),
      translation: String(item.translation || "").trim(),
      date: item.date || S.todayISO(),
      featured: type === "book" ? Boolean(item.featured) : false
    };
  }

  /* ---------- form ---------- */

  function themeNamesInData() {
    var names = [];
    data.forEach(function (item) {
      S.themesOf(item).forEach(function (name) {
        if (names.indexOf(name) === -1) names.push(name);
      });
    });
    return names;
  }

  function renderThemePicker() {
    els.fields.themes.innerHTML = S.allThemes(themeNamesInData()).map(function (theme) {
      return '<label class="theme-option"><input type="checkbox" value="' + esc(theme.name) + '"><span>' +
        esc(theme.name) + "</span></label>";
    }).join("") +
      '<button class="theme-option theme-add" type="button" id="themeAdd">＋ 新增主题</button>';
  }

  function addThemeClicked() {
    if (els.fields.themes.querySelector(".theme-add-input")) return;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "theme-add-input";
    input.placeholder = "新主题名称";
    input.maxLength = 12;
    els.fields.themes.appendChild(input);
    input.focus();

    var finished = false;
    function commit(save) {
      if (finished) return;
      finished = true;
      var name = input.value.trim();
      if (input.parentNode) input.parentNode.removeChild(input);
      if (!save || !name) return;
      if (S.THEME_MAP[name] || S.allThemes().some(function (theme) { return theme.name === name; })) {
        S.toast("主题「" + name + "」已存在");
        return;
      }
      if (!S.addCustomTheme(name)) {
        S.toast("主题保存失败，请检查浏览器存储");
        return;
      }
      var checked = getThemes();
      renderThemePicker();
      setThemes(checked.concat(name));
      S.toast("已新增主题「" + name + "」");
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        commit(true);
      } else if (event.key === "Escape") {
        commit(false);
      }
    });
    input.addEventListener("blur", function () { commit(true); });
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

  function eraValues() {
    return tagValues("era");
  }

  function syncEraField() {
    els.fields.eraNew.hidden = els.fields.era.value !== "__new__";
  }

  function renderEraOptions(selected) {
    var values = eraValues();
    els.fields.era.innerHTML = '<option value="">未选择</option>' + values.map(function (value) {
      return '<option value="' + esc(value) + '">' + esc(value) + "</option>";
    }).join("") + '<option value="__new__">＋ 新增时代…</option>';
    els.fields.era.value = selected && (selected === "__new__" || values.indexOf(selected) !== -1) ? selected : "";
    syncEraField();
  }

  function eraValue() {
    if (els.fields.era.value !== "__new__") return els.fields.era.value;
    return els.fields.eraNew.value.trim();
  }

  function selectedWorkName() {
    if (els.fields.book.value === "__new__") return els.fields.newBook.value.trim();
    return els.fields.book.value;
  }

  function toggleNewBook() {
    els.newBookField.hidden = els.fields.book.value !== "__new__";
  }

  function renderWorkOptions(type, selected) {
    var names = S.loadWorks().filter(function (work) {
      return work.type === type;
    }).map(function (work) {
      return work.title;
    });

    names = names.concat(data.filter(function (item) {
      return typeOf(item) === type;
    }).map(function (item) {
      return item.book;
    }));

    var works = Array.from(new Set(names.filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, "zh");
    });

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
    renderEraOptions("");
    els.fields.medium.value = "电影";
  }

  function fillFromWork(name) {
    var type = els.fields.type.value === "film" ? "film" : "book";
    var work = S.loadWorks().find(function (row) {
      return row.type === type && row.title === name;
    });
    var sample = work || data.find(function (item) {
      return typeOf(item) === type && item.book === name;
    });
    if (!sample) return;
    els.fields.author.value = sample.author || "";
    els.fields.publisher.value = sample.publisher || "";
    els.fields.year.value = sample.year || "";
    els.fields.country.value = sample.country || sample.dynasty || "";
    renderEraOptions(sample.era);
    els.fields.medium.value = sample.medium === "剧集" ? "剧集" : "电影";
  }

  function isArchivedWork(name) {
    if (!name) return false;
    var type = els.fields.type.value === "film" ? "film" : "book";
    return S.loadWorks().some(function (row) {
      return row.type === type && row.title === name;
    });
  }

  function syncWorkLock() {
    var locked = els.fields.book.value !== "__new__" && isArchivedWork(selectedWorkName());
    [els.fields.author, els.fields.publisher, els.fields.year, els.fields.country].forEach(function (field) {
      field.readOnly = locked;
    });
    els.fields.era.disabled = locked;
    els.fields.eraNew.disabled = locked;
    els.fields.medium.disabled = locked;
    els.workLinkHint.hidden = !locked;
    els.form.classList.toggle("is-work-linked", locked);
  }

  function applyType(selectedBook) {
    var type = els.fields.type.value === "film" ? "film" : "book";
    var copy = TYPE_COPY[type];

    document.querySelectorAll("[data-for]").forEach(function (node) {
      if (node.hasAttribute("data-always-hidden")) return;
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

    els.formTitle.textContent = "新增" + (type === "film" ? "一则影视台词" : "一则书籍摘录");
  }

  function resetForm(focus) {
    els.form.reset();
    els.fields.type.value = lockedType || "book";
    setThemes([S.THEMES[0].name]);
    renderEraOptions("");
    els.fields.medium.value = "电影";
    els.fields.date.value = S.todayISO();
    els.fields.featured.checked = true;
    els.fields.newBook.value = "";
    applyType();
    syncWorkLock();
    els.formTitle.textContent = lockedType === "film"
      ? "新增一则影视台词"
      : (lockedType === "book" ? "新增一则书籍摘录" : "新增一则书摘 / 台词");
    els.saveBtn.textContent = "保存内容";
    if (focus) els.fields.book.focus();
  }

  function startFromWork(id) {
    var work = S.loadWorks().find(function (row) { return row.id === id; });
    if (!work) return false;
    els.fields.type.value = work.type;
    applyType(work.title);
    fillFromWork(work.title);
    toggleNewBook();
    syncWorkLock();
    els.fields.quote.focus();
    return true;
  }

  function readForm() {
    var themes = getThemes();
    var type = els.fields.type.value;
    var work = S.loadWorks().find(function (row) {
      return (row.type === "film" ? "film" : "book") === (type === "film" ? "film" : "book") &&
        row.title === selectedWorkName();
    });
    return {
      type: type,
      theme: themes[0] || "",
      themes: themes,
      book: selectedWorkName(),
      author: els.fields.author.value.trim(),
      publisher: els.fields.publisher.value.trim(),
      isbn: type === "film" ? "" : (work ? work.isbn || "" : ""),
      year: els.fields.year.value.trim(),
      country: els.fields.country.value.trim(),
      chapter: els.fields.chapter.value.trim(),
      era: eraValue(),
      translator: type === "film" ? "" : (work ? work.translator || "" : ""),
      cover: work ? work.cover || "" : "",
      medium: els.fields.medium.value,
      date: els.fields.date.value || S.todayISO(),
      quote: els.fields.quote.value.trim(),
      featured: els.fields.featured.checked
    };
  }

  /* ---------- events ---------- */

  els.fields.type.addEventListener("change", function () {
    clearWorkFields();
    applyType();
    syncWorkLock();
  });

  els.fields.book.addEventListener("change", function () {
    toggleNewBook();
    if (els.fields.book.value === "__new__") {
      syncWorkLock();
      els.fields.newBook.focus();
      return;
    }
    fillFromWork(els.fields.book.value);
    syncWorkLock();
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

    var saved;
    draft.id = makeId();
    data.unshift(normalize(draft));
    saved = persist(isFilm ? "已新增一则影视台词" : "已新增一则书籍摘录");

    S.upsertWork({
      type: draft.type,
      title: draft.book,
      author: draft.author,
      publisher: draft.publisher,
      isbn: draft.isbn,
      year: draft.year,
      country: draft.country,
      era: draft.era,
      medium: draft.medium
    });

    if (saved) {
      window.location.href = isFilm ? "index.html#screen" : "index.html#library";
      return;
    }

    renderEraOptions(els.fields.era.value);
    resetForm(false);
  });

  /* ---------- init ---------- */

  renderThemePicker();
  els.fields.themes.addEventListener("click", function (event) {
    if (event.target.closest("#themeAdd")) addThemeClicked();
  });
  renderEraOptions("");
  els.fields.era.addEventListener("change", syncEraField);
  setSaveState();

  if (lockedType) {
    els.typeField.hidden = true;
    document.getElementById("pageTitle").textContent = lockedType === "film" ? "新增影视摘录" : "新增书籍摘录";
  }

  resetForm(false);

  if (params.get("edit")) {
    S.toast("已有摘录不支持修改，如需调整请先删除再重新添加");
    window.location.replace("content.html");
    return;
  }

  if (workId) {
    if (startFromWork(workId)) {
      var workName = els.fields.book.value;
      var isFilm = els.fields.type.value === "film";
      els.typeField.hidden = true;
      els.fields.book.parentElement.hidden = true;
      document.getElementById("newBookField").hidden = true;
      els.bookHint.hidden = true;
      document.getElementById("formTitle").hidden = true;
      document.getElementById("workContext").hidden = false;
      document.getElementById("workContextLabel").textContent = "作品库 · " + (isFilm ? "影视" : "书籍");
      document.getElementById("workContextTitle").textContent = "《" + workName + "》";
      document.getElementById("pageTitle").textContent = "新增" + (isFilm ? "影视" : "书籍") + "摘录";
    } else {
      S.toast("没有找到要添加摘录的作品");
    }
  }
})();
