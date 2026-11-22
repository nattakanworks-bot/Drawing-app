/*! v3-piping.js — เน้นระบบ 3D งาน piping
 * ใช้ FittingsDims + MeshBuilder + __app.convert3d / V3
 */
(function () {
  var STATE = { quality: 'med', autoMesh: true, useRealDims: true, lastCount: 0 };

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) { console.info('[v3-piping]', t); return; }
    el.textContent = t;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 3000);
  }

  function app() { return window.__app || null; }
  function v3() { var a = app(); return a && a.V3 ? a.V3 : null; }

  function qualitySeg() {
    return STATE.quality === 'high' ? 32 : (STATE.quality === 'low' ? 12 : 20);
  }

  /** ดึงขนาดจริงจากตาราง */
  function realParams(symbolId, nps) {
    if (window.FittingsDims && FittingsDims.meshParamsFor) {
      return FittingsDims.meshParamsFor(symbolId, nps);
    }
    if (window.FittingsKB && FittingsKB.dims) {
      var d = FittingsKB.dims(nps);
      return {
        nps: String(nps),
        od_mm: d.od_mm,
        radius_mm: (d.od_mm || 114) / 2,
        radius_m: ((d.od_mm || 114) / 2) / 1000,
        A_mm: d.el90_lr_A_mm,
        C_mm: d.tee_C_mm
      };
    }
    return { nps: String(nps || '4'), od_mm: 114.3, radius_m: 0.057 };
  }

  function switchTo3dView() {
    var a = app();
    try {
      if (a && typeof a.setMode === 'function') { a.setMode('3d'); return true; }
      if (a && typeof a.show3d === 'function') { a.show3d(); return true; }
    } catch (e) {}
    var tabs = document.querySelectorAll('[data-mode], .modeTab, #mode3d, button');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var label = (t.textContent || '') + (t.getAttribute('data-mode') || '');
      if (/\b3d\b/i.test(label) && !/2d|4d/i.test(label)) {
        t.click();
        return true;
      }
    }
    return false;
  }

  function runConvert3d() {
    var a = app();
    if (a && typeof a.convert3d === 'function') {
      toast('กำลังแปลง 2D → 3D…');
      return Promise.resolve(a.convert3d({})).then(function (r) {
        switchTo3dView();
        if (STATE.autoMesh) {
          return rebuildMeshes().then(function () { return r; });
        }
        return r;
      });
    }
    var b = document.getElementById('btnTo3d');
    if (b) {
      b.click();
      if (STATE.autoMesh) setTimeout(function () { rebuildMeshes(); }, 1200);
      return Promise.resolve('clicked');
    }
    return Promise.reject(new Error('ไม่พบ convert3d'));
  }

  function rebuildMeshes() {
    if (window.MeshBuilder && typeof MeshBuilder.buildAll === 'function') {
      toast('สร้าง mesh 3D จากคลัง + ตารางขนาด…');
      return MeshBuilder.buildAll({ quality: STATE.quality, useDims: STATE.useRealDims }).then(function (r) {
        STATE.lastCount = (r && r.count) || 0;
        toast('Mesh 3D: ' + STATE.lastCount + ' ชิ้น');
        return r;
      }).catch(function (e) {
        toast('Mesh: ' + (e && e.message ? e.message : e));
        return null;
      });
    }
    toast('MeshBuilder ยังไม่พร้อม — โหลด mesh-builder.js');
    return Promise.resolve(null);
  }

  /** แสดงตัวอย่าง mesh หนึ่งชิ้นตาม NPS จริง (demo ใน scene) */
  function spawnDemoFitting(symbolId, nps) {
    if (!window.MeshBuilder || !MeshBuilder.buildAll) {
      toast('ต้องมี MeshBuilder');
      return Promise.resolve(null);
    }
    var p = realParams(symbolId, nps);
    toast('ตัวอย่าง ' + symbolId + ' NPS ' + p.nps + ' OD ' + p.od_mm + ' mm');
    // ใช้ buildAll แบบมี filter ถ้ามี — ไม่มีก็ log params
    console.info('[v3-piping] mesh params', symbolId, p);
    if (window.SymbolLib && SymbolLib.meshParams) {
      console.info('[v3-piping] symbol recipe', SymbolLib.meshParams(symbolId, p.nps));
    }
    return rebuildMeshes();
  }

  function perfOff() {
    var a = app();
    try {
      if (a && a.V3 && a.V3.opts) {
        a.V3.opts.dims = false;
        a.V3.opts.edges = false;
        if (a.V3fn && a.V3fn.rebuild) a.V3fn.rebuild();
        toast('ปิด dims/edges เพื่อให้ 3D ลื่น');
      }
    } catch (e) {}
  }

  function wrapConvert() {
    var a = app();
    if (!a || typeof a.convert3d !== 'function' || a.convert3d.__v3pipe) return;
    var orig = a.convert3d.bind(a);
    a.convert3d = function (opts) {
      return Promise.resolve(orig(opts)).then(function (r) {
        if (STATE.autoMesh) {
          setTimeout(function () { rebuildMeshes(); }, 600);
        }
        return r;
      });
    };
    a.convert3d.__v3pipe = true;
  }

  function openPanel() {
    var id = 'v3PipePanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('v3PipeCss')) {
      var css = document.createElement('style');
      css.id = 'v3PipeCss';
      css.textContent = [
        '#v3PipePanel{display:none;position:fixed;right:12px;top:96px;width:min(380px,96vw);max-height:75vh;z-index:20020;',
        'background:#0f172a;color:#e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:auto;font-size:12px}',
        '#v3PipePanel.open{display:block!important}',
        '#v3PipePanel .hd{position:sticky;top:0;background:#1e293b;padding:12px;display:flex;justify-content:space-between;align-items:center;z-index:1}',
        '#v3PipePanel .hd button{border:0;background:#334155;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}',
        '#v3PipePanel .bd{padding:12px;line-height:1.45}',
        '#v3PipePanel .btnrow{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}',
        '#v3PipePanel .btnrow button{border:0;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700;background:#38bdf8;color:#0f172a}',
        '#v3PipePanel .btnrow button.sec{background:#334155;color:#e2e8f0}',
        '#v3PipePanel label{display:flex;align-items:center;gap:8px;margin:6px 0}',
        '#v3PipePanel select{background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:8px;padding:6px}',
        '#v3PipePanel .hint{opacity:.75;font-size:11px;margin-top:8px}'
      ].join('');
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    d.innerHTML =
      '<div class="hd"><div><b>🧊 โหมดเน้น 3D (Piping)</b><div style="opacity:.7;font-size:11px">convert → mesh → ขนาดจริง</div></div>' +
      '<button type="button" id="v3pClose">ปิด</button></div>' +
      '<div class="bd">' +
      '<div class="btnrow">' +
      '<button type="button" id="v3pGo">แปลง 2D → 3D + Mesh</button>' +
      '<button type="button" id="v3pMesh" class="sec">สร้าง Mesh ใหม่</button>' +
      '<button type="button" id="v3pView" class="sec">สลับมุมมอง 3D</button>' +
      '<button type="button" id="v3pPerf" class="sec">เบาโหลด 3D</button></div>' +
      '<label><input type="checkbox" id="v3pAuto" ' + (STATE.autoMesh ? 'checked' : '') + '/> สร้าง Mesh อัตโนมัติหลังแปลง</label>' +
      '<label><input type="checkbox" id="v3pDims" ' + (STATE.useRealDims ? 'checked' : '') + '/> ใช้ตารางขนาดจริง (FittingsDims)</label>' +
      '<label>คุณภาพ mesh <select id="v3pQ"><option value="low">ต่ำ (เร็ว)</option><option value="med">กลาง</option><option value="high">สูง</option></select></label>' +
      '<p class="hint">ลำดับแนะนำ: เปิดแบบ ISO → กดปุ่มด้านบน → หมุนโมเดลในโหมด 3D<br/>' +
      'ขนาดข้องอ/ทีดึงจากตาราง B16.9 ที่สอนไว้ · ตำแหน่งยังขึ้นกับ convert3d ของแอป</p>' +
      '<p>สถานะล่าสุด: mesh <b id="v3pCnt">' + STATE.lastCount + '</b> ชิ้น</p>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('v3pClose').onclick = function () { d.classList.remove('open'); };
    document.getElementById('v3pQ').value = STATE.quality;
    document.getElementById('v3pAuto').onchange = function (e) { STATE.autoMesh = e.target.checked; };
    document.getElementById('v3pDims').onchange = function (e) { STATE.useRealDims = e.target.checked; };
    document.getElementById('v3pQ').onchange = function (e) { STATE.quality = e.target.value; };
    document.getElementById('v3pGo').onclick = function () {
      runConvert3d().then(function () {
        document.getElementById('v3pCnt').textContent = String(STATE.lastCount);
      }).catch(function (e) { toast(e.message || String(e)); });
    };
    document.getElementById('v3pMesh').onclick = function () {
      rebuildMeshes().then(function () {
        document.getElementById('v3pCnt').textContent = String(STATE.lastCount);
      });
    };
    document.getElementById('v3pView').onclick = function () {
      toast(switchTo3dView() ? 'สลับโหมด 3D' : 'กดแท็บ 3D บนหัวแอป');
    };
    document.getElementById('v3pPerf').onclick = perfOff;
  }

  function addButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="v3pipe"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'v3pipe');
    b.title = 'โหมดเน้นระบบ 3D';
    b.innerHTML = '🧊 เน้น 3D <span class="ab">3D+</span>';
    bar.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPanel();
    });
  }

  function boot() {
    addButton();
    wrapConvert();
    setTimeout(wrapConvert, 1500);
    setTimeout(wrapConvert, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.V3Piping = {
    state: STATE,
    convert: runConvert3d,
    mesh: rebuildMeshes,
    realParams: realParams,
    open: openPanel,
    switchView: switchTo3dView
  };
})();
