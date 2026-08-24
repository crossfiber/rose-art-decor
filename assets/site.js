/* ==========================================================================
   Rose Art & Decor — site.js
   Mechanics sourced from the Builda mechanics library (scroll restore, drawer,
   accordion w/ resize resync, anchor hash strip, branded form validation),
   plus this build's two new ones: the EN/ES language engine and the
   colour-story gallery filter + lightbox.
   ========================================================================== */
if ('scrollRestoration' in history) { history.scrollRestoration = 'auto'; }

(function () {
  'use strict';

  /* ---------------------------------------------------------------- boot -- */
  if (window.location.hash && !document.querySelector(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname);
  }

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------- 1. language engine -- */
  var LANG_KEY = 'rad-lang';
  var lang = 'en';

  function storedLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function storeLang(v) {
    try { localStorage.setItem(LANG_KEY, v); } catch (e) {}
  }

  function applyLang(next) {
    lang = (next === 'es') ? 'es' : 'en';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);

    $$('[data-en]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang);
      if (v === null) return;
      if (el.hasAttribute('data-html')) { el.innerHTML = v; } else { el.textContent = v; }
    });
    $$('[data-en-ph]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang + '-ph');
      if (v !== null) el.setAttribute('placeholder', v);
    });
    $$('[data-en-aria]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang + '-aria');
      if (v !== null) el.setAttribute('aria-label', v);
    });

    var t = document.documentElement.getAttribute('data-title-' + lang);
    if (t) document.title = t;
    var d = document.documentElement.getAttribute('data-desc-' + lang);
    if (d) { var m = $('meta[name="description"]'); if (m) m.setAttribute('content', d); }

    $$('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === lang));
    });

    // open accordion panels change height when the copy changes
    resyncAccordion();
    storeLang(lang);
  }

  (function initLang() {
    var q = new URLSearchParams(window.location.search).get('lang');
    var pick = q || storedLang();
    if (!pick) {
      var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      pick = /^es/i.test(nav) ? 'es' : 'en';
    }
    applyLang(pick);
  })();

  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-set')); });
  });

  /* -------------------------------------------------------- 2. nav/drawer -- */
  var nav = $('.nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var hamburger = $('#hamburger');
  var drawer = $('#navDrawer');
  var overlay = $('#navOverlay');
  var drawerClose = $('#drawerClose');

  function openDrawer() {
    drawer.classList.add('open'); overlay.classList.add('open');
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    drawer.classList.remove('open'); overlay.classList.remove('open');
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  if (hamburger && drawer && overlay) {
    hamburger.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  /* ------------------------------------------------ 3. anchors + intents -- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', window.location.pathname);
    });
  });

  // CTA -> preset the service field in the quote form
  $$('[data-want]').forEach(function (el) {
    el.addEventListener('click', function () {
      var sel = $('#f-service');
      if (!sel) return;
      var v = el.getAttribute('data-want');
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.value === v) sel.selectedIndex = o.index;
      });
    });
  });

  /* --------------------------------------------------------- 4. accordion -- */
  function resyncAccordion() {
    $$('.acc-item.open .acc-body').forEach(function (b) { b.style.maxHeight = b.scrollHeight + 'px'; });
  }
  $$('.acc-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var body = item.querySelector('.acc-body');
      var isOpen = item.classList.contains('open');
      $$('.acc-item', item.closest('.acc')).forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
        i.querySelector('.acc-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
  var rsz;
  window.addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(resyncAccordion, 120);
  });

  /* --------------------------------------------- 5. gallery filter + LB --- */
  var figs = $$('.gallery figure');
  $$('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-filter');
      $$('.filters button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      figs.forEach(function (f) {
        var tags = (f.getAttribute('data-tags') || '').split(' ');
        f.classList.toggle('hide', key !== 'all' && tags.indexOf(key) === -1);
      });
    });
  });

  var lb = $('#lightbox');
  if (lb && figs.length) {
    var lbImg = $('#lbImg'), lbCap = $('#lbCap');
    var visible = function () { return figs.filter(function (f) { return !f.classList.contains('hide'); }); };
    var idx = 0;

    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var f = list[idx];
      var im = f.querySelector('img');
      lbImg.src = im.getAttribute('data-full') || im.currentSrc || im.src;
      lbImg.alt = im.alt;
      var cap = f.querySelector('figcaption');
      lbCap.textContent = cap ? cap.textContent : im.alt;
    }
    function openLB(f) {
      show(visible().indexOf(f));
      lb.classList.add('open');
      document.body.classList.add('drawer-open');
    }
    function closeLB() {
      lb.classList.remove('open');
      document.body.classList.remove('drawer-open');
      lbImg.removeAttribute('src');
    }
    figs.forEach(function (f) {
      f.addEventListener('click', function () { openLB(f); });
    });
    $('#lbClose').addEventListener('click', closeLB);
    $('#lbPrev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    $('#lbNext').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ------------------------------------------------------ 6. quote form --- */
  var form = $('#quoteForm');
  if (form) {
    var GFORM = 'https://docs.google.com/forms/d/e/1FAIpQLSePVDAvasT7-rf5k2Ydhqu27_G6I_XD_5nh-FN5crZXNFMOUg/formResponse';

    // radio cards get a selected state
    $$('.radio input', form).forEach(function (r) {
      r.addEventListener('change', function () {
        $$('input[name="' + r.name + '"]', form).forEach(function (o) {
          o.closest('.radio').classList.toggle('on', o.checked);
        });
        if (r.name === 'owned') toggleBuy();
      });
    });

    // "should we buy the materials?" is only relevant when she doesn't own them
    var buyBlock = $('#buyBlock');
    function toggleBuy() {
      var owned = $('input[name="owned"]:checked', form);
      var show = owned && owned.value === 'No';
      if (buyBlock) buyBlock.style.display = show ? '' : 'none';
    }
    toggleBuy();

    // clear the error state the moment the field is fixed
    $$('input, select, textarea', form).forEach(function (el) {
      ['input', 'change'].forEach(function (ev) {
        el.addEventListener(ev, function () {
          var f = el.closest('.field');
          if (f) f.classList.remove('err');
        });
      });
    });

    function fail(field) { field.classList.add('err'); return field; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      $$('.field', form).forEach(function (f) { f.classList.remove('err'); });

      function need(sel) {
        var el = $(sel, form);
        if (!el) return null;
        var f = el.closest('.field');
        if (!el.value.trim()) { fail(f); first = first || f; }
        return el;
      }
      var name = need('#f-name');
      var email = need('#f-email');
      var phone = need('#f-phone');
      var loc = need('#f-location');
      var size = need('#f-size');

      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        var ef = email.closest('.field'); fail(ef); first = first || ef;
      }
      if (phone && phone.value.trim() && phone.value.replace(/\D/g, '').length < 10) {
        var pf = phone.closest('.field'); fail(pf); first = first || pf;
      }
      ['owned', 'around', 'contact'].forEach(function (n) {
        if (!$('input[name="' + n + '"]:checked', form)) {
          var f = $('input[name="' + n + '"]', form).closest('.field');
          fail(f); first = first || f;
        }
      });
      var ownedVal = $('input[name="owned"]:checked', form);
      if (ownedVal && ownedVal.value === 'No' && !$('input[name="buy"]:checked', form)) {
        var bf = $('input[name="buy"]', form).closest('.field');
        fail(bf); first = first || bf;
      }

      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var focusable = first.querySelector('input, select, textarea');
        if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 320);
        return;
      }

      // ---- map onto the client's existing Google Form ----
      var pick = function (n) { var c = $('input[name="' + n + '"]:checked', form); return c ? c.value : ''; };
      var BUY_YES = 'Yes (Extra $50 fee, plus total material cost)';
      var BUY_NO  = 'No, I will purchase and provide all the required decorations.';
      var AROUND_NO = 'No, my tree is against a wall/surface and I would only like the exposed parts to be decorated.';

      var owned = pick('owned');
      var buy = owned === 'No' ? (pick('buy') === 'Yes' ? BUY_YES : BUY_NO) : BUY_NO;
      var around = pick('around') === 'Yes' ? 'Yes' : AROUND_NO;

      var service = $('#f-service') ? $('#f-service').value : '';
      var notes = $('#f-notes') ? $('#f-notes').value.trim() : '';
      var combined = (service ? 'Service requested: ' + service + '\n' : '') +
                     (notes ? notes + '\n' : '') +
                     'Sent from roseartanddecor website (' + (lang === 'es' ? 'Espanol' : 'English') + ')';

      var data = new URLSearchParams();
      data.append('entry.1000027', name.value.trim());
      data.append('entry.1000057', email.value.trim());
      data.append('entry.967112212', phone.value.trim());
      data.append('entry.602909070', ($('#f-instagram') ? $('#f-instagram').value.trim() : ''));
      data.append('entry.2055232012', loc.value.trim());
      data.append('entry.824677231', size.value.trim());
      data.append('entry.1000020', owned);
      data.append('entry.1000022', buy);
      data.append('entry.1000025', around);
      data.append('entry.1000026', pick('contact'));
      data.append('entry.1000023', combined);
      data.append('fvv', '1');
      data.append('pageHistory', '0');
      data.append('submit', 'Submit');

      var btn = $('#submitBtn');
      if (btn) { btn.disabled = true; btn.textContent = lang === 'es' ? 'Enviando…' : 'Sending…'; }

      var done = function () {
        form.classList.add('sent');
        var ok = $('#formDone');
        if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      };

      fetch(GFORM, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString()
      }).then(done).catch(function () {
        // fallback: hidden iframe post, same payload
        var f = document.createElement('form');
        f.action = GFORM; f.method = 'POST'; f.target = 'gformSink'; f.style.display = 'none';
        data.forEach(function (v, k) {
          var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
        });
        var sink = document.createElement('iframe');
        sink.name = 'gformSink'; sink.style.display = 'none';
        document.body.appendChild(sink); document.body.appendChild(f);
        f.submit();
        setTimeout(done, 900);
      });
    });
  }

  /* ------------------------------------------------------- 7. reveal ------ */
  var rv = $$('.rv');
  if (rv.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* -------------------------------------------------------- 8. year ------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
