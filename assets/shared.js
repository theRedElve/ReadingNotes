/* 拾页 · 公共数据与工具 */
(function (global) {
  "use strict";

  var THEMES = [
    { name: "自我", en: "SELF", color: "green", char: "自" },
    { name: "行动", en: "ACTION", color: "red", char: "行" },
    { name: "自由", en: "FREEDOM", color: "blue", char: "游" }
  ];

  var THEME_MAP = {};
  THEMES.forEach(function (theme, index) {
    theme.index = index;
    THEME_MAP[theme.name] = theme;
  });

  var DRAFT_KEY = "shiye.draft.v1";
  var FAV_KEY = "shiye.favorites.v1";
  var CUSTOM_THEME_KEY = "shiye.themes.v1";

  function loadCustomThemes() {
    try {
      var list = JSON.parse(localStorage.getItem(CUSTOM_THEME_KEY) || "[]");
      return Array.isArray(list) ? list.filter(function (name) { return typeof name === "string" && name.trim(); }) : [];
    } catch (error) {
      return [];
    }
  }

  function addCustomTheme(name) {
    var value = String(name || "").trim();
    if (!value || THEME_MAP[value] || loadCustomThemes().indexOf(value) !== -1) return false;
    var list = loadCustomThemes();
    list.push(value);
    try {
      localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(list));
    } catch (error) {
      return false;
    }
    return true;
  }

  function allThemes(extraNames) {
    var list = THEMES.slice();
    var seen = {};
    THEMES.forEach(function (theme) { seen[theme.name] = true; });
    loadCustomThemes().concat(Array.isArray(extraNames) ? extraNames : []).forEach(function (name) {
      var value = String(name || "").trim();
      if (!value || seen[value]) return;
      seen[value] = true;
      list.push({ name: value, en: "CUSTOM", color: "brown", char: value.charAt(0), index: 99 });
    });
    return list;
  }

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

  function themesOf(item) {
    var list = item && Array.isArray(item.themes) ? item.themes : [];
    if (!list.length && item && item.theme) list = [item.theme];
    var valid = list.filter(function (name) { return typeof name === "string" && name.trim(); });
    return valid.length ? valid : ["自我"];
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

  var TRASH_KEY = "shiye.trash.v1";
  var TRASH_DAYS = 7;

  function loadTrash() {
    try {
      var list = JSON.parse(localStorage.getItem(TRASH_KEY) || "[]");
      if (!Array.isArray(list)) return [];
      var cutoff = Date.now() - TRASH_DAYS * 86400000;
      var kept = list.filter(function (entry) {
        return entry && entry.item && new Date(entry.deletedAt).getTime() > cutoff;
      });
      if (kept.length !== list.length) {
        localStorage.setItem(TRASH_KEY, JSON.stringify(kept));
      }
      return kept;
    } catch (error) {
      return [];
    }
  }

  function saveTrash(list) {
    try {
      localStorage.setItem(TRASH_KEY, JSON.stringify(list));
    } catch (error) {
      /* ignore */
    }
  }

  function addTrash(item) {
    var list = loadTrash();
    list.unshift({ deletedAt: new Date().toISOString(), item: item });
    saveTrash(list);
  }

  var WORK_TRASH_KEY = "shiye.works-trash.v1";

  function loadWorkTrash() {
    try {
      var list = JSON.parse(localStorage.getItem(WORK_TRASH_KEY) || "[]");
      if (!Array.isArray(list)) return [];
      var cutoff = Date.now() - TRASH_DAYS * 86400000;
      var kept = list.filter(function (entry) {
        return entry && entry.work && new Date(entry.deletedAt).getTime() > cutoff;
      });
      if (kept.length !== list.length) {
        localStorage.setItem(WORK_TRASH_KEY, JSON.stringify(kept));
      }
      return kept;
    } catch (error) {
      return [];
    }
  }

  function saveWorkTrash(list) {
    try {
      localStorage.setItem(WORK_TRASH_KEY, JSON.stringify(list));
    } catch (error) {
      /* ignore */
    }
  }

  function addWorkTrash(work) {
    var list = loadWorkTrash();
    list.unshift({ deletedAt: new Date().toISOString(), work: work });
    saveWorkTrash(list);
  }

  var WORKS_KEY = "shiye.works.v1";

  function fileWorks() {
    return Array.isArray(global.WORKS) ? global.WORKS.slice() : [];
  }

  function workKey(item) {
    var title = String((item && (item.title || item.book)) || "").trim();
    return (item && item.type === "film" ? "film" : "book") + "::" + title;
  }

  function derivedWorkId(type, title) {
    var text = type + "::" + title;
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
    return "work-" + Math.abs(hash).toString(36);
  }

  function normalizeWork(work) {
    var type = work && work.type === "film" ? "film" : "book";
    var title = String((work && (work.title || work.book)) || "").trim();
    return {
      id: String((work && work.id) || "") || derivedWorkId(type, title),
      type: type,
      title: title,
      author: String((work && work.author) || "").trim(),
      publisher: String((work && work.publisher) || "").trim(),
      isbn: type === "book" ? String((work && work.isbn) || "").trim() : "",
      year: String((work && work.year) || "").trim(),
      country: String((work && work.country) || "").trim(),
      era: type === "book" ? String((work && work.era) || "").trim() : "",
      translator: type === "book" ? String((work && work.translator) || "").trim() : "",
      cover: String((work && work.cover) || ""),
      doubanTag: String((work && work.doubanTag) || "").trim(),
      whyThis: String((work && work.whyThis) || "").trim(),
      medium: type === "film" ? (work && work.medium === "剧集" ? "剧集" : "电影") : ""
    };
  }

  function readWorksDraft() {
    try {
      var parsed = JSON.parse(localStorage.getItem(WORKS_KEY) || "null");
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function loadWorks() {
    var base = readWorksDraft();
    if (!base) base = fileWorks();
    var list = base.map(normalizeWork).filter(function (work) { return work.title; });
    var seen = {};
    list.forEach(function (work) { seen[workKey(work)] = true; });

    loadExcerpts().forEach(function (item) {
      var work = normalizeWork({
        type: item.type,
        title: item.book,
        author: item.author,
        publisher: item.publisher,
        isbn: item.isbn,
        year: item.year,
        country: item.country,
        era: item.era,
        translator: item.translator,
        cover: item.cover,
        medium: item.medium
      });
      if (!work.title || seen[workKey(work)]) return;
      seen[workKey(work)] = true;
      list.push(work);
    });

    return list;
  }

  function saveWorks(list) {
    try {
      localStorage.setItem(WORKS_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearWorksDraft() {
    try {
      localStorage.removeItem(WORKS_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function upsertWork(work) {
    var next = normalizeWork(work);
    if (!next.title) return null;
    var list = loadWorks();
    var found = null;
    list = list.map(function (row) {
      if (workKey(row) !== workKey(next)) return row;
      found = normalizeWork(row);
      return {
        id: row.id,
        type: next.type,
        title: next.title,
        author: next.author || row.author,
        publisher: next.publisher || row.publisher,
        isbn: next.type === "book" ? (next.isbn || row.isbn) : "",
        year: next.year || row.year,
        country: next.country || row.country,
        era: next.type === "book" ? (next.era || row.era) : "",
        translator: next.type === "book" ? (next.translator || row.translator) : "",
        cover: next.cover || row.cover,
        doubanTag: next.doubanTag || row.doubanTag,
        whyThis: next.whyThis || row.whyThis,
        medium: next.type === "film" ? (next.medium || row.medium) : ""
      };
    });
    if (!found) {
      list.push(next);
      found = next;
    } else {
      found = list.find(function (row) { return workKey(row) === workKey(next); });
    }
    saveWorks(list);
    return found;
  }

  var GH = { owner: "theRedElve", repo: "ReadingNotes", branch: "main", path: "data/excerpts.js" };
  var GH_TOKEN_KEY = "shiye.gh.token.v1";

  function getGhToken() {
    try {
      return localStorage.getItem(GH_TOKEN_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function setGhToken(token) {
    try {
      if (token) localStorage.setItem(GH_TOKEN_KEY, token);
      else localStorage.removeItem(GH_TOKEN_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function buildScript(list, works) {
    var stamp = new Date().toLocaleString("zh-CN", { hour12: false });
    return "/* 拾页 · 书摘数据\n * 由管理台导出于 " + stamp +
      "\n * 用本文件覆盖站点的 data/excerpts.js 即可发布。\n */\nwindow.EXCERPTS = " +
      JSON.stringify(list, null, 2) + ";\n\nwindow.WORKS = " +
      JSON.stringify(works || loadWorks(), null, 2) + ";\n";
  }

  function toBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = "";
    for (var i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function ghError(status) {
    if (status === 401 || status === 403) return new Error("令牌无效，或没有 Contents 读写权限");
    if (status === 404) return new Error("找不到仓库或文件，请检查仓库名与分支");
    if (status === 409) return new Error("线上文件已被改动，请稍后重试");
    return new Error("GitHub 返回 " + status);
  }

  function publishExcerpts(list, works) {
    var token = getGhToken();
    if (!token) return Promise.reject(new Error("尚未保存 GitHub 令牌"));
    var api = "https://api.github.com/repos/" + GH.owner + "/" + GH.repo + "/contents/" + GH.path;
    var headers = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    return fetch(api + "?ref=" + GH.branch, { headers: headers })
      .then(function (response) {
        if (!response.ok) throw ghError(response.status);
        return response.json();
      })
      .then(function (info) {
        return fetch(api, {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            message: "chore: 更新摘录 " + new Date().toLocaleString("zh-CN", { hour12: false }),
            content: toBase64(buildScript(list, works)),
            sha: info.sha,
            branch: GH.branch
          })
        });
      })
      .then(function (response) {
        if (!response.ok) throw ghError(response.status);
        return response.json();
      });
  }

  global.SHIYE = {
    THEMES: THEMES,
    THEME_MAP: THEME_MAP,
    DRAFT_KEY: DRAFT_KEY,
    FAV_KEY: FAV_KEY,
    esc: esc,
    themeOf: themeOf,
    themesOf: themesOf,
    loadCustomThemes: loadCustomThemes,
    addCustomTheme: addCustomTheme,
    allThemes: allThemes,
    formatDate: formatDate,
    todayISO: todayISO,
    loadExcerpts: loadExcerpts,
    loadTrash: loadTrash,
    saveTrash: saveTrash,
    addTrash: addTrash,
    loadWorkTrash: loadWorkTrash,
    saveWorkTrash: saveWorkTrash,
    addWorkTrash: addWorkTrash,
    TRASH_DAYS: TRASH_DAYS,
    getGhToken: getGhToken,
    setGhToken: setGhToken,
    publishExcerpts: publishExcerpts,
    fileExcerpts: fileExcerpts,
    buildScript: buildScript,
    loadWorks: loadWorks,
    saveWorks: saveWorks,
    upsertWork: upsertWork,
    clearWorksDraft: clearWorksDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    readDraft: readDraft,
    download: download,
    toast: toast,
    favorites: favorites,
    saveFavorites: saveFavorites
  };
})(window);
