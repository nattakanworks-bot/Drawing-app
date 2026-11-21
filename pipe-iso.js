/*! Petroleum piping + Isometric helper for อ่านแบบ */
(function () {
  function el(id) { return document.getElementById(id); }
  function show(t) {
    var n = el('featToast');
    if (!n) {
      n = document.createElement('div');
      n.id = 'featToast';
      n.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#1c1917;color:#fff;padding:10px 16px;border-radius:10px;z-index:9999;font-size:13px;max-width:90vw;';
      document.body.appendChild(n);
    }
    n.textContent = t;
    n.style.display = 'block';
    clearTimeout(show._t);
    show._t = setTimeout(function () { n.style.display = 'none'; }, 3000);
  }

  function ensurePanel() {
    if (el('pipePanel')) return;
    var css = document.createElement('style');
    css.textContent = '#pipePanel{display:none;position:fixed;right:12px;top:110px;bottom:56px;width:min(380px,94vw);z-index:9500;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);overflow:auto;font-size:13px}#pipePanel.open{display:block}#pipePanel .pp-head{position:sticky;top:0;background:#1565c0;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}#pipePanel .pp-head h3{margin:0;font-size:15px}#pipePanel .pp-head button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:600}#pipePanel .pp-body{padding:12px 14px}#pipePanel h4{margin:14px 0 6px;font-size:13px;color:#1565c0}#pipePanel ul{margin:0 0 8px 18px;padding:0}#pipePanel li{margin:3px 0}#pipePanel .tag{display:inline-block;background:#e3f2fd;color:#0d47a1;border-radius:6px;padding:1px 6px;font-size:11px;margin-right:4px}#pipePanel .pp-actions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}#pipePanel .pp-actions button{border:1px solid #90caf9;background:#e3f2fd;color:#0d47a1;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:600}#pipePanel .pp-actions button.primary{background:#1565c0;color:#fff;border-color:#1565c0}#pipePanel table{width:100%;border-collapse:collapse;font-size:12px}#pipePanel td,#pipePanel th{border:1px solid #e0e6ed;padding:4px 6px;text-align:left}#pipePanel th{background:#f5f7fa}#btnPipe.on{background:#2e7d32!important;color:#fff!important;border-color:#2e7d32!important}';
    document.head.appendChild(css);

    var d = document.createElement('div');
    d.id = 'pipePanel';
    d.innerHTML = '<div class="pp-head"><h3>🛢️ งานท่อปิโตรเลียม + แบบไอโซเมตริก</h3><button type="button" id="pipeClose">ปิด</button></div><div class="pp-body">'
      + '<div class="pp-actions">'
      + '<button type="button" class="primary" id="pipeSetWT">ตั้งประเภทงาน = ปิโตรเลียม</button>'
      + '<button type="button" id="pipeAnalyzeIso">วิเคราะห์แบบไอโซฯ</button>'
      + '<button type="button" id="pipeApplyIso">ใช้ผล ISO กับโมเดล</button>'
      + '</div>'
      + '<h4>1) ขั้นตอนอ่านแบบไอโซเมตริก</h4><ul>'
      + '<li>เปิดไฟล์แบบ → เลือกประเภทงาน <b>ปิโตรเลียม / งานท่อ</b></li>'
      + '<li>ตรวจ title block ว่าเป็นแผ่น <span class="tag">ISOMETRIC</span></li>'
      + '<li>ตั้งทิศเหนือและแกนท่อบน isometric</li>'
      + '<li>อ่าน callout: <span class="tag">NPS</span>/<span class="tag">DN</span>, <span class="tag">SCH</span>, วัสดุ</li>'
      + '<li>ไล่ fitting: elbow · tee · reducer · cap · flange · valve</li>'
      + '<li>อ่าน weld (FW/SW) และ support (anchor, guide, shoe)</li>'
      + '<li>แปลง 2D→3D แล้วตรวจความยาวและทิศทางรันท่อ</li></ul>'
      + '<h4>2) สัญลักษณ์หลัก</h4><table><tr><th>รายการ</th><th>ความหมาย</th><th>ย่อ</th></tr>'
      + '<tr><td>เส้นท่อ</td><td>Pipe run</td><td>PIPE</td></tr>'
      + '<tr><td>ข้องอ 90/45</td><td>Elbow</td><td>EL</td></tr>'
      + '<tr><td>ที</td><td>Tee / Red. tee</td><td>TEE</td></tr>'
      + '<tr><td>รีดิวเซอร์</td><td>Conc. / Ecc.</td><td>RED</td></tr>'
      + '<tr><td>หน้าแปลน</td><td>WN / SO / Blind</td><td>FLG</td></tr>'
      + '<tr><td>วาล์ว</td><td>Gate Globe Ball Check BF</td><td>GV GL BV CK</td></tr>'
      + '<tr><td>FW / SW</td><td>Field / Shop weld</td><td>WELD</td></tr>'
      + '<tr><td>Support</td><td>Anchor Guide Shoe</td><td>SUP</td></tr></table>'
      + '<h4>3) มาตรฐานปิโตรเลียมที่ใช้บ่อย</h4><ul>'
      + '<li><span class="tag">ASME B31.3</span> Process piping</li>'
      + '<li><span class="tag">ASME B16.5</span> Flanges</li>'
      + '<li><span class="tag">ASME B16.9</span> BW fittings</li>'
      + '<li><span class="tag">ASME B16.10</span> Valve F-to-F</li>'
      + '<li><span class="tag">ASME B36.10/19</span> Pipe sizes</li>'
      + '<li><span class="tag">API / ASTM</span> วัสดุตามสเปคโครงการ</li></ul>'
      + '<h4>4) ข้อมูลที่ควรดึงจากแบบ ISO</h4><ul>'
      + '<li>Line no. / P&ID ref</li>'
      + '<li>NPS × SCH × Material</li>'
      + '<li>Flange class (150/300/600…)</li>'
      + '<li>Insulation / painting / NDE</li>'
      + '<li>BOM/MTO: ความยาวท่อ จำนวน fitting</li>'
      + '<li>Elevation / coordinate / north</li></ul>'
      + '<h4>5) ให้แอปอ่านได้ดีขึ้น</h4><ul>'
      + '<li>ใช้ไฟล์คมชัด หรือสแกนให้ตรง</li>'
      + '<li>ใช้ OCR ไทย+อังกฤษเมื่อตัวอักษรเล็ก</li>'
      + '<li>งานหลายแผ่น: ประกอบแบบก่อนดู 3D</li></ul>'
      + '<p style="opacity:.85">แอปมีโมดูล ISO ภายใน (แกน·callout·flange·weld·support ตาม ASME) — แผงนี้ช่วยตั้งงานปิโตรเลียมและเรียกใช้โมดูลนั้น</p>'
      + '</div>';
    document.body.appendChild(d);

    el('pipeClose').onclick = function () { openPanel(false); };
    el('pipeSetWT').onclick = setPetroleum;
    el('pipeAnalyzeIso').onclick = function () {
      show(callIso(['analyze','solve','applyIso','finish']) ? 'เรียกวิเคราะห์แบบไอโซเมตริกแล้ว' : 'เปิดแบบไอโซฯ ก่อน แล้วใช้เมนูวิเคราะห์ในแอป');
    };
    el('pipeApplyIso').onclick = function () {
      show(callIso(['applyIso','finish','analyze']) ? 'ใช้ผล ISO กับโมเดลแล้ว' : 'ยังไม่มีผล ISO — วิเคราะห์ก่อน');
    };
  }

  function openPanel(v) {
    ensurePanel();
    var p = el('pipePanel');
    var b = el('btnPipe');
    if (v === undefined) v = !p.classList.contains('open');
    p.classList.toggle('open', !!v);
    if (b) b.classList.toggle('on', !!v);
  }

  function setPetroleum() {
    try {
      if (window.__app && typeof window.__app.setWorkType === 'function') {
        window.__app.setWorkType('petroleum');
        show('ตั้งประเภทงานเป็น ปิโตรเลียม / งานท่อ แล้ว');
        return;
      }
      if (window.__app && window.__app.S) window.__app.S.workType = 'petroleum';
      var wt = el('btnWorkType') || el('wWorkType');
      if (wt) wt.click();
      show('เลือกประเภทงาน: ปิโตรเลียม / น้ำมันและก๊าซ (Petroleum)');
    } catch (e) {
      show('ตั้งประเภทงานไม่สำเร็จ — กดเลือกประเภทงานด้วยมือ');
    }
  }

  function callIso(names) {
    var iso = window.__app && window.__app.ISO;
    if (!iso) return false;
    for (var i = 0; i < names.length; i++) {
      var fn = iso[names[i]];
      if (typeof fn === 'function') {
        try { fn(); return true; } catch (e) {
          try { fn(window.__app); return true; } catch (e2) {}
        }
      }
    }
    return false;
  }

  function ensureButton() {
    if (el('btnPipe')) return;
    var bar = el('featBar');
    if (!bar) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.id = 'btnPipe';
    b.setAttribute('data-feat', 'pipe');
    b.title = 'งานท่อปิโตรเลียม / แบบไอโซเมตริก';
    b.innerHTML = '🛢️ ท่อปิโตรฯ <span class="ab">Pipe</span>';
    bar.insertBefore(b, bar.firstChild);
  }

  function boot() {
    ensureButton();
    ensurePanel();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('#btnPipe, [data-feat="pipe"]');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      openPanel();
      show('คู่มืองานท่อปิโตรเลียม / แบบไอโซเมตริก');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
