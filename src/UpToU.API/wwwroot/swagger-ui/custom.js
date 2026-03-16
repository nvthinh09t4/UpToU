/* UpToU – Swagger UI enhancements
   • Persistent bearer-token bar (auto-applies on paste / Enter)
   • Dropdown endpoint selector replaced with tab pills
   • "Try it out" toggle hidden (forms always open in execute mode)
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'uptou_swagger_token';

  // ── Token bar ─────────────────────────────────────────────────────────────

  function injectTokenBar() {
    if (document.getElementById('ctb-bar')) return;

    var topbar = document.querySelector('.topbar');
    if (!topbar) { setTimeout(injectTokenBar, 150); return; }

    var bar = document.createElement('div');
    bar.id = 'ctb-bar';
    bar.innerHTML =
      '<div class="ctb-inner">' +
        '<span class="ctb-key-icon">&#x1F511;</span>' +
        '<label class="ctb-label" for="ctb-input">Bearer Token</label>' +
        '<input id="ctb-input" type="text" spellcheck="false" autocomplete="off"' +
        '  placeholder="Paste your JWT access token here \u2014 press Enter or Apply\u2026" />' +
        '<button id="ctb-apply" type="button">Apply</button>' +
        '<button id="ctb-clear" type="button">Clear</button>' +
        '<span id="ctb-status"></span>' +
      '</div>';

    topbar.insertAdjacentElement('afterend', bar);

    document.getElementById('ctb-apply').onclick = applyToken;
    document.getElementById('ctb-clear').onclick = clearToken;

    var input = document.getElementById('ctb-input');
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyToken(); });
    input.addEventListener('paste',   function ()  { setTimeout(applyToken, 20); });

    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      input.value = saved;
      tryPreauth(saved);
    }
  }

  function applyToken() {
    var raw   = (document.getElementById('ctb-input').value || '').trim();
    var token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) { clearToken(); return; }

    localStorage.setItem(STORAGE_KEY, token);
    tryPreauth(token);
    setStatus('\u2713 Token applied', 'ctb-ok');
  }

  function clearToken() {
    document.getElementById('ctb-input').value = '';
    localStorage.removeItem(STORAGE_KEY);
    tryPreauth('');
    setStatus('Cleared', 'ctb-warn');
  }

  function tryPreauth(token) {
    if (window.ui && window.ui.preauthorizeApiKey) {
      window.ui.preauthorizeApiKey('Bearer', token);
    } else {
      setTimeout(function () { tryPreauth(token); }, 250);
    }
  }

  function setStatus(msg, cls) {
    var el = document.getElementById('ctb-status');
    if (!el) return;
    el.textContent = msg;
    el.className = cls || '';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = ''; el.className = ''; }, 3000);
  }

  // ── Tab navigation ────────────────────────────────────────────────────────

  function watchForTabs() {
    var mo = new MutationObserver(function () {
      var sel = document.querySelector('.topbar-wrapper select');
      if (!sel || document.getElementById('ctb-tabs')) return;
      mo.disconnect();
      buildTabs(sel);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function buildTabs(select) {
    // Hide the original URL controls
    var wrapper = select.closest('.download-url-wrapper') || select.parentElement;
    if (wrapper) {
      ['.download-url-input', '.download-url-button'].forEach(function (sel) {
        var el = wrapper.querySelector(sel);
        if (el) el.style.display = 'none';
      });
    }
    select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px';

    // Build tab strip
    var nav = document.createElement('div');
    nav.id = 'ctb-tabs';

    Array.from(select.options).forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.text;
      if (i === select.selectedIndex) btn.classList.add('active');

      btn.addEventListener('click', function () {
        select.selectedIndex = i;
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
        Array.from(nav.querySelectorAll('button')).forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });

      nav.appendChild(btn);
    });

    // Inject the tab strip into the topbar (right side)
    var tbw = document.querySelector('.topbar-wrapper');
    if (tbw) tbw.appendChild(nav);
    else if (wrapper) wrapper.parentElement.insertBefore(nav, wrapper);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  function boot() {
    injectTokenBar();
    watchForTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 200); });
  } else {
    setTimeout(boot, 200);
  }
})();
