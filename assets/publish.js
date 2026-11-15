(function () {
  "use strict";

  var S = window.SHIYE;

  var els = {
    ghToken: document.getElementById("ghToken"),
    saveToken: document.getElementById("saveToken"),
    clearToken: document.getElementById("clearToken"),
    publishNow: document.getElementById("publishNow"),
    publishState: document.getElementById("publishState"),
    publishNote: document.getElementById("publishNote"),
    publishSummary: document.getElementById("publishSummary")
  };

  function renderSummary() {
    var list = S.loadExcerpts();
    var books = new Set();
    var films = new Set();
    list.forEach(function (item) {
      (item.type === "film" ? films : books).add(item.book);
    });
    els.publishSummary.textContent = "当前内容：" + books.size + " 本书 · " + films.size + " 部影视 · 共 " + list.length + " 则。";
  }

  function renderPublishState() {
    var connected = Boolean(S.getGhToken());
    els.publishState.textContent = connected ? "已连接 GitHub" : "未连接";
    els.ghToken.placeholder = connected ? "令牌已保存，输入新令牌可替换" : "github_pat_…";
    els.publishNote.textContent = connected
      ? "令牌已保存。确认网页效果无误后点「立即发布」，提交到 main 分支。"
      : "保存令牌后才能发布；令牌类型选 Fine-grained，仓库选 ReadingNotes，权限只需 Contents → Read and write。";
  }

  function publish(showToast) {
    els.publishState.textContent = "正在提交…";
    els.publishNote.textContent = "正在把本地内容提交到 GitHub…";
    return S.publishExcerpts(S.loadExcerpts()).then(function () {
      els.publishState.textContent = "已提交 · 约 1 分钟生效";
      els.publishNote.textContent = "已提交到 main 分支，GitHub Pages 通常 1 分钟内更新。";
      if (showToast) S.toast("已提交上线");
    }).catch(function (error) {
      els.publishState.textContent = "提交失败";
      els.publishNote.textContent = error.message;
      if (showToast) S.toast(error.message);
      throw error;
    });
  }

  els.saveToken.addEventListener("click", function () {
    var token = els.ghToken.value.trim();
    if (!token) {
      S.toast("请先粘贴 GitHub 令牌");
      els.ghToken.focus();
      return;
    }
    S.setGhToken(token);
    els.ghToken.value = "";
    renderPublishState();
    S.toast("令牌已保存，可以点「立即发布」提交上线");
  });

  els.clearToken.addEventListener("click", function () {
    S.setGhToken("");
    els.ghToken.value = "";
    renderPublishState();
    S.toast("已清除令牌，内容仍保存在本地草稿里");
  });

  els.publishNow.addEventListener("click", function () {
    if (!S.getGhToken()) {
      S.toast("请先保存 GitHub 令牌");
      els.ghToken.focus();
      return;
    }
    publish(true).catch(function () {});
  });

  renderSummary();
  renderPublishState();
})();
