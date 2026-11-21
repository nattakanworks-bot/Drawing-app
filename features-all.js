/*! features-all.js — เชื่อมฟีเจอร์ที่แนะนำทั้งหมดเข้ากับ API ของแอป */
(function () {
  function $(id) { return document.getElementById(id); }
  function app() { return window.__app || null; }

  function toast(t) {
    var n = $('featToast');
    if (!n) {
      n = document.createElement('div');
      n.id = 'featToast';
      n.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#1c1917;color:#fff;padding:10px 16px;border-radius:10px;z-index:10001;font-size:13px;max-width:92vw';
      document.body.appendChild(n);
    }
    n.textContent = t;
    n.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { n.style.display = 'none'; }, 3200);
  }

  function callPath(parts) {
    var o = app();
    if (!o) return false;
    for (var i = 0; i < parts.length; i++) {
      if (o == null) return false;
      o = o[parts[i]];
    }
    if (typeof o === 'function') {
      try { o(); return true; } catch (e) {
        try { o(app()); return true; } catch (e2) { console.warn(parts, e2); }
      }
    }
    return false;
  }

  function ensure3D() {
    try {
      if (app() && typeof app().setMode === 'function') app().setMode('3d');
      else {
        var b = document.querySelector('button[data-mode="3d"]');
        if (b) b.click();
      }
    } catch (e) {}
  }

  function doDwg() {
    var a = app();
    if (!a || typeof a.handleFile !== 'function') {
      toast('DWG: เปิดผ่านเมนูไฟล์ — แนะนำแปลงเป็น DXF ก่อนเพื่อผลลัพธ์ดีที่สุด');
      return;
    }
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.dwg,.dxf,application/acad,image/vnd.dwg';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var name = (f.name || '').toLowerCase();
      if (name.endsWith('.dwg')) {
        toast('ไฟล์ DWG: แอปจะพยายามเปิด — ถ้าไม่ครบให้แปลงเป็น DXF ก่อน');
      }
      try { a.handleFile(f); toast('กำลังเปิดไฟล์: ' + f.name); }
      catch (e) { toast('เปิดไม่สำเร็จ — แปลงเป็น DXF แล้วเปิดใหม่'); }
    };
    inp.click();
  }

  function doOcr() {
    var a = app();
    if (!a) { toast('ยังไม่พร้อม'); return; }
    var ok = false;
    if (typeof a.runRead === 'function') { try { a.runRead(); ok = true; } catch (e) {} }
    if (!ok && typeof a.ocrCanvas === 'function') { try { a.ocrCanvas(); ok = true; } catch (e) {} }
    if (!ok && typeof a.runDetection === 'function') { try { a.runDetection(); ok = true; } catch (e) {} }
    toast(ok ? 'เริ่ม OCR ไทย+อังกฤษ / อ่านตัวอักษรบนแบบ' : 'เปิดแบบก่อน แล้วใช้เครื่องมืออ่านข้อความในแอป');
  }

  function doCheck() {
    var a = app();
    if (!a) return;
    var ok = false;
    if (typeof a.runChecks === 'function') { try { a.runChecks(); ok = true; } catch (e) {} }
    if (typeof a.clashCheck === 'function') { try { a.clashCheck(); ok = true; } catch (e) {} }
    if (typeof a.verifyAction === 'function') { try { a.verifyAction(); ok = true; } catch (e) {} }
    toast(ok ? 'รันตรวจอัตโนมัติ / Clash แล้ว' : 'เปิดแบบและแปลง 3D ก่อน แล้วค่อยตรวจ');
  }

  function doGlb() {
    var a = app();
    if (!a || !a.exp) { toast('ไม่พบตัวส่งออก 3D'); return; }
    ensure3D();
    setTimeout(function () {
      var ok = false;
      try { if (typeof a.exp.glb === 'function') { a.exp.glb(); ok = true; } } catch (e) {}
      if (!ok) try { if (typeof a.exp.obj === 'function') { a.exp.obj(); ok = true; } } catch (e) {}
      toast(ok ? 'กำลังส่งออกโมเดล 3D (GLB/OBJ)' : 'ต้องมีโมเดล 3D ก่อน (แปลง 2D→3D)');
    }, 200);
  }

  function doDiff() {
    var a = app();
    if (!a) return;
    var ok = false;
    if (typeof a.compareSheets === 'function') { try { a.compareSheets(); ok = true; } catch (e) {} }
    toast(ok ? 'เปิดเปรียบเทียบแบบ (Diff)' : 'ต้องมีอย่างน้อย 2 แผ่นแบบเพื่อเปรียบเทียบ');
  }

  function doLayer() {
    var a = app();
    var ok = false;
    if (a && typeof a.renderPanel === 'function') { try { a.renderPanel(); ok = true; } catch (e) {} }
    var panel = document.getElementById('panel') || document.getElementById('btnPanel');
    if (panel && panel.click) { try { panel.click(); ok = true; } catch (e) {} }
    toast(ok ? 'เปิดแผงเลเยอร์ / คุณสมบัติ' : 'ใช้แผงด้านขวาเพื่อจัดการเลเยอร์');
  }

  function doSymbol() {
    var a = app();
    var ok = false;
    if (a && typeof a.teachSymbol === 'function') { try { a.teachSymbol(); ok = true; } catch (e) {} }
    if (!ok && a && typeof a.onTeach === 'function') { try { a.onTeach(); ok = true; } catch (e) {} }
    if (!ok && a && typeof a.learnAction === 'function') { try { a.learnAction(); ok = true; } catch (e) {} }
    var learn = document.getElementById('btnLearn');
    if (!ok && learn) { learn.click(); ok = true; }
    toast(ok ? 'เปิดโหมดสัญลักษณ์ / สอนสัญลักษณ์' : 'ใช้โหมดเรียนรู้เพื่อสอนสัญลักษณ์');
  }

  function doCloud() {
    var a = app();
    var ok = false;
    if (a && typeof a.makeBackup === 'function') { try { a.makeBackup(); ok = true; } catch (e) {} }
    if (!ok) {
      var mi = document.getElementById('miBackup') || document.getElementById('miExport');
      if (mi) { mi.click(); ok = true; }
    }
    toast(ok
      ? 'สำรอง/ส่งออกโปรเจกต์แล้ว (แทนซิงค์คลาวด์ — ข้อมูลอยู่เครื่องคุณ)'
      : 'ใช้เมนูไฟล์ → สำรองข้อมูล / ส่งออกโปรเจกต์');
  }

  function doPerf() {
    var a = app();
    try {
      if (a && a.V3fn && typeof a.V3fn.relayoutDims === 'function') a.V3fn.relayoutDims();
    } catch (e) {}
    toast('โหมดประสิทธิภาพ: ลดรายละเอียดมิติ ปิดเลเยอร์ที่ไม่ใช้ แยกแผ่นใหญ่');
  }

  var HANDLERS = {
    dwg: doDwg,
    ocr: doOcr,
    check: doCheck,
    glb: doGlb,
    diff: doDiff,
    layer: doLayer,
    symbol: doSymbol,
    cloud: doCloud,
    perf: doPerf
  };

  function onFeatClick(e) {
    var btn = e.target.closest && e.target.closest('[data-feat]');
    if (!btn) return;
    var f = btn.getAttribute('data-feat');
    if (!f || f === 'ar' || f === 'pipe') return;
    if (HANDLERS[f]) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('on');
      HANDLERS[f]();
      setTimeout(function () { btn.classList.remove('on'); }, 800);
    }
  }

  function markReadyButtons() {
    var bar = $('featBar');
    if (!bar) return;
    bar.querySelectorAll('[data-feat]').forEach(function (b) {
      var f = b.getAttribute('data-feat');
      if (['dwg','ocr','check','glb','diff','layer','symbol','cloud','perf','ar','pipe'].indexOf(f) >= 0) {
        b.classList.add('ready');
        b.classList.remove('soon');
      }
    });
  }

  function boot() {
    markReadyButtons();
    var bar = $('featBar');
    if (bar) bar.addEventListener('click', onFeatClick, true);
    try {
      var wt = localStorage.getItem('dwgapp-worktype');
      if (wt && app() && typeof app().setWorkType === 'function') app().setWorkType(wt);
    } catch (e) {}
  }

  function wrapSetWorkType() {
    var a = app();
    if (!a || typeof a.setWorkType !== 'function' || a.setWorkType.__wrapped) return;
    var _sw = a.setWorkType.bind(a);
    a.setWorkType = function (v) {
      try { localStorage.setItem('dwgapp-worktype', v); } catch (e) {}
      return _sw(v);
    };
    a.setWorkType.__wrapped = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); setTimeout(wrapSetWorkType, 500); });
  } else {
    boot();
    setTimeout(wrapSetWorkType, 500);
  }

  window.__featuresAll = {
    doDwg: doDwg, doOcr: doOcr, doCheck: doCheck, doGlb: doGlb,
    doDiff: doDiff, doLayer: doLayer, doSymbol: doSymbol, doCloud: doCloud, doPerf: doPerf
  };
})();
