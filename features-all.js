/*! features-all.js — เชื่อมฟีเจอร์ที่แนะนำทั้งหมดเข้ากับ API ของแอป */
(function () {
  function $(id) { return document.getElementById(id); }
  function app() { return window.__app || null; }

  function toast(msg) {
    var el = $('featToast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 2800);
  }

  function doDwg() {
    var a = app();
    toast('เปิดไฟล์ DXF/DWG (แนะนำ DXF)');
    var inp = $('inDxf') || $('inAny');
    if (inp) inp.click();
  }
  function doOcr() {
    var a = app();
    try {
      if (a && typeof a.runRead === 'function') { a.runRead(); toast('รัน OCR'); return; }
      if (a && typeof a.ocrCanvas === 'function') { a.ocrCanvas(); toast('OCR canvas'); return; }
    } catch (e) {}
    toast('OCR: ใช้เครื่องมือในแอป หรือโหมดเรียนรู้');
  }
  function doCheck() {
    var a = app();
    try {
      if (a && typeof a.runChecks === 'function') { a.runChecks(); toast('ตรวจอัตโนมัติ');
      } else if (a && typeof a.clashCheck === 'function') { a.clashCheck(); toast('Clash check'); }
      else toast('ยังไม่มีตัวตรวจครบ');
    } catch (e) { toast('Check: ' + e.message); }
  }
  function doGlb() {
    var a = app();
    try {
      if (a && a.exp && typeof a.exp.glb === 'function') { a.exp.glb(); toast('ส่งออก GLB'); }
      else if (a && a.exp && typeof a.exp.obj === 'function') { a.exp.obj(); toast('ส่งออก OBJ'); }
      else toast('ยังไม่มีตัวส่งออก 3D');
    } catch (e) { toast('GLB: ' + e.message); }
  }
  function doDiff() {
    var a = app();
    try {
      if (a && typeof a.compareSheets === 'function') { a.compareSheets(); toast('เปรียบเทียบแบบ'); }
      else toast('Diff ยังไม่พร้อม');
    } catch (e) { toast('Diff: ' + e.message); }
  }
  function doLayer() {
    toast('เลเยอร์: ใช้แผงเครื่องมือ / Layer ในแอป');
  }
  function doSymbol() {
    if (window.SymbolLib && typeof SymbolLib.open === 'function') {
      SymbolLib.open();
      return;
    }
    toast('คลังสัญลักษณ์: รอโหลด symbol-lib');
  }
  function doCloud() {
    var a = app();
    try {
      if (a && typeof a.makeBackup === 'function') { a.makeBackup(); toast('สำรองข้อมูล');
      } else if (a && a.SAVE) { toast('ใช้ปุ่มเซฟลงเครื่อง');
      } else toast('Cloud: สำรองในเครื่อง');
    } catch (e) { toast('Cloud: ' + e.message); }
  }
  function doPerf() {
    toast('โหมดประสิทธิภาพ: ลด dims/edges ใน 3D ถ้ามีในตัวเลือก');
    try {
      var a = app();
      if (a && a.V3 && a.V3.opts) {
        a.V3.opts.dims = false;
        a.V3.opts.edges = false;
        if (a.V3fn && a.V3fn.rebuild) a.V3fn.rebuild();
        toast('ปิด dims/edges เพื่อเบาโหลด');
      }
    } catch (e) {}
  }

  function onFeatClick(e) {
    var btn = e.target.closest && e.target.closest('[data-feat]');
    if (!btn) return;
    var f = btn.getAttribute('data-feat');
    if (f === 'ar' || f === 'mesh3d') return; // AR / Mesh มี handler เอง
    e.preventDefault();
    var map = {
      dwg: doDwg, ocr: doOcr, check: doCheck, glb: doGlb,
      diff: doDiff, layer: doLayer, symbol: doSymbol,
      cloud: doCloud, perf: doPerf
    };
    if (map[f]) map[f]();
  }

  function wrapSetWorkType() {
    var a = app();
    if (!a || typeof a.setWorkType !== 'function' || a.setWorkType.__featWrapped) return;
    var orig = a.setWorkType.bind(a);
    a.setWorkType = function () {
      var r = orig.apply(a, arguments);
      try {
        if (window.SymbolLib) console.info('[features] work type + symbol lib ready');
      } catch (e) {}
      return r;
    };
    a.setWorkType.__featWrapped = true;
  }

  function boot() {
    var bar = $('featBar');
    if (bar) bar.addEventListener('click', onFeatClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); setTimeout(wrapSetWorkType, 500); });
  } else {
    boot();
    setTimeout(wrapSetWorkType, 500);
  }

  // โหลดตัวสร้าง mesh 3D จากคลังสัญลักษณ์
  (function loadMeshBuilder() {
    if (document.querySelector('script[src="mesh-builder.js"]')) return;
    var s = document.createElement('script');
    s.src = 'mesh-builder.js';
    s.async = true;
    document.head.appendChild(s);
  })();

  window.__featuresAll = {
    doDwg: doDwg, doOcr: doOcr, doCheck: doCheck, doGlb: doGlb,
    doDiff: doDiff, doLayer: doLayer, doSymbol: doSymbol, doCloud: doCloud, doPerf: doPerf
  };
})();
