/* 拾页 · 站点前台 */
(function () {
  "use strict";

  var S = window.SHIYE;
  var esc = S.esc;
  var themes = S.THEMES;
  var themeMap = S.THEME_MAP;

  function themesOf(item) { return S.themesOf(item); }
  function countryOf(item) { return item.country || item.dynasty || ""; }
  function translationOf(item) { return item.translation || ""; }

  var all = S.loadExcerpts();
  var favorites = S.favorites();
  var books = all.filter(function (item) { return typeOf(item) === "book"; });
  var films = all.filter(function (item) { return typeOf(item) === "film"; });

  var bookState = { q: "", author: "all", era: "all", sort: "newest" };
  var filmState = { q: "", medium: "all", director: "all", region: "all", sort: "newest" };
  var themeState = { q: "", theme: "all", type: "all", author: "all", fav: "all", sort: "newest" };
  var bookLimit = 8;

  var els = {
    views: Array.prototype.slice.call(document.querySelectorAll("[data-view]")),
    navLinks: Array.prototype.slice.call(document.querySelectorAll("[data-nav]")),
    book: {
      search: document.querySelector("[data-book-search]"),
      author: document.querySelector("[data-book-author]"),
      era: document.querySelector("[data-book-era]"),
      sort: document.querySelector("[data-book-sort]"),
      list: document.querySelector("[data-book-list]"),
      more: document.querySelector("[data-book-more]"),
      empty: document.querySelector("[data-book-empty]"),
      count: document.querySelector("[data-book-result]"),
      total: document.querySelector("[data-book-count]"),
      totalLines: document.querySelector("[data-book-total]"),
      clears: Array.prototype.slice.call(document.querySelectorAll("[data-book-clear]"))
    },
    film: {
      search: document.querySelector("[data-film-search]"),
      medium: document.querySelector("[data-film-medium]"),
      director: document.querySelector("[data-film-director]"),
      region: document.querySelector("[data-film-region]"),
      sort: document.querySelector("[data-film-sort]"),
      grid: document.querySelector("[data-film-grid]"),
      empty: document.querySelector("[data-film-empty]"),
      count: document.querySelector("[data-film-result]"),
      clears: Array.prototype.slice.call(document.querySelectorAll("[data-film-clear]"))
    },
    theme: {
      search: document.querySelector("[data-theme-search]"),
      theme: document.querySelector("[data-theme-theme]"),
      type: document.querySelector("[data-theme-type]"),
      author: document.querySelector("[data-theme-author]"),
      fav: document.querySelector("[data-theme-fav]"),
      sort: document.querySelector("[data-theme-sort]"),
      shelves: document.querySelector("[data-shelves]"),
      empty: document.querySelector("[data-theme-empty]"),
      count: document.querySelector("[data-theme-result]"),
      clears: Array.prototype.slice.call(document.querySelectorAll("[data-theme-clear]"))
    },
    today: {
      card: document.querySelector("[data-today-card]"),
      label: document.querySelector("[data-today-theme]"),
      quote: document.querySelector("[data-today-quote]"),
      source: document.querySelector("[data-today-source]"),
      note: document.querySelector("[data-today-note]"),
      char: document.querySelector("[data-today-char]"),
      no: document.querySelector("[data-today-no]"),
      title: document.querySelector("[data-today-title]"),
      open: document.querySelector("[data-today-open]"),
      change: document.querySelector("[data-today-change]"),
      fav: document.querySelector("[data-today-fav]")
    },
    reader: {
      root: document.querySelector("[data-reader]"),
      sheet: document.querySelector(".reader-sheet"),
      rail: document.querySelector("[data-reader-rail]"),
      theme: document.querySelector("[data-reader-theme]"),
      quote: document.querySelector("[data-reader-quote]"),
      source: document.querySelector("[data-reader-source]"),
      note: document.querySelector("[data-reader-note]"),
      meta: document.querySelector("[data-reader-meta]"),
      fav: document.querySelector("[data-reader-fav]"),
      copy: document.querySelector("[data-reader-copy]"),
      prev: document.querySelector("[data-reader-prev]"),
      next: document.querySelector("[data-reader-next]")
    }
  };

  var numbering = buildExcerptNumbering();
  var bookNumbering = buildBookNumbering();
  var filmNumbering = buildFilmNumbering();
  var todayEntry = null;
  var readerList = [];
  var readerIndex = -1;

  /* ---------- basics ---------- */

  function typeOf(item) {
    return item && item.type === "film" ? "film" : "book";
  }

  function themeRank(name) {
    var theme = themeMap[name];
    return theme ? theme.index : 99;
  }

  function byNewest(a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  }

  function buildExcerptNumbering() {
    var sorted = all.slice().sort(function (a, b) {
      var diff = themeRank(a.theme) - themeRank(b.theme);
      return diff !== 0 ? diff : byNewest(a, b);
    });
    var map = new Map();
    sorted.forEach(function (item, index) {
      map.set(item.id, String(index + 1).padStart(2, "0"));
    });
    return map;
  }

  function buildBookNumbering() {
    var names = Array.from(new Set(books.map(function (item) { return item.book; })))
      .sort(function (a, b) { return a.localeCompare(b, "zh-Hans-CN"); });
    var map = new Map();
    names.forEach(function (name, index) {
      map.set(name, String(index + 1).padStart(2, "0"));
    });
    return map;
  }

  function buildFilmNumbering() {
    var sorted = films.slice().sort(function (a, b) {
      return String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
    });
    var map = new Map();
    sorted.forEach(function (item, index) {
      map.set(item.book, String(index + 1).padStart(2, "0"));
    });
    return map;
  }

  function sourceOf(item) {
    if (typeOf(item) === "film") {
      return "《" + item.book + "》 " + item.author + " 导演";
    }
    return item.author + "《" + item.book + "》";
  }

  function uniqueAuthors(list) {
    return Array.from(new Set(list.map(function (item) { return item.author; })))
      .sort(function (a, b) { return a.localeCompare(b, "zh-Hans-CN"); });
  }

  function setOptions(select, values, allLabel, current) {
    select.innerHTML = '<option value="all">' + esc(allLabel) + "</option>" + values.map(function (value) {
      return '<option value="' + esc(value) + '">' + esc(value) + "</option>";
    }).join("");
    select.value = current;
  }

  /* ---------- routing ---------- */

  function viewFromHash() {
    var name = location.hash.replace("#", "");
    return ["library", "screen", "themes", "home"].indexOf(name) !== -1 ? name : "home";
  }

  function applyView() {
    var name = viewFromHash();
    els.views.forEach(function (view) {
      view.hidden = view.getAttribute("data-view") !== name;
    });
    els.navLinks.forEach(function (link) {
      if (link.getAttribute("data-nav") === name) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.body.setAttribute("data-view", name);
    window.scrollTo(0, 0);
  }

  /* ---------- book view ---------- */

  function bookGroups() {
    var q = bookState.q.trim().toLowerCase();
    var items = books.filter(function (item) {
      if (bookState.author !== "all" && item.author !== bookState.author) return false;
      if (bookState.era !== "all" && item.era !== bookState.era) return false;
      if (!q) return true;
      return [item.book, item.chapter, item.author, item.quote, item.translation, item.publisher, item.year, item.country, themesOf(item).join(" ")]
        .join(" ")
        .toLowerCase()
        .indexOf(q) !== -1;
    });

    var map = new Map();
    items.forEach(function (item) {
      if (!map.has(item.book)) {
        map.set(item.book, {
          book: item.book,
          author: item.author,
          publisher: item.publisher,
          isbn: item.isbn,
          year: item.year,
          translator: item.translator,
          cover: item.cover,
          theme: themesOf(item)[0],
          items: [],
          latest: item.date
        });
      }
      var group = map.get(item.book);
      group.items.push(item);
      if (String(item.date || "") > String(group.latest || "")) group.latest = item.date;
    });

    var groups = Array.from(map.values());
    groups.forEach(function (group) {
      group.items.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    });

    groups.sort(function (a, b) {
      if (bookState.sort === "title") return String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
      if (bookState.sort === "count") return b.items.length - a.items.length || String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
      if (bookState.sort === "author") return String(a.author).localeCompare(String(b.author), "zh-Hans-CN");
      return String(b.latest || "").localeCompare(String(a.latest || ""));
    });

    return { groups: groups, items: items };
  }

  function quoteHTML(item, index) {
    return (
      '<article class="book-quote" style="--d:' + Math.min(index * 35, 240) + 'ms">' +
        '<div class="book-quote-top">' +
          '<span class="quote-index">' + String(index + 1).padStart(2, "0") + "</span>" +
          '<span class="quote-chapter">' + esc(item.chapter || "摘录") + "</span>" +
        "</div>" +
        '<blockquote>' + esc(item.quote) + "</blockquote>" +
        (translationOf(item) ? '<p class="book-quote-note"><span>译文</span>' + esc(translationOf(item)) + "</p>" : "") +
        '<div class="book-quote-foot">' +
          "<span>" + esc(S.formatDate(item.date)) + "</span>" +
          '<a href="#" data-open="' + esc(item.id) + '">读全文 →</a>' +
        "</div>" +
      "</article>"
    );
  }

  function bookShelfHTML(group) {
    var theme = S.themeOf(group.theme);
    var no = bookNumbering.get(group.book) || "00";
    var quotes = group.items.map(quoteHTML).join("");
    var work = S.loadWorks().find(function (row) {
      return row.type !== "film" && row.title === group.book;
    });
    var addHref = work
      ? "admin-form.html?work=" + encodeURIComponent(work.id)
      : "works.html?type=book";
    var anchor = "quotes-" + (work ? work.id : encodeURIComponent(group.book));
    var detailHref = work ? "work.html?work=" + encodeURIComponent(work.id) : "index.html#library";
    return (
      '<article class="book-shelf is-' + theme.color + '">' +
        '<div class="book-aside">' +
          (group.cover
            ? '<div class="card-cover book-cover has-photo"><img class="cover-photo" src="' + esc(group.cover) + '" alt="《' + esc(group.book) + '》封面"></div>'
            : '<div class="card-cover book-cover">' +
            '<div class="cover-inner">' +
              '<div class="cover-top"><span>拾页藏书</span><span>NO. ' + no + "</span></div>" +
              '<div class="cover-middle">' +
                '<span class="cover-char" aria-hidden="true">' + esc(theme.char) + "</span>" +
                '<p class="cover-book">' + esc(group.book) + "</p>" +
              "</div>" +
              '<div class="cover-bottom">' +
                '<span class="cover-author">' + esc(group.author) + "</span>" +
                '<span class="cover-seal" aria-hidden="true">拾</span>' +
              "</div>" +
            "</div>" +
          "</div>") +
          '<div class="book-info">' +
            "<h2>" + esc(group.book) + "</h2>" +
            '<p class="book-author">' + esc(group.author) + "</p>" +
            (group.translator ? '<p class="book-translator">译 ' + esc(group.translator) + "</p>" : "") +
            '<p class="book-edition">' + esc(group.publisher || "版本待补") +
              (group.year ? " · " + esc(group.year) : "") +
              (group.isbn ? " · ISBN " + esc(group.isbn) : "") + "</p>" +
            '<div class="book-meta">' +
              '<a class="book-count" href="' + detailHref + '">' +
                group.items.length + " 则摘录" +
              "</a>" +
              '<a class="book-add" href="' + addHref + '">＋ 添加书摘</a>' +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="book-quotes" id="' + esc(anchor) + '">' + quotes + "</div>" +
      "</article>"
    );
  }

  function renderBooks() {
    var result = bookGroups();
    var groups = result.groups;
    var visible = groups.slice(0, bookLimit);

    els.book.list.innerHTML = visible.map(bookShelfHTML).join("");
    els.book.empty.hidden = groups.length !== 0;
    els.book.count.textContent = groups.length;
    els.book.more.hidden = groups.length <= bookLimit;
    els.book.more.textContent = "展开更多书目（还有 " + Math.max(groups.length - bookLimit, 0) + " 本）";

    var filtering = Boolean(bookState.q.trim()) || bookState.author !== "all" || bookState.era !== "all";
    els.book.clears.forEach(function (button) { button.hidden = !filtering; });
  }

  function renderBookAuthors() {
    setOptions(els.book.author, uniqueAuthors(books), "全部作者", bookState.author);
  }

  function renderBookEras() {
    var values = Array.from(new Set(books.map(function (item) { return item.era; })))
      .filter(Boolean)
      .sort(function (a, b) { return a.localeCompare(b, "zh-Hans-CN"); });
    setOptions(els.book.era, values, "不限时代", bookState.era);
  }

  function resetBookFilters() {
    bookState.q = "";
    bookState.author = "all";
    bookState.era = "all";
    bookState.sort = "newest";
    bookLimit = 8;
    els.book.search.value = "";
    els.book.era.value = "all";
    els.book.sort.value = "newest";
    els.book.author.value = "all";
    renderBooks();
  }

  /* ---------- film view ---------- */

  function filmList() {
    var q = filmState.q.trim().toLowerCase();
    var list = films.filter(function (item) {
      if (filmState.medium !== "all" && item.medium !== filmState.medium) return false;
      if (filmState.director !== "all" && item.author !== filmState.director) return false;
      if (filmState.region !== "all" && countryOf(item) !== filmState.region) return false;
      if (!q) return true;
      return [item.book, item.chapter, item.author, item.quote, item.translation, item.publisher, countryOf(item), item.year, themesOf(item).join(" ")]
        .join(" ")
        .toLowerCase()
        .indexOf(q) !== -1;
    });

    list.sort(function (a, b) {
      if (filmState.sort === "oldest") return String(a.date || "").localeCompare(String(b.date || ""));
      if (filmState.sort === "title") return String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
      return byNewest(a, b);
    });

    return list;
  }

  function filmCardHTML(item, delay) {
    var theme = S.themeOf(themesOf(item)[0]);
    var no = filmNumbering.get(item.book) || "00";
    var faved = favorites.has(item.id);
    return (
      '<article class="excerpt-card film-card is-' + theme.color + '" style="--d:' + delay + 'ms">' +
        '<a class="card-link" href="#" data-open="' + esc(item.id) + '">' +
          '<div class="card-cover' + (item.cover ? " has-photo" : "") + '">' +
            (item.cover
              ? '<img class="cover-photo" src="' + esc(item.cover) + '" alt="《' + esc(item.book) + '》封面">'
              : '<div class="cover-inner">' +
              '<div class="cover-top"><span>拾页藏影</span><span>NO. ' + no + "</span></div>" +
              '<div class="cover-middle">' +
                '<span class="cover-char" aria-hidden="true">影</span>' +
                '<p class="cover-book">' + esc(item.book) + "</p>" +
              "</div>" +
              '<div class="cover-bottom">' +
                '<span class="cover-author">' + esc(item.author) + "</span>" +
                '<span class="cover-seal" aria-hidden="true">拾</span>' +
              "</div>" +
            "</div>") +
          "</div>" +
          '<div class="card-copy">' +
            '<span class="card-source"><span>' + esc(item.medium || "电影") + " · " +
              esc(countryOf(item)) + " · " + esc(item.year || "") + "</span>" +
              '<span class="card-fav-mark"' + (faved ? "" : " hidden") + ">已藏</span></span>" +
            '<blockquote class="card-quote">' + esc(item.quote) + "</blockquote>" +
            '<div class="card-footer">' +
              '<span class="card-book">' + esc(item.author) + " 导演</span>" +
              '<span>' + esc(S.formatDate(item.date)) + ' <span class="card-arrow">→</span></span>' +
            "</div>" +
          "</div>" +
        "</a>" +
      "</article>"
    );
  }

  function renderFilms() {
    var list = filmList();
    els.film.grid.innerHTML = list.map(function (item, index) {
      return filmCardHTML(item, Math.min(index * 30, 300));
    }).join("");
    els.film.empty.hidden = list.length !== 0;
    els.film.grid.hidden = list.length === 0;
    els.film.count.textContent = list.length;

    var filtering = Boolean(filmState.q.trim()) || filmState.medium !== "all" ||
      filmState.director !== "all" || filmState.region !== "all";
    els.film.clears.forEach(function (button) { button.hidden = !filtering; });
  }

  function renderFilmOptions() {
    setOptions(els.film.director, uniqueAuthors(films), "全部导演", filmState.director);
    var regions = Array.from(new Set(films.map(countryOf).filter(Boolean)))
      .sort(function (a, b) { return a.localeCompare(b, "zh-Hans-CN"); });
    setOptions(els.film.region, regions, "全部国家", filmState.region);
  }

  function resetFilmFilters() {
    filmState.q = "";
    filmState.medium = "all";
    filmState.director = "all";
    filmState.region = "all";
    filmState.sort = "newest";
    els.film.search.value = "";
    els.film.medium.value = "all";
    els.film.director.value = "all";
    els.film.region.value = "all";
    els.film.sort.value = "newest";
    renderFilms();
  }

  /* ---------- theme view ---------- */

  function themeList() {
    var q = themeState.q.trim().toLowerCase();
    var list = all.filter(function (item) {
      if (themeState.theme !== "all" && themesOf(item).indexOf(themeState.theme) === -1) return false;
      if (themeState.type !== "all" && typeOf(item) !== themeState.type) return false;
      if (themeState.author !== "all" && item.author !== themeState.author) return false;
      if (themeState.fav === "fav" && !favorites.has(item.id)) return false;
      if (!q) return true;
      return [item.quote, item.book, item.author, themesOf(item).join(" "), item.translation, item.publisher, item.year, item.chapter, countryOf(item)]
        .join(" ")
        .toLowerCase()
        .indexOf(q) !== -1;
    });

    list.sort(function (a, b) {
      if (themeState.sort === "oldest") return String(a.date || "").localeCompare(String(b.date || ""));
      if (themeState.sort === "book") return String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
      if (themeState.sort === "author") return String(a.author).localeCompare(String(b.author), "zh-Hans-CN");
      return byNewest(a, b) || String(a.book).localeCompare(String(b.book), "zh-Hans-CN");
    });

    return list;
  }

  function themeCardHTML(item, delay) {
    var theme = S.themeOf(themesOf(item)[0]);
    var no = numbering.get(item.id) || "00";
    var faved = favorites.has(item.id);
    var isFilm = typeOf(item) === "film";
    return (
      '<article class="excerpt-card is-' + theme.color + '" style="--d:' + delay + 'ms">' +
        '<a class="card-link" href="#" data-open="' + esc(item.id) + '">' +
          '<div class="card-cover' + (item.cover ? " has-photo" : "") + '">' +
            (item.cover
              ? '<img class="cover-photo" src="' + esc(item.cover) + '" alt="《' + esc(item.book) + '》封面">'
              : '<div class="cover-inner">' +
              '<div class="cover-top"><span>' + (isFilm ? "拾页藏影" : "拾页藏书") + "</span><span>NO. " + no + "</span></div>" +
              '<div class="cover-middle">' +
                '<span class="cover-char" aria-hidden="true">' + esc(isFilm ? "影" : theme.char) + "</span>" +
                '<p class="cover-book">' + esc(item.book) + "</p>" +
              "</div>" +
              '<div class="cover-bottom">' +
                '<span class="cover-author">' + esc(item.author) + "</span>" +
                '<span class="cover-seal" aria-hidden="true">拾</span>' +
              "</div>" +
            "</div>") +
          "</div>" +
          '<div class="card-copy">' +
            '<span class="card-source"><span>' + esc(theme.name) + " · " + esc(theme.en) + "</span>" +
              '<span class="card-fav-mark"' + (faved ? "" : " hidden") + ">已藏</span></span>" +
            '<blockquote class="card-quote">' + esc(item.quote) + "</blockquote>" +
            '<div class="card-footer">' +
              '<span class="card-book">' + esc(sourceOf(item)) + "</span>" +
              '<span>' + esc(S.formatDate(item.date)) + ' <span class="card-arrow">→</span></span>' +
            "</div>" +
          "</div>" +
        "</a>" +
      "</article>"
    );
  }

  function renderThemes() {
    var list = themeList();
    var groups = [];

    themes.forEach(function (theme) {
      var items = list.filter(function (item) { return themesOf(item).indexOf(theme.name) !== -1; });
      if (items.length) groups.push({ theme: theme, items: items });
    });

    var known = new Set(themes.map(function (theme) { return theme.name; }));
    var extra = list.filter(function (item) { return !known.has(themesOf(item)[0]); });
    if (extra.length) {
      groups.push({
        theme: { name: themesOf(extra[0])[0] || "未分类", en: "MISC", color: "brown", char: "拾", index: 99 },
        items: extra
      });
    }

    if (!groups.length) {
      els.theme.shelves.innerHTML = "";
      els.theme.empty.hidden = false;
    } else {
      els.theme.empty.hidden = true;
      var delay = 0;
      els.theme.shelves.innerHTML = groups.map(function (group) {
        var cards = group.items.map(function (item) {
          var html = themeCardHTML(item, Math.min(delay, 360));
          delay += 30;
          return html;
        }).join("");
        return (
          '<section class="shelf" id="shelf-' + esc(group.theme.name) + '">' +
            '<div class="shelf-divider">' +
              "<div>" +
                '<span class="shelf-no">' + String(group.theme.index + 1).padStart(2, "0") + "</span>" +
                "<h2>" + esc(group.theme.name) + "</h2>" +
                "<em>" + esc(group.theme.en) + "</em>" +
              "</div>" +
              "<strong>" + group.items.length + " 则</strong>" +
            "</div>" +
            '<div class="excerpt-grid">' + cards + "</div>" +
          "</section>"
        );
      }).join("");
    }

    els.theme.count.textContent = list.length;
    var filtering = Boolean(themeState.q.trim()) || themeState.theme !== "all" ||
      themeState.type !== "all" || themeState.author !== "all" || themeState.fav !== "all";
    els.theme.clears.forEach(function (button) { button.hidden = !filtering; });
  }

  function renderThemeOptions() {
    var themeSelect = els.theme.theme;
    themeSelect.innerHTML = '<option value="all">全部主题</option>' + themes.map(function (theme) {
      return '<option value="' + esc(theme.name) + '">' + esc(theme.name) + "</option>";
    }).join("");
    themeSelect.value = themeState.theme;
    setOptions(els.theme.author, uniqueAuthors(all), "全部作者", themeState.author);
  }

  function resetThemeFilters() {
    themeState.q = "";
    themeState.theme = "all";
    themeState.type = "all";
    themeState.author = "all";
    themeState.fav = "all";
    themeState.sort = "newest";
    els.theme.search.value = "";
    els.theme.theme.value = "all";
    els.theme.type.value = "all";
    els.theme.author.value = "all";
    els.theme.fav.value = "all";
    els.theme.sort.value = "newest";
    renderThemes();
  }

  /* ---------- stats / today ---------- */

  function renderStats() {
    var uniqueBookNames = new Set(books.map(function (item) { return item.book; })).size;
    var uniqueFilmNames = new Set(films.map(function (item) { return item.book; })).size;
    var themeCount = new Set(all.reduce(function (acc, item) { return acc.concat(themesOf(item)); }, [])).size;
    setAll("[data-stat-books]", uniqueBookNames);
    setAll("[data-stat-book-lines]", books.length);
    setAll("[data-stat-works]", uniqueFilmNames);
    setAll("[data-stat-lines]", films.length);
    setAll("[data-stat-all]", all.length);
    setAll("[data-stat-theme-count]", themeCount);
    setAll("[data-book-count]", uniqueBookNames);
    setAll("[data-book-total]", books.length);
  }

  function setAll(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function updateTodayFav() {
    if (!todayEntry) return;
    var faved = favorites.has(todayEntry.id);
    els.today.fav.textContent = faved ? "已收藏 · 取消" : "收藏此页";
    els.today.fav.classList.toggle("is-faved", faved);
  }

  function renderToday() {
    if (!todayEntry) return;
    var item = todayEntry;
    var theme = S.themeOf(themesOf(item)[0]);
    els.today.card.className = "today-card is-" + theme.color;
    els.today.label.textContent = "今日书摘 · " + (countryOf(item) || "BOOK");
    els.today.quote.textContent = item.quote;
    els.today.source.textContent = sourceOf(item);
    els.today.note.textContent = translationOf(item);
    els.today.note.hidden = !translationOf(item);
    els.today.char.textContent = theme.char;
    els.today.no.textContent = "NO. " + (bookNumbering.get(item.book) || "00");
    els.today.title.textContent = item.book;
    updateTodayFav();
  }

  function pickToday() {
    var candidates = books.filter(function (item) { return item.featured; });
    if (!candidates.length) candidates = books;
    if (!candidates.length) return;
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    todayEntry = candidates[seed % candidates.length];
    renderToday();
  }

  function changeToday() {
    var candidates = books.filter(function (item) { return item.featured; });
    if (!candidates.length) candidates = books;
    if (!candidates.length) return;
    var pool = candidates.filter(function (item) { return item.id !== (todayEntry && todayEntry.id); });
    if (!pool.length) pool = candidates;
    todayEntry = pool[Math.floor(Math.random() * pool.length)];
    renderToday();
  }

  /* ---------- reader ---------- */

  function openReader(id, list) {
    var base = (list && list.length ? list : all).slice();
    var index = base.findIndex(function (item) { return item.id === id; });
    if (index === -1) {
      base = all.slice().sort(byNewest);
      index = base.findIndex(function (item) { return item.id === id; });
    }
    if (index === -1) return;

    readerList = base;
    readerIndex = index;
    renderReader();
    els.reader.root.hidden = false;
    document.body.classList.add("is-reading");
    els.reader.sheet.focus({ preventScroll: true });
  }

  function readerMeta(item) {
    var parts = ["收录 " + S.formatDate(item.date)];
    if (typeOf(item) === "film") {
      if (item.medium) parts.push(item.medium);
      if (item.year) parts.push(item.year);
      if (countryOf(item)) parts.push(countryOf(item));
    } else {
      if (item.publisher) parts.push(item.publisher);
      if (item.year) parts.push(item.year);
    }
    if (item.chapter) parts.push(item.chapter);
    parts.push("第 " + (readerIndex + 1) + " / " + readerList.length + " 则");
    return parts.join(" · ");
  }

  function renderReader() {
    var item = readerList[readerIndex];
    if (!item) return;
    var theme = S.themeOf(themesOf(item)[0]);
    var no = numbering.get(item.id) || "00";
    var root = els.reader.root;

    root.className = "reader is-" + theme.color;
    els.reader.rail.textContent = "拾页 · 摘录 NO. " + no;
    els.reader.theme.textContent = theme.name + " · " + theme.en;
    els.reader.quote.textContent = item.quote;
    els.reader.source.textContent = sourceOf(item);
    els.reader.note.textContent = translationOf(item);
    els.reader.note.parentElement.hidden = !translationOf(item);
    els.reader.meta.textContent = readerMeta(item);

    var faved = favorites.has(item.id);
    els.reader.fav.textContent = faved ? "已收藏" : "收藏此页";
    els.reader.fav.classList.toggle("is-active", faved);
    els.reader.prev.disabled = readerList.length < 2;
    els.reader.next.disabled = readerList.length < 2;
  }

  function stepReader(direction) {
    if (readerList.length < 2) return;
    readerIndex = (readerIndex + direction + readerList.length) % readerList.length;
    renderReader();
    els.reader.sheet.scrollTop = 0;
  }

  function closeReader() {
    els.reader.root.hidden = true;
    document.body.classList.remove("is-reading");
  }

  function favorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    S.saveFavorites(favorites);
    updateFavMarks();
    if (todayEntry && todayEntry.id === id) updateTodayFav();
    if (!els.reader.root.hidden && readerList[readerIndex] && readerList[readerIndex].id === id) {
      renderReader();
    }
    if (themeState.fav === "fav") renderThemes();
  }

  function updateFavMarks() {
    document.querySelectorAll(".card-fav-mark").forEach(function (mark) {
      var link = mark.closest("[data-open]");
      if (link) mark.hidden = !favorites.has(link.getAttribute("data-open"));
    });
  }

  function copyCurrent() {
    var item = readerList[readerIndex];
    if (!item) return;
    var text = "“" + item.quote + "”\n—— " + sourceOf(item) + (translationOf(item) ? "\n\n译文：" + translationOf(item) : "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        S.toast("摘录已复制");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      S.toast("摘录已复制");
    } catch (error) {
      S.toast("复制失败，请手动选择文字");
    }
    document.body.removeChild(area);
  }

  /* ---------- events ---------- */

  var timers = {};
  function debounce(name, fn, wait) {
    clearTimeout(timers[name]);
    timers[name] = setTimeout(fn, wait);
  }

  els.book.search.addEventListener("input", function () {
    debounce("book", function () {
      bookState.q = els.book.search.value;
      bookLimit = 8;
      renderBooks();
    }, 120);
  });
  els.book.author.addEventListener("change", function () {
    bookState.author = els.book.author.value;
    bookLimit = 8;
    renderBooks();
  });
  els.book.era.addEventListener("change", function () {
    bookState.era = els.book.era.value;
    bookLimit = 8;
    renderBooks();
  });
  els.book.sort.addEventListener("change", function () {
    bookState.sort = els.book.sort.value;
    bookLimit = 8;
    renderBooks();
  });
  els.book.clears.forEach(function (button) {
    button.addEventListener("click", resetBookFilters);
  });
  els.book.more.addEventListener("click", function () {
    bookLimit += 8;
    renderBooks();
  });

  els.film.search.addEventListener("input", function () {
    debounce("film", function () {
      filmState.q = els.film.search.value;
      renderFilms();
    }, 120);
  });
  els.film.medium.addEventListener("change", function () {
    filmState.medium = els.film.medium.value;
    renderFilms();
  });
  els.film.director.addEventListener("change", function () {
    filmState.director = els.film.director.value;
    renderFilms();
  });
  els.film.region.addEventListener("change", function () {
    filmState.region = els.film.region.value;
    renderFilms();
  });
  els.film.sort.addEventListener("change", function () {
    filmState.sort = els.film.sort.value;
    renderFilms();
  });
  els.film.clears.forEach(function (button) {
    button.addEventListener("click", resetFilmFilters);
  });

  els.theme.search.addEventListener("input", function () {
    debounce("theme", function () {
      themeState.q = els.theme.search.value;
      renderThemes();
    }, 120);
  });
  ["theme", "type", "author", "fav"].forEach(function (key) {
    var select = els.theme[key];
    select.addEventListener("change", function () {
      themeState[key] = select.value;
      renderThemes();
    });
  });
  els.theme.sort.addEventListener("change", function () {
    themeState.sort = els.theme.sort.value;
    renderThemes();
  });
  els.theme.clears.forEach(function (button) {
    button.addEventListener("click", resetThemeFilters);
  });

  els.today.change.addEventListener("click", changeToday);
  els.today.open.addEventListener("click", function () {
    if (todayEntry) openReader(todayEntry.id, books);
  });
  els.today.fav.addEventListener("click", function () {
    if (todayEntry) favorite(todayEntry.id);
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-open]");
    if (!link) return;
    event.preventDefault();
    var id = link.getAttribute("data-open");
    var item = all.find(function (row) { return row.id === id; });
    if (!item) return;
    var view = viewFromHash();
    var list;
    if (typeOf(item) === "film") list = filmList();
    else if (view === "themes") list = themeList();
    else list = bookGroups().items;
    openReader(id, list);
  });

  document.querySelectorAll("[data-random]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!all.length) return;
      var item = all[Math.floor(Math.random() * all.length)];
      openReader(item.id, all);
    });
  });

  document.querySelectorAll("[data-reader-close]").forEach(function (node) {
    node.addEventListener("click", closeReader);
  });
  els.reader.prev.addEventListener("click", function () { stepReader(-1); });
  els.reader.next.addEventListener("click", function () { stepReader(1); });
  els.reader.fav.addEventListener("click", function () {
    var item = readerList[readerIndex];
    if (item) favorite(item.id);
  });
  els.reader.copy.addEventListener("click", copyCurrent);

  document.addEventListener("keydown", function (event) {
    if (!els.reader.root.hidden) {
      if (event.key === "Escape") closeReader();
      if (event.key === "ArrowLeft") stepReader(-1);
      if (event.key === "ArrowRight") stepReader(1);
      return;
    }
    var tag = (event.target.tagName || "").toLowerCase();
    if (event.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select") {
      var search = document.querySelector(".view:not([hidden]) input[type=search]");
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
  });

  window.addEventListener("hashchange", applyView);

  /* ---------- init ---------- */

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });

  renderStats();
  renderBookAuthors();
  renderBookEras();
  renderFilmOptions();
  renderThemeOptions();
  renderBooks();
  renderFilms();
  renderThemes();
  pickToday();
  applyView();
})();
