/* 拾页 · 公共数据与工具 */
(function (global) {
  "use strict";

  var THEMES = [
    { name: "自我", en: "SELF", color: "green", char: "自" },
    { name: "行动", en: "ACTION", color: "red", char: "行" },
    { name: "孤独", en: "SOLITUDE", color: "blue", char: "孤" },
    { name: "时间", en: "TIME", color: "brown", char: "时" },
    { name: "自由", en: "FREEDOM", color: "blue", char: "游" },
    { name: "读书", en: "READING", color: "brown", char: "读" },
    { name: "自然", en: "NATURE", color: "green", char: "山" },
    { name: "希望", en: "HOPE", color: "red", char: "望" }
  ];

  var THEME_MAP = {};
  THEMES.forEach(function (theme, index) {
    theme.index = index;
    THEME_MAP[theme.name] = theme;
  });

  var DRAFT_KEY = "shiye.draft.v1";
  var FAV_KEY = "shiye.favorites.v1";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function themeOf(name) {
    return THEME_MAP[name] || { name: name || "未分类", en: "NOTE", color: "brown", char: "拾", index: 99 };
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).replace(/-/g, ".");
  }

  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function loadExcerpts() {
    var draft = readDraft();
    if (draft) return draft;
    return Array.isArray(global.EXCERPTS) ? global.EXCERPTS.slice() : [];
  }

  function saveDraft(list) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function fileExcerpts() {
    return Array.isArray(global.EXCERPTS) ? global.EXCERPTS.slice() : [];
  }

  function download(filename, content, type) {
    var blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 600);
  }

  function toast(message) {
    var node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      node.classList.remove("is-visible");
    }, 2200);
  }

  function favorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
    } catch (error) {
      /* ignore */
    }
  }

  global.SHIYE = {
    THEMES: THEMES,
    THEME_MAP: THEME_MAP,
    DRAFT_KEY: DRAFT_KEY,
    FAV_KEY: FAV_KEY,
    esc: esc,
    themeOf: themeOf,
    formatDate: formatDate,
    todayISO: todayISO,
    loadExcerpts: loadExcerpts,
    fileExcerpts: fileExcerpts,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    readDraft: readDraft,
    download: download,
    toast: toast,
    favorites: favorites,
    saveFavorites: saveFavorites
  };
})(window);
