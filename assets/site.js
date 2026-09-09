/* ==========================================================================
   Rose Art & Decor / site.js
   Mechanics taken from builda-mechanics.md: scroll restoration, drawer,
   accordion with resize resync, anchor hash strip, branded form validation,
   CTA intent routing. New to this build: the EN/ES language engine and the
   seasonal calendar section.
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

    var other = lang === 'en' ? 'es' : 'en';
    $$('.lang-sw').forEach(function (b) {
      b.setAttribute('data-set', other);
      b.textContent = other.toUpperCase();
      b.setAttribute('aria-label', other === 'es' ? 'Cambiar a español' : 'Switch to English');
    });
    if (typeof closeModal === 'function') closeModal();

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

  $$('.lang-sw').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-set')); });
  });

  /* ------------------------------------------------------------- 2. drawer -- */
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
  $$('a[href^="#"]:not(.skip-link)').forEach(function (link) {
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

  /* ------------------------------------------------------- 5. lightbox ---- */
  var figs = $$('.work-grid figure');
  var lb = $('#lightbox');
  if (lb && figs.length) {
    var lbImg = $('#lbImg'), lbCap = $('#lbCap');
    var visible = function () { return figs; };
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
    // ---- three screens: what you need, the tree, then who you are (Cooper Crane lift-ticket pattern)
    var steps = $$('.qf-step', form);
    var bars = $$('.qf-bars i');
    var countEl = $('#qfCount');
    var cur = 0;
    function showStep(n) {
      cur = n;
      steps.forEach(function (st, i) { st.classList.toggle('on', i === n); });
      bars.forEach(function (b, i) { b.classList.toggle('on', i <= n); });
      if (countEl) {
        var en = 'Step ' + (n + 1) + ' of ' + steps.length, es = 'Paso ' + (n + 1) + ' de ' + steps.length;
        countEl.setAttribute('data-en', en); countEl.setAttribute('data-es', es);
        countEl.textContent = lang === 'es' ? es : en;
      }
      var shell = form.closest('.qf');
      if (shell && n > 0) shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function markFirst(first) {
      if (!first) return true;
      var fo = first.querySelector('input, select, textarea');
      if (fo) fo.focus({ preventScroll: true });
      return false;
    }
    function needText(sel, box) {
      var el = $(sel, form); if (!el) return null;
      var f = el.closest('.field');
      if (!el.value.trim()) { f.classList.add('err'); box.first = box.first || f; }
      return el;
    }
    function needRadio(name, box) {
      if (!$('input[name="' + name + '"]:checked', form)) {
        var f = $('input[name="' + name + '"]', form).closest('.field');
        f.classList.add('err'); box.first = box.first || f;
      }
    }
    // step 1: what you need
    function validateStep1() {
      var box = { first: null };
      $$('.field', steps[0]).forEach(function (f) { f.classList.remove('err'); });
      needRadio('owned', box);
      var ownedVal = $('input[name="owned"]:checked', form);
      if (ownedVal && ownedVal.value === 'No') needRadio('buy', box);
      needRadio('around', box);
      return markFirst(box.first);
    }
    // step 2: the tree
    function validateStep2() {
      var box = { first: null };
      $$('.field', steps[1]).forEach(function (f) { f.classList.remove('err'); });
      needText('#f-city', box);
      needText('#f-size', box);
      return markFirst(box.first);
    }
    // step 3: who you are
    function validateStep3() {
      var box = { first: null };
      $$('.field', steps[2]).forEach(function (f) { f.classList.remove('err'); });
      needText('#f-name', box);
      var email = needText('#f-email', box);
      var phone = needText('#f-phone', box);
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        var ef = email.closest('.field'); ef.classList.add('err'); box.first = box.first || ef;
      }
      if (phone && phone.value.trim() && phone.value.replace(/\D/g, '').length < 10) {
        var pf = phone.closest('.field'); pf.classList.add('err'); box.first = box.first || pf;
      }
      needRadio('contact', box);
      return markFirst(box.first);
    }
    var validators = [validateStep1, validateStep2, validateStep3];
    $$('.qf-next', form).forEach(function (b) {
      b.addEventListener('click', function () { if (validators[cur]()) showStep(Math.min(cur + 1, steps.length - 1)); });
    });
    $$('.qf-back', form).forEach(function (b) {
      b.addEventListener('click', function () { showStep(Math.max(cur - 1, 0)); });
    });
    // Enter inside a text field advances instead of submitting early
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < steps.length - 1) {
        e.preventDefault(); if (validators[cur]()) showStep(cur + 1);
      }
    });
    // phone formats itself as you type: 305-555-1234
    var phoneEl = $('#f-phone', form);
    if (phoneEl) {
      phoneEl.addEventListener('input', function () {
        var d = phoneEl.value.replace(/\D/g, '').slice(0, 10);
        var out = d;
        if (d.length > 6) out = d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
        else if (d.length > 3) out = d.slice(0, 3) + '-' + d.slice(3);
        phoneEl.value = out;
      });
    }

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
      for (var i = 0; i < validators.length; i++) {
        if (!validators[i]()) { showStep(i); return; }
      }
      var name = $('#f-name', form), email = $('#f-email', form), phone = $('#f-phone', form);
      var city = $('#f-city', form), size = $('#f-size', form);
      var locStr = city.value.trim();

      // ---- map onto the client's existing Google Form ----
      var pick = function (n) { var c = $('input[name="' + n + '"]:checked', form); return c ? c.value : ''; };
      // Must match the option text in Rose's Google Form exactly. Her form still says $50;
      // update this string the day she edits the form to $60, not before.
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
      data.append('entry.2055232012', locStr);
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
      if (btn) { btn.disabled = true; btn.textContent = lang === 'es' ? 'Enviando' : 'Sending'; }

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


  /* ------------------------------------------------ 8. service showcase --- */
  var its = $$('.show-it');
  if (its.length) {
    function setPanel(id) {
      its.forEach(function (b) {
        if (b.getAttribute('data-panel') === id) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      $$('.panel').forEach(function (pn) { pn.classList.toggle('active', pn.id === id); });
    }
    its.forEach(function (b) {
      ['mouseenter', 'focus'].forEach(function (ev) {
        b.addEventListener(ev, function () { setPanel(b.getAttribute('data-panel')); });
      });
    });
  }

  /* ------------------------------------------------ 9. occasion modal ----- */
  var mdl = $('#sznModal');
  var lastFocus = null;
  function closeModal() {
    if (!mdl || !mdl.classList.contains('open')) return;
    mdl.classList.remove('open');
    document.body.classList.remove('drawer-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (mdl) {
    var media = $('#mdlMedia'), mMo = $('#mdlMo'), mTitle = $('#mdlTitle'), mText = $('#mdlText');
    var mQuote = $('#mdlQuote'), mLink = $('#mdlLink');
    function openModal(card) {
      lastFocus = card;
      var plate = card.querySelector('.plate');
      media.innerHTML = '';
      if (plate) {
        var c = plate.cloneNode(true);
        var im = c.querySelector('img');
        if (im) { im.setAttribute('sizes', '(max-width:900px) 92vw, 44vw'); im.removeAttribute('loading'); }
        media.appendChild(c);
      }
      var mo = card.querySelector('.szn-mo'), t = card.querySelector('h3');
      var de = card.querySelector('.szn-de'), more = card.querySelector('.szn-more span');
      var link = card.querySelector('.szn-link');
      mMo.textContent = mo ? mo.textContent : '';
      mTitle.textContent = t ? t.textContent : '';
      mText.textContent = (de ? de.textContent : '') + (more ? ' ' + more.textContent : '');
      mQuote.setAttribute('data-want', card.getAttribute('data-want') || '');
      if (link) { mLink.href = link.getAttribute('data-href'); mLink.textContent = link.textContent; mLink.style.display = ''; }
      else { mLink.style.display = 'none'; }
      mdl.classList.add('open');
      document.body.classList.add('drawer-open');
      $('#mdlClose').focus();
    }
    $$('.szn').forEach(function (card) {
      card.addEventListener('click', function () { openModal(card); });
    });
    $('#mdlClose').addEventListener('click', closeModal);
    mdl.addEventListener('click', function (e) { if (e.target === mdl) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mdl.classList.contains('open')) closeModal();
    });
    mQuote.addEventListener('click', function () {
      var sel = $('#f-service'), v = mQuote.getAttribute('data-want');
      if (sel && v) Array.prototype.forEach.call(sel.options, function (o) { if (o.value === v) sel.selectedIndex = o.index; });
      closeModal();
    });
  }

  /* -------------------------------------------------------- 7. year ------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
