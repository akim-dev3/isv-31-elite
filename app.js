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
  //  ПЕРЦЫ — ДАННЫЕ И ШАФФЛ
  // -----------------------------------------------------------
  const PERCI = [
    { id: "ilusha", name: "Илюша", nick: "Бурмалда", color: "#FFD700" },
    { id: "egor", name: "Егор", nick: "Блендер", color: "#FF6B35" },
    { id: "danya", name: "Даня", nick: "просто Даня", color: "#4DD0E1" },
    { id: "vanya", name: "Ваня", nick: "Инсульт", color: "#FF4444" },
    { id: "artem", name: "Артём", nick: "Чекушка", color: "#3DD68C" },
    { id: "izma", name: "Изма", nick: "Славянин", color: "#64B5F6" },
    { id: "vitya", name: "Витя", nick: "Еврей", color: "#BB86FC" },
    { id: "nikita", name: "Никита", nick: "Астма", color: "#29B6F6" },
    { id: "maxim", name: "Максим", nick: "дота 2", color: "#C8102E" },
    { id: "artem2", name: "Артём", nick: "Жид", color: "#B8860B" },
    { id: "danya2", name: "Даня", nick: "Анимешник", color: "#F06292" }
  ];

  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function shuffleSeeded(arr, seed) {
    const rng = mulberry32(seed);
    const r = [...arr];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

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

  // сборка HTML для превью практической работы
  function buildPreviewHtml(blocks) {
    let body = "";
    let css = "";
    (blocks || []).forEach((b) => {
      if (b.lang === "css") css += b.code + "\n";
      else if (b.lang === "html") body += b.code + "\n";
    });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css ? "<style>\n" + css + "</style>" : ""}</head><body>${body}</body></html>`;
  }

  // практическая работа экзамена (большая) с превью
  function tplPracBig(item) {
    const blocks = (item.blocks || []).map((b) => {
      const lang = b.lang || "plaintext";
      return `
        <h4 style="margin:20px 0 6px;font-size:14.5px;color:var(--accent)">${b.title}</h4>
        <div class="code-wrap">
          <button class="copy-btn" data-copy>Скопировать</button>
          <pre><code class="language-${lang}">${escapeHTMLForCode(b.code)}</code></pre>
        </div>
      `;
    }).join("");

    // Превью: сохраняем скомпилированный HTML и рендерим кнопку + iframe
    const hasCode = (item.blocks || []).some((b) => b.lang === "html" || b.lang === "css");
    let previewHtml = "";
    if (hasCode) {
      const pid = "prev-" + Math.random().toString(36).substr(2, 9);
      if (!window.__previewData) window.__previewData = {};
      window.__previewData[pid] = buildPreviewHtml(item.blocks);
      previewHtml = `
        <button class="prac-preview-toggle" data-preview-toggle="${pid}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Превью результата
        </button>
        <div class="prac-preview-frame" id="${pid}"><iframe></iframe></div>`;
    }

    return `
      <div class="practice">
        <h3>${item.title}</h3>
        <div class="muted">Часть 3. Практическая работа</div>
        <div class="req">${item.desc}</div>
        ${blocks}
        ${previewHtml}
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
    if (window.hljs) {
      $$("pre code").forEach((el) => {
        try { hljs.highlightElement(el); } catch (_) {}
      });
    }
  }

  const PERC_THEMES = {
    ilusha: {
      accent: "#D4AF37",
      accent2: "#fff2b8",
      pageBg: "linear-gradient(180deg,#fffdf0 0%,#fff6d6 100%)",
      pageBgDark: "linear-gradient(180deg,#1a1608 0%,#0e0b04 100%)",
      heroImg: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(15,10,0,.45),rgba(15,10,0,.75))",
      tagline: "Великий и могучий. Бурмалда изрекает истину.",
      symbol: "✦",
      titleFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
      correctLabel: "✦ бурмалда верно",
      varTitleSuffix: "Священное писание",
      memeCap: "АЛЛО ЭТО БОГ\nЯ В ШОКЕ",
      memeTag: "#бог",
      memeUrl: "https://media.giphy.com/media/ZmvcCtD8vOD6cHji9T/giphy.gif"
    },
    egor: {
      accent: "#FF6B35",
      accent2: "#ffb088",
      pageBg: "linear-gradient(180deg,#fff5ee 0%,#ffe6d4 100%)",
      pageBgDark: "linear-gradient(180deg,#0a0805 0%,#1a0e05 100%)",
      heroImg: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1600&q=80",
      heroOverlay: "linear-gradient(135deg,rgba(255,107,53,.65),rgba(10,8,5,.85))",
      tagline: "Перемешано до однородной массы",
      symbol: "⌬",
      titleFont: "'Russo One', 'JetBrains Mono', sans-serif",
      bodyFont: "'JetBrains Mono', Consolas, monospace",
      correctLabel: "▶ blended_ok",
      varTitleSuffix: "Render Layer",
      memeCap: "ВСЁ В МИКСЕР\nТРИ ЛЯМА",
      memeTag: "#блендер",
      memeUrl: "https://media.giphy.com/media/HFhEf6CQcKEQXNkoha/giphy.gif"
    },
    danya: {
      accent: "#4DD0E1",
      accent2: "#b2ebf2",
      pageBg: "linear-gradient(180deg,#fafdfe 0%,#f0fbfc 100%)",
      pageBgDark: "linear-gradient(180deg,#0a0e10 0%,#0a1416 100%)",
      heroImg: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(77,208,225,.15),rgba(10,14,16,.35))",
      tagline: "Минимализм. Без пафоса. Просто Даня.",
      symbol: "·",
      titleFont: "'Manrope', system-ui, sans-serif",
      bodyFont: "'Manrope', system-ui, sans-serif",
      correctLabel: "просто верно",
      varTitleSuffix: "Просто часть",
      memeCap: "БРАТ ТЫ ЧЁ\nЛЕГЕНДА",
      memeTag: "#простоданя",
      memeUrl: "https://media.giphy.com/media/fYbMLz812TTFm2qs7o/giphy.gif"
    },
    vanya: {
      accent: "#FF4444",
      accent2: "#ffb4b4",
      pageBg: "linear-gradient(180deg,#fff8f8 0%,#ffe9e9 100%)",
      pageBgDark: "linear-gradient(180deg,#150708 0%,#0a0405 100%)",
      heroImg: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1600&q=80",
      heroOverlay: "linear-gradient(135deg,rgba(255,68,68,.55),rgba(20,5,5,.85))",
      tagline: "ЭКГ нестабильна. Срочно ответ!",
      symbol: "✚",
      titleFont: "'Bebas Neue', 'Manrope', sans-serif",
      bodyFont: "'Manrope', sans-serif",
      correctLabel: "✚ диагноз верный",
      varTitleSuffix: "История болезни",
      memeCap: "ДОКТОР!\nЯ ВСЁ ПОНЯЛ",
      memeTag: "#инсульт",
      memeUrl: "https://media.giphy.com/media/Lacdhow6MzATtdNytw/giphy.gif"
    },
    artem: {
      accent: "#3DD68C",
      accent2: "#a8e6c1",
      pageBg: "linear-gradient(180deg,#fafaf2 0%,#f1f4e0 100%)",
      pageBgDark: "linear-gradient(180deg,#0a1108 0%,#06090a 100%)",
      heroImg: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(20,40,15,.65),rgba(10,15,8,.85))",
      tagline: "Граненая правда. 250 мл истины.",
      symbol: "✦",
      titleFont: "'Russo One', 'Bebas Neue', sans-serif",
      bodyFont: "'Manrope', sans-serif",
      correctLabel: "★ принято",
      varTitleSuffix: "Тираж",
      memeCap: "ПО ЧЕКУШКЕ\nИ НА ЭКЗАМЕН",
      memeTag: "#чекушка",
      memeUrl: "https://media.giphy.com/media/UqFr1fYiMq9r0uKry9/giphy.gif"
    },
    izma: {
      accent: "#64B5F6",
      accent2: "#bbdefb",
      pageBg: "linear-gradient(180deg,#f7faff 0%,#e3efff 100%)",
      pageBgDark: "linear-gradient(180deg,#08111a 0%,#040810 100%)",
      heroImg: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(8,30,60,.45),rgba(8,15,30,.85))",
      tagline: "Древний код предков. Истина славянская.",
      symbol: "❅",
      titleFont: "'Marck Script', 'Playfair Display', cursive",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
      correctLabel: "❅ истинно",
      varTitleSuffix: "Сказание",
      memeCap: "БРАТ ПО-РУССКИ\nТАК ИСТИННЕЕ",
      memeTag: "#славянин",
      memeUrl: "https://media.giphy.com/media/ekVeEZFN9a5eIG8hNv/giphy.gif"
    },
    vitya: {
      accent: "#BB86FC",
      accent2: "#e1bee7",
      pageBg: "linear-gradient(180deg,#fbf8ff 0%,#efe4ff 100%)",
      pageBgDark: "linear-gradient(180deg,#10081a 0%,#080410 100%)",
      heroImg: "https://images.unsplash.com/photo-1552423314-cf29ab68ad7c?w=1600&q=80",
      heroOverlay: "linear-gradient(135deg,rgba(70,30,120,.55),rgba(15,8,30,.85))",
      tagline: "Мудрость веков. Чёткая выгода.",
      symbol: "✡",
      titleFont: "'Cormorant Garamond', 'Playfair Display', serif",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
      correctLabel: "✡ премудро верно",
      varTitleSuffix: "Свиток",
      memeCap: "Я НЕ ЕВРЕЙ\nЯ БИЗНЕСМЕН",
      memeTag: "#бизнес",
      memeUrl: "https://media.giphy.com/media/JTPzqSpIOYeteuzPhV/giphy.gif"
    },
    nikita: {
      accent: "#29B6F6",
      accent2: "#b3e5fc",
      pageBg: "linear-gradient(180deg,#f0f9ff 0%,#e1f5fe 100%)",
      pageBgDark: "linear-gradient(180deg,#04141f 0%,#02080f 100%)",
      heroImg: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(0,40,80,.35),rgba(0,40,80,.85))",
      tagline: "Глубокий вдох. Долгий выдох. Все ответы.",
      symbol: "༄",
      titleFont: "'Bebas Neue', 'Manrope', sans-serif",
      bodyFont: "'Manrope', sans-serif",
      correctLabel: "༄ дыхание норм",
      varTitleSuffix: "Карта симптомов",
      memeCap: "ВДОХ-ВЫДОХ\nПОЕХАЛИ",
      memeTag: "#астма",
      memeUrl: "https://media.giphy.com/media/W1AzNrz8NkeN9LJvW5/giphy.gif"
    },
    maxim: {
      accent: "#C8102E",
      accent2: "#ffd700",
      pageBg: "linear-gradient(180deg,#1a0608 0%,#2a0a0f 100%)",
      pageBgDark: "linear-gradient(180deg,#0a0204 0%,#1a0508 100%)",
      heroImg: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80",
      heroOverlay: "linear-gradient(135deg,rgba(200,16,46,.55),rgba(0,0,0,.85))",
      tagline: "GG WP. Радиант наносит ответы.",
      symbol: "⚔",
      titleFont: "'Russo One', 'Bebas Neue', sans-serif",
      bodyFont: "'Russo One', 'Manrope', sans-serif",
      correctLabel: "⚔ KILLED IT",
      varTitleSuffix: "Match Replay",
      memeCap: "AEGIS ВЗЯТ\nGG WP",
      memeTag: "#дота2",
      memeUrl: "https://media.giphy.com/media/kg8p6Se4UZo5Ooc0on/giphy.gif"
    },
    artem2: {
      accent: "#B8860B",
      accent2: "#fff3c4",
      pageBg: "linear-gradient(180deg,#fff8e1 0%,#fff0b8 100%)",
      pageBgDark: "linear-gradient(180deg,#1a1408 0%,#0a0804 100%)",
      heroImg: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(40,25,5,.55),rgba(20,10,2,.9))",
      tagline: "Древний свиток мудрости и торговли.",
      symbol: "✡",
      titleFont: "'Cormorant Garamond', serif",
      bodyFont: "'Cormorant Garamond', Georgia, serif",
      correctLabel: "✡ ПРИНЯТО",
      varTitleSuffix: "Свиток торы",
      memeCap: "ТРАМ-ПАМ-ПАМ\nТРАМ-ПАМ-ПАМ",
      memeTag: "#торгуем",
      memeUrl: "https://media.giphy.com/media/C4imCg5z1rb8PaIcfj/giphy.gif"
    },
    danya2: {
      accent: "#F06292",
      accent2: "#ffc1d6",
      pageBg: "linear-gradient(180deg,#fff5fa 0%,#ffe1ed 100%)",
      pageBgDark: "linear-gradient(180deg,#1a0a14 0%,#0a040a 100%)",
      heroImg: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&q=80",
      heroOverlay: "linear-gradient(180deg,rgba(150,40,90,.35),rgba(40,10,30,.85))",
      tagline: "Каваий-десу! Сэнсэй знает ответы!",
      symbol: "✿",
      titleFont: "'Caveat', cursive",
      bodyFont: "'Manrope', sans-serif",
      correctLabel: "✿ субаращии",
      varTitleSuffix: "Арка",
      memeCap: "БРАТ ЭТО АНИМЕ\nА Я СЭНСЭЙ",
      memeTag: "#аниме",
      memeUrl: "https://media.giphy.com/media/Yx7WARywsZiL1MZmoF/giphy.gif"
    }
  };

  function buildMemeBlock(perc, theme) {
    const memeUrl = theme.memeUrl || "";
    const fallback = `https://placehold.co/640x480/000000/${(theme.accent || "#fff").replace("#", "")}.png?text=${encodeURIComponent("МЕЛСТРОЙ\n" + perc.nick.toUpperCase())}&font=oswald`;
    return `
      <div class="p-meme">
        <img class="p-meme-img" src="${memeUrl}" alt="Мем с Мелстроем · ${escapeAttr(perc.name)}" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"/>
      </div>`;
  }

  function buildThemeCss(id, t) {
    return `
      [data-perc-theme="${id}"]{
        --p-accent:${t.accent};
        --p-accent2:${t.accent2};
        --p-title-font:${t.titleFont};
        --p-body-font:${t.bodyFont};
        background:${t.pageBg};
        margin:-36px -44px 0;
        padding:0 44px 60px;
        font-family:var(--p-body-font);
        color:#1a1612;
      }
      [data-theme="dark"] [data-perc-theme="${id}"]{
        background:${t.pageBgDark};
        color:#f0ebe0;
      }
      @media (max-width:900px){
        [data-perc-theme="${id}"]{margin:-60px -18px 0;padding:0 18px 60px}
      }
      [data-perc-theme="${id}"] .p-hero{
        position:relative;height:340px;border-radius:24px;overflow:hidden;
        margin-top:36px;
        background-image:${t.heroOverlay}, url('${t.heroImg}');
        background-size:cover;background-position:center;
        display:grid;place-items:center;text-align:center;color:#fff;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
      }
      [data-perc-theme="${id}"] .p-hero-symbol{
        font-size:54px;color:${t.accent2};text-shadow:0 0 30px rgba(0,0,0,.6);margin-bottom:6px;
      }
      [data-perc-theme="${id}"] .p-hero-name{
        font-family:var(--p-title-font);font-size:72px;font-weight:800;
        margin:0;letter-spacing:2px;line-height:1;text-shadow:0 4px 30px rgba(0,0,0,.7);
      }
      [data-perc-theme="${id}"] .p-hero-nick{
        color:${t.accent};font-family:var(--p-title-font);font-size:30px;font-style:italic;
        margin-top:8px;text-shadow:0 2px 14px rgba(0,0,0,.7);
      }
      [data-perc-theme="${id}"] .p-hero-tag{
        margin-top:14px;font-size:16px;opacity:.92;max-width:560px;
      }
      [data-perc-theme="${id}"] .p-section-title{
        font-family:var(--p-title-font);color:${t.accent};
        font-size:22px;margin:28px 0 10px;font-weight:700;
        display:flex;align-items:center;gap:10px;
      }
      [data-perc-theme="${id}"] .p-section-title::before{
        content:"${t.symbol}";color:${t.accent};font-size:24px;
      }
      [data-perc-theme="${id}"] .perc-variant-header{
        background:rgba(255,255,255,.5);
        border:1px solid ${t.accent2};
        border-left:6px solid ${t.accent};
        border-radius:14px;margin:30px 0 14px;font-family:var(--p-title-font);
      }
      [data-theme="dark"] [data-perc-theme="${id}"] .perc-variant-header{
        background:rgba(20,16,10,.6);border-color:${t.accent}55;
      }
      [data-perc-theme="${id}"] .perc-variant-header .var-num{
        background:${t.accent};color:#fff;font-family:var(--p-title-font);
      }
      [data-perc-theme="${id}"] .perc-variant-header .var-title{
        font-family:var(--p-title-font);color:#2a1f10;font-size:18px;
      }
      [data-theme="dark"] [data-perc-theme="${id}"] .perc-variant-header .var-title{color:#f0ebe0}
      [data-perc-theme="${id}"] .perc-variant-header .var-arrow{color:${t.accent}}
      ${themeQaCss(id, t)}
    `;
  }

  function themeQaCss(id, t) {
    if (id === "ilusha") {
      return `
        [data-perc-theme="ilusha"] .qa{
          background:linear-gradient(180deg,#fffef9,#fff6d6);
          border:1.5px solid #d4af37;border-radius:6px;
          box-shadow:0 4px 24px rgba(212,175,55,.18);
          position:relative;
        }
        [data-theme="dark"] [data-perc-theme="ilusha"] .qa{
          background:linear-gradient(180deg,#1f1808,#15100a);color:#f5e9c0;
        }
        [data-perc-theme="ilusha"] .qa-num{
          background:radial-gradient(circle,#ffd700,#b8860b);color:#fff;border-radius:50%;
          font-family:'Playfair Display',serif;box-shadow:0 0 16px rgba(255,215,0,.5);
        }
        [data-perc-theme="ilusha"] .qa-title{font-family:'Playfair Display',serif;font-weight:700;color:#3a2a08}
        [data-theme="dark"] [data-perc-theme="ilusha"] .qa-title{color:#f5e9c0}
        [data-perc-theme="ilusha"] .test-opt{background:#fffef9;border:1px solid #e8d99a;border-radius:4px}
        [data-theme="dark"] [data-perc-theme="ilusha"] .test-opt{background:#1a1408;border-color:#3a2a10;color:#e8dca8}
        [data-perc-theme="ilusha"] .test-opt .opt-letter{background:#fff6d6;color:#b8860b;border-radius:50%;font-family:serif}
        [data-perc-theme="ilusha"] .test-opt.correct{background:linear-gradient(90deg,#fff2b8,#ffe680);border-color:#d4af37}
        [data-perc-theme="ilusha"] .test-opt.correct .opt-letter{background:radial-gradient(circle,#ffd700,#b8860b);color:#fff}
        [data-perc-theme="ilusha"] .test-opt.correct::after{content:"${t.correctLabel}";color:#b8860b;font-family:'Playfair Display',serif;font-style:italic;font-weight:700}
        [data-perc-theme="ilusha"] .explain{background:rgba(212,175,55,.12);border-left-color:#d4af37;color:#3a2a08;font-family:'Cormorant Garamond',serif;font-size:15px}
        [data-theme="dark"] [data-perc-theme="ilusha"] .explain{color:#f5e9c0}
        [data-perc-theme="ilusha"] .practice{background:linear-gradient(180deg,#fffef9,#fff6d6);border:2px solid #d4af37;border-radius:8px}
        [data-theme="dark"] [data-perc-theme="ilusha"] .practice{background:linear-gradient(180deg,#1f1808,#15100a)}
        [data-perc-theme="ilusha"] .practice h3{font-family:'Playfair Display',serif;color:#b8860b;font-size:22px;text-align:center}
      `;
    }
    if (id === "egor") {
      return `
        [data-perc-theme="egor"] .qa{
          background:#181410;border:1px solid #3a2a1a;border-radius:0;
          border-left:4px solid #FF6B35;color:#ffe0c2;
          font-family:'JetBrains Mono',monospace;
          position:relative;
        }
        [data-theme="dark"] [data-perc-theme="egor"] .qa{background:#0a0805}
        [data-perc-theme="egor"] .qa-num{
          background:#FF6B35;color:#0a0805;border-radius:0;
          font-family:'JetBrains Mono',monospace;font-weight:700;
        }
        [data-perc-theme="egor"] .qa-title{font-family:'JetBrains Mono',monospace;color:#ffd9b0;font-size:14.5px}
        [data-perc-theme="egor"] .test-opt{background:#0e0a05;border:1px solid #2a1f10;border-radius:0;color:#ffd9b0;font-family:'JetBrains Mono',monospace;font-size:13px}
        [data-perc-theme="egor"] .test-opt .opt-letter{background:#1a120a;color:#FF6B35;border-radius:0;border:1px solid #3a2a1a;font-family:'JetBrains Mono',monospace}
        [data-perc-theme="egor"] .test-opt.correct{background:rgba(255,107,53,.15);border-color:#FF6B35}
        [data-perc-theme="egor"] .test-opt.correct .opt-letter{background:#FF6B35;color:#0a0805}
        [data-perc-theme="egor"] .test-opt.correct::after{content:"${t.correctLabel}";color:#FF6B35;font-family:'JetBrains Mono',monospace;font-weight:700}
        [data-perc-theme="egor"] .explain{background:rgba(255,107,53,.1);border-left-color:#FF6B35;color:#ffd9b0;font-family:'JetBrains Mono',monospace;font-size:12.5px;border-radius:0}
        [data-perc-theme="egor"] .practice{background:#0e0a05;border:1px solid #FF6B35;border-radius:0;color:#ffe0c2}
        [data-perc-theme="egor"] .practice h3{font-family:'Russo One',sans-serif;color:#FF6B35;text-transform:uppercase;letter-spacing:2px}
      `;
    }
    if (id === "danya") {
      return `
        [data-perc-theme="danya"] .qa{
          background:#ffffff;border:none;border-bottom:1px solid #e0f0f2;
          border-radius:0;box-shadow:none;
          padding:0;
        }
        [data-theme="dark"] [data-perc-theme="danya"] .qa{background:transparent;border-bottom-color:#1a2a2e}
        [data-perc-theme="danya"] .qa-head{padding:18px 0}
        [data-perc-theme="danya"] .qa-num{
          background:transparent;color:#4DD0E1;border-radius:0;font-weight:300;font-size:14px;
        }
        [data-perc-theme="danya"] .qa-title{font-weight:400;color:#1a3a40;font-size:15px}
        [data-theme="dark"] [data-perc-theme="danya"] .qa-title{color:#d4f0f4}
        [data-perc-theme="danya"] .qa-body{border-top:none;padding:0 0 18px}
        [data-perc-theme="danya"] .test-opt{background:#f7fcfd;border:1px solid #e0f0f2;border-radius:2px;font-size:13.5px}
        [data-theme="dark"] [data-perc-theme="danya"] .test-opt{background:#0d1518;border-color:#1a2a2e;color:#d4f0f4}
        [data-perc-theme="danya"] .test-opt .opt-letter{background:transparent;color:#4DD0E1;font-weight:400}
        [data-perc-theme="danya"] .test-opt.correct{background:#e0f7fa;border-color:#4DD0E1}
        [data-perc-theme="danya"] .test-opt.correct .opt-letter{background:#4DD0E1;color:#fff}
        [data-perc-theme="danya"] .test-opt.correct::after{content:"${t.correctLabel}";color:#0097a7;font-weight:400}
        [data-perc-theme="danya"] .explain{background:#f0fbfc;border-left-color:#4DD0E1;color:#1a3a40;border-radius:2px}
        [data-theme="dark"] [data-perc-theme="danya"] .explain{color:#d4f0f4;background:#0d1518}
        [data-perc-theme="danya"] .practice{background:#ffffff;border:1px solid #e0f0f2;border-radius:2px;box-shadow:none}
        [data-theme="dark"] [data-perc-theme="danya"] .practice{background:#0a1416}
        [data-perc-theme="danya"] .practice h3{font-weight:400;color:#0097a7;font-size:17px}
      `;
    }
    if (id === "vanya") {
      return `
        [data-perc-theme="vanya"] .qa{
          background:#ffffff;border:1px solid #ffcccc;
          border-radius:2px;box-shadow:0 2px 8px rgba(255,68,68,.08);
          position:relative;overflow:hidden;
        }
        [data-theme="dark"] [data-perc-theme="vanya"] .qa{background:#1a0808;border-color:#3a1010;color:#ffcccc}
        [data-perc-theme="vanya"] .qa::before{
          content:"";position:absolute;top:0;left:0;right:0;height:3px;
          background:repeating-linear-gradient(90deg,#FF4444 0 8px,transparent 8px 16px);
        }
        [data-perc-theme="vanya"] .qa-num{
          background:#FF4444;color:#fff;border-radius:50%;font-family:'Bebas Neue',sans-serif;font-size:16px;
          box-shadow:0 0 12px rgba(255,68,68,.4);
        }
        [data-perc-theme="vanya"] .qa-title{font-family:'Bebas Neue','Manrope',sans-serif;font-size:18px;letter-spacing:.5px;color:#7a0e0e;text-transform:uppercase}
        [data-theme="dark"] [data-perc-theme="vanya"] .qa-title{color:#ffcccc}
        [data-perc-theme="vanya"] .test-opt{background:#fff8f8;border:1px solid #ffcccc;border-radius:2px}
        [data-theme="dark"] [data-perc-theme="vanya"] .test-opt{background:#150505;border-color:#3a1010;color:#ffcccc}
        [data-perc-theme="vanya"] .test-opt .opt-letter{background:#ffe5e5;color:#FF4444;border-radius:2px;font-family:'Bebas Neue',sans-serif}
        [data-perc-theme="vanya"] .test-opt.correct{background:#ffeded;border-color:#FF4444}
        [data-perc-theme="vanya"] .test-opt.correct .opt-letter{background:#FF4444;color:#fff}
        [data-perc-theme="vanya"] .test-opt.correct::after{content:"${t.correctLabel}";color:#FF4444;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:13px}
        [data-perc-theme="vanya"] .explain{background:rgba(255,68,68,.08);border-left-color:#FF4444;color:#7a0e0e}
        [data-theme="dark"] [data-perc-theme="vanya"] .explain{color:#ffcccc}
        [data-perc-theme="vanya"] .practice{background:#fff;border:1px solid #FF4444;border-radius:2px}
        [data-theme="dark"] [data-perc-theme="vanya"] .practice{background:#1a0808}
        [data-perc-theme="vanya"] .practice h3{font-family:'Bebas Neue',sans-serif;color:#FF4444;letter-spacing:2px;text-transform:uppercase;font-size:24px}
      `;
    }
    if (id === "artem") {
      return `
        [data-perc-theme="artem"] .qa{
          background:#fafaf2;border:2px solid #3DD68C;border-radius:0;
          box-shadow:4px 4px 0 #1f5a3a;position:relative;
        }
        [data-theme="dark"] [data-perc-theme="artem"] .qa{background:#0d1a10;color:#c8e6c8;box-shadow:4px 4px 0 #3DD68C}
        [data-perc-theme="artem"] .qa-num{
          background:#1f5a3a;color:#fafaf2;border-radius:0;
          font-family:'Russo One',sans-serif;border:2px solid #3DD68C;
        }
        [data-perc-theme="artem"] .qa-title{font-family:'Russo One','Manrope',sans-serif;color:#1f5a3a;font-size:15px;letter-spacing:.5px}
        [data-theme="dark"] [data-perc-theme="artem"] .qa-title{color:#c8e6c8}
        [data-perc-theme="artem"] .test-opt{background:#fff;border:1.5px solid #3DD68C;border-radius:0;font-family:'Manrope',sans-serif}
        [data-theme="dark"] [data-perc-theme="artem"] .test-opt{background:#080f0a;border-color:#1f5a3a;color:#c8e6c8}
        [data-perc-theme="artem"] .test-opt .opt-letter{background:#1f5a3a;color:#fafaf2;border-radius:0;font-family:'Russo One',sans-serif}
        [data-perc-theme="artem"] .test-opt.correct{background:#e8f7ec;border-color:#1f5a3a;border-width:2px}
        [data-perc-theme="artem"] .test-opt.correct .opt-letter{background:#3DD68C;color:#0a1a10}
        [data-perc-theme="artem"] .test-opt.correct::after{content:"${t.correctLabel}";color:#1f5a3a;font-family:'Russo One',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase}
        [data-perc-theme="artem"] .explain{background:#e8f7ec;border-left:4px solid #3DD68C;color:#1f5a3a;border-radius:0}
        [data-theme="dark"] [data-perc-theme="artem"] .explain{color:#c8e6c8;background:#0d1a10}
        [data-perc-theme="artem"] .practice{background:#fafaf2;border:2px solid #1f5a3a;border-radius:0;box-shadow:6px 6px 0 #3DD68C}
        [data-theme="dark"] [data-perc-theme="artem"] .practice{background:#0d1a10}
        [data-perc-theme="artem"] .practice h3{font-family:'Russo One',sans-serif;color:#1f5a3a;text-transform:uppercase;text-align:center;border-bottom:2px dashed #3DD68C;padding-bottom:10px;letter-spacing:2px}
      `;
    }
    if (id === "izma") {
      return `
        [data-perc-theme="izma"] .qa{
          background:#fff;
          border:1px solid #64B5F6;border-radius:18px;
          box-shadow:0 4px 16px rgba(100,181,246,.15);
          position:relative;overflow:hidden;
        }
        [data-theme="dark"] [data-perc-theme="izma"] .qa{background:#0d1a2a;color:#d4e8ff;border-color:#1e4a7a}
        [data-perc-theme="izma"] .qa::before{
          content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:6px;height:60%;border-radius:0 4px 4px 0;
          background:repeating-linear-gradient(180deg,#64B5F6 0 8px,#bbdefb 8px 16px);
        }
        [data-perc-theme="izma"] .qa-num{
          background:linear-gradient(135deg,#64B5F6,#1565c0);color:#fff;
          border-radius:50%;font-family:'Marck Script',cursive;font-size:18px;
          border:2px solid #fff;box-shadow:0 0 0 1px #64B5F6;
        }
        [data-perc-theme="izma"] .qa-title{font-family:'Marck Script','Playfair Display',cursive;font-size:20px;color:#1565c0;font-weight:400}
        [data-theme="dark"] [data-perc-theme="izma"] .qa-title{color:#d4e8ff}
        [data-perc-theme="izma"] .test-opt{background:#f7faff;border:1px solid #bbdefb;border-radius:12px;font-family:'Cormorant Garamond',serif;font-size:15px}
        [data-theme="dark"] [data-perc-theme="izma"] .test-opt{background:#0a1422;border-color:#1e3a5a;color:#d4e8ff}
        [data-perc-theme="izma"] .test-opt .opt-letter{background:#e3efff;color:#1565c0;border-radius:50%;font-family:'Marck Script',cursive;font-size:14px}
        [data-perc-theme="izma"] .test-opt.correct{background:linear-gradient(90deg,#e3efff,#bbdefb);border-color:#64B5F6}
        [data-perc-theme="izma"] .test-opt.correct .opt-letter{background:#1565c0;color:#fff}
        [data-perc-theme="izma"] .test-opt.correct::after{content:"${t.correctLabel}";color:#1565c0;font-family:'Marck Script',cursive;font-size:18px}
        [data-perc-theme="izma"] .explain{background:rgba(100,181,246,.1);border-left-color:#64B5F6;color:#1a3a5a;font-family:'Cormorant Garamond',serif;font-size:16px;border-radius:12px}
        [data-theme="dark"] [data-perc-theme="izma"] .explain{color:#d4e8ff}
        [data-perc-theme="izma"] .practice{background:#fff;border:2px solid #64B5F6;border-radius:18px}
        [data-theme="dark"] [data-perc-theme="izma"] .practice{background:#0d1a2a}
        [data-perc-theme="izma"] .practice h3{font-family:'Marck Script',cursive;color:#1565c0;font-size:28px;text-align:center;font-weight:400}
      `;
    }
    if (id === "vitya") {
      return `
        [data-perc-theme="vitya"] .qa{
          background:#fff;
          border:1px solid #d4c5ec;border-radius:2px;border-left:4px solid #BB86FC;
          box-shadow:0 2px 14px rgba(187,134,252,.12);
          position:relative;
        }
        [data-theme="dark"] [data-perc-theme="vitya"] .qa{background:#180c2a;color:#e8d4ff;border-color:#3a2860}
        [data-perc-theme="vitya"] .qa::after{
          content:"✡";position:absolute;top:14px;right:18px;color:#BB86FC;font-size:14px;opacity:.4;
        }
        [data-perc-theme="vitya"] .qa-num{
          background:linear-gradient(135deg,#BB86FC,#6a1b9a);color:#fff;
          border-radius:2px;font-family:'Cormorant Garamond',serif;
          font-weight:700;border:1px solid #d4c5ec;
        }
        [data-perc-theme="vitya"] .qa-title{font-family:'Cormorant Garamond','Playfair Display',serif;font-size:17px;font-weight:600;color:#4a2a7a;font-style:italic}
        [data-theme="dark"] [data-perc-theme="vitya"] .qa-title{color:#e8d4ff}
        [data-perc-theme="vitya"] .test-opt{background:#fbf8ff;border:1px solid #d4c5ec;border-radius:2px;font-family:'Cormorant Garamond',serif;font-size:15px}
        [data-theme="dark"] [data-perc-theme="vitya"] .test-opt{background:#0d061a;border-color:#3a2860;color:#e8d4ff}
        [data-perc-theme="vitya"] .test-opt .opt-letter{background:#efe4ff;color:#6a1b9a;border-radius:2px;font-family:'Cormorant Garamond',serif;font-weight:700;font-style:italic}
        [data-perc-theme="vitya"] .test-opt.correct{background:linear-gradient(90deg,#efe4ff,#d4c5ec);border-color:#BB86FC}
        [data-perc-theme="vitya"] .test-opt.correct .opt-letter{background:#6a1b9a;color:#fff}
        [data-perc-theme="vitya"] .test-opt.correct::after{content:"${t.correctLabel}";color:#6a1b9a;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:700}
        [data-perc-theme="vitya"] .explain{background:rgba(187,134,252,.1);border-left-color:#BB86FC;color:#4a2a7a;font-family:'Cormorant Garamond',serif;font-size:15.5px;border-radius:2px}
        [data-theme="dark"] [data-perc-theme="vitya"] .explain{color:#e8d4ff}
        [data-perc-theme="vitya"] .practice{background:#fff;border:1px solid #BB86FC;border-radius:2px;border-top:6px solid #6a1b9a}
        [data-theme="dark"] [data-perc-theme="vitya"] .practice{background:#180c2a}
        [data-perc-theme="vitya"] .practice h3{font-family:'Cormorant Garamond',serif;color:#6a1b9a;font-size:24px;font-style:italic;text-align:center}
      `;
    }
    if (id === "nikita") {
      return `
        [data-perc-theme="nikita"] .qa{
          background:#fff;border:1px solid #b3e5fc;border-radius:6px;
          box-shadow:0 2px 14px rgba(41,182,246,.15);
          position:relative;overflow:hidden;
        }
        [data-theme="dark"] [data-perc-theme="nikita"] .qa{background:#0a1822;color:#b3e5fc;border-color:#1a3a50}
        [data-perc-theme="nikita"] .qa::before{
          content:"";position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,#29B6F6 20%,#29B6F6 80%,transparent);
          animation:nikitaBreath 4s ease-in-out infinite;
        }
        @keyframes nikitaBreath{0%,100%{opacity:.35;transform:translateX(-30%)}50%{opacity:1;transform:translateX(30%)}}
        [data-perc-theme="nikita"] .qa-num{
          background:#29B6F6;color:#fff;border-radius:50%;
          font-family:'Bebas Neue',sans-serif;font-size:16px;
          box-shadow:0 0 12px rgba(41,182,246,.4);
        }
        [data-perc-theme="nikita"] .qa-title{font-family:'Bebas Neue','Manrope',sans-serif;font-size:18px;letter-spacing:.5px;color:#01579b;text-transform:uppercase}
        [data-theme="dark"] [data-perc-theme="nikita"] .qa-title{color:#b3e5fc}
        [data-perc-theme="nikita"] .test-opt{background:#f0f9ff;border:1px solid #b3e5fc;border-radius:4px}
        [data-theme="dark"] [data-perc-theme="nikita"] .test-opt{background:#0a1218;border-color:#1a3a50;color:#b3e5fc}
        [data-perc-theme="nikita"] .test-opt .opt-letter{background:#e1f5fe;color:#29B6F6;border-radius:50%;font-family:'Bebas Neue',sans-serif}
        [data-perc-theme="nikita"] .test-opt.correct{background:#e1f5fe;border-color:#29B6F6}
        [data-perc-theme="nikita"] .test-opt.correct .opt-letter{background:#29B6F6;color:#fff}
        [data-perc-theme="nikita"] .test-opt.correct::after{content:"${t.correctLabel}";color:#01579b;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:13px}
        [data-perc-theme="nikita"] .explain{background:rgba(41,182,246,.1);border-left-color:#29B6F6;color:#01579b}
        [data-theme="dark"] [data-perc-theme="nikita"] .explain{color:#b3e5fc}
        [data-perc-theme="nikita"] .practice{background:#fff;border:1px solid #29B6F6;border-radius:6px}
        [data-theme="dark"] [data-perc-theme="nikita"] .practice{background:#0a1822}
        [data-perc-theme="nikita"] .practice h3{font-family:'Bebas Neue',sans-serif;color:#01579b;font-size:24px;text-align:center;letter-spacing:1.5px}
      `;
    }
    if (id === "maxim") {
      return `
        [data-perc-theme="maxim"] .qa{
          background:#1a0608;border:1px solid #4a1010;border-radius:0;
          border-left:4px solid #C8102E;
          color:#ffcccc;font-family:'Russo One',sans-serif;
          position:relative;
        }
        [data-perc-theme="maxim"] .qa::after{
          content:"";position:absolute;top:0;right:0;width:24px;height:24px;
          background:linear-gradient(135deg,transparent 50%,#C8102E 50%);
        }
        [data-perc-theme="maxim"] .qa-num{
          background:linear-gradient(135deg,#C8102E,#600);color:#ffd700;border-radius:0;
          font-family:'Russo One',sans-serif;border:1px solid #ffd700;
        }
        [data-perc-theme="maxim"] .qa-title{font-family:'Russo One',sans-serif;color:#ffd700;text-transform:uppercase;letter-spacing:1px;font-size:14px}
        [data-perc-theme="maxim"] .test-opt{background:#0e0404;border:1px solid #4a1010;border-radius:0;color:#ffcccc;font-family:'Russo One',sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.5px}
        [data-perc-theme="maxim"] .test-opt .opt-letter{background:#2a0808;color:#ffd700;border-radius:0;border:1px solid #4a1010;font-family:'Russo One',sans-serif}
        [data-perc-theme="maxim"] .test-opt.correct{background:linear-gradient(90deg,rgba(200,16,46,.4),rgba(200,16,46,.1));border-color:#ffd700}
        [data-perc-theme="maxim"] .test-opt.correct .opt-letter{background:#ffd700;color:#1a0608}
        [data-perc-theme="maxim"] .test-opt.correct::after{content:"${t.correctLabel}";color:#ffd700;font-family:'Russo One',sans-serif;letter-spacing:2px}
        [data-perc-theme="maxim"] .explain{background:rgba(200,16,46,.12);border-left-color:#ffd700;color:#ffcccc;border-radius:0;font-family:'Russo One',sans-serif;font-size:12.5px}
        [data-perc-theme="maxim"] .practice{background:#0e0404;border:1px solid #C8102E;border-radius:0;color:#ffcccc}
        [data-perc-theme="maxim"] .practice h3{font-family:'Russo One',sans-serif;color:#ffd700;text-align:center;text-transform:uppercase;letter-spacing:3px;border-bottom:2px solid #C8102E;padding-bottom:8px}
      `;
    }
    if (id === "artem2") {
      return `
        [data-perc-theme="artem2"] .qa{
          background:#fff8e1;border:2px double #b8860b;border-radius:0;
          box-shadow:0 4px 18px rgba(184,134,11,.18);
          position:relative;
        }
        [data-theme="dark"] [data-perc-theme="artem2"] .qa{background:#1a1408;color:#f5e6a8;border-color:#8a6a08}
        [data-perc-theme="artem2"] .qa::before{
          content:"";position:absolute;top:6px;left:6px;right:6px;bottom:6px;
          border:1px solid #b8860b;pointer-events:none;opacity:.4;
        }
        [data-perc-theme="artem2"] .qa-num{
          background:#b8860b;color:#fff8e1;border-radius:0;
          font-family:'Cormorant Garamond',serif;font-weight:700;
          border:2px solid #fff8e1;outline:1px solid #b8860b;
        }
        [data-perc-theme="artem2"] .qa-title{font-family:'Cormorant Garamond',serif;font-weight:700;color:#5a3a08;text-transform:uppercase;letter-spacing:1.5px;font-size:15px}
        [data-theme="dark"] [data-perc-theme="artem2"] .qa-title{color:#f5e6a8}
        [data-perc-theme="artem2"] .test-opt{background:#fff;border:1px solid #d4af37;border-radius:0;font-family:'Cormorant Garamond',serif;font-size:15px}
        [data-theme="dark"] [data-perc-theme="artem2"] .test-opt{background:#0e0a02;border-color:#3a2a08;color:#f5e6a8}
        [data-perc-theme="artem2"] .test-opt .opt-letter{background:#fff3c4;color:#b8860b;border-radius:0;font-family:'Cormorant Garamond',serif;font-weight:700}
        [data-perc-theme="artem2"] .test-opt.correct{background:linear-gradient(90deg,#fff3c4,#ffe680);border-color:#b8860b}
        [data-perc-theme="artem2"] .test-opt.correct .opt-letter{background:#b8860b;color:#fff}
        [data-perc-theme="artem2"] .test-opt.correct::after{content:"${t.correctLabel}";color:#5a3a08;font-family:'Cormorant Garamond',serif;font-weight:700;letter-spacing:2px}
        [data-perc-theme="artem2"] .explain{background:rgba(184,134,11,.12);border-left-color:#b8860b;color:#5a3a08;font-family:'Cormorant Garamond',serif;font-size:15px;border-radius:0}
        [data-theme="dark"] [data-perc-theme="artem2"] .explain{color:#f5e6a8}
        [data-perc-theme="artem2"] .practice{background:#fff8e1;border:2px double #b8860b;border-radius:0}
        [data-theme="dark"] [data-perc-theme="artem2"] .practice{background:#1a1408}
        [data-perc-theme="artem2"] .practice h3{font-family:'Cormorant Garamond',serif;color:#b8860b;text-align:center;text-transform:uppercase;letter-spacing:3px;border-bottom:2px solid #b8860b;padding-bottom:8px;font-size:22px}
      `;
    }
    if (id === "danya2") {
      return `
        [data-perc-theme="danya2"] .qa{
          background:#fff;border:2px solid #ffc1d6;border-radius:24px;
          box-shadow:0 6px 20px rgba(240,98,146,.18);
          position:relative;
        }
        [data-theme="dark"] [data-perc-theme="danya2"] .qa{background:#1a0a14;color:#ffd4e3;border-color:#4a1a30}
        [data-perc-theme="danya2"] .qa::before{
          content:"❀";position:absolute;top:10px;right:16px;color:#F06292;font-size:18px;
        }
        [data-perc-theme="danya2"] .qa-num{
          background:linear-gradient(135deg,#F06292,#AB47BC);color:#fff;
          border-radius:50%;font-family:'Caveat',cursive;font-size:20px;font-weight:700;
          box-shadow:0 0 0 3px #ffe1ed;
        }
        [data-theme="dark"] [data-perc-theme="danya2"] .qa-num{box-shadow:0 0 0 3px #2a0a1a}
        [data-perc-theme="danya2"] .qa-title{font-family:'Caveat',cursive;font-size:22px;font-weight:700;color:#7a1f4a;line-height:1.2}
        [data-theme="dark"] [data-perc-theme="danya2"] .qa-title{color:#ffd4e3}
        [data-perc-theme="danya2"] .test-opt{background:#fff8fb;border:1.5px solid #ffc1d6;border-radius:18px}
        [data-theme="dark"] [data-perc-theme="danya2"] .test-opt{background:#1f0e1a;border-color:#3a1a28;color:#ffd4e3}
        [data-perc-theme="danya2"] .test-opt .opt-letter{background:#ffe1ed;color:#F06292;border-radius:50%;font-family:'Caveat',cursive;font-weight:700;font-size:16px}
        [data-perc-theme="danya2"] .test-opt.correct{background:linear-gradient(90deg,#ffe1ed,#ffc1d6);border-color:#F06292}
        [data-perc-theme="danya2"] .test-opt.correct .opt-letter{background:linear-gradient(135deg,#F06292,#AB47BC);color:#fff}
        [data-perc-theme="danya2"] .test-opt.correct::after{content:"${t.correctLabel}";color:#7a1f4a;font-family:'Caveat',cursive;font-size:20px;font-weight:700}
        [data-perc-theme="danya2"] .explain{background:rgba(240,98,146,.12);border-left-color:#F06292;color:#7a1f4a;border-radius:18px}
        [data-theme="dark"] [data-perc-theme="danya2"] .explain{color:#ffd4e3}
        [data-perc-theme="danya2"] .practice{background:#fff;border:2px solid #F06292;border-radius:24px}
        [data-theme="dark"] [data-perc-theme="danya2"] .practice{background:#1a0a14}
        [data-perc-theme="danya2"] .practice h3{font-family:'Caveat',cursive;color:#F06292;font-size:32px;text-align:center;font-weight:700}
      `;
    }
    return "";
  }

  function stripCodeComments(code, lang) {
    if (!code) return code;
    let out = code;
    if (lang === "html") {
      out = out.replace(/<!--[\s\S]*?-->/g, "");
    } else if (lang === "css") {
      out = out.replace(/\/\*[\s\S]*?\*\//g, "");
    } else if (lang === "js" || lang === "javascript") {
      out = out.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");
    }
    return out
      .split("\n")
      .filter(line => line.trim().length > 0)
      .join("\n")
      .trim();
  }

  function stripPracticeComments(prac) {
    if (!prac || !prac.blocks) return prac;
    return Object.assign({}, prac, {
      blocks: prac.blocks.map(b => Object.assign({}, b, { code: stripCodeComments(b.code, b.lang) }))
    });
  }

  function renderPercy(personId) {
    const perc = PERCI.find(p => p.id === personId);
    if (!perc) return;
    const theme = PERC_THEMES[personId];
    if (!theme) return;

    const seed = hashStr(perc.id);
    const container = document.getElementById("percContent");
    if (!container) return;

    let styleEl = document.getElementById("perc-theme-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "perc-theme-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildThemeCss(personId, theme);

    const variants = [
      { key: "v1", label: "Вариант 1" },
      { key: "v2", label: "Вариант 2" },
      { key: "v3", label: "Вариант 3" }
    ];

    let html = `
      <div data-perc-theme="${personId}">
      <div style="display:none" hidden>
        <span class="eyebrow" style="color:${perc.color};background:${perc.color}22">Персональные ответы</span>
        <h1>${perc.name} <span style="color:${perc.color}">\u201C${perc.nick}\u201D</span></h1>
        <p class="lead">Уникальные ответы для ${perc.name}. Порядок вариантов ответов перемешан \u2014 не совпадает с ответами других участников.</p>
      </div>`;

    variants.forEach((v, vi) => {
      html += `
        <div class="perc-variant-body" id="perc-body-${v.key}">
          <h2 class="p-section-title">Часть 1. Тестовые вопросы</h2>
          <div id="perc-tests-${v.key}"></div>
          <h2 class="p-section-title">Часть 2. Открытые вопросы</h2>
          <div id="perc-open-${v.key}"></div>
          <h2 class="p-section-title">Часть 3. Практическая работа</h2>
          <div id="perc-prac-${v.key}"></div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Render content for each variant
    variants.forEach((v, vi) => {
      const variantSeed = seed + vi * 1000 + 42;
      const tests = DATA[v.key + "_tests"];
      const opens = DATA[v.key + "_open"];
      const prac = DATA[v.key + "_prac"];

      // Shuffled tests
      const testsHtml = tests.map((test, ti) => {
        const testSeed = variantSeed + ti * 100;
        const indices = test.opts.map((_, idx) => idx);
        const shuffled = shuffleSeeded(indices, testSeed);
        const letters = ["А", "Б", "В", "Г"];
        const opts = shuffled.map((origIdx, newPos) => {
          const clean = test.opts[origIdx].replace(/^[А-ГA-D]\)\s*/u, "");
          const isOk = origIdx === test.correct;
          return `
            <div class="test-opt ${isOk ? "correct" : ""}">
              <div class="opt-letter">${letters[newPos]}</div>
              <div>${clean}</div>
            </div>`;
        }).join("");
        const searchText = (test.q + " " + test.opts.join(" ") + " " + stripHtml(test.explain || "")).toLowerCase();
        return `
          <div class="qa" data-search="${escapeAttr(searchText)}">
            <div class="qa-head">
              <div class="qa-num">${ti + 1}</div>
              <div class="qa-title">${test.q}</div>
              <svg class="qa-toggle" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="qa-body">
              <div class="test-opts">${opts}</div>
              ${test.explain ? `<div class="explain"><b>Пояснение.</b> ${test.explain}</div>` : ""}
            </div>
          </div>`;
      }).join("");
      document.getElementById(`perc-tests-${v.key}`).innerHTML = testsHtml;

      // Open questions with shuffled content
      const opensHtml = opens.map((q, qi) => {
        const openSeed = variantSeed + qi * 100 + 500;
        const div = document.createElement("div");
        div.innerHTML = q.a;
        // Shuffle direct children (p, ul, ol, h4, etc.)
        const children = Array.from(div.children);
        if (children.length > 1) {
          shuffleSeeded(children, openSeed).forEach(c => div.appendChild(c));
        }
        // Shuffle li items within lists
        div.querySelectorAll("ul, ol").forEach(list => {
          const items = Array.from(list.children);
          if (items.length > 1) {
            shuffleSeeded(items, openSeed + 777).forEach(item => list.appendChild(item));
          }
        });
        const answerHtml = div.innerHTML;
        const searchText = (q.q + " " + stripHtml(answerHtml)).toLowerCase();
        return `
          <div class="qa" data-search="${escapeAttr(searchText)}">
            <div class="qa-head">
              <div class="qa-num">${qi + 1 + 20}</div>
              <div class="qa-title">${q.q}</div>
              <svg class="qa-toggle" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="qa-body">${answerHtml}</div>
          </div>`;
      }).join("");
      document.getElementById(`perc-open-${v.key}`).innerHTML = opensHtml;

      document.getElementById(`perc-prac-${v.key}`).innerHTML = tplPracBig(stripPracticeComments(prac));
    });

    // Highlight syntax
    if (window.hljs) {
      $$("#percContent pre code").forEach(el => {
        try { hljs.highlightElement(el); } catch (_) {}
      });
    }

    // Toggle variant headers
    container.querySelectorAll("[data-perc-variant]").forEach(header => {
      header.addEventListener("click", () => {
        header.classList.toggle("open");
        const body = header.nextElementSibling;
        if (body) body.classList.toggle("open");
      });
    });
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

    // превью практической работы
    const prevBtn = e.target.closest("[data-preview-toggle]");
    if (prevBtn) {
      const pid = prevBtn.dataset.previewToggle;
      const frame = document.getElementById(pid);
      if (!frame) return;
      const isOpen = frame.classList.toggle("open");
      prevBtn.classList.toggle("active", isOpen);
      if (isOpen && window.__previewData && window.__previewData[pid]) {
        const iframe = frame.querySelector("iframe");
        if (iframe && !iframe.srcdoc) {
          iframe.srcdoc = window.__previewData[pid];
        }
      }
      return;
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
    const section = a.dataset.section;
    if (section.startsWith("perc-")) {
      const personId = section.replace("perc-", "");
      renderPercy(personId);
      showSection("percy");
      $$("#percNav a, #percdNav a").forEach(l => l.classList.remove("active"));
      a.classList.add("active");
      if (a.closest("#percGroup")) document.getElementById("percGroup")?.classList.add("open");
      if (a.closest("#percdGroup")) document.getElementById("percdGroup")?.classList.add("open");
    } else {
      showSection(section);
    }
  });

  // Collapsible \u201CПерцы\u201D toggle
  document.getElementById("percToggle")?.addEventListener("click", () => {
    document.getElementById("percGroup")?.classList.toggle("open");
  });
  document.getElementById("percdToggle")?.addEventListener("click", () => {
    document.getElementById("percdGroup")?.classList.toggle("open");
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
  if (initial.startsWith("perc-")) {
    const personId = initial.replace("perc-", "");
    renderPercy(personId);
    showSection("percy");
    $$("#percNav a, #percdNav a").forEach(a => a.classList.toggle("active", a.dataset.section === initial));
    const initActive = $(`#percNav a[data-section="${initial}"], #percdNav a[data-section="${initial}"]`);
    if (initActive?.closest("#percGroup")) document.getElementById("percGroup")?.classList.add("open");
    if (initActive?.closest("#percdGroup")) document.getElementById("percdGroup")?.classList.add("open");
  } else {
    showSection(["home","crit"].includes(initial) ? initial : "home");
  }

})();