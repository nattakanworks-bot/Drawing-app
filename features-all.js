/*! features-all.js */
(function () {
  function $(id) { return document.getElementById(id); }
  function app() { return window.__app || null; }
  function toast(msg) {
    var el = $('featToast');
    if (!el) return;
    el.textContent = msg; el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 2800);
  }
  function doDwg() {
    toast('เปิดไฟล์ DXF/DWG (แนะนำ DXF)');
    var inp = $('inDxf') || $('inAny');
    if (inp) inp.click();
  }
  function doOcr() {
    if (window.OcrSheet && OcrSheet.open) { OcrSheet.open(); return; }
    var a = app();
    try {
      if (a && typeof a.runRead === 'function') { a.runRead(); toast('รัน OCR'); return; }
    } catch (e) {}
    toast('OCR: เปิดแผง OCR แผ่น');
  }
  function doCheck() {
    var a = app();
    try {
      if (a && typeof a.runChecks === 'function') { a.runChecks(); toast('ตรวจอัตโนมัติ'); }
      else toast('Check ยังไม่ครบ');
    } catch (e) { toast(e.message); }
  }
  function doGlb() {
    var a = app();
    try {
      if (a && a.exp && a.exp.glb) { a.exp.glb(); toast('ส่งออก GLB'); }
      else if (a && a.exp && a.exp.obj) { a.exp.obj(); toast('ส่งออก OBJ'); }
      else toast('ยังไม่มีตัวส่งออก 3D');
    } catch (e) { toast(e.message); }
  }
  function doDiff() {
    var a = app();
    try {
      if (a && a.compareSheets) { a.compareSheets(); toast('เปรียบเทียบแบบ'); }
      else toast('Diff ยังไม่พร้อม');
    } catch (e) { toast(e.message); }
  }
  function doLayer() { toast('เลเยอร์: ใช้แผงในแอป'); }
  function doCloud() {
    var a = app();
    try {
      if (a && a.makeBackup) { a.makeBackup(); toast('สำรอง'); }
      else toast('สำรองในเครื่อง');
    } catch (e) { toast(e.message); }
  }
  function doPerf() {
    try {
      var a = app();
      if (a && a.V3 && a.V3.opts) {
        a.V3.opts.dims = false; a.V3.opts.edges = false;
        if (a.V3fn && a.V3fn.rebuild) a.V3fn.rebuild();
        toast('เบาโหลด 3D');
      }
    } catch (e) {}
  }
  function onFeatClick(e) {
    var btn = e.target.closest && e.target.closest('[data-feat]');
    if (!btn) return;
    var f = btn.getAttribute('data-feat');
    if (['ar','mesh3d','symbol','fitting','iso','mto','ai','pipe','fitdims','v3pipe','ocrsheet','isoplace','ready3d'].indexOf(f) >= 0) return;
    e.preventDefault();
    var map = { dwg: doDwg, ocr: doOcr, check: doCheck, glb: doGlb, diff: doDiff, layer: doLayer, cloud: doCloud, perf: doPerf };
    if (map[f]) map[f]();
  }
  function boot() {
    var bar = $('featBar');
    if (bar) bar.addEventListener('click', onFeatClick);
  }
  function loadScript(src) {
    if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) return;
    var s = document.createElement('script');
    s.src = src; s.async = true;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  var v = '20261122n';
  ['mesh-builder.js','fittings-kb.js','fittings-dims.js','iso-reader.js','mto-engine.js','ai-assist.js','pipe-domain.js','v3-piping.js','ocr-sheet.js','iso-place3d.js','ready3d.js'].forEach(function (f) {
    loadScript(f + '?v=' + v);
  });
  // เมนูหมวดโหลดทีหลัง เพื่อรอปุ่มอื่นสร้างก่อน
  setTimeout(function () { loadScript('feat-menu.js?v=' + v); }, 2200);
  window.__featuresAll = { doDwg: doDwg, doOcr: doOcr, doCheck: doCheck, doGlb: doGlb, doDiff: doDiff, doLayer: doLayer, doCloud: doCloud, doPerf: doPerf };
})();
