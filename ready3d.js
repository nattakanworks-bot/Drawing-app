/*! ready3d.js — Pre-3D readiness / confidence report
 * รวมแนวทางจากงานถอด ISO→3D ทั่วไป: ตรวจ element, พิกัด, ชนิด, NPS, แล้วค่อยแปลง
 */
(function () {
  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) return;
    el.textContent = t; el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 3000);
  }
  function app() { return window.__app || null; }

  function getElements() {
    var a = app();
    try {
      if (a && a.S && a.S.project && Array.isArray(a.S.project.elements))
        return a.S.project.elements;
      if (a && a.S && Array.isArray(a.S.elements)) return a.S.elements;
    } catch (e) {}
    if (window.IsoPlace3D && IsoPlace3D.analyze) {
      var an = IsoPlace3D.analyze();
      return an.rows || [];
    }
    return [];
  }

  function scoreElement(el, idx) {
    var score = 0;
    var max = 100;
    var reasons = [];
    var sid = null;
    var nps = null;
    var pose = null;

    if (window.IsoPlace3D) {
      try {
        sid = IsoPlace3D.extractPose ? null : null;
      } catch (e) {}
    }
    // guess symbol
    if (window.IsoPlace3D && IsoPlace3D.analyze) {
      /* use local heuristics below */
    }
    var blob = [el.type, el.kind, el.name, el.tag, el.sym, el.label, el.symbol]
      .filter(Boolean).join(' ');
    if (window.FittingsKB && FittingsKB.lookup) {
      var f = FittingsKB.lookup(blob);
      if (f) { sid = f.id; score += 25; reasons.push('รู้จักชนิด fitting'); }
    }
    if (!sid && window.SymbolLib && SymbolLib.lookup) {
      var s = SymbolLib.lookup(blob);
      if (s) { sid = s.id; score += 20; reasons.push('รู้จักสัญลักษณ์'); }
    }
    if (!sid) {
      var t = blob.toLowerCase();
      if (/elbow|tee|pipe|valve|flange|reduc/.test(t)) {
        sid = 'HEUR'; score += 10; reasons.push('เดาชนิดจากชื่อ');
      } else {
        reasons.push('ไม่รู้ชนิด');
      }
    }

    nps = el.nps || el.dn || el.size || el.dia || (el.iso && el.iso.nps);
    if (nps) { score += 15; reasons.push('มี NPS/size'); }
    else reasons.push('ไม่มี NPS');

    if (window.IsoPlace3D && IsoPlace3D.extractPose) {
      pose = IsoPlace3D.extractPose(el);
      if (pose && pose.ok) { score += 35; reasons.push('มีพิกัด');
      } else { reasons.push('พิกัดไม่ชัด'); score += 5; }
    } else {
      var x = el.x != null ? el.x : (el.p && el.p.x);
      var y = el.y != null ? el.y : (el.p && el.p.y);
      if (x != null && y != null) { score += 30; reasons.push('มี x,y'); }
      else reasons.push('ไม่มี x,y');
    }

    if (el.from && el.to) { score += 10; reasons.push('มี from–to (ท่อนท่อ)'); }
    if (el.elev != null || el.elevation != null || (el.iso && el.iso.elev != null)) {
      score += 10; reasons.push('มี elevation');
    }

    if (score > 100) score = 100;
    var level = score >= 75 ? 'สูง' : (score >= 45 ? 'กลาง' : 'ต่ำ');
    return {
      index: idx,
      symbol: sid,
      nps: nps || '',
      score: score,
      level: level,
      reasons: reasons,
      tag: el.tag || el.name || el.type || ('#' + idx)
    };
  }

  function runReport() {
    var els = getElements();
    // ถ้า IsoPlace ให้ rows จาก analyze
    if ((!els || !els.length) && window.IsoPlace3D && IsoPlace3D.analyze) {
      var an0 = IsoPlace3D.analyze();
      if (an0.total) {
        return {
          source: 'iso-place-analyze',
          total: an0.total,
          with_position: an0.with_position,
          with_symbol: an0.with_symbol,
          items: an0.sample || [],
          readiness_pct: an0.total ? Math.round(100 * (0.5 * an0.with_position + 0.5 * an0.with_symbol) / an0.total) : 0,
          checklist: buildChecklist(an0.total, an0.with_position, an0.with_symbol, 0),
          advice: adviceFromPct(an0.total ? Math.round(100 * (0.5 * an0.with_position + 0.5 * an0.with_symbol) / an0.total) : 0)
        };
      }
    }

    var items = (els || []).map(function (el, i) {
      // ถ้าเป็น row จาก analyze อยู่แล้ว
      if (el.pose || el.id) {
        return {
          index: el.i != null ? el.i : i,
          symbol: el.id,
          nps: el.nps,
          score: (el.pose && el.pose.ok ? 40 : 0) + (el.id ? 40 : 0) + (el.nps ? 15 : 0),
          level: '',
          reasons: [],
          tag: el.tag || el.type || ''
        };
      }
      return scoreElement(el, i);
    });
    items.forEach(function (it) {
      if (!it.level) it.level = it.score >= 75 ? 'สูง' : (it.score >= 45 ? 'กลาง' : 'ต่ำ');
    });

    var total = items.length;
    var high = items.filter(function (x) { return x.score >= 75; }).length;
    var mid = items.filter(function (x) { return x.score >= 45 && x.score < 75; }).length;
    var low = items.filter(function (x) { return x.score < 45; }).length;
    var withSym = items.filter(function (x) { return x.symbol; }).length;
    var withNps = items.filter(function (x) { return x.nps; }).length;
    var readiness = total ? Math.round((high * 100 + mid * 55 + low * 15) / total) : 0;

    return {
      source: 'elements',
      total: total,
      high: high,
      mid: mid,
      low: low,
      with_symbol: withSym,
      with_nps: withNps,
      readiness_pct: readiness,
      items: items.slice(0, 50),
      checklist: buildChecklist(total, withSym, withNps, high),
      advice: adviceFromPct(readiness)
    };
  }

  function buildChecklist(total, withPosOrSym, withNps, high) {
    return [
      { ok: total > 0, text: 'มี element ในโปรเจกต์หลังเปิดแบบ/แปลง (' + total + ')' },
      { ok: withPosOrSym > 0, text: 'มีชิ้นที่รู้ชนิดหรือมีพิกัด' },
      { ok: withNps > 0, text: 'มีขนาด NPS บางส่วน' },
      { ok: high > 0, text: 'มีชิ้นความมั่นใจสูง' },
      { ok: !!(window.FittingsDims || window.FittingsKB), text: 'โหลดคลัง fitting / ตารางขนาดแล้ว' },
      { ok: !!(window.MeshBuilder), text: 'MeshBuilder พร้อม' },
      { ok: !!(app() && app().convert3d), text: 'มี convert3d ในแอป' },
      { ok: !!(window.OcrSheet), text: 'OCR แผ่นพร้อม (กรณีใช้รูป)' }
    ];
  }

  function adviceFromPct(p) {
    if (p >= 80) return 'ความพร้อมสูง — แปลง 3D ได้ แล้วตรวจชิ้นระดับกลาง/ต่ำด้วยตา';
    if (p >= 50) return 'ความพร้อมปานกลาง — แนะนำเปิด DXF ให้ได้ element ครบ หรือรัน OCR BOM แล้วเติม NPS';
    if (p > 0) return 'ความพร้อมต่ำ — ยังขาดพิกัด/ชนิด ควรเปิดไฟล์ vector หรือแปลง 2D→3D ก่อน แล้ววิเคราะห์ใหม่';
    return 'ยังไม่มี element — เปิดแบบ DXF/ISO ในแอปก่อน แล้วกดแปลง 2D→3D หรือวิเคราะห์อีกครั้ง';
  }

  function openPanel() {
    var id = 'ready3dPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('ready3dCss')) {
      var css = document.createElement('style');
      css.id = 'ready3dCss';
      css.textContent = '#ready3dPanel{display:none;position:fixed;left:50%;top:48px;transform:translateX(-50%);width:min(520px,96vw);max-height:85vh;z-index:20030;background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.35);overflow:auto;font-size:13px}#ready3dPanel.open{display:block!important}#ready3dPanel .hd{position:sticky;top:0;background:#0f766e;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;z-index:1}#ready3dPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}#ready3dPanel .bd{padding:14px}#ready3dPanel .pct{font-size:42px;font-weight:800;color:#0f766e}#ready3dPanel .go{border:0;background:#0f766e;color:#fff;font-weight:700;border-radius:10px;padding:10px 14px;cursor:pointer;margin:4px 4px 4px 0}#ready3dPanel .sec{background:#e2e8f0;color:#0f172a}#ready3dPanel li.ok{color:#047857}#ready3dPanel li.bad{color:#b91c1c}#ready3dPanel table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}#ready3dPanel td,#ready3dPanel th{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id; d.className = 'open';
    d.innerHTML = '<div class="hd"><b>✅ ความพร้อมถอด 3D</b><button type="button" id="r3Close">ปิด</button></div>' +
      '<div class="bd">' +
      '<div class="pct" id="r3Pct">—%</div>' +
      '<p id="r3Advice" style="line-height:1.45"></p>' +
      '<button class="go" type="button" id="r3Run">วิเคราะห์ใหม่</button>' +
      '<button class="go sec" type="button" id="r3Conv">แปลง 2D→3D</button>' +
      '<button class="go sec" type="button" id="r3Place">วางพิกัด 3D</button>' +
      '<button class="go sec" type="button" id="r3Ocr">OCR แผ่น</button>' +
      '<h4>Checklist</h4><ul id="r3Check"></ul>' +
      '<h4>ตัวอย่างชิ้น (สูงสุด 30)</h4><div id="r3Table"></div>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('r3Close').onclick = function () { d.classList.remove('open'); };

    function render() {
      var r = runReport();
      document.getElementById('r3Pct').textContent = r.readiness_pct + '%';
      document.getElementById('r3Advice').textContent = r.advice;
      var ul = document.getElementById('r3Check');
      ul.innerHTML = (r.checklist || []).map(function (c) {
        return '<li class="' + (c.ok ? 'ok' : 'bad') + '">' + (c.ok ? '✓ ' : '✗ ') + c.text + '</li>';
      }).join('');
      var items = r.items || [];
      var html = '<table><tr><th>#</th><th>tag</th><th>sym</th><th>NPS</th><th>คะแนน</th><th>ระดับ</th></tr>';
      items.slice(0, 30).forEach(function (it) {
        html += '<tr><td>' + (it.index != null ? it.index : '') + '</td><td>' +
          (it.tag || '') + '</td><td>' + (it.symbol || '') + '</td><td>' +
          (it.nps || '') + '</td><td>' + (it.score != null ? it.score : '') + '</td><td>' +
          (it.level || '') + '</td></tr>';
      });
      html += '</table>';
      if (!items.length) html = '<p style="opacity:.7">ยังไม่มีรายการ — เปิดแบบแล้วแปลงหรือวิเคราะห์พิกัดก่อน</p>';
      document.getElementById('r3Table').innerHTML = html;
      toast('ความพร้อม 3D ≈ ' + r.readiness_pct + '%');
      return r;
    }

    document.getElementById('r3Run').onclick = render;
    document.getElementById('r3Conv').onclick = function () {
      if (window.V3Piping && V3Piping.convert) V3Piping.convert();
      else if (app() && app().convert3d) app().convert3d({});
      else {
        var b = document.getElementById('btnTo3d');
        if (b) b.click();
      }
      setTimeout(render, 1500);
    };
    document.getElementById('r3Place').onclick = function () {
      if (window.IsoPlace3D && IsoPlace3D.open) IsoPlace3D.open();
      else if (window.IsoPlace3D && IsoPlace3D.placeAll) IsoPlace3D.placeAll();
    };
    document.getElementById('r3Ocr').onclick = function () {
      if (window.OcrSheet && OcrSheet.open) OcrSheet.open();
    };
    render();
  }

  function addBtn() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="ready3d"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'ready3d');
    b.innerHTML = '✅ พร้อม 3D <span class="ab">QA</span>';
    bar.appendChild(b);
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openPanel(); };
  }

  function boot() { addBtn(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Ready3D = { report: runReport, open: openPanel };
})();
