(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- language ---------- */
  var I18N = null;
  try { I18N = JSON.parse($('#i18n').textContent); } catch (e) {}
  // The same 10 languages, in the same order, as the LingoMic extension and app.
  var LANGS = [
    ['vi', 'VI', 'Tiếng Việt'], ['en', 'EN', 'English'], ['zh-CN', 'ZH', '简体中文'],
    ['es', 'ES', 'Español'], ['hi', 'HI', 'हिन्दी'], ['ar', 'AR', 'العربية'],
    ['fr', 'FR', 'Français'], ['pt-BR', 'PT', 'Português'], ['ru', 'RU', 'Русский'], ['ja', 'JA', '日本語']
  ];
  var TITLE_EN = document.title;

  // Texts carry a key (scripts/translate-site.mjs); English is what the page was built with.
  function applyLang(id) {
    var d = (I18N && I18N[id]) || {};
    $$('[data-i18n]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      el.textContent = d[el.dataset.i18n] || el.dataset.en;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML;
      el.innerHTML = d[el.dataset.i18nHtml] || el.dataset.enHtml;
    });
    var tk = document.documentElement.dataset.titleKey;
    document.title = (tk && d[tk]) || TITLE_EN;
    document.documentElement.lang = id;
    document.documentElement.dir = id === 'ar' ? 'rtl' : 'ltr';
    var short = (LANGS.filter(function (l) { return l[0] === id; })[0] || LANGS[1])[1];
    $$('[data-langshort]').forEach(function (el) { el.textContent = short; });
    $$('.langitem').forEach(function (b) {
      var on = b.dataset.lang === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      var chk = b.querySelector('svg');
      if (chk) chk.style.visibility = on ? 'visible' : 'hidden';
    });
  }

  function buildLangMenus() {
    $$('[data-langwrap]').forEach(function (wrap) {
      var items = LANGS.map(function (l) {
        return '<li><button type="button" class="langitem" role="option" data-lang="' + l[0] + '" aria-selected="false"><span>' + l[2] + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="visibility:hidden"><path d="m5 12 5 5L20 7"></path></svg></button></li>';
      }).join('');
      wrap.innerHTML =
        '<button type="button" class="langbtn" aria-haspopup="listbox" aria-expanded="false" aria-label="Change language">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"></path></svg>' +
        '<span data-langshort>EN</span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>' +
        '<ul class="langmenu" role="listbox" aria-label="Language" hidden>' + items + '</ul>';
      var btn = wrap.querySelector('.langbtn');
      var menu = wrap.querySelector('.langmenu');
      function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = menu.hidden;
        $$('.langmenu').forEach(function (m) { m.hidden = true; });
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('.langitem');
        if (!b) return;
        store.set('lm-lang', b.dataset.lang);
        applyLang(b.dataset.lang);
        close();
      });
      document.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    });
  }

  function detectLang() {
    var saved = store.get('lm-lang');
    if (saved && LANGS.some(function (l) { return l[0] === saved; })) return saved;
    if (saved === 'en-US' || saved === 'en-GB') return 'en';
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var p = prefs[i];
      var exact = LANGS.filter(function (l) { return l[0].toLowerCase() === p.toLowerCase(); })[0];
      if (exact) return exact[0];
      var base = p.split('-')[0].toLowerCase();
      var m = LANGS.filter(function (l) { return l[0].split('-')[0].toLowerCase() === base; })[0];
      if (m) return m[0];
    }
    return 'en';
  }

  buildLangMenus();
  applyLang(detectLang());

  /* ---------- tabs ---------- */
  function wireTabs(btnAttr, paneAttr) {
    $$('[data-' + btnAttr + ']').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-' + btnAttr + ']').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        $$('[data-' + paneAttr + ']').forEach(function (p) { p.hidden = p.dataset[paneAttr] !== b.dataset[btnAttr]; });
      });
    });
  }
  wireTabs('tab', 'pane');
  wireTabs('dtab', 'dpane');

  /* ---------- voice demo ---------- */
  var VOICE = {
    en: ['English', 'That’s great news! Thanks for waiting, I’ll have it ready today.'],
    ja: ['日本語', 'それは素晴らしいニュースですね！お待ちいただきありがとうございます、本日中にご用意します。'],
    fr: ['Français', 'Quelle bonne nouvelle ! Merci d’avoir attendu, ce sera prêt aujourd’hui.'],
    de: ['Deutsch', 'Das sind tolle Neuigkeiten! Danke fürs Warten, es ist noch heute fertig.'],
    ko: ['한국어', '정말 좋은 소식이네요! 기다려 주셔서 감사합니다, 오늘 안에 준비해 드릴게요.'],
    zh: ['简体中文', '真是个好消息！谢谢你的等待，今天就能准备好。'],
    pt: ['Português (Brasil)', 'Que ótima notícia! Obrigado por esperar, ainda hoje fica pronto.']
  };
  $$('[data-v]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var v = VOICE[b.dataset.v];
      var n = $('#vname');
      var t = $('#vtext');
      if (n) n.textContent = v[0];
      if (t) {
        t.textContent = v[1];
        t.classList.remove('pane');
        void t.offsetWidth;
        t.classList.add('pane');
      }
    });
  });

  /* ---------- faq ---------- */
  $$('.faqbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      $$('.faqbtn').forEach(function (x) {
        x.setAttribute('aria-expanded', 'false');
        var p = x.parentElement.querySelector('.faqa');
        if (p) p.hidden = true;
      });
      if (!open) {
        b.setAttribute('aria-expanded', 'true');
        var panel = b.parentElement.querySelector('.faqa');
        if (panel) panel.hidden = false;
      }
    });
  });

  /* ---------- trial page ---------- */
  var PLANS = {
    m6: { name: '6 months', price: '$29', per: '6 months', life: false },
    y1: { name: '1 year', price: '$49', per: 'year', life: false },
    life: { name: 'Lifetime', price: '$79', per: '', life: true }
  };
  function bind(key, text) {
    $$('[data-bind="' + key + '"]').forEach(function (el) { el.textContent = text; });
  }
  $$('[data-plan]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-plan]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var p = PLANS[b.dataset.plan];
      bind('planName', p.name);
      bind('planPrice', p.price);
      bind('chargeLine', p.life ? 'Your card is charged $79 once for the lifetime plan.' : 'Your card is charged ' + p.price + ' for the ' + p.name + ' plan, then again every ' + p.per + ' until you cancel.');
      bind('renewLine', p.life ? 'No renewals, ever' : 'Then ' + p.price + ' every ' + p.per + ' until you cancel');
      bind('renewFine', p.life ? 'Lifetime is a single payment and never renews.' : 'This plan renews automatically every ' + p.per + ' at ' + p.price + ' until you cancel, and we email you a week before each renewal.');
    });
  });

  /* ---------- signup page ---------- */
  var MODES = {
    signup: { title: 'Create your LingoMic account', subtitle: 'One account to start your free trial and manage your license.', googleLabel: 'Sign up with Google', emailLabel: 'Email me a sign-up link' },
    login: { title: 'Welcome back', subtitle: 'Log in to manage your license and devices.', googleLabel: 'Continue with Google', emailLabel: 'Email me a log-in link' }
  };
  $$('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-mode]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      var m = MODES[b.dataset.mode];
      Object.keys(m).forEach(function (k) { bind(k, m[k]); });
    });
  });

  /* ---------- blog filter ---------- */
  $$('[data-cat-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-cat-btn]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var cat = b.dataset.catBtn;
      $$('[data-card]').forEach(function (c) { c.hidden = cat !== 'all' && c.dataset.cat !== cat; });
    });
  });
})();
