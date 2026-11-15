(function () {
  var S = window.SHIYE;
  var els = {
    hero: document.getElementById("workHero"),
    cover: document.getElementById("workCover"),
    eyebrow: document.getElementById("workEyebrow"),
    title: document.getElementById("workTitle"),
    meta: document.getElementById("workMeta"),
    count: document.getElementById("workCount"),
    themeCount: document.getElementById("workThemeCount"),
    span: document.getElementById("workSpan"),
    quotes: document.getElementById("workQuotes"),
    empty: document.getElementById("workEmpty")
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function metaOf(work) {
    var parts = [];
    if (work.type === "film") {
      if (work.author) parts.push("导演 " + work.author);
      if (work.publisher) parts.push(work.publisher);
    } else {
      if (work.author) parts.push(work.author);
      if (work.translator) parts.push("译 " + work.translator);
      if (work.publisher) parts.push(work.publisher);
      if (work.year) parts.push(work.year);
    }
    if (work.country) parts.push(work.country);
    if (work.era) parts.push(work.era);
    if (work.medium) parts.push(work.medium);
    if (work.isbn) parts.push("ISBN " + work.isbn);
    return parts.join(" · ");
  }

  function shortDate(value) {
    var date = String(value || "").slice(0, 10);
    return date ? date.replace(/-/g, ".") : "";
  }

  function quoteHTML(item, index) {
    var theme = S.themeOf(item.theme);
    var translation = String(item.translation || "").trim();
    return (
      '<article class="wp-quote">' +
        '<span class="wp-index">' + String(index + 1).padStart(2, "0") + "</span>" +
        '<div class="wp-quote-body">' +
          '<div class="wp-quote-top">' +
            '<span class="wp-chip">' + esc(theme && theme.name ? theme.name : "摘录") + "</span>" +
            '<span class="wp-chapter">' + esc(item.chapter || "") + "</span>" +
          "</div>" +
          "<blockquote>" + esc(item.quote) + "</blockquote>" +
          (translation ? '<p class="wp-trans"><span>译</span>' + esc(translation) + "</p>" : "") +
          '<p class="wp-date">收录于 ' + esc(shortDate(item.date)) + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function fail(message) {
    els.hero.hidden = true;
    els.quotes.innerHTML = "";
    els.empty.hidden = false;
    els.empty.textContent = message;
  }

  var id = new URLSearchParams(location.search).get("work");
  var work = id ? S.loadWorks().find(function (row) { return row.id === id; }) : null;
  if (!work) {
    fail("找不到这部作品，可能已被删除。");
    return;
  }

  var isFilm = work.type === "film";
  var items = S.loadExcerpts().filter(function (row) {
    return row.type === work.type && row.book === work.title;
  }).sort(function (a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  });

  document.title = "《" + work.title + "》摘录 · 拾页";
  els.eyebrow.textContent = isFilm ? "FILM · 影视台词" : "BOOK · 书籍摘录";
  els.title.textContent = "《" + work.title + "》";
  els.meta.textContent = metaOf(work);
  els.count.textContent = items.length;

  var themes = {};
  items.forEach(function (row) {
    var theme = S.themeOf(row.theme);
    if (theme && theme.name) themes[theme.name] = true;
  });
  els.themeCount.textContent = Object.keys(themes).length;

  var dates = items.map(function (row) { return String(row.date || "").slice(0, 4); })
    .filter(Boolean).sort();
  if (dates.length) {
    var first = dates[0];
    var last = dates[dates.length - 1];
    els.span.textContent = first === last ? first : first + "–" + last;
  }

  if (work.cover) {
    els.cover.innerHTML = '<img src="' + esc(work.cover) + '" alt="《' + esc(work.title) + "》封面\">";
  }

  els.hero.hidden = false;
  if (!items.length) {
    els.quotes.innerHTML = "";
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;
  els.quotes.innerHTML = items.map(quoteHTML).join("");
})();
