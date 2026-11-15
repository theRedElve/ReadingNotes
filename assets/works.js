(function () {
  "use strict";

  var S = window.SHIYE;

  var els = {
    count: document.getElementById("workCount"),
    list: document.getElementById("workList"),
    empty: document.getElementById("workEmpty"),
    form: document.getElementById("workForm"),
    formTitle: document.getElementById("workFormTitle"),
    typeBadge: document.getElementById("workTypeBadge"),
    title: document.getElementById("w-title"),
    author: document.getElementById("w-author"),
    publisher: document.getElementById("w-publisher"),
    isbn: document.getElementById("w-isbn"),
    isbnField: document.getElementById("w-isbn-field"),
    year: document.getElementById("w-year"),
    country: document.getElementById("w-country"),
    era: document.getElementById("w-era"),
    eraField: document.getElementById("w-era-field"),
    translator: document.getElementById("w-translator"),
    translatorField: document.getElementById("w-translator-field"),
    cover: document.getElementById("w-cover"),
    coverPick: document.getElementById("w-cover-pick"),
    coverClear: document.getElementById("w-cover-clear"),
    coverPreview: document.getElementById("w-cover-preview"),
    coverImg: document.getElementById("w-cover-img"),
    medium: document.getElementById("w-medium"),
    mediumField: document.getElementById("w-medium-field"),
    titleLabel: document.getElementById("w-title-label"),
    authorLabel: document.getElementById("w-author-label"),
    publisherLabel: document.getElementById("w-publisher-label"),
    yearLabel: document.getElementById("w-year-label"),
    save: document.getElementById("workSave"),
    cancel: document.getElementById("workCancel"),
    addBook: document.getElementById("addBook"),
    addFilm: document.getElementById("addFilm"),
    tabs: Array.prototype.slice.call(document.querySelectorAll("[data-filter]")),
    trashPanel: document.getElementById("workTrashPanel"),
    trashCount: document.getElementById("workTrashCount"),
    trashList: document.getElementById("workTrashList")
  };

  var params = new URLSearchParams(window.location.search);
  var paramType = params.get("type");
  var works = S.loadWorks();
  var excerpts = S.loadExcerpts();
  var filter = paramType === "book" || paramType === "film" ? paramType : "all";
  var editingId = null;
  var formType = "book";
  var coverData = "";

  function esc(value) {
    return S.esc(value);
  }

  function normIsbn(value) {
    return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  }

  var alertMask = document.getElementById("alertMask");
  var alertText = document.getElementById("alertText");
  var alertOk = document.getElementById("alertOk");

  function showAlert(message) {
    alertText.textContent = message;
    alertMask.hidden = false;
    alertOk.focus();
  }

  function closeAlert() {
    alertMask.hidden = true;
  }

  alertOk.addEventListener("click", closeAlert);
  alertMask.addEventListener("click", function (event) {
    if (event.target === alertMask) closeAlert();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !alertMask.hidden) closeAlert();
  });

  function countOf(work) {
    return excerpts.filter(function (item) {
      return (item.type === "film" ? "film" : "book") === work.type && item.book === work.title;
    }).length;
  }

  function setActiveTab() {
    els.tabs.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-filter") === filter);
    });
  }

  function render() {
    var books = works.filter(function (work) { return work.type === "book"; }).length;
    var films = works.filter(function (work) { return work.type === "film"; }).length;
    els.count.textContent = works.length + " 个档案 · " + books + " 本书 · " + films + " 部影视";

    var shown = works.filter(function (work) {
      return filter === "all" || work.type === filter;
    });

    els.list.innerHTML = shown.map(function (work) {
      var meta = [
        work.type === "film" ? ("导演 " + (work.author || "—")) : (work.author || "—"),
        work.type === "book" && work.translator ? ("译 " + work.translator) : "",
        work.publisher,
        work.isbn ? ("ISBN " + work.isbn) : "",
        work.year,
        work.country,
        work.type === "film" ? work.medium : work.era
      ].filter(Boolean).join(" · ");

      var count = countOf(work);
      return '<article class="work-card">' +
        (work.cover ? '<div class="work-card-thumb"><img src="' + esc(work.cover) + '" alt="《' + esc(work.title) + '》封面"></div>' : "") +
        '<div class="work-card-body">' +
        '<div class="work-card-head">' +
          '<h3>' + esc(work.title) + "</h3>" +
          (count
            ? '<a class="work-count-pill" href="work.html?work=' + encodeURIComponent(work.id) + '">' + count + " 条摘录</a>"
            : '<span class="work-count-pill">暂无摘录</span>') +
        "</div>" +
        '<p class="work-card-meta">' + esc(meta) + "</p>" +
        '<div class="work-card-foot">' +
          '<a class="btn-mini" href="admin-form.html?work=' + encodeURIComponent(work.id) + '">＋ 加一条摘录</a>' +
          '<button class="btn-mini" type="button" data-edit="' + esc(work.id) + '">编辑</button>' +
          '<button class="btn-mini is-danger" type="button" data-delete="' + esc(work.id) + '">删除</button>' +
        "</div>" +
        "</div>" +
      "</article>";
    }).join("");

    els.empty.hidden = shown.length > 0;
    els.empty.textContent = filter === "film"
      ? "还没有影视作品，点上面的「添加影视」开始。"
      : (filter === "book" ? "还没有书籍，点上面的「添加书籍」开始。" : "还没有作品，点上面的「添加书籍」或「添加影视」开始。");
    setActiveTab();
  }

  function applyFormCopy() {
    var isFilm = formType === "film";
    els.typeBadge.textContent = isFilm ? "影视" : "书籍";
    els.titleLabel.textContent = isFilm ? "片名 *" : "书名 *";
    els.authorLabel.textContent = isFilm ? "导演" : "作者";
    els.publisherLabel.textContent = isFilm ? "出品方" : "出版社";
    els.yearLabel.textContent = isFilm ? "上映年份" : "出版年份";
    els.title.placeholder = isFilm ? "例如：天堂电影院" : "例如：世说新语";
    els.author.placeholder = isFilm ? "例如：朱塞佩·托纳多雷" : "例如：刘义庆";
    els.publisher.placeholder = isFilm ? "例如：Cristaldi Film" : "例如：中华书局";
    els.year.placeholder = isFilm ? "例如：1988" : "例如：2011";
    els.eraField.hidden = isFilm;
    els.translatorField.hidden = isFilm;
    els.isbnField.hidden = isFilm;
    els.mediumField.hidden = !isFilm;
  }

  function syncAddButtons() {
    var open = !els.form.hidden && !editingId;
    els.addBook.textContent = open && formType === "book" ? "收起" : "＋ 添加书籍";
    els.addFilm.textContent = open && formType === "film" ? "收起" : "＋ 添加影视";
    els.addBook.setAttribute("aria-expanded", String(open && formType === "book"));
    els.addFilm.setAttribute("aria-expanded", String(open && formType === "film"));
  }

  function openForm(type, work) {
    formType = type === "film" ? "film" : "book";
    editingId = work ? work.id : null;
    applyFormCopy();
    els.formTitle.textContent = (editingId ? "编辑" : "添加") + (formType === "film" ? "影视作品" : "书籍");
    els.save.textContent = editingId ? "保存修改" : "保存作品";
    els.title.value = work ? work.title : "";
    els.author.value = work ? work.author : "";
    els.publisher.value = work ? work.publisher : "";
    els.isbn.value = work ? work.isbn || "" : "";
    els.year.value = work ? work.year : "";
    els.country.value = work ? work.country : "";
    els.era.value = work ? work.era : "";
    els.translator.value = work ? work.translator || "" : "";
    coverData = work ? work.cover || "" : "";
    paintCover();
    els.medium.value = work && work.medium === "剧集" ? "剧集" : "电影";
    els.form.hidden = false;
    syncAddButtons();
    els.form.scrollIntoView({ behavior: "smooth", block: "start" });
    els.title.focus({ preventScroll: true });
  }

  function closeForm() {
    editingId = null;
    els.form.hidden = true;
    els.form.reset();
    coverData = "";
    paintCover();
    syncAddButtons();
  }

  function paintCover() {
    var has = Boolean(coverData);
    els.coverPreview.hidden = !has;
    els.coverClear.hidden = !has;
    els.coverPick.textContent = has ? "更换图片" : "选择图片";
    if (has) els.coverImg.src = coverData;
  }

  function readCover(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        var maxWidth = 640;
        var scale = Math.min(1, maxWidth / image.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = function () {
        showAlert("图片读取失败\n\n这张图片可能已损坏或格式不受支持，请换一张 JPG / PNG 图片。");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function reload() {
    works = S.loadWorks();
    excerpts = S.loadExcerpts();
    render();
    renderWorkTrash();
  }

  function renderWorkTrash() {
    var list = S.loadWorkTrash();
    els.trashPanel.hidden = !list.length;
    els.trashCount.textContent = list.length + " 个";
    els.trashList.innerHTML = list.map(function (entry) {
      var work = entry.work || {};
      var isFilm = work.type === "film";
      var when = new Date(entry.deletedAt).toLocaleString("zh-CN", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
      return (
        '<div class="admin-row">' +
          '<div class="admin-row-main">' +
            '<div class="admin-row-top">' +
              '<span class="type-chip' + (isFilm ? " is-film" : "") + '">' + (isFilm ? "影视" : "书籍") + "</span>" +
              "<strong>" + esc(work.title || "未命名") + "</strong>" +
            "</div>" +
            "<small>" + esc(work.author || "") + " · 删除于 " + esc(when) + "</small>" +
          "</div>" +
          '<div class="admin-row-actions">' +
            '<button type="button" data-restore="' + esc(entry.deletedAt) + '">恢复</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  els.tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-filter");
      render();
    });
  });

  els.addBook.addEventListener("click", function () {
    if (!els.form.hidden && !editingId && formType === "book") {
      closeForm();
      return;
    }
    openForm("book");
  });

  els.addFilm.addEventListener("click", function () {
    if (!els.form.hidden && !editingId && formType === "film") {
      closeForm();
      return;
    }
    openForm("film");
  });
  els.cancel.addEventListener("click", closeForm);

  els.coverPick.addEventListener("click", function () { els.cover.click(); });

  els.cover.addEventListener("change", function () {
    var file = els.cover.files && els.cover.files[0];
    if (!file) return;
    readCover(file, function (data) {
      coverData = data;
      paintCover();
    });
  });

  els.coverClear.addEventListener("click", function () {
    coverData = "";
    els.cover.value = "";
    paintCover();
  });

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
    var title = els.title.value.trim();
    var noun = formType === "film" ? "片名" : "书名";

    if (!title) {
      showAlert("请填写" + noun);
      els.title.focus();
      return;
    }

    var rawIsbn = formType === "book" ? els.isbn.value.trim() : "";
    var isbn = normIsbn(rawIsbn);
    if (formType === "book" && !isbn) {
      showAlert("请填写 ISBN\n\nISBN 是这本书的唯一标识，可在版权页或豆瓣页面查到。");
      els.isbn.focus();
      return;
    }

    if (!coverData) {
      showAlert("请上传封面\n\n封面用于书摘馆与详情展示，建议使用竖版图片。");
      els.coverPick.focus();
      return;
    }

    if (isbn) {
      if (!/^(97[89]\d{10}|\d{9}[\dX])$/.test(isbn)) {
        showAlert("ISBN 格式不正确\n\n应为 10 位或 13 位数字，横线与空格会自动去掉。");
        els.isbn.focus();
        return;
      }
      var duplicate = works.find(function (row) {
        return row.type === "book" && normIsbn(row.isbn) === isbn && row.id !== editingId;
      });
      if (duplicate) {
        showAlert("ISBN 重复\n\n这个 ISBN 已登记在「" + duplicate.title + "」名下，请检查是否重复添加。");
        els.isbn.focus();
        return;
      }
    }

    var work = {
      id: editingId || "",
      type: formType,
      title: title,
      author: els.author.value.trim(),
      publisher: els.publisher.value.trim(),
      isbn: formType === "book" ? normIsbn(els.isbn.value) : "",
      year: els.year.value.trim(),
      country: els.country.value.trim(),
      era: formType === "book" ? els.era.value.trim() : "",
      translator: formType === "book" ? els.translator.value.trim() : "",
      cover: coverData,
      medium: formType === "film" ? els.medium.value : ""
    };

    var saved;
    if (editingId) {
      saved = S.loadWorks().map(function (row) {
        return row.id === editingId ? Object.assign({}, work, { id: editingId }) : row;
      });
    }

    if (editingId) {
      if (!S.saveWorks(saved)) {
        S.toast("浏览器存储不可用，改动未能保存");
        return;
      }
    } else {
      S.upsertWork(work);
    }

    var linked = false;
    var updated = S.loadExcerpts().map(function (item) {
      var itemType = item.type === "film" ? "film" : "book";
      if (itemType !== formType || item.book !== title) return item;
      linked = true;
      return Object.assign({}, item, {
        author: work.author || item.author,
        publisher: work.publisher,
        isbn: work.isbn,
        year: work.year,
        country: work.country,
        era: formType === "book" ? work.era : item.era,
        translator: formType === "book" ? work.translator : item.translator,
        cover: work.cover,
        medium: formType === "film" ? work.medium : item.medium
      });
    });
    if (linked) S.saveDraft(updated);

    closeForm();
    reload();
    S.toast("已保存「" + title + "」（确认后到「发布上线」提交）");
  });

  els.list.addEventListener("click", function (event) {
    var target = event.target.closest("button");
    if (!target) return;

    var editId = target.getAttribute("data-edit");
    var deleteId = target.getAttribute("data-delete");

    if (editId) {
      var work = works.find(function (row) { return row.id === editId; });
      if (work) openForm(work.type, work);
      return;
    }

    if (deleteId) {
      var targetWork = works.find(function (row) { return row.id === deleteId; });
      if (!targetWork) return;
      var count = countOf(targetWork);
      if (count > 0) {
        S.toast("「" + targetWork.title + "」下还有 " + count + " 条摘录，请先到「全部内容」删除摘录");
        return;
      }
      if (!window.confirm("删除作品档案「" + targetWork.title + "」？")) return;
      S.addWorkTrash(targetWork);
      S.saveWorks(works.filter(function (row) { return row.id !== deleteId; }));
      reload();
      S.toast("已删除「" + targetWork.title + "」，可在下方「最近删除」恢复");
    }
  });

  els.trashList.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-restore]");
    if (!btn) return;
    var at = btn.getAttribute("data-restore");
    var list = S.loadWorkTrash();
    var entry = list.find(function (row) { return row.deletedAt === at; });
    if (!entry || !entry.work) return;
    var work = entry.work;
    var duplicate = works.find(function (row) {
      return (row.isbn && work.isbn && row.isbn === work.isbn) ||
        (row.type === work.type && row.title === work.title);
    });
    if (duplicate) {
      S.toast("作品库里已有同名或同 ISBN 的作品，请先处理重复项");
      return;
    }
    var next = S.loadWorks();
    next.push(work);
    S.saveWorks(next);
    S.saveWorkTrash(list.filter(function (row) { return row.deletedAt !== at; }));
    reload();
    S.toast("已恢复「" + work.title + "」");
  });

  render();
  renderWorkTrash();

  if (paramType === "book" || paramType === "film") {
    filter = paramType;
    render();
    if (params.get("new") === "1") openForm(paramType);
  }
})();
