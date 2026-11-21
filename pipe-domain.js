/*! pipe-domain.js — สอนแอปเรื่องงาน Piping: ขนาดท่อ / fitting / valve + ขั้นตอนแปลง 3D·4D
 * ตาราง wall = ค่าความหนาโดยประมาณตามแนวทาง ASME B36.10 (mm) สำหรับอ้างอิงในแอป
 */
(function () {
  var PIPE_OD_MM = {
    '1/8': 10.3, '1/4': 13.7, '3/8': 17.1, '1/2': 21.3, '3/4': 26.7,
    '1': 33.4, '1-1/4': 42.2, '1-1/2': 48.3, '2': 60.3, '2-1/2': 73.0,
    '3': 88.9, '3-1/2': 101.6, '4': 114.3, '5': 141.3, '6': 168.3,
    '8': 219.1, '10': 273.0, '12': 323.9, '14': 355.6, '16': 406.4,
    '18': 457.0, '20': 508.0, '24': 610.0, '26': 660.0, '28': 711.0,
    '30': 762.0, '32': 813.0, '34': 864.0, '36': 914.0
  };

  /** ความหนาผนัง mm — กุญแจ NPS ตรงกับ PIPE_OD_MM */
  var SCH_WALL = {
    '10': {
      '1/2':1.65,'3/4':1.65,'1':1.65,'1-1/4':1.65,'1-1/2':1.65,'2':1.65,'2-1/2':2.11,'3':2.11,'3-1/2':2.11,'4':2.11,
      '5':2.77,'6':2.77,'8':3.05,'10':3.40,'12':3.96,'14':3.96,'16':4.19,'18':4.19,'20':4.78,'24':5.54
    },
    '20': {
      '1/2':1.65,'3/4':1.65,'1':1.65,'1-1/4':1.65,'1-1/2':1.65,'2':1.65,'2-1/2':2.11,'3':2.11,'3-1/2':2.11,'4':2.11,
      '5':2.77,'6':2.77,'8':3.76,'10':4.19,'12':4.57,'14':4.78,'16':4.78,'18':4.78,'20':5.54,'24':6.35
    },
    '30': {
      '1/2':2.41,'3/4':2.41,'1':2.90,'1-1/4':2.97,'1-1/2':3.18,'2':3.18,'2-1/2':4.78,'3':4.78,'3-1/2':4.78,'4':4.78,
      '5':5.56,'6':5.56,'8':7.04,'10':7.80,'12':8.38,'14':8.74,'16':9.53,'18':9.53,'20':9.53,'24':9.53
    },
    '40': {
      '1/8':1.73,'1/4':2.24,'3/8':2.31,'1/2':2.77,'3/4':2.87,'1':3.38,'1-1/4':3.56,'1-1/2':3.68,'2':3.91,'2-1/2':5.16,
      '3':5.49,'3-1/2':5.74,'4':6.02,'5':6.55,'6':7.11,'8':8.18,'10':9.27,'12':9.53,'14':9.53,'16':9.53,
      '18':9.53,'20':9.53,'24':9.53,'30':12.70,'36':9.53
    },
    '60': {
      '1/2':3.18,'3/4':3.18,'1':3.96,'1-1/4':4.32,'1-1/2':4.32,'2':4.78,'2-1/2':6.35,'3':6.35,'3-1/2':6.35,'4':6.35,
      '5':7.92,'6':7.92,'8':10.31,'10':12.70,'12':14.27,'14':15.09,'16':16.66,'18':19.05,'20':20.62,'24':24.61
    },
    '80': {
      '1/8':2.41,'1/4':3.02,'3/8':3.20,'1/2':3.73,'3/4':3.91,'1':4.55,'1-1/4':4.85,'1-1/2':5.08,'2':5.54,'2-1/2':7.01,
      '3':7.62,'3-1/2':8.08,'4':8.56,'5':9.53,'6':10.97,'8':12.70,'10':15.09,'12':17.48,'14':19.05,'16':21.44,
      '18':23.83,'20':26.19,'24':30.96,'30':41.28,'36':46.02
    },
    '100': {
      '1/2':4.78,'3/4':5.16,'1':5.74,'1-1/4':6.35,'1-1/2':6.35,'2':8.74,'2-1/2':9.53,'3':11.13,'3-1/2':11.13,'4':11.13,
      '5':12.70,'6':14.27,'8':18.26,'10':21.44,'12':25.40,'14':27.79,'16':30.96,'18':34.93,'20':38.10,'24':46.02
    },
    '120': {
      '1/2':5.56,'3/4':5.56,'1':6.35,'1-1/4':6.35,'1-1/2':7.14,'2':8.74,'2-1/2':9.53,'3':11.13,'3-1/2':11.13,'4':13.49,
      '5':15.88,'6':18.26,'8':22.23,'10':25.40,'12':28.58,'14':31.75,'16':36.53,'18':39.67,'20':44.45,'24':52.37
    },
    '140': {
      '1/2':6.35,'3/4':6.35,'1':7.92,'1-1/4':7.92,'1-1/2':7.92,'2':9.53,'2-1/2':11.13,'3':11.13,'3-1/2':12.70,'4':13.49,
      '5':15.88,'6':18.26,'8':23.83,'10':28.58,'12':33.32,'14':35.71,'16':40.49,'18':45.24,'20':50.01,'24':59.54
    },
    '160': {
      '1/2':4.78,'3/4':5.56,'1':6.35,'1-1/4':6.35,'1-1/2':7.14,'2':8.74,'2-1/2':9.53,'3':11.13,'3-1/2':11.13,'4':13.49,
      '5':15.88,'6':18.26,'8':23.01,'10':28.58,'12':33.32,'14':35.71,'16':40.49,'18':45.24,'20':50.01,'24':59.54,
      '30':66.68,'36':81.00
    },
    // ชื่ออื่นที่เจอบนแบบ
    'STD': null, // จะ map ไป 40
    'XS': null,  // map ไป 80
    'XXS': {
      '1/2':7.47,'3/4':7.82,'1':9.09,'1-1/4':9.70,'1-1/2':10.15,'2':11.07,'2-1/2':14.02,'3':15.24,'4':17.12,
      '5':19.05,'6':21.95,'8':22.23,'10':25.40,'12':25.40
    },
    '5S': {
      '1/2':1.65,'3/4':1.65,'1':1.65,'1-1/4':1.65,'1-1/2':1.65,'2':1.65,'2-1/2':2.11,'3':2.11,'4':2.11,'6':2.77,'8':2.77,'10':3.40,'12':3.96
    },
    '10S': {
      '1/2':2.11,'3/4':2.11,'1':2.77,'1-1/4':2.77,'1-1/2':2.77,'2':2.77,'2-1/2':3.05,'3':3.05,'4':3.05,'6':3.40,'8':3.76,'10':4.19,'12':4.57
    },
    '40S': null, // = 40 สำหรับ SS หลายขนาด
    '80S': null
  };

  // alias ชื่อ schedule
  SCH_WALL['STD'] = SCH_WALL['40'];
  SCH_WALL['XS'] = SCH_WALL['80'];
  SCH_WALL['40S'] = SCH_WALL['40'];
  SCH_WALL['80S'] = SCH_WALL['80'];
  SCH_WALL['5'] = SCH_WALL['5S'];
  SCH_WALL['10S'] = SCH_WALL['10S'];

  var SCH_LIST = ['5S','10','10S','20','30','40','STD','40S','60','80','XS','80S','100','120','140','160','XXS'];

  function npsKey(s) {
    s = String(s || '').replace(/["″'in]/gi, '').trim();
    if (PIPE_OD_MM[s] != null) return s;
    // 1.5 -> 1-1/2
    var n = parseFloat(s);
    if (s.indexOf('/') >= 0) {
      var p = s.split('/');
      n = parseFloat(p[0]) / parseFloat(p[1]);
    }
    var map = { 0.125:'1/8', 0.25:'1/4', 0.375:'3/8', 0.5:'1/2', 0.75:'3/4', 1.25:'1-1/4', 1.5:'1-1/2', 2.5:'2-1/2', 3.5:'3-1/2' };
    if (map[n]) return map[n];
    if (!isNaN(n) && PIPE_OD_MM[String(Math.floor(n))] && n === Math.floor(n)) return String(Math.floor(n));
    if (!isNaN(n) && PIPE_OD_MM[String(n)]) return String(n);
    return s;
  }

  function schKey(sch) {
    if (sch == null || sch === '') return null;
    var s = String(sch).toUpperCase().replace(/SCHEDULE|SCH|\s/gi, '');
    if (s === 'STANDARD') s = 'STD';
    if (s === 'EXTRASTRONG' || s === 'EXTRA-STRONG') s = 'XS';
    if (s === 'DOUBLEEXTRA' || s === 'XXSTRONG') s = 'XXS';
    return s;
  }

  function wallMm(nps, sch) {
    var k = npsKey(nps);
    var sk = schKey(sch);
    if (!sk || !SCH_WALL[sk]) return null;
    var table = SCH_WALL[sk];
    if (!table) return null;
    if (table[k] != null) return table[k];
    return null;
  }

  function pipeInfo(nps, sch) {
    var k = npsKey(nps);
    var od = PIPE_OD_MM[k];
    var sk = schKey(sch);
    var wall = wallMm(k, sk);
    var id = (od != null && wall != null) ? +(od - 2 * wall).toFixed(2) : null;
    var available = [];
    if (od != null) {
      SCH_LIST.forEach(function (s) {
        if (SCH_WALL[s] && SCH_WALL[s][k] != null) available.push(s);
      });
    }
    return {
      nps: k,
      od_mm: od || null,
      sch: sk,
      wall_mm: wall,
      id_mm: id,
      schedules_available: available,
      note: od == null
        ? 'ไม่พบ NPS นี้ในตาราง'
        : (wall == null
          ? 'มี OD แต่ยังไม่มีค่า Sch ' + (sk || '') + ' สำหรับ NPS นี้ — ลอง Sch อื่น: ' + available.join(', ')
          : 'อ้างอิงแนวทาง B36.10 (mm) สำหรับประมาณในแอป')
    };
  }

  function listAllForNps(nps) {
    var k = npsKey(nps);
    var od = PIPE_OD_MM[k];
    var rows = [];
    SCH_LIST.forEach(function (s) {
      if (!SCH_WALL[s] || SCH_WALL[s][k] == null) return;
      var w = SCH_WALL[s][k];
      rows.push({ sch: s, wall_mm: w, id_mm: od != null ? +(od - 2 * w).toFixed(2) : null });
    });
    return { nps: k, od_mm: od || null, rows: rows };
  }

  // ========== วาล์ว ==========
  var VALVES = [
    { id:'GV', th:'วาล์วเกต', en:'Gate Valve', aliases:['gate','GV','วาล์วเกต'], ends:['BW','SW','FLG'], use:'เปิด-ปิด เต็มทาง' },
    { id:'GL', th:'วาล์วโกลบ', en:'Globe Valve', aliases:['globe','GL'], ends:['BW','SW','FLG'], use:'ควบคุม/หรี่' },
    { id:'BV', th:'วาล์วบอล', en:'Ball Valve', aliases:['ball','BV','วาล์วบอล'], ends:['BW','SW','FLG'], use:'เปิด-ปิด เร็ว' },
    { id:'BF', th:'บัตเตอร์ฟลาย', en:'Butterfly Valve', aliases:['butterfly','BF'], ends:['FLG','WAFER','LUG'], use:'ขนาดใหญ่ น้ำหนักเบา' },
    { id:'CK', th:'เช็ควาล์ว', en:'Check Valve', aliases:['check','NRV','CK','วาล์วเช็ค'], ends:['BW','SW','FLG'], use:'กันย้อน' },
    { id:'PSV', th:'เซฟตี้วาล์ว', en:'PSV/PRV', aliases:['PSV','PRV','relief','safety'], ends:['FLG'], use:'ระบายความดัน' },
    { id:'CV', th:'วาล์วควบคุม', en:'Control Valve', aliases:['control valve','FCV','FV','CV'], ends:['FLG','BW'], use:'ควบคุมด้วย actuator' },
    { id:'MOV', th:'มอเตอร์วาล์ว', en:'MOV', aliases:['MOV','motor operated'], ends:['BW','FLG'], use:'ขับมอเตอร์' },
    { id:'AOV', th:'วาล์วลม', en:'AOV', aliases:['AOV','pneumatic'], ends:['BW','FLG'], use:'ขับลม' },
    { id:'XV', th:'เปิด-ปิด (SDV)', en:'On/Off XV', aliases:['XV','SDV','shutdown'], ends:['BW','FLG'], use:'safety shutdown' },
    { id:'NRV_SWING', th:'เช็คสวิง', en:'Swing Check', aliases:['swing check'], ends:['BW','FLG'], use:'กันย้อน' },
    { id:'PINCH', th:'พินช์', en:'Pinch Valve', aliases:['pinch'], ends:['FLG'], use:'สลารี/ของหนืด' }
  ];

  var FITTING_SHORT = [
    { id:'EL90_LR', th:'ข้องอ 90° LR', en:'Elbow 90 LR', aliases:['elbow','el90','ข้องอ'] },
    { id:'EL45', th:'ข้องอ 45°', en:'Elbow 45', aliases:['el45','ข้องอ45'] },
    { id:'TEE', th:'ที', en:'Tee', aliases:['tee','ที'] },
    { id:'RED_CON', th:'รีดิวเซอร์', en:'Concentric Reducer', aliases:['reducer','red'] },
    { id:'RED_ECC', th:'รีดิวเซอร์นอกศูนย์', en:'Eccentric Reducer', aliases:['ecc','fot','fob'] },
    { id:'CAP', th:'ฝาปิด', en:'Cap', aliases:['cap'] },
    { id:'WOL', th:'เวลด์โอเล็ต', en:'Weldolet', aliases:['weldolet','olet'] },
    { id:'FLG_WN', th:'หน้าแปลน WN', en:'WN Flange', aliases:['flange','wnrf'] }
  ];

  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

  function lookupValve(q) {
    var n = norm(q);
    for (var i = 0; i < VALVES.length; i++) {
      var v = VALVES[i];
      if (norm(v.id) === n || norm(v.en) === n || norm(v.th) === n) return v;
      for (var j = 0; j < (v.aliases || []).length; j++) {
        if (n.indexOf(norm(v.aliases[j])) >= 0) return v;
      }
    }
    return null;
  }

  function lookupFitting(q) {
    if (window.FittingsKB && FittingsKB.lookup) {
      var f = FittingsKB.lookup(q);
      if (f) return f;
    }
    var n = norm(q);
    for (var i = 0; i < FITTING_SHORT.length; i++) {
      var f = FITTING_SHORT[i];
      if (norm(f.id) === n || n.indexOf(norm(f.th)) >= 0) return f;
      for (var j = 0; j < (f.aliases || []).length; j++) {
        if (n.indexOf(norm(f.aliases[j])) >= 0) return f;
      }
    }
    return null;
  }

  function classifyToken(text) {
    var t = String(text || '');
    var v = lookupValve(t);
    if (v) return { kind: 'valve', item: v };
    var f = lookupFitting(t);
    if (f) return { kind: 'fitting', item: f };
    if (/\bpipe\b|ท่อ|sch\s*\d+|schedule/i.test(t)) {
      var m = t.match(/(\d+\/\d+|\d+(?:\.\d+)?)\s*["″']?.*?sch(?:edule)?\s*(\d+[A-Za-z]*|STD|XS|XXS)/i);
      return { kind: 'pipe', item: pipeInfo(m ? m[1] : '4', m ? m[2] : '40') };
    }
    return { kind: 'unknown', item: null };
  }

  var WORKFLOW_3D4D = {
    title_th: 'แปลงแบบ Piping → 3D → 4D',
    steps: [
      { id: 1, th: 'เปิดแบบ ISO / DXF / รูป', tip: 'ไฟล์ → เปิด DXF หรือรูปแบบ isometric' },
      { id: 2, th: 'ตั้งประเภทงาน = Piping / Petroleum', tip: 'ปุ่มเลือกประเภทงาน หรือ setWorkType' },
      { id: 3, th: 'ตรวจ BOM / ขนาดท่อ / fitting / valve', tip: 'ใช้ 📋 MTO หรือ 🤖 AI ช่วยอ่าน' },
      { id: 4, th: 'แปลง 2D → 3D', tip: 'กดปุ่ม แปลง 2D → 3D แล้วรอโมเดล' },
      { id: 5, th: 'เสริม mesh สัญลักษณ์', tip: 'กด 🧱 Mesh 3D ให้วาล์ว/ฟิตติ้งเป็นรูป 3D' },
      { id: 6, th: 'ตรวจทิศ EL / support', tip: 'สลับโหมด 3D หมุนดู elevation' },
      { id: 7, th: 'แปลง 3D → 4D (ตารางเวลา)', tip: 'กด แปลง 3D → 4D ใส่ช่วงงานติดตั้ง' },
      { id: 8, th: 'ส่งออก GLB / CSV MTO', tip: 'ส่งออก 3D + ดาวน์โหลด MTO' }
    ]
  };

  function setPipingWorkType() {
    var a = window.__app;
    try {
      if (a && typeof a.setWorkType === 'function') {
        var candidates = ['piping', 'pipe', 'petroleum', 'iso', 'process'];
        for (var i = 0; i < candidates.length; i++) {
          try { a.setWorkType(candidates[i]); return candidates[i]; } catch (e) {}
        }
      }
      if (a && typeof a.showWorkType === 'function') { a.showWorkType(); return 'show-ui'; }
    } catch (e) {}
    var btn = document.getElementById('btnWorkType') || document.getElementById('wWorkType');
    if (btn) { btn.click(); return 'clicked-ui'; }
    return null;
  }

  function runConvert3d() {
    var a = window.__app;
    try {
      if (a && typeof a.convert3d === 'function') {
        return Promise.resolve(a.convert3d({})).then(function (r) {
          setTimeout(function () {
            if (window.MeshBuilder && MeshBuilder.buildAll) MeshBuilder.buildAll({}).catch(function () {});
          }, 800);
          return r;
        });
      }
    } catch (e) {}
    var b = document.getElementById('btnTo3d');
    if (b) { b.click(); return Promise.resolve('clicked'); }
    return Promise.reject(new Error('ไม่พบ convert3d'));
  }

  function runConvert4d() {
    var a = window.__app;
    try {
      if (a && typeof a.convert4d === 'function') return Promise.resolve(a.convert4d({}));
    } catch (e) {}
    var b = document.getElementById('btnTo4d');
    if (b) { b.click(); return Promise.resolve('clicked'); }
    return Promise.reject(new Error('ไม่พบ convert4d'));
  }

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) return;
    el.textContent = t; el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 2800);
  }

  function openPanel() {
    var id = 'pipeDomainPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('pipeDomainCss')) {
      var css = document.createElement('style');
      css.id = 'pipeDomainCss';
      css.textContent = '#pipeDomainPanel{display:none;position:fixed;left:12px;top:96px;bottom:48px;width:min(440px,96vw);z-index:20005;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:auto;font-size:12px}#pipeDomainPanel.open{display:block!important}#pipeDomainPanel .hd{position:sticky;top:0;background:#0c4a6e;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;z-index:1}#pipeDomainPanel .hd button,#pipeDomainPanel .bd button{border:0;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:600}#pipeDomainPanel .hd button{background:rgba(255,255,255,.2);color:#fff}#pipeDomainPanel .bd{padding:10px 12px;line-height:1.45}#pipeDomainPanel table{width:100%;border-collapse:collapse;margin:6px 0}#pipeDomainPanel th,#pipeDomainPanel td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}#pipeDomainPanel .rowbtns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#pipeDomainPanel .rowbtns button{background:#e0f2fe;color:#0c4a6e}#pipeDomainPanel input,#pipeDomainPanel select{width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;margin:4px 0}#pipeDomainPanel .step{padding:6px 0;border-bottom:1px solid #f1f5f9}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    var valveRows = VALVES.map(function (v) {
      return '<tr><td><b>' + v.id + '</b></td><td>' + v.th + '</td><td>' + v.use + '</td></tr>';
    }).join('');
    var steps = WORKFLOW_3D4D.steps.map(function (s) {
      return '<div class="step"><b>' + s.id + '. ' + s.th + '</b><br/><span style="opacity:.8">' + s.tip + '</span></div>';
    }).join('');
    var schOpts = SCH_LIST.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
    d.innerHTML = '<div class="hd"><h3 style="margin:0;font-size:14px">🔩 Piping · ตาราง Sch ครบ · 3D/4D</h3><button type="button" id="pdClose">ปิด</button></div>' +
      '<div class="bd">' +
      '<div class="rowbtns">' +
      '<button type="button" id="pdWt">ตั้งงาน Piping</button>' +
      '<button type="button" id="pd3d">แปลง → 3D</button>' +
      '<button type="button" id="pd4d">แปลง → 4D</button>' +
      '<button type="button" id="pdMesh">Mesh 3D</button></div>' +
      '<h4 style="margin:8px 0 4px;color:#0c4a6e">ค้นขนาดท่อ (ตาราง Sch ขยายแล้ว)</h4>' +
      '<input id="pdNps" placeholder="NPS เช่น 3/4, 2, 6, 12"/>' +
      '<select id="pdSch"><option value="">— เลือก Schedule —</option>' + schOpts + '</select>' +
      '<div class="rowbtns"><button type="button" id="pdPipe" style="background:#0c4a6e;color:#fff">คำนวณ OD/หนา/ID</button>' +
      '<button type="button" id="pdAllSch">แสดงทุก Sch ของ NPS นี้</button></div>' +
      '<pre id="pdPipeOut" style="background:#f8fafc;padding:8px;border-radius:8px;font-size:11px">{}</pre>' +
      '<div id="pdSchTable"></div>' +
      '<h4 style="margin:10px 0 4px;color:#0c4a6e">วาล์วที่รู้จัก</h4>' +
      '<table><tr><th>ID</th><th>ชื่อ</th><th>ใช้ทำ</th></tr>' + valveRows + '</table>' +
      '<h4 style="margin:10px 0 4px;color:#0c4a6e">ขั้นตอนแปลง 3D → 4D</h4>' + steps +
      '<h4 style="margin:10px 0 4px;color:#0c4a6e">จำแนกข้อความ</h4>' +
      '<input id="pdCls" placeholder="เช่น 3/4 Sch160 Ball valve BW"/>' +
      '<pre id="pdClsOut" style="background:#f8fafc;padding:8px;border-radius:8px;font-size:11px">{}</pre>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('pdClose').onclick = function () { d.classList.remove('open'); };
    document.getElementById('pdWt').onclick = function () {
      toast('ตั้งประเภทงาน: ' + (setPipingWorkType() || 'เปิด UI ให้เลือกเอง'));
    };
    document.getElementById('pd3d').onclick = function () {
      toast('กำลังแปลง 2D → 3D…');
      runConvert3d().then(function () { toast('สั่งแปลง 3D แล้ว'); }).catch(function (e) { toast(e.message); });
    };
    document.getElementById('pd4d').onclick = function () {
      toast('กำลังแปลง 3D → 4D…');
      runConvert4d().then(function () { toast('สั่งแปลง 4D แล้ว'); }).catch(function (e) { toast(e.message); });
    };
    document.getElementById('pdMesh').onclick = function () {
      if (window.MeshBuilder && MeshBuilder.buildAll) {
        MeshBuilder.buildAll({}).then(function (r) { toast('Mesh: ' + (r && r.count) + ' ชิ้น'); });
      } else toast('MeshBuilder ยังไม่พร้อม');
    };
    document.getElementById('pdPipe').onclick = function () {
      var info = pipeInfo(document.getElementById('pdNps').value, document.getElementById('pdSch').value);
      document.getElementById('pdPipeOut').textContent = JSON.stringify(info, null, 2);
    };
    document.getElementById('pdAllSch').onclick = function () {
      var all = listAllForNps(document.getElementById('pdNps').value);
      document.getElementById('pdPipeOut').textContent = JSON.stringify({ nps: all.nps, od_mm: all.od_mm }, null, 2);
      var html = '<table><tr><th>Sch</th><th>Wall mm</th><th>ID mm</th></tr>';
      all.rows.forEach(function (r) {
        html += '<tr><td>' + r.sch + '</td><td>' + r.wall_mm + '</td><td>' + r.id_mm + '</td></tr>';
      });
      html += '</table>';
      document.getElementById('pdSchTable').innerHTML = html || '<p>ไม่พบ NPS</p>';
    };
    document.getElementById('pdCls').oninput = function (e) {
      document.getElementById('pdClsOut').textContent = JSON.stringify(classifyToken(e.target.value), null, 2);
    };
  }

  function addButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="pipe"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'pipe');
    b.title = 'Piping / ตาราง Sch / แปลง 3D·4D';
    b.innerHTML = '🔩 Piping 3D/4D <span class="ab">Pipe</span>';
    bar.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPanel();
    });
  }

  function registerAppHints() {
    try {
      var a = window.__app;
      if (a && a.SYMS) {
        VALVES.forEach(function (v) {
          if (!a.SYMS[v.id]) a.SYMS[v.id] = { th: v.th, en: v.en, aliases: v.aliases };
        });
      }
    } catch (e) {}
  }

  function boot() {
    addButton();
    registerAppHints();
    setTimeout(registerAppHints, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.PipeDomain = {
    od: PIPE_OD_MM,
    sch: SCH_WALL,
    schList: SCH_LIST,
    pipeInfo: pipeInfo,
    listAllForNps: listAllForNps,
    wallMm: wallMm,
    valves: VALVES,
    lookupValve: lookupValve,
    lookupFitting: lookupFitting,
    classify: classifyToken,
    workflow: WORKFLOW_3D4D,
    setPipingWorkType: setPipingWorkType,
    convert3d: runConvert3d,
    convert4d: runConvert4d,
    open: openPanel
  };

  try {
    if (window.AIAssist && AIAssist.ask) {
      var _ask = AIAssist.ask;
      AIAssist.ask = function (q) {
        var n = norm(q);
        if (/ขนาดท่อ|nps|schedule|sch\s*\d+/.test(n) && /\d/.test(n)) {
          var m = String(q).match(/(\d+\/\d+|\d+(?:\.\d+)?)\s*["″']?.*?sch(?:edule)?\s*(\d+[A-Za-z]*|STD|XS|XXS)/i);
          if (m) return 'ขนาดท่อ: ' + JSON.stringify(pipeInfo(m[1], m[2]), null, 2);
        }
        if (/แปลง\s*3d|convert\s*3d|workflow|ขั้นตอน.*3d/.test(n)) {
          return WORKFLOW_3D4D.title_th + '\n' + WORKFLOW_3D4D.steps.map(function (s) {
            return s.id + ') ' + s.th + ' — ' + s.tip;
          }).join('\n');
        }
        return _ask(q);
      };
    }
  } catch (e) {}
})();
