/*! fittings-kb.js — สอนแอปใหรู้จักงาน pipe fitting (ASME B16.9 / B16.11 / MSS SP-97)
 * อ้างอิงแนวทางสาธารณะจากมาตรฐานงานท่อ ไม่ใช่ข้อความลิขสิทธิ์เต็มของ ASME
 */
(function () {
  // OD mm ตาม NPS (ASME B36.10 แนวทาง)
  var OD_MM = {
    '0.5': 21.3, '0.75': 26.7, '1': 33.4, '1.25': 42.2, '1.5': 48.3,
    '2': 60.3, '2.5': 73.0, '3': 88.9, '3.5': 101.6, '4': 114.3,
    '5': 141.3, '6': 168.3, '8': 219.1, '10': 273.0, '12': 323.9,
    '14': 355.6, '16': 406.4, '18': 457.0, '20': 508.0, '24': 610.0
  };

  // Center-to-end 90° LR ≈ 1.5×NPS (นิ้ว→mm) สำหรับ NPS≥1; ค่าคร่าว ๆ ที่ใช้จัดโมเดล
  function lr90_A_mm(nps) {
    var n = parseFloat(nps);
    if (!(n > 0)) n = 4;
    return Math.round(n * 1.5 * 25.4);
  }
  function sr90_A_mm(nps) {
    var n = parseFloat(nps);
    if (!(n > 0)) n = 4;
    return Math.round(n * 1.0 * 25.4);
  }

  /** นิยาม fitting ทั้งหมดที่โปรแกรมควรรู้จัก */
  var FITTINGS = [
    // —— Elbows (B16.9) ——
    { id: 'EL90_LR', th: 'ข้องอ 90° รัศมียาว', en: 'Elbow 90° Long Radius', family: 'elbow',
      std: 'ASME B16.9', ends: ['BW'], radius: 'LR', angle: 90,
      rule: 'A = 1.5 × NPS (center-to-end)',
      aliases: ['EL','EL90','90LR','elbow','elbow90','LR elbow','ข้องอ','ข้องอ90','long radius'],
      mesh3d: { type: 'torus_arc', angle_deg: 90, bend_radius: '1.5*NPS' }, ports: 2 },
    { id: 'EL90_SR', th: 'ข้องอ 90° รัศมีสั้น', en: 'Elbow 90° Short Radius', family: 'elbow',
      std: 'ASME B16.9', ends: ['BW'], radius: 'SR', angle: 90,
      rule: 'A = 1.0 × NPS', aliases: ['90SR','SR elbow','short radius','ข้องอสั้น'],
      mesh3d: { type: 'torus_arc', angle_deg: 90, bend_radius: '1.0*NPS' }, ports: 2 },
    { id: 'EL45', th: 'ข้องอ 45°', en: 'Elbow 45°', family: 'elbow',
      std: 'ASME B16.9', ends: ['BW'], angle: 45,
      rule: 'B = center-to-end 45° (ตาราง B16.9)', aliases: ['EL45','45 elbow','elbow45','ข้องอ45'],
      mesh3d: { type: 'torus_arc', angle_deg: 45, bend_radius: '1.5*NPS' }, ports: 2 },
    { id: 'EL180_LR', th: 'รีเทิร์น 180° LR', en: '180° Return Long Radius', family: 'elbow',
      std: 'ASME B16.9', ends: ['BW'], angle: 180, radius: 'LR',
      rule: 'O ≈ 2×A ของ 90° LR', aliases: ['return','180 return','U-bend','รีเทิร์น'],
      mesh3d: { type: 'torus_arc', angle_deg: 180, bend_radius: '1.5*NPS' }, ports: 2 },
    { id: 'EL90_RED', th: 'ข้องอ 90° ลดขนาด', en: 'Reducing Elbow 90°', family: 'elbow',
      std: 'ASME B16.9', ends: ['BW'], angle: 90,
      rule: 'A ตามปลายใหญ่', aliases: ['reducing elbow','RE elbow','ข้องอลด'],
      mesh3d: { type: 'torus_arc', angle_deg: 90, bend_radius: '1.5*NPS' }, ports: 2 },
    // —— Tees / Cross / Lateral ——
    { id: 'TEE', th: 'ที เท่า', en: 'Equal Tee', family: 'tee',
      std: 'ASME B16.9', ends: ['BW'],
      rule: 'C, M center-to-end เท่ากันทุกทาง', aliases: ['TEE','equal tee','straight tee','ที','ทีเท่า'],
      mesh3d: { type: 'tee' }, ports: 3 },
    { id: 'TEE_RED', th: 'ที ลด', en: 'Reducing Tee', family: 'tee',
      std: 'ASME B16.9', ends: ['BW'],
      rule: 'branch เล็กกว่ารัน', aliases: ['reducing tee','RT','ทีลด','red tee'],
      mesh3d: { type: 'tee' }, ports: 3 },
    { id: 'TEE_BARRED', th: 'ทีมีบาร์ (pig)', en: 'Barred Tee', family: 'tee',
      std: 'ASME B16.9 / project', ends: ['BW'],
      rule: 'มี bar กั้นทาง branch สำหรับ pigging', aliases: ['barred tee','ทีบาร์'],
      mesh3d: { type: 'tee' }, ports: 3 },
    { id: 'CROSS', th: 'ครอส', en: 'Cross', family: 'tee',
      std: 'ASME B16.9', ends: ['BW'], aliases: ['CROSS','cross','ครอส','4-way tee'],
      mesh3d: { type: 'cross' }, ports: 4 },
    { id: 'LAT45', th: 'แลเทอรัล 45°', en: '45° Lateral', family: 'tee',
      std: 'ASME B16.9 / fabricated', ends: ['BW'],
      aliases: ['lateral','LATERAL','Y lateral','แลเทอรัล','wye'],
      mesh3d: { type: 'lateral', angle_deg: 45 }, ports: 3 },
    // —— Reducers ——
    { id: 'RED_CON', th: 'รีดิวเซอร์ ศูนย์กลาง', en: 'Concentric Reducer', family: 'reducer',
      std: 'ASME B16.9', ends: ['BW'],
      rule: 'H = end-to-end; แกนร่วม', aliases: ['RED','CONC','concentric','reducer','รีดิวเซอร์','concentric reducer'],
      mesh3d: { type: 'cone_frustum' }, ports: 2 },
    { id: 'RED_ECC', th: 'รีดิวเซอร์ นอกศูนย์', en: 'Eccentric Reducer', family: 'reducer',
      std: 'ASME B16.9', ends: ['BW'],
      rule: 'FOB/FOT บน isometric', aliases: ['ECC','eccentric','FOB','FOT','eccentric reducer','รีดิวเซอร์นอกศูนย์'],
      mesh3d: { type: 'cone_frustum_offset' }, ports: 2 },
    { id: 'SWAGE', th: 'สวาจ / นิปเปิลลด', en: 'Swage Nipple', family: 'reducer',
      std: 'MSS SP-95', ends: ['BW','THD'],
      aliases: ['swage','swage nipple','สวาจ'],
      mesh3d: { type: 'cone_frustum' }, ports: 2 },
    // —— Caps / closures ——
    { id: 'CAP', th: 'ฝาปิดท่อ', en: 'Pipe Cap', family: 'cap',
      std: 'ASME B16.9', ends: ['BW'], aliases: ['CAP','cap','end cap','ฝาปิด'],
      mesh3d: { type: 'cap' }, ports: 1 },
    { id: 'PLUG', th: 'ปลั๊ก', en: 'Pipe Plug', family: 'cap',
      std: 'ASME B16.11', ends: ['THD'], aliases: ['plug','ปลั๊ก'],
      mesh3d: { type: 'cap' }, ports: 1 },
    // —— Stub end ——
    { id: 'STUB', th: 'สตับเอนด์', en: 'Lap Joint Stub End', family: 'stub',
      std: 'ASME B16.9', ends: ['BW'],
      rule: 'ใช้กับหน้าแปลน Lap Joint', aliases: ['stub end','stub','สตับ'],
      mesh3d: { type: 'cylinder' }, ports: 2 },
    // —— Couplings / unions (B16.11) ——
    { id: 'CPL', th: 'คัปปลิ้ง', en: 'Coupling', family: 'coupling',
      std: 'ASME B16.11', ends: ['SW','THD'], aliases: ['coupling','คัปปลิ้ง'],
      mesh3d: { type: 'cylinder' }, ports: 2 },
    { id: 'HALF_CPL', th: 'ฮาล์ฟคัปปลิ้ง', en: 'Half Coupling', family: 'coupling',
      std: 'ASME B16.11', ends: ['SW','THD'], aliases: ['half coupling','ฮาล์ฟคัปปลิ้ง'],
      mesh3d: { type: 'cylinder' }, ports: 1 },
    { id: 'UNION', th: 'ยูเนียน', en: 'Union', family: 'coupling',
      std: 'ASME B16.11', ends: ['SW','THD'], aliases: ['union','ยูเนียน'],
      mesh3d: { type: 'cylinder' }, ports: 2 },
    { id: 'BUSH', th: 'บุชชิ่ง', en: 'Bushing', family: 'coupling',
      std: 'ASME B16.11', ends: ['THD'], aliases: ['bushing','bush','บุช'],
      mesh3d: { type: 'cone_frustum' }, ports: 2 },
    { id: 'NIPPLE', th: 'นิปเปิล', en: 'Pipe Nipple', family: 'coupling',
      std: 'project / ASTM', ends: ['THD','BW'], aliases: ['nipple','นิปเปิล'],
      mesh3d: { type: 'cylinder' }, ports: 2 },
    // —— Olets (MSS SP-97) ——
    { id: 'WOL', th: 'เวลด์โอเล็ต', en: 'Weldolet', family: 'olet',
      std: 'MSS SP-97', ends: ['BW'], aliases: ['weldolet','WOL','olet','branch outlet','เวลด์โอเล็ต'],
      mesh3d: { type: 'olet' }, ports: 2 },
    { id: 'SOL', th: 'ซ็อกโอเล็ต', en: 'Sockolet', family: 'olet',
      std: 'MSS SP-97', ends: ['SW'], aliases: ['sockolet','SOL','ซ็อกโอเล็ต'],
      mesh3d: { type: 'olet' }, ports: 2 },
    { id: 'TOL', th: 'เทรดโอเล็ต', en: 'Threadolet', family: 'olet',
      std: 'MSS SP-97', ends: ['THD'], aliases: ['threadolet','TOL','เทรดโอเล็ต'],
      mesh3d: { type: 'olet' }, ports: 2 },
    { id: 'NOL', th: 'นิปเปิลโอเล็ต', en: 'Nippolet', family: 'olet',
      std: 'MSS SP-97', ends: ['THD'], aliases: ['nippolet','NOL'],
      mesh3d: { type: 'olet' }, ports: 2 },
    { id: 'FOL', th: 'แฟลงโอเล็ต', en: 'Flangolet', family: 'olet',
      std: 'MSS SP-97', ends: ['FLG'], aliases: ['flangolet','FOL'],
      mesh3d: { type: 'olet' }, ports: 2 },
    // —— Connection marks ——
    { id: 'BW', th: 'เชื่อมชน (BW)', en: 'Butt Weld', family: 'joint',
      std: 'ASME B16.25', ends: ['BW'], aliases: ['BW','butt weld','bevel','รอยเชื่อมชน'],
      mesh3d: { type: 'weld_ring' }, ports: 2 },
    { id: 'SW', th: 'ซ็อกเก็ตเวลด์', en: 'Socket Weld', family: 'joint',
      std: 'ASME B16.11', ends: ['SW'], aliases: ['SW','socket weld','ซ็อกเก็ต'],
      mesh3d: { type: 'socket' }, ports: 2 },
    { id: 'THD', th: 'เกลียว', en: 'Threaded (NPT)', family: 'joint',
      std: 'ASME B1.20.1', ends: ['THD'], aliases: ['NPT','threaded','THD','เกลียว'],
      mesh3d: { type: 'thread_mark' }, ports: 2 }
  ];

  var STANDARDS = {
    'ASME B16.9': {
      th: 'ฟิตติ้งเชื่อมชน (wrought BW)',
      scope: 'NPS 1/2–48: elbow, tee, cross, reducer, cap, stub end, return',
      note: 'ขนาดตามตาราง; ความดันตาม schedule ท่อที่จับคู่ — ไม่มี class แยก'
    },
    'ASME B16.11': {
      th: 'ฟิตติ้งตีบ (forged SW/THD)',
      scope: 'NPS 1/8–4: socket weld / threaded; Class 2000–9000',
      note: 'งาน small-bore, instrument, utility'
    },
    'MSS SP-97': {
      th: 'Branch outlet (olet)',
      scope: 'Weldolet, Sockolet, Threadolet, Nippolet, Flangolet',
      note: 'แยกจาก header โดยไม่ใช้ tee เต็ม'
    },
    'ASME B16.25': {
      th: 'เตรียมปลายเชื่อม (bevel)',
      scope: 'มุม bevel ~37.5°, root face',
      note: 'ใช้คู่กับ B16.9'
    },
    'ASME B36.10/19': {
      th: 'ขนาดท่อ OD / schedule',
      scope: 'OD คงที่ต่อ NPS; หนาตาม Sch 40/80/160/XS…',
      note: 'ฟิตติ้ง BW ต้อง match schedule ท่อ'
    }
  };

  var INDEX = {};
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function rebuild() {
    INDEX = {};
    FITTINGS.forEach(function (f) {
      (f.aliases || []).forEach(function (a) { INDEX[norm(a)] = f; });
      INDEX[norm(f.id)] = f;
      INDEX[norm(f.en)] = f;
      INDEX[norm(f.th)] = f;
    });
  }
  rebuild();

  function lookup(q) {
    if (!q) return null;
    var n = norm(q);
    if (INDEX[n]) return INDEX[n];
    var keys = Object.keys(INDEX);
    for (var i = 0; i < keys.length; i++) {
      if (n.indexOf(keys[i]) >= 0 || keys[i].indexOf(n) >= 0) return INDEX[keys[i]];
    }
    // heuristics
    if (/elbow|ข้องอ|el\s*90|90\s*lr/.test(n)) return INDEX['el90_lr'] || INDEX['elbow'];
    if (/tee|ที/.test(n) && /red|ลด/.test(n)) return INDEX['tee_red'] || INDEX['reducing tee'];
    if (/tee|ที/.test(n)) return INDEX['tee'];
    if (/reduc|รีดิว/.test(n) && /ecc|นอกศูนย์|fot|fob/.test(n)) return INDEX['red_ecc'];
    if (/reduc|รีดิว|conc/.test(n)) return INDEX['red_con'];
    if (/cap|ฝา/.test(n)) return INDEX['cap'];
    if (/weldolet|olet/.test(n)) return INDEX['wol'];
    if (/cross|ครอส/.test(n)) return INDEX['cross'];
    return null;
  }

  function dims(nps) {
    var od = OD_MM[String(nps)] || OD_MM['4'];
    return {
      nps: String(nps),
      od_mm: od,
      el90_lr_A_mm: lr90_A_mm(nps),
      el90_sr_A_mm: sr90_A_mm(nps),
      note: 'ค่า A คร่าว ๆ จากกฎ 1.5×NPS / 1.0×NPS — งานจริงอ้างตาราง B16.9'
    };
  }

  function toSymbolExtra() {
    return FITTINGS.map(function (f) {
      return {
        id: f.id, th: f.th, en: f.en, category: 'fitting',
        aliases: f.aliases, ports: f.ports || 2, std: f.std,
        notes: f.rule || '', mesh3d: f.mesh3d || { type: 'box' }
      };
    });
  }

  function registerIntoSymbolLib() {
    try {
      if (!window.SymbolLib) return;
      // ผสานเข้า EXTRA ผ่าน merge ถ้ามี API
      var extra = toSymbolExtra();
      if (window.__SYMBOL_LIB && window.__SYMBOL_LIB.raw) {
        var raw = window.__SYMBOL_LIB.raw;
        raw.symbols = raw.symbols || [];
        var have = {};
        raw.symbols.forEach(function (s) { have[s.id] = true; });
        extra.forEach(function (s) {
          if (!have[s.id]) raw.symbols.push(s);
        });
        raw.count = raw.symbols.length;
        raw.fittings_kb = true;
      }
      var a = window.__app;
      if (a && a.SYMS) {
        FITTINGS.forEach(function (f) {
          try {
            if (!a.SYMS[f.id]) a.SYMS[f.id] = { th: f.th, en: f.en, aliases: f.aliases };
          } catch (e) {}
        });
      }
    } catch (e) { console.warn('[fittings-kb] register', e); }
  }

  function openPanel() {
    var id = 'fitKbPanel';
    var existing = document.getElementById(id);
    if (existing) { existing.classList.toggle('open'); return; }
    if (!document.getElementById('fitKbCss')) {
      var css = document.createElement('style');
      css.id = 'fitKbCss';
      css.textContent = '#fitKbPanel{display:none;position:fixed;right:12px;top:100px;bottom:48px;width:min(400px,94vw);z-index:20001;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:auto;font-size:12px}#fitKbPanel.open{display:block!important}#fitKbPanel .hd{position:sticky;top:0;background:#b45309;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}#fitKbPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}#fitKbPanel .bd{padding:10px 12px}#fitKbPanel h4{margin:12px 0 4px;color:#b45309}#fitKbPanel table{width:100%;border-collapse:collapse}#fitKbPanel td,#fitKbPanel th{border:1px solid #eee;padding:4px 6px;text-align:left}#fitKbPanel input{width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box;margin-bottom:8px}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    var rows = FITTINGS.map(function (f) {
      return '<tr data-blob="' + norm([f.id, f.th, f.en].concat(f.aliases).join(' ')) + '"><td><b>' + f.id + '</b></td><td>' + f.th + '<br><span style="opacity:.7">' + f.en + '</span></td><td>' + f.std + '</td></tr>';
    }).join('');
    d.innerHTML = '<div class="hd"><h3 style="margin:0;font-size:14px">🔧 งาน Fitting ทั้งหมด (' + FITTINGS.length + ')</h3><button type="button" id="fitKbClose">ปิด</button></div>' +
      '<div class="bd"><p style="margin-top:0;line-height:1.45">มาตรฐานหลัก: <b>ASME B16.9</b> (BW), <b>B16.11</b> (SW/THD), <b>MSS SP-97</b> (olet)</p>' +
      '<input id="fitKbQ" placeholder="ค้นหา elbow, tee, olet, ข้องอ…"/>' +
      '<table><thead><tr><th>ID</th><th>ชื่อ</th><th>มาตรฐาน</th></tr></thead><tbody id="fitKbBody">' + rows + '</tbody></table>' +
      '<h4>สรุปมาตรฐาน</h4><ul>' +
      Object.keys(STANDARDS).map(function (k) {
        var s = STANDARDS[k];
        return '<li><b>' + k + '</b> — ' + s.th + ': ' + s.scope + '</li>';
      }).join('') + '</ul>' +
      '<h4>ตัวอย่างขนาด NPS 6</h4><pre style="background:#f8fafc;padding:8px;border-radius:8px">' +
      JSON.stringify(dims(6), null, 2) + '</pre></div>';
    document.body.appendChild(d);
    document.getElementById('fitKbClose').onclick = function () { d.classList.remove('open'); };
    document.getElementById('fitKbQ').oninput = function (e) {
      var q = norm(e.target.value);
      document.querySelectorAll('#fitKbBody tr').forEach(function (tr) {
        var blob = tr.getAttribute('data-blob') || '';
        tr.style.display = !q || blob.indexOf(q) >= 0 ? '' : 'none';
      });
    };
  }

  function addButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="fitting"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'fitting');
    b.title = 'คลังความรู้ Fitting (B16.9)';
    b.innerHTML = '🔧 Fitting <span class="ab">Fit</span>';
    bar.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPanel();
    });
  }

  function boot() {
    registerIntoSymbolLib();
    addButton();
    setTimeout(registerIntoSymbolLib, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.FittingsKB = {
    all: FITTINGS,
    standards: STANDARDS,
    lookup: lookup,
    dims: dims,
    od: OD_MM,
    open: openPanel
  };
})();
