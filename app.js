/* ============================================================
   Шпаргалка по ПМ.08 — клиентская логика (только экзамен).
   ============================================================ */

(function () {

  // -----------------------------------------------------------
  //  УТИЛИТЫ
  // -----------------------------------------------------------
  const $  = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const escapeAttr = (s = "") => String(s).replace(/"/g, "&quot;");

  // нормализованный текст для поиска (без HTML)
  const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").toLowerCase();
  };

  // -----------------------------------------------------------
  //  ШАБЛОНЫ КАРТОЧЕК (остались только тесты, открытые вопросы и практика)
  // -----------------------------------------------------------

  // SVG галочка для чекбокса
  const PICK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  // QA + блок кода (практика)
  function tplPractice(item, i, _offset, kind) {
    const dKind = kind || "practice";
    const lang = item.lang || "html";
    const codeHtml = `
      <div class="code-wrap">
        <button class="copy-btn" data-copy>Скопировать</button>
        <pre><code class="language-${lang}">${escapeHTMLForCode(item.code)}</code></pre>
      </div>
    `;
    const searchText = (item.q + " " + stripHtml(item.a) + " " + item.code).toLowerCase();
    return `
      <div class="qa" data-search="${escapeAttr(searchText)}" data-kind="${dKind}" data-idx="${i}">
        <div class="qa-head">
          <div class="qa-pick" data-pick title="Выбрать для экспорта">${PICK_SVG}</div>
          <div class="qa-num">${i + 1}</div>
          <div class="qa-title">${item.q}</div>
          <svg class="qa-toggle" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="qa-body">
          ${item.a}
          ${codeHtml}
        </div>
      </div>
    `;
  }

  // тест с подсветкой правильного варианта
  function tplTest(item, i, _offset, kind) {
    const letters = ["А", "Б", "В", "Г"];
    const opts = item.opts.map((opt, idx) => {
      const clean = opt.replace(/^[А-ГA-D]\)\s*/u, "");
      const isOk  = idx === item.correct;
      return `
        <div class="test-opt ${isOk ? "correct" : ""}">
          <div class="opt-letter">${letters[idx]}</div>
          <div>${clean}</div>
        </div>
      `;
    }).join("");

    const searchText = (item.q + " " + item.opts.join(" ") + " " + stripHtml(item.explain || "")).toLowerCase();

    return `
      <div class="qa" data-search="${escapeAttr(searchText)}" data-kind="${kind || "test"}" data-idx="${i}">
        <div class="qa-head">
          <div class="qa-pick" data-pick title="Выбрать для экспорта">${PICK_SVG}</div>
          <div class="qa-num">${i + 1}</div>
          <div class="qa-title">${item.q}</div>
          <svg class="qa-toggle" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="qa-body">
          <div class="test-opts">${opts}</div>
          ${item.explain ? `<div class="explain"><b>Пояснение.</b> ${item.explain}</div>` : ""}
        </div>
      </div>
    `;
  }

  // открытый вопрос
  function tplOpen(item, i, offset = 20, kind) {
    const searchText = (item.q + " " + stripHtml(item.a)).toLowerCase();
    return `
      <div class="qa" data-search="${escapeAttr(searchText)}" data-kind="${kind || "open"}" data-idx="${i}">
        <div class="qa-head">
          <div class="qa-pick" data-pick title="Выбрать для экспорта">${PICK_SVG}</div>
          <div class="qa-num">${i + 1 + offset}</div>
          <div class="qa-title">${item.q}</div>
          <svg class="qa-toggle" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="qa-body">${item.a}</div>
      </div>
    `;
  }

  // практическая работа экзамена (большая)
  function tplPracBig(item) {
    const blocks = (item.blocks || []).map((b) => {
      const lang = b.lang || "plain";
      return `
        <h4 style="margin:20px 0 6px;font-size:14.5px;color:var(--accent)">${b.title}</h4>
        <div class="code-wrap">
          <button class="copy-btn" data-copy>Скопировать</button>
          <pre><code class="language-${lang}">${escapeHTMLForCode(b.code)}</code></pre>
        </div>
      `;
    }).join("");

    return `
      <div class="practice">
        <h3>${item.title}</h3>
        <div class="muted">Часть 3. Практическая работа</div>
        <div class="req">${item.desc}</div>
        ${blocks}
        ${item.note ? `<div class="tip" style="margin-top:18px"><span class="ic">📌</span><div>${item.note}</div></div>` : ""}
      </div>
    `;
  }

  // экранирование для вставки кода в <pre><code>
  function escapeHTMLForCode(s = "") {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -----------------------------------------------------------
  //  РЕНДЕРИНГ СПИСКОВ
  // -----------------------------------------------------------
  function renderList(containerId, items, tpl, offset = 0, kind) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = items.map((it, i) => tpl(it, i, offset, kind)).join("");
  }

  function renderPracticeWrapper(containerId, prac, kind) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = `
      <div class="qa open" data-kind="${kind}" data-idx="0" data-search="${escapeAttr((prac.title + " " + stripHtml(prac.desc)).toLowerCase())}">
        <div class="qa-head">
          <div class="qa-pick" data-pick title="Выбрать для экспорта">${PICK_SVG}</div>
          <div class="qa-num">!</div>
          <div class="qa-title">${prac.title}</div>
        </div>
        <div class="qa-body">${tplPracBig(prac)}</div>
      </div>`;
  }

  function renderAll() {
    // Отрисовываем только экзаменационные варианты
    renderList("list-v1-tests", DATA.v1_tests, tplTest, 0,  "v1_tests");
    renderList("list-v1-open",  DATA.v1_open,  tplOpen, 20, "v1_open");
    renderPracticeWrapper("list-v1-prac", DATA.v1_prac, "v1_prac");

    renderList("list-v2-tests", DATA.v2_tests, tplTest, 0,  "v2_tests");
    renderList("list-v2-open",  DATA.v2_open,  tplOpen, 20, "v2_open");
    renderPracticeWrapper("list-v2-prac", DATA.v2_prac, "v2_prac");

    renderList("list-v3-tests", DATA.v3_tests, tplTest, 0,  "v3_tests");
    renderList("list-v3-open",  DATA.v3_open,  tplOpen, 20, "v3_open");
    renderPracticeWrapper("list-v3-prac", DATA.v3_prac, "v3_prac");

    // подсветка синтаксиса
    if (window.hljs) {
      $$("pre code").forEach((el) => {
        try { hljs.highlightElement(el); } catch (_) {}
      });
    }
  }

  // -----------------------------------------------------------
  //  ВЗАИМОДЕЙСТВИЕ С КАРТОЧКАМИ (delegated)
  // -----------------------------------------------------------
  document.addEventListener("click", (e) => {
    // раскрытие/сворачивание
    const head = e.target.closest(".qa-head");
    if (head && !e.target.closest("[data-copy]") && !e.target.closest("[data-pick]")) {
      head.parentElement.classList.toggle("open");
      return;
    }

    // копирование кода
    const btn = e.target.closest("[data-copy]");
    if (btn) {
      const code = btn.parentElement.querySelector("pre code");
      if (!code) return;
      const text = code.textContent;
      const done = () => {
        const prev = btn.textContent;
        btn.textContent = "✓ Скопировано";
        btn.classList.add("ok");
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove("ok");
        }, 1400);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
      return;
    }

    // toolbar: раскрыть/свернуть все в текущем разделе
    const tb = e.target.closest("[data-action]");
    if (tb) {
      const action = tb.dataset.action;
      const target = tb.dataset.target;
      const section = document.getElementById("sec-" + target);
      if (!section) return;
      const cards = $$(".qa", section);
      cards.forEach((c) => {
        if (action === "expand")   c.classList.add("open");
        if (action === "collapse") c.classList.remove("open");
      });
    }
  });

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
    done && done();
  }

  // -----------------------------------------------------------
  //  НАВИГАЦИЯ ПО РАЗДЕЛАМ
  // -----------------------------------------------------------
  function showSection(name) {
    $$(".section").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById("sec-" + name);
    if (target) target.classList.add("active");

    $$("#nav a").forEach((a) => {
      a.classList.toggle("active", a.dataset.section === name);
    });

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

    document.getElementById("sidebar")?.classList.remove("open");

    if (location.hash !== "#" + name) {
      history.replaceState(null, "", "#" + name);
    }
  }

  document.getElementById("nav")?.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-section]");
    if (!a) return;
    e.preventDefault();
    showSection(a.dataset.section);
  });

  // -----------------------------------------------------------
  //  ПОИСК
  // -----------------------------------------------------------
  const searchInput = document.getElementById("search");
  let searchTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  });

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    const cards = $$(".qa");

    if (!q) {
      cards.forEach((c) => c.classList.remove("hidden"));
      return;
    }

    let firstMatchSection = null;
    cards.forEach((c) => {
      const text = c.dataset.search || "";
      const hit  = text.includes(q);
      c.classList.toggle("hidden", !hit);
      if (hit && !firstMatchSection) {
        firstMatchSection = c.closest(".section");
      }
    });

    const active = $(".section.active");
    if (firstMatchSection && firstMatchSection !== active) {
      const id = firstMatchSection.id.replace(/^sec-/, "");
      showSection(id);
    }
  }

  // -----------------------------------------------------------
  //  МОБИЛЬНОЕ МЕНЮ
  // -----------------------------------------------------------
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  menuBtn?.addEventListener("click", () => sidebar.classList.toggle("open"));

  document.addEventListener("click", (e) => {
    if (window.innerWidth > 900) return;
    if (sidebar && !sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });

  // -----------------------------------------------------------
  //  ТЕМА
  // -----------------------------------------------------------
  const themeBtn  = document.getElementById("themeBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeLbl  = document.getElementById("themeLbl");

  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
    if (!themeIcon || !themeLbl) return;
    if (t === "light") {
      themeIcon.textContent = "☀";
      themeLbl.textContent  = "Тёмная тема";
    } else {
      themeIcon.textContent = "☾";
      themeLbl.textContent  = "Светлая тема";
    }
  };

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  themeBtn?.addEventListener("click", () => {
    const cur  = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next = cur === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  // -----------------------------------------------------------
  //  РЕЖИМ ВЫБОРА + ЭКСПОРТ В .DOCX
  // -----------------------------------------------------------
  const exportBar   = document.getElementById("exportBar");
  const exportCount = document.getElementById("exportCount");
  const exportBtn   = document.getElementById("exportBtn");
  const exportClear = document.getElementById("exportClear");

  function refreshExportBar() {
    if (!exportBar || !exportCount) return;
    const n = $$(".qa.picked").length;
    if (n > 0) {
      exportBar.classList.add("show");
      exportCount.textContent = "Выбрано: " + n;
    } else {
      exportBar.classList.remove("show");
    }
  }

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      e.stopPropagation();
      const card = pick.closest(".qa");
      card.classList.toggle("picked");
      refreshExportBar();
      return;
    }

    const tb = e.target.closest("[data-action='select-mode']");
    if (tb) {
      document.body.classList.toggle("select-mode");
      const on = document.body.classList.contains("select-mode");
      $$(".select-toggle").forEach((b) => b.classList.toggle("on", on));
      return;
    }

    const pa = e.target.closest("[data-action='pick-all']");
    if (pa) {
      if (!document.body.classList.contains("select-mode")) {
        document.body.classList.add("select-mode");
        $$(".select-toggle").forEach((b) => b.classList.add("on"));
      }
      const section = document.getElementById("sec-" + pa.dataset.target);
      if (!section) return;
      const cards = $$(".qa", section).filter((c) => !c.classList.contains("hidden"));
      const allPicked = cards.every((c) => c.classList.contains("picked"));
      cards.forEach((c) => c.classList.toggle("picked", !allPicked));
      pa.classList.toggle("on", !allPicked);
      refreshExportBar();
      return;
    }
  });

  exportClear?.addEventListener("click", () => {
    $$(".qa.picked").forEach((c) => c.classList.remove("picked"));
    $$(".pick-all").forEach((b) => b.classList.remove("on"));
    refreshExportBar();
  });

  exportBtn?.addEventListener("click", exportToDocx);

  /* =====================================================
     ЭКСПОРТ В WORD — ЧИСТОЕ ФОРМАТИРОВАНИЕ (только ПМ.08)
     ===================================================== */

  const KIND_MAP = {
    v1_tests:  () => DATA.v1_tests,
    v1_open:   () => DATA.v1_open,
    v1_prac:   () => [DATA.v1_prac],
    v2_tests:  () => DATA.v2_tests,
    v2_open:   () => DATA.v2_open,
    v2_prac:   () => [DATA.v2_prac],
    v3_tests:  () => DATA.v3_tests,
    v3_open:   () => DATA.v3_open,
    v3_prac:   () => [DATA.v3_prac]
  };

  const KIND_LABEL = {
    v1_tests: "Вариант 1 · тест",
    v1_open:  "Вариант 1 · открытый вопрос",
    v1_prac:  "Вариант 1 · практическая работа",
    v2_tests: "Вариант 2 · тест",
    v2_open:  "Вариант 2 · открытый вопрос",
    v2_prac:  "Вариант 2 · практическая работа",
    v3_tests: "Вариант 3 · тест",
    v3_open:  "Вариант 3 · открытый вопрос",
    v3_prac:  "Вариант 3 · практическая работа"
  };

  // экранирование текста для HTML
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // упростить HTML ответа для Word
  function cleanAnswerHtml(html) {
    if (!html) return "";
    return html
      .replace(/<pre[^>]*>\s*<code[^>]*>/gi,
        '<pre style="font-family:Consolas,monospace;font-size:10pt;background:#f5f6fa;border:0.75pt solid #d8dce6;padding:8pt 10pt;color:#1a1f2c;white-space:pre-wrap">')
      .replace(/<\/code>\s*<\/pre>/gi, '</pre>')
      .replace(/<code\s+class\s*=\s*["']inline["']\s*>/gi,
        '<span style="font-family:Consolas,monospace;font-size:10.5pt;background:#f1f3f8;padding:1pt 4pt;color:#5a3df0">')
      .replace(/<code(\s[^>]*)?>/gi,
        '<span style="font-family:Consolas,monospace;font-size:10.5pt;background:#f1f3f8;padding:1pt 4pt;color:#5a3df0">')
      .replace(/<\/code>/gi, '</span>')
      .replace(/<table\s+class\s*=\s*["']crit["']\s*>/gi,
        '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:10.5pt">');
  }

  // ---- Рендер одного вопроса по типу ----

  function renderTest(item, num, kindLabel) {
    const letters = ["А", "Б", "В", "Г"];
    const rows = item.opts.map((opt, idx) => {
      const cleanOpt = opt.replace(/^[А-ГA-D]\)\s*/u, "");
      const isOk = idx === item.correct;
      const bg = isOk ? "background:#d6f5e3;" : "background:#ffffff;";
      const weight = isOk ? "font-weight:bold;color:#0a6b3d;" : "color:#222;";
      const mark = isOk ? '<span style="float:right;color:#0a6b3d;font-weight:bold">✓ ВЕРНО</span>' : "";
      return `
<tr>
  <td width="36" style="${bg}border:0.5pt solid #c5cad6;text-align:center;font-weight:bold;color:#5a3df0;font-size:11pt">${letters[idx]}</td>
  <td style="${bg}border:0.5pt solid #c5cad6;${weight}font-size:11pt">${esc(cleanOpt)} ${mark}</td>
</tr>`;
    }).join("");

    return `
<h2 class="card-title">${esc(item.q)}</h2>
<p class="meta">${kindLabel} · №${num}</p>
<table class="test-table" border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin:6pt 0">
  ${rows}
</table>
${item.explain ? `<div class="explain-box"><b>Пояснение.</b> ${cleanAnswerHtml(item.explain)}</div>` : ""}
<hr class="card-end"/>`;
  }

  function renderOpen(item, num, kindLabel) {
    return `
<h2 class="card-title">${esc(item.q)}</h2>
<p class="meta">${kindLabel} · вопрос ${num}</p>
<div class="answer">${cleanAnswerHtml(item.a)}</div>
<hr class="card-end"/>`;
  }

  function renderPracBig(item, kindLabel) {
    const blocks = (item.blocks || []).map((b) => `
<p class="code-label">${esc(b.title)}</p>
<pre class="code-block">${esc(b.code)}</pre>`).join("");

    return `
<h2 class="card-title">${esc(item.title)}</h2>
<p class="meta">${kindLabel}</p>
<div class="answer">${cleanAnswerHtml(item.desc)}</div>
${blocks}
${item.note ? `<div class="note-box"><b>Заметка.</b> ${cleanAnswerHtml(item.note)}</div>` : ""}
<hr class="card-end"/>`;
  }

  // ---- Основная функция экспорта ----

  function exportToDocx() {
    const picked = $$(".qa.picked");
    if (!picked.length) return;

    const parts = picked.map((card) => {
      const kind = card.dataset.kind;
      const idx  = parseInt(card.dataset.idx, 10) || 0;
      const source = KIND_MAP[kind]?.();
      if (!source) return "";
      const item = source[idx];
      if (!item) return "";

      const label = KIND_LABEL[kind] || "";

      if (kind.endsWith("_tests")) return renderTest(item, idx + 1, label);
      if (kind.endsWith("_open"))  return renderOpen(item, idx + 1 + 20, label);
      if (kind.endsWith("_prac"))  return renderPracBig(item, label);
      return "";
    });

    const now = new Date().toLocaleDateString("ru-RU");
    const html = `
<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Шпаргалка ПМ.08</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  body { font-family: Calibri, "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.45; }
  h1   { font-family: Calibri, Arial, sans-serif; font-size: 22pt; color: #5a3df0; margin: 0 0 4pt; }
  .subtitle { color: #5b6477; font-size: 11pt; margin: 0 0 22pt; }
  .card-title {
    font-family: Calibri, Arial, sans-serif; font-size: 14pt; color: #1a1f2c;
    margin: 18pt 0 4pt; padding: 0 0 0 10pt; border-left: 4pt solid #5a3df0;
  }
  .meta { color: #8a93a6; font-size: 9pt; margin: 0 0 10pt; font-style: italic; }
  .answer p { margin: 4pt 0; }
  .answer ul, .answer ol { margin: 4pt 0 4pt 24pt; padding: 0; }
  .answer li { margin: 3pt 0; }
  .answer table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 10.5pt; }
  .answer table th, .answer table td { border: 0.5pt solid #c5cad6; padding: 4pt 6pt; }
  .code-label { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #5a3df0; font-weight: bold; margin: 10pt 0 2pt; }
  .code-block { font-family: Consolas, "Courier New", monospace; font-size: 10pt; background: #f5f6fa; border: 0.75pt solid #d8dce6; padding: 8pt 10pt; color: #1a1f2c; white-space: pre-wrap; margin: 4pt 0 8pt; }
  .test-table { width: 100%; border-collapse: collapse; }
  .explain-box { background: #f3efff; border-left: 3pt solid #5a3df0; padding: 8pt 12pt; margin: 8pt 0; font-size: 10.5pt; }
  .note-box { background: #fff9ef; border-left: 3pt solid #ffb86b; padding: 8pt 12pt; margin: 10pt 0; font-size: 10.5pt; }
  .card-end { border: 0; border-top: 0.75pt dashed #c5cad6; margin: 22pt 0 0; height: 0; }
</style>
</head>
<body>
  <h1>Шпаргалка по ПМ.08 / МДК.08.01</h1>
  <p class="subtitle">Выбрано материалов: ${picked.length} &nbsp;·&nbsp; ${now}</p>
  ${parts.join("\n")}
</body>
</html>`;

    if (window.htmlDocx && typeof window.htmlDocx.asBlob === "function") {
      try {
        const blob = window.htmlDocx.asBlob(html);
        triggerDownload(blob, "Шпаргалка_ПМ08.docx");
        return;
      } catch (err) {
        console.warn("html-docx-js failed, fallback to .doc:", err);
      }
    }

    const blob = new Blob(["﻿", html], { type: "application/msword" });
    triggerDownload(blob, "Шпаргалка_ПМ08.doc");
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // -----------------------------------------------------------
  //  PWA — Service Worker (оффлайн-режим)
  // -----------------------------------------------------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    });
  }

  // -----------------------------------------------------------
  //  СТАРТ
  // -----------------------------------------------------------
  renderAll();

  // начальный раздел — из хеша или home
  const initial = (location.hash || "").replace(/^#/, "") || "home";
  showSection(["home","v1","v2","v3","crit"].includes(initial) ? initial : "home");

})();