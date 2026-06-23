/* ============================================================
   Шпаргалка по ПМ.08 — клиентская логика.
   - Рендеринг карточек из DATA (см. data.js)
   - Переключение разделов
   - Поиск по вопросам
   - Раскрытие / сворачивание ответов
   - Копирование кода
   - Светлая / тёмная тема
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
  //  ШАБЛОНЫ КАРТОЧЕК
  // -----------------------------------------------------------

  // обычный QA-блок (теория)
  function tplQA(item, i) {
    const searchText = (item.q + " " + stripHtml(item.a)).toLowerCase();
    return `
      <div class="qa" data-search="${escapeAttr(searchText)}">
        <div class="qa-head">
          <div class="qa-num">${i + 1}</div>
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

  // QA + блок кода (практика)
  function tplPractice(item, i) {
    const lang = item.lang || "html";
    const codeHtml = `
      <div class="code-wrap">
        <button class="copy-btn" data-copy>Скопировать</button>
        <pre><code class="language-${lang}">${escapeHTMLForCode(item.code)}</code></pre>
      </div>
    `;
    const searchText = (item.q + " " + stripHtml(item.a) + " " + item.code).toLowerCase();
    return `
      <div class="qa" data-search="${escapeAttr(searchText)}">
        <div class="qa-head">
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
  function tplTest(item, i) {
    const letters = ["А", "Б", "В", "Г"];
    const opts = item.opts.map((opt, idx) => {
      // убираем "А) " в начале, если есть — букву покажем отдельно
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
      <div class="qa" data-search="${escapeAttr(searchText)}">
        <div class="qa-head">
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

  // открытый вопрос (с возможной вставкой кода внутри ответа)
  function tplOpen(item, i, offset = 20) {
    const searchText = (item.q + " " + stripHtml(item.a)).toLowerCase();
    return `
      <div class="qa" data-search="${escapeAttr(searchText)}">
        <div class="qa-head">
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
  function renderList(containerId, items, tpl, offset = 0) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = items.map((it, i) => tpl(it, i, offset)).join("");
  }

  function renderPracticeWrapper(containerId, prac) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = tplPracBig(prac);
  }

  function renderAll() {
    renderList("list-theory",   DATA.theory,   tplQA);
    renderList("list-practice", DATA.practice, tplPractice);

    renderList("list-v1-tests", DATA.v1_tests, tplTest);
    renderList("list-v1-open",  DATA.v1_open,  tplOpen, 20);
    renderPracticeWrapper("list-v1-prac", DATA.v1_prac);

    renderList("list-v2-tests", DATA.v2_tests, tplTest);
    renderList("list-v2-open",  DATA.v2_open,  tplOpen, 20);
    renderPracticeWrapper("list-v2-prac", DATA.v2_prac);

    renderList("list-v3-tests", DATA.v3_tests, tplTest);
    renderList("list-v3-open",  DATA.v3_open,  tplOpen, 20);
    renderPracticeWrapper("list-v3-prac", DATA.v3_prac);

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
    if (head && !e.target.closest("[data-copy]")) {
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
      // современный API + фолбэк
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

    // на мобильном — закрыть сайдбар
    document.getElementById("sidebar")?.classList.remove("open");

    // запомнить в hash
    if (location.hash !== "#" + name) {
      history.replaceState(null, "", "#" + name);
    }
  }

  document.getElementById("nav").addEventListener("click", (e) => {
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
  searchInput.addEventListener("input", () => {
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

    // если есть запрос — найдём первый раздел с совпадениями и переключимся на него
    let firstMatchSection = null;
    cards.forEach((c) => {
      const text = c.dataset.search || "";
      const hit  = text.includes(q);
      c.classList.toggle("hidden", !hit);
      if (hit && !firstMatchSection) {
        firstMatchSection = c.closest(".section");
      }
    });

    // если активный раздел не содержит совпадений — переключаемся
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

  // клик вне сайдбара — закрыть (mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 900) return;
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });

  // -----------------------------------------------------------
  //  ТЕМА (тёмная / светлая) — сохраняется в localStorage
  // -----------------------------------------------------------
  const themeBtn  = document.getElementById("themeBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeLbl  = document.getElementById("themeLbl");

  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
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

  themeBtn.addEventListener("click", () => {
    const cur  = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next = cur === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  // -----------------------------------------------------------
  //  СТАРТ
  // -----------------------------------------------------------
  renderAll();

  // начальный раздел — из хеша или home
  const initial = (location.hash || "").replace(/^#/, "") || "home";
  showSection(["home","theory","practice","v1","v2","v3","crit"].includes(initial) ? initial : "home");

})();
