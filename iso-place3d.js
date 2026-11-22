/*! iso-place3d.js — วางสัญลักษณ์ 3D ตามพิกัดบนโปรเจกต์ ISO ให้แม่นขึ้น
 * อ่านหลายรูปแบบพิกัดจาก element, ใช้ FittingsDims, ปรับ scale/offset
 */
(function () {
  var CFG = {
    scale: 0.001,      // drawing unit → meter (mm)
    elevScale: 0.001,
    flipZ: true,
    yIsUp: true,
    useRealDims: true,
    autoAfterConvert: true
  };

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) return;
    el.textContent = t;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 3000);
  }

  function app() { return window.__app || null; }

  function getElements() {
    var a = app();
    var list = [];
    try {
      if (a && a.S && a.S.project && Array.isArray(a.S.project.elements)) {
        list = a.S.project.elements;
      }
    } catch (e) {}
    // สำรอง: สแกน object อื่น
    try {
      if ((!list || !list.length) && a && a.S) {
        var s = a.S;
        if (Array.isArray(s.elements)) list = s.elements;
        if (Array.isArray(s.items)) list = s.items;
      }
    } catch (e2) {}
    return list || [];
  }

  function num(v, d) {
    if (v == null || v === '') return d;
    if (typeof v === 'number' && !isNaN(v)) return v;
    var n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? d : n;
  }

  /** ดึงพิกัดจาก element หลายรูปแบบที่เจอในแอป ISO */
  function extractPose(el) {
    if (!el) return { x: 0, y: 0, z: 0, rotY: 0, ok: false };
    var x = null, y = null, z = null, rot = 0;

    // ตรง ๆ
    if (el.x != null) x = el.x;
    if (el.y != null) y = el.y;
    if (el.z != null) z = el.z;
    if (el.cx != null) x = el.cx;
    if (el.cy != null) y = el.cy;
    if (el.cz != null) z = el.cz;

    // p / pos / position / origin
    var bags = [el.p, el.pos, el.position, el.origin, el.pt, el.center, el.at];
    for (var i = 0; i < bags.length; i++) {
      var b = bags[i];
      if (!b) continue;
      if (typeof b === 'object') {
        if (b.x != null && x == null) x = b.x;
        if (b.y != null && y == null) y = b.y;
        if (b.z != null && z == null) z = b.z;
        if (Array.isArray(b) && b.length >= 2) {
          if (x == null) x = b[0];
          if (y == null) y = b[1];
          if (z == null && b.length > 2) z = b[2];
        }
      }
    }

    // iso block
    if (el.iso) {
      if (el.iso.x != null && x == null) x = el.iso.x;
      if (el.iso.y != null && y == null) y = el.iso.y;
      if (el.iso.el != null && z == null) z = el.iso.el;
      if (el.iso.elev != null && z == null) z = el.iso.elev;
    }
    if (el.elev != null && z == null) z = el.elev;
    if (el.elevation != null && z == null) z = el.elevation;
    if (el.EL != null && z == null) z = el.EL;

    // จาก / ถึง — ใช้จุดกลางท่อนท่อ
    if (x == null && el.from && el.to) {
      var fx = num(el.from.x, 0), fy = num(el.from.y, 0), fz = num(el.from.z, 0);
      var tx = num(el.to.x, 0), ty = num(el.to.y, 0), tz = num(el.to.z, 0);
      x = (fx + tx) / 2;
      y = (fy + ty) / 2;
      z = (fz + tz) / 2;
      rot = Math.atan2(ty - fy, tx - fx);
    }

    if (el.rot != null) rot = num(el.rot, 0);
    if (el.rotation != null) rot = num(el.rotation, 0);
    if (el.angle != null) rot = num(el.angle, 0) * Math.PI / 180;

    x = num(x, 0); y = num(y, 0); z = num(z, 0);

    // แปลงเป็นเมตรในฉาก
    var sx = x * CFG.scale;
    var sy = z * CFG.elevScale; // elevation → up
    var sz = (CFG.flipZ ? -1 : 1) * y * CFG.scale;
    if (!CFG.yIsUp) {
      // ถ้าฉากเป็น Z-up
      sy = y * CFG.scale;
      sz = z * CFG.elevScale;
    }

    return {
      x: sx, y: sy, z: sz,
      rotY: rot,
      raw: { x: x, y: y, z: z },
      ok: !(x === 0 && y === 0 && z === 0 && !el.from)
    };
  }

  function guessId(el) {
    if (window.MeshBuilder && false) {}
    if (!el) return null;
    var blob = [el.type, el.kind, el.name, el.tag, el.sym, el.label, el.symbol,
      el.iso && el.iso.type, el.iso && el.iso.sym].filter(Boolean).join(' ');
    if (window.FittingsKB && FittingsKB.lookup) {
      var f = FittingsKB.lookup(blob);
      if (f) return f.id;
    }
    if (window.SymbolLib && SymbolLib.lookup) {
      var s = SymbolLib.lookup(blob);
      if (s) return s.id;
    }
    var t = blob.toLowerCase();
    if (/elbow|el90|bend|ข้องอ/.test(t)) return 'EL90_LR';
    if (/tee|ที/.test(t)) return 'TEE';
    if (/reduc/.test(t)) return 'RED_CON';
    if (/cap|ฝา/.test(t)) return 'CAP';
    if (/flange|flg|หน้าแปลน/.test(t)) return 'FLG_WN';
    if (/ball/.test(t)) return 'BV';
    if (/gate/.test(t)) return 'GV';
    if (/globe/.test(t)) return 'GL';
    if (/check|nrv/.test(t)) return 'CK';
    if (/valve|วาล์ว/.test(t)) return 'GV';
    if (/pipe|ท่อ|line/.test(t)) return 'PIPE';
    if (/shoe|support|cli|รอง/.test(t)) return 'SUP_SHOE';
    if (/weldolet|olet/.test(t)) return 'WOL';
    return null;
  }

  function npsOf(el) {
    var n = el && (el.nps || el.dn || el.size || el.dia || (el.iso && (el.iso.nps || el.iso.size)));
    if (n == null) return '4';
    return String(n).replace(/["″']/g, '').trim() || '4';
  }

  function analyze() {
    var els = getElements();
    var rows = els.map(function (el, i) {
      var pose = extractPose(el);
      var id = guessId(el);
      return {
        i: i,
        id: id,
        nps: npsOf(el),
        pose: pose,
        type: el.type || el.kind || '',
        tag: el.tag || el.name || ''
      };
    });
    var withPos = rows.filter(function (r) { return r.pose && r.pose.ok; }).length;
    var withId = rows.filter(function (r) { return r.id; }).length;
    return {
      total: rows.length,
      with_position: withPos,
      with_symbol: withId,
      scale: CFG.scale,
      sample: rows.slice(0, 12),
      rows: rows
    };
  }

  /** วางใหม่โดยใช้ MeshBuilder + พิกัดที่ถอดได้ */
  async function placeAll() {
    if (!window.MeshBuilder || !MeshBuilder.buildAll) {
      toast('MeshBuilder ยังไม่พร้อม');
      return { count: 0 };
    }
    // บันทึก CFG ให้ MeshBuilder ใช้ถ้ามี hook
    window.__ISO_PLACE_CFG = CFG;
    window.__ISO_PLACE = { extractPose: extractPose, guessId: guessId, npsOf: npsOf };

    // patch ชั่วคราว: ถ้า MeshBuilder อ่าน global นี้จะดี — เราเรียก buildAll ปกติ
    // และ post-process ตำแหน่งใน scene
    var r = await MeshBuilder.buildAll({ useDims: CFG.useRealDims });
    try {
      refinePositionsInScene();
    } catch (e) {
      console.warn('[iso-place3d] refine', e);
    }
    return r;
  }

  function refinePositionsInScene() {
    var a = app();
    var v3 = a && a.V3;
    if (!v3 || !v3.group) return 0;
    var els = getElements();
    if (!els.length) return 0;
    var moved = 0;
    v3.group.traverse(function (o) {
      if (!o.userData || o.userData.elementIndex == null) return;
      var el = els[o.userData.elementIndex];
      if (!el) return;
      var pose = extractPose(el);
      o.position.set(pose.x, pose.y, pose.z);
      if (pose.rotY) o.rotation.y = pose.rotY;
      // สเกลตาม OD จริง
      if (CFG.useRealDims && window.FittingsDims) {
        var nps = npsOf(el);
        var mp = FittingsDims.meshParamsFor(o.userData.symbolId || 'PIPE', nps);
        if (mp && mp.od_mm) {
          // mesh สร้างที่รัศมีอ้างอิง ~0.05–0.1 — ปรับสเกลคร่าว
          var targetR = (mp.od_mm / 1000) / 2;
          var baseR = 0.05;
          var s = targetR / baseR;
          if (s > 0.05 && s < 20) o.scale.setScalar(s);
        }
      }
      moved++;
    });
    // กลุ่มสัญลักษณ์แยก
    if (v3.scene) {
      v3.scene.traverse(function (o) {
        if (o.name === 'SymbolLibMeshes' || (o.userData && o.userData.isSymbolLib)) {
          o.children.forEach(function (ch) {
            if (ch.userData && ch.userData.elementIndex != null) {
              var el = els[ch.userData.elementIndex];
              if (!el) return;
              var pose = extractPose(el);
              ch.position.set(pose.x, pose.y, pose.z);
              if (pose.rotY) ch.rotation.y = pose.rotY;
            }
          });
        }
      });
    }
    toast('ปรับตำแหน่ง 3D แล้ว ' + moved + ' ชิ้น');
    try {
      if (a.V3fn && a.V3fn.fit) a.V3fn.fit();
    } catch (e) {}
    return moved;
  }

  function wrapConvert() {
    var a = app();
    if (!a || typeof a.convert3d !== 'function' || a.convert3d.__isoPlace) return;
    var orig = a.convert3d.bind(a);
    a.convert3d = function (opts) {
      return Promise.resolve(orig(opts)).then(function (r) {
        if (CFG.autoAfterConvert) {
          setTimeout(function () {
            placeAll().catch(function (e) { console.warn(e); });
          }, 900);
        }
        return r;
      });
    };
    a.convert3d.__isoPlace = true;
  }

  function openPanel() {
    var id = 'isoPlacePanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('isoPlaceCss')) {
      var css = document.createElement('style');
      css.id = 'isoPlaceCss';
      css.textContent = '#isoPlacePanel{display:none;position:fixed;right:12px;top:96px;width:min(400px,96vw);max-height:75vh;z-index:20021;background:#111827;color:#e5e7eb;border-radius:14px;overflow:auto;font-size:12px;box-shadow:0 12px 40px rgba(0,0,0,.45)}#isoPlacePanel.open{display:block!important}#isoPlacePanel .hd{position:sticky;top:0;background:#1f2937;padding:12px;display:flex;justify-content:space-between;z-index:1}#isoPlacePanel .hd button{border:0;background:#374151;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}#isoPlacePanel .bd{padding:12px}#isoPlacePanel button.go{border:0;background:#34d399;color:#064e3b;font-weight:700;border-radius:10px;padding:10px 12px;cursor:pointer;margin:4px 4px 4px 0}#isoPlacePanel input[type=number]{width:90px;padding:6px;border-radius:8px;border:1px solid #4b5563;background:#1f2937;color:#e5e7eb}#isoPlacePanel pre{background:#0b1220;padding:8px;border-radius:8px;font-size:10px;max-height:200px;overflow:auto}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    d.innerHTML = '<div class="hd"><b>📍 วาง 3D ตามพิกัด ISO</b><button type="button" id="ipClose">ปิด</button></div>' +
      '<div class="bd">' +
      '<p>ถอดพิกัดจาก element หลังแปลง 2D→3D แล้ววาง mesh ให้ตรงขึ้น + สเกลตาม NPS</p>' +
      '<div>scale (unit→m) <input type="number" id="ipScale" step="0.0001" value="' + CFG.scale + '"/></div>' +
      '<div style="margin-top:6px"><label><input type="checkbox" id="ipAuto" ' + (CFG.autoAfterConvert ? 'checked' : '') + '/> วางอัตโนมัติหลังแปลง</label></div>' +
      '<div style="margin-top:6px"><label><input type="checkbox" id="ipDims" ' + (CFG.useRealDims ? 'checked' : '') + '/> ใช้ขนาดจริง</label></div>' +
      '<div style="margin-top:10px">' +
      '<button class="go" type="button" id="ipAnalyze">วิเคราะห์พิกัด</button>' +
      '<button class="go" type="button" id="ipPlace">วาง mesh ตามพิกัด</button>' +
      '<button class="go" type="button" id="ipRefine" style="background:#60a5fa;color:#0f172a">ปรับตำแหน่งในฉาก</button></div>' +
      '<pre id="ipOut">{}</pre></div>';
    document.body.appendChild(d);
    document.getElementById('ipClose').onclick = function () { d.classList.remove('open'); };
    document.getElementById('ipScale').onchange = function (e) {
      CFG.scale = parseFloat(e.target.value) || 0.001;
      CFG.elevScale = CFG.scale;
    };
    document.getElementById('ipAuto').onchange = function (e) { CFG.autoAfterConvert = e.target.checked; };
    document.getElementById('ipDims').onchange = function (e) { CFG.useRealDims = e.target.checked; };
    document.getElementById('ipAnalyze').onclick = function () {
      var a = analyze();
      document.getElementById('ipOut').textContent = JSON.stringify({
        total: a.total, with_position: a.with_position, with_symbol: a.with_symbol,
        scale: a.scale, sample: a.sample
      }, null, 2);
      toast('element ' + a.total + ' · มีพิกัด ' + a.with_position + ' · มีสัญลักษณ์ ' + a.with_symbol);
    };
    document.getElementById('ipPlace').onclick = function () {
      placeAll().then(function (r) {
        document.getElementById('ipOut').textContent = JSON.stringify(r, null, 2);
      });
    };
    document.getElementById('ipRefine').onclick = function () {
      var n = refinePositionsInScene();
      document.getElementById('ipOut').textContent = 'refined ' + n;
    };
  }

  function addBtn() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="isoplace"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'isoplace');
    b.innerHTML = '📍 วางพิกัด 3D <span class="ab">XYZ</span>';
    bar.appendChild(b);
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openPanel(); };
  }

  function boot() {
    addBtn();
    wrapConvert();
    setTimeout(wrapConvert, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.IsoPlace3D = {
    cfg: CFG,
    analyze: analyze,
    placeAll: placeAll,
    refine: refinePositionsInScene,
    extractPose: extractPose,
    open: openPanel
  };
})();
