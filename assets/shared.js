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

  function themesOf(item) {
    var list = item && Array.isArray(item.themes) ? item.themes : [];
    if (!list.length && item && item.theme) list = [item.theme];
    var valid = list.filter(function (name) { return Boolean(THEME_MAP[name]); });
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

  function dedupeWorks(list) {
    var seen = new Map();
    list.forEach(function (item) {
      if (!item) return;
      var key = (item.type === "film" ? "film" : "book") + "::" + String(item.book || "");
      if (!seen.has(key)) {
        seen.set(key, item);
      } else if (item.featured && !seen.get(key).featured) {
        seen.set(key, item);
      }
    });
    return Array.from(seen.values());
  }

  function loadExcerpts() {
    var draft = readDraft();
    if (draft) return dedupeWorks(draft);
    return dedupeWorks(Array.isArray(global.EXCERPTS) ? global.EXCERPTS.slice() : []);
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
    return dedupeWorks(Array.isArray(global.EXCERPTS) ? global.EXCERPTS.slice() : []);
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

  var GH = { owner: "theRedElve", repo: "reading-notes", branch: "main", path: "data/excerpts.js" };
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

  function buildScript(list) {
    var stamp = new Date().toLocaleString("zh-CN", { hour12: false });
    return "/* 拾页 · 书摘数据\n * 由「全部内容」页导出于 " + stamp +
      "\n * 用本文件覆盖站点的 data/excerpts.js 即可发布。\n */\nwindow.EXCERPTS = " +
      JSON.stringify(list, null, 2) + ";\n";
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

  function publishExcerpts(list) {
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
            content: toBase64(buildScript(list)),
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
    formatDate: formatDate,
    todayISO: todayISO,
    loadExcerpts: loadExcerpts,
    loadTrash: loadTrash,
    saveTrash: saveTrash,
    addTrash: addTrash,
    TRASH_DAYS: TRASH_DAYS,
    getGhToken: getGhToken,
    setGhToken: setGhToken,
    publishExcerpts: publishExcerpts,
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
