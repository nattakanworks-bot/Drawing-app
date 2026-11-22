/*! feat-menu.js — จัดปุ่ม data-feat เป็นหมวดหมู่ ลดความรกของแถบ */
(function () {
  var CATEGORIES = [
    {
      id: 'file',
      th: 'ไฟล์',
      en: 'File',
      icon: '📁',
      feats: ['dwg', 'cloud']
    },
    {
      id: 'read',
      th: 'อ่านแบบ',
      en: 'Read',
      icon: '🔤',
      feats: ['ocr', 'ocrsheet', 'iso', 'mto', 'ai']
    },
    {
      id: 'pipe',
      th: 'ท่อ / Fitting',
      en: 'Pipe',
      icon: '🔩',
      feats: ['fitting', 'fitdims', 'pipe', 'symbol']
    },
    {
      id: 'v3',
      th: '3D / โมเดล',
      en: '3D',
      icon: '🧊',
      feats: ['mesh3d', 'v3pipe', 'isoplace', 'ready3d', 'glb', 'ar']
    },
    {
      id: 'tools',
      th: 'เครื่องมือ',
      en: 'Tools',
      icon: '🛠️',
      feats: ['check', 'diff', 'layer', 'perf']
    }
  ];

  var STYLE = [
    '#featCatBar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:4px 0;max-width:100%}',
    '#featCatBar .fcat{position:relative;flex:0 0 auto}',
    '#featCatBar .fcat > button.fcatBtn{',
    'border:1px solid #c5d0dc;background:#fff;border-radius:10px;padding:6px 10px;',
    'font-size:12px;font-weight:600;cursor:pointer;color:#1c1917;',
    'display:inline-flex;align-items:center;gap:4px;white-space:nowrap}',
    '#featCatBar .fcat > button.fcatBtn:hover{background:#f1f5f9}',
    '#featCatBar .fcat.open > button.fcatBtn{background:#0f766e;color:#fff;border-color:#0f766e}',
    '#featCatBar .fcatPanel{',
    'display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:20040;',
    'min-width:200px;max-width:min(320px,92vw);',
    'background:#fff;border:1px solid #c5d0dc;border-radius:12px;',
    'box-shadow:0 12px 32px rgba(0,0,0,.18);padding:6px;',
    'max-height:60vh;overflow:auto}',
    '#featCatBar .fcat.open .fcatPanel{display:block}',
    '#featCatBar .fcatPanel .fb{',
    'display:flex !important;width:100%;justify-content:flex-start;',
    'margin:2px 0;border-radius:8px;text-align:left}',
    '#featBar.featBarHiddenOriginal{',
    'position:absolute !important;left:-9999px !important;width:1px !important;height:1px !important;',
    'overflow:hidden !important;opacity:0 !important;pointer-events:none !important}',
    '@media (max-width:700px){#featCatBar .fcat > button.fcatBtn .fcatEn{display:none}}'
  ].join('');

  function ensureCss() {
    if (document.getElementById('featMenuCss')) return;
    var s = document.createElement('style');
    s.id = 'featMenuCss';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function findFeatButton(feat) {
    return document.querySelector('#featBar [data-feat="' + feat + '"], [data-feat="' + feat + '"]');
  }

  function closeAll(except) {
    document.querySelectorAll('#featCatBar .fcat.open').forEach(function (el) {
      if (el !== except) el.classList.remove('open');
    });
  }

  function build() {
    var bar = document.getElementById('featBar');
    if (!bar) return false;
    if (document.getElementById('featCatBar')) return true;

    ensureCss();

    var wrap = document.createElement('div');
    wrap.id = 'featCatBar';
    wrap.setAttribute('role', 'toolbar');
    wrap.setAttribute('aria-label', 'หมวดเครื่องมือ');

    CATEGORIES.forEach(function (cat) {
      var box = document.createElement('div');
      box.className = 'fcat';
      box.dataset.cat = cat.id;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fcatBtn';
      btn.innerHTML = cat.icon + ' ' + cat.th + ' <span class="fcatEn" style="opacity:.7;font-weight:500">' + cat.en + '</span> ▾';
      btn.setAttribute('aria-expanded', 'false');

      var panel = document.createElement('div');
      panel.className = 'fcatPanel';

      var moved = 0;
      cat.feats.forEach(function (feat) {
        var fb = findFeatButton(feat);
        if (!fb) return;
        // clone visual into panel, keep original hidden for handlers that query featBar
        var clone = fb.cloneNode(true);
        clone.classList.add('inCat');
        // rebind: click clone → click original
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeAll();
          fb.click();
        });
        panel.appendChild(clone);
        moved++;
      });

      if (!moved) return; // หมวดว่าง ไม่โชว์

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = box.classList.contains('open');
        closeAll();
        if (!open) {
          box.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      box.appendChild(btn);
      box.appendChild(panel);
      wrap.appendChild(box);
    });

    // ปุ่มที่ไม่อยู่ในหมวดใด — รวมเป็น "อื่น"
    var known = {};
    CATEGORIES.forEach(function (c) {
      c.feats.forEach(function (f) { known[f] = true; });
    });
    var orphans = [];
    bar.querySelectorAll('[data-feat]').forEach(function (fb) {
      var f = fb.getAttribute('data-feat');
      if (f && !known[f]) orphans.push(fb);
    });
    if (orphans.length) {
      var box = document.createElement('div');
      box.className = 'fcat';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fcatBtn';
      btn.textContent = '⋯ อื่น ๆ';
      var panel = document.createElement('div');
      panel.className = 'fcatPanel';
      orphans.forEach(function (fb) {
        var clone = fb.cloneNode(true);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeAll();
          fb.click();
        });
        panel.appendChild(clone);
      });
      btn.onclick = function (e) {
        e.stopPropagation();
        var open = box.classList.contains('open');
        closeAll();
        if (!open) box.classList.add('open');
      };
      box.appendChild(btn);
      box.appendChild(panel);
      wrap.appendChild(box);
    }

    // แทรกแถบหมวดก่อน featBar แล้วซ่อนแถบเดิม
    bar.parentNode.insertBefore(wrap, bar);
    bar.classList.add('featBarHiddenOriginal');

    document.addEventListener('click', function () { closeAll(); });
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });

    return true;
  }

  function boot() {
    // รอปุ่มจากสคริปต์อื่นสร้างก่อน
    var tries = 0;
    function tryBuild() {
      tries++;
      var n = document.querySelectorAll('#featBar [data-feat]').length;
      if (n >= 8 || tries > 25) {
        build();
        return;
      }
      setTimeout(tryBuild, 400);
    }
    tryBuild();
    // สร้างใหม่ถ้ามีปุ่มเพิ่มทีหลัง
    setTimeout(function () {
      if (!document.getElementById('featCatBar')) build();
    }, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.FeatMenu = { rebuild: build, categories: CATEGORIES };
})();
