/*! symbol-lib.js — คลังสัญลักษณ์งานท่อ + สูตร mesh 3D */
(function () {
  var LIB = null;
  var INDEX = {};

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function categoryColor(c) {
    return ({
      pipe: '#60a5fa', fitting: '#34d399', flange: '#fbbf24', valve: '#f87171',
      weld: '#a3a3a3', support: '#c084fc', special: '#fb923c', instrument: '#22d3ee'
    })[c] || '#94a3b8';
  }

  function rebuildIndex() {
    INDEX = {};
    if (!LIB || !LIB.symbols) return;
    LIB.symbols.forEach(function (sy) {
      (sy.aliases || []).forEach(function (a) { INDEX[norm(a)] = sy; });
      INDEX[norm(sy.id)] = sy;
      INDEX[norm(sy.en)] = sy;
      INDEX[norm(sy.th)] = sy;
    });
  }

  function lookup(q) {
    if (!q || !LIB) return null;
    var n = norm(q);
    if (INDEX[n]) return INDEX[n];
    var keys = Object.keys(INDEX);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(n) >= 0 || n.indexOf(keys[i]) >= 0) return INDEX[keys[i]];
    }
    return null;
  }

  function meshParams(symbolId, nps) {
    var sy = lookup(symbolId);
    if (!sy) return null;
    var od = (LIB.nps_hint_mm && LIB.nps_hint_mm[String(nps)]) || 114.3;
    return {
      id: sy.id, th: sy.th, en: sy.en, category: sy.category,
      recipe: sy.mesh3d || {}, od_mm: od, r_mm: od / 2, color: categoryColor(sy.category)
    };
  }

  function listByCategory() {
    var map = {};
    if (!LIB) return map;
    (LIB.symbols || []).forEach(function (sy) {
      (map[sy.category] = map[sy.category] || []).push(sy);
    });
    return map;
  }

  function registerWithApp() {
    window.__SYMBOL_LIB = {
      raw: LIB, lookup: lookup, meshParams: meshParams,
      listByCategory: listByCategory, all: (LIB && LIB.symbols) || []
    };
    try {
      var a = window.__app;
      if (a && a.SYMS && typeof a.SYMS === 'object' && LIB) {
        LIB.symbols.forEach(function (sy) {
          try {
            if (!a.SYMS[sy.id]) a.SYMS[sy.id] = { th: sy.th, en: sy.en, aliases: sy.aliases };
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  function openBrowser() {
    if (!LIB) {
      alert('กำลังโหลดคลังสัญลักษณ์… ลองใหม่ใน 1 วินาที');
      return;
    }
    var existing = document.getElementById('symLibPanel');
    if (existing) { existing.classList.toggle('open'); return; }
    var css = document.createElement('style');
    css.textContent = '#symLibPanel{display:none;position:fixed;left:12px;top:110px;bottom:56px;width:min(420px,96vw);z-index:9600;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.2);overflow:auto;font-size:12px}#symLibPanel.open{display:block}#symLibPanel .sh{position:sticky;top:0;background:#0f766e;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}#symLibPanel .sh h3{margin:0;font-size:14px}#symLibPanel .sh button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}#symLibPanel .sb{padding:10px 12px}#symLibPanel .cat{margin:10px 0 4px;font-weight:700;color:#0f766e}#symLibPanel .row{display:flex;gap:8px;border-bottom:1px solid #eee;padding:6px 0;align-items:flex-start}#symLibPanel .dot{width:10px;height:10px;border-radius:50%;margin-top:4px;flex:0 0 auto}#symLibPanel .meta{opacity:.75;font-size:11px}#symLibPanel input{width:100%;padding:8px;border:1px solid #c5d0dc;border-radius:8px;margin-bottom:8px;box-sizing:border-box}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'symLibPanel';
    d.className = 'open';
    d.innerHTML = '<div class="sh"><h3>🔣 คลังสัญลักษณ์ 3D (' + (LIB.count || 0) + ')</h3><button type="button" id="symLibClose">ปิด</button></div><div class="sb"><input id="symLibQ" placeholder="ค้นหา เช่น gate, ข้องอ, flange…"/><div id="symLibBody"></div></div>';
    document.body.appendChild(d);
    document.getElementById('symLibClose').onclick = function () { d.classList.remove('open'); };
    function render(filter) {
      var body = document.getElementById('symLibBody');
      var f = norm(filter);
      var by = listByCategory();
      var html = '';
      Object.keys(by).forEach(function (cat) {
        var rows = by[cat].filter(function (sy) {
          if (!f) return true;
          var blob = norm([sy.id, sy.th, sy.en].concat(sy.aliases || []).join(' '));
          return blob.indexOf(f) >= 0;
        });
        if (!rows.length) return;
        html += '<div class="cat">' + cat + ' (' + rows.length + ')</div>';
        rows.forEach(function (sy) {
          html += '<div class="row"><span class="dot" style="background:' + categoryColor(sy.category) + '"></span><div><b>' + sy.th + '</b> · ' + sy.en +
            '<div class="meta">' + sy.id + ' · mesh: ' + (sy.mesh3d && sy.mesh3d.type) + ' · ' + (sy.aliases || []).slice(0, 6).join(', ') + '</div></div></div>';
        });
      });
      body.innerHTML = html || '<div class="meta">ไม่พบ</div>';
    }
    render('');
    document.getElementById('symLibQ').oninput = function (e) { render(e.target.value); };
  }

  function load() {
    fetch('symbol-lib.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        LIB = data;
        rebuildIndex();
        registerWithApp();
        console.info('[symbol-lib] loaded', LIB.count, 'symbols');
      })
      .catch(function (e) {
        console.warn('[symbol-lib] load failed', e);
      });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-feat="symbol"]');
    if (!t) return;
    setTimeout(openBrowser, 50);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();

  window.SymbolLib = {
    open: openBrowser,
    lookup: lookup,
    meshParams: meshParams,
    get data() { return LIB; }
  };
})();
