/*! symbol-lib.js — คลังสัญลักษณ์งานท่อ + วาล์ว/ปั๊ม + ISA-5.1 */
(function () {
  var LIB = null;
  var INDEX = {};

  // ชุดขยาย: วาล์วเพิ่ม / ปั๊ม / แท็ก ISA-5.1 (ผสานกับ symbol-lib.json)
  var EXTRA = [
    {id:'AV',th:'วาล์วมุม',en:'Angle Valve',category:'valve',aliases:['angle valve','AV'],ports:2,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_angle'}},
    {id:'4W',th:'วาล์วสี่ทาง',en:'Four-Way Valve',category:'valve',aliases:['4-way','four way'],ports:4,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_4way'}},
    {id:'PINCH',th:'วาล์วพินช์',en:'Pinch Valve',category:'valve',aliases:['pinch'],ports:2,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_pinch'}},
    {id:'DBB',th:'ดับเบิลบล็อกแอนด์บลีด',en:'Double Block & Bleed',category:'valve',aliases:['DBB','double block'],ports:2,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_dbb'}},
    {id:'CK_SWING',th:'เช็ควาล์วสวิง',en:'Swing Check',category:'valve',aliases:['swing check'],ports:2,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_check_swing'}},
    {id:'CK_LIFT',th:'เช็ควาล์วลิฟต์',en:'Lift Check',category:'valve',aliases:['lift check'],ports:2,std:'ISO/ASME',mesh3d:{type:'valve',body:'body_check_lift'}},
    {id:'XV',th:'วาล์วเปิด-ปิด',en:'On/Off Valve (XV)',category:'valve',aliases:['XV','SDV','on-off'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_onoff'}},
    {id:'MOV',th:'วาล์วมอเตอร์',en:'Motor Operated Valve',category:'valve',aliases:['MOV','motor operated'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_gate',actuator:'motor'}},
    {id:'AOV',th:'วาล์วลม',en:'Air Operated Valve',category:'valve',aliases:['AOV','pneumatic'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_control',actuator:'pneumatic'}},
    {id:'SOV',th:'โซลินอยด์วาล์ว',en:'Solenoid Valve',category:'valve',aliases:['SOV','solenoid'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_solenoid'}},
    {id:'PMP_CENT',th:'ปั๊มหอยโข่ง',en:'Centrifugal Pump',category:'pump',aliases:['pump','centrifugal','P-','ปั๊ม','หอยโข่ง'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'centrifugal'}},
    {id:'PMP_PD',th:'ปั๊ม positive displacement',en:'PD Pump',category:'pump',aliases:['PD pump','positive displacement'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'pd'}},
    {id:'PMP_RECIP',th:'ปั๊มลูกสูบ',en:'Reciprocating Pump',category:'pump',aliases:['reciprocating','piston pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'reciprocating'}},
    {id:'PMP_SCREW',th:'ปั๊มสกรู',en:'Screw Pump',category:'pump',aliases:['screw pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'screw'}},
    {id:'PMP_GEAR',th:'ปั๊มเฟือง',en:'Gear Pump',category:'pump',aliases:['gear pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'gear'}},
    {id:'PMP_DIAPH',th:'ปั๊มไดอะแฟรม',en:'Diaphragm Pump',category:'pump',aliases:['diaphragm pump','AODD'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'diaphragm'}},
    {id:'PMP_SUB',th:'ปั๊มจุ่ม',en:'Submersible Pump',category:'pump',aliases:['submersible'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'submersible'}},
    {id:'PMP_VERT',th:'ปั๊มแนวตั้ง',en:'Vertical Turbine Pump',category:'pump',aliases:['vertical turbine','can pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'vertical'}},
    {id:'PMP_VAC',th:'ปั๊มสุญญากาศ',en:'Vacuum Pump',category:'pump',aliases:['vacuum pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'vacuum'}},
    {id:'PMP_SUMP',th:'ปั๊มซัมป์',en:'Sump Pump',category:'pump',aliases:['sump pump'],ports:2,std:'ISO/ASME',mesh3d:{type:'pump',style:'sump'}},
    {id:'PT',th:'ทรานสมิตเตอร์ความดัน',en:'Pressure Transmitter',category:'instrument',aliases:['PT','PIT'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'P',tag:'PT'}},
    {id:'PI',th:'อินดิเคเตอร์ความดัน',en:'Pressure Indicator',category:'instrument',aliases:['PI','PG'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'P',tag:'PI'}},
    {id:'PIC',th:'คอนโทรลเลอร์ความดัน',en:'Pressure Indicating Controller',category:'instrument',aliases:['PIC'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'P',tag:'PIC'}},
    {id:'PSV',th:'เซฟตี้วาล์ว',en:'Pressure Safety Valve',category:'instrument',aliases:['PSV','PRV'],ports:1,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_relief'}},
    {id:'PSE',th:'จานระเบิด',en:'Rupture Disc (PSE)',category:'instrument',aliases:['PSE','rupture disc'],ports:1,std:'ISA-5.1',mesh3d:{type:'disc'}},
    {id:'FT',th:'ทรานสมิตเตอร์ไหล',en:'Flow Transmitter',category:'instrument',aliases:['FT','FIT'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'F',tag:'FT'}},
    {id:'FI',th:'อินดิเคเตอร์ไหล',en:'Flow Indicator',category:'instrument',aliases:['FI'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'F',tag:'FI'}},
    {id:'FIC',th:'คอนโทรลเลอร์ไหล',en:'Flow Indicating Controller',category:'instrument',aliases:['FIC'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'F',tag:'FIC'}},
    {id:'FE',th:'องค์ประกอบวัดไหล',en:'Flow Element',category:'instrument',aliases:['FE'],ports:1,std:'ISA-5.1',mesh3d:{type:'orifice_plate'}},
    {id:'FV',th:'วาล์วควบคุมไหล',en:'Flow Control Valve',category:'instrument',aliases:['FV','FCV'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_control'}},
    {id:'LT',th:'ทรานสมิตเตอร์ระดับ',en:'Level Transmitter',category:'instrument',aliases:['LT','LIT'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'L',tag:'LT'}},
    {id:'LI',th:'อินดิเคเตอร์ระดับ',en:'Level Indicator',category:'instrument',aliases:['LI','LG'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'L',tag:'LI'}},
    {id:'LIC',th:'คอนโทรลเลอร์ระดับ',en:'Level Indicating Controller',category:'instrument',aliases:['LIC'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'L',tag:'LIC'}},
    {id:'LS',th:'สวิตช์ระดับ',en:'Level Switch',category:'instrument',aliases:['LS','LSH','LSL','LSHH'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'L',tag:'LS'}},
    {id:'TT',th:'ทรานสมิตเตอร์อุณหภูมิ',en:'Temperature Transmitter',category:'instrument',aliases:['TT','TIT'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'T',tag:'TT'}},
    {id:'TI',th:'อินดิเคเตอร์อุณหภูมิ',en:'Temperature Indicator',category:'instrument',aliases:['TI','TG'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'T',tag:'TI'}},
    {id:'TIC',th:'คอนโทรลเลอร์อุณหภูมิ',en:'Temperature Indicating Controller',category:'instrument',aliases:['TIC'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'T',tag:'TIC'}},
    {id:'TE',th:'องค์ประกอบวัดอุณหภูมิ',en:'Temperature Element',category:'instrument',aliases:['TE','RTD','thermocouple'],ports:1,std:'ISA-5.1',mesh3d:{type:'nozzle_small'}},
    {id:'TV',th:'วาล์วควบคุมอุณหภูมิ',en:'Temperature Control Valve',category:'instrument',aliases:['TV','TCV'],ports:2,std:'ISA-5.1',mesh3d:{type:'valve',body:'body_control'}},
    {id:'AT',th:'ทรานสมิตเตอร์วิเคราะห์',en:'Analyzer Transmitter',category:'instrument',aliases:['AT','AIT'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'A',tag:'AT'}},
    {id:'PDT',th:'ทรานสมิตเตอร์ dP',en:'DP Transmitter',category:'instrument',aliases:['PDT','DP'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'P',tag:'PDT'}},
    {id:'HS',th:'สวิตช์มือ',en:'Hand Switch',category:'instrument',aliases:['HS'],ports:1,std:'ISA-5.1',mesh3d:{type:'instrument_bubble',variable:'H',tag:'HS'}}
  ];

  var ISA5 = {
    standard: 'ANSI/ISA-5.1-2024',
    tag_format: '[First][Succeeding]-[Loop][Suffix]',
    examples: ['FT-101','PIC-202','LSHH-401A','FV-101'],
    first_letters: {A:'Analysis',F:'Flow',L:'Level',P:'Pressure',T:'Temperature',V:'Vibration',W:'Weight',S:'Speed',Z:'Position',X:'Unclassified',H:'Hand'},
    succeeding_letters: {T:'Transmit',I:'Indicate',C:'Control',R:'Record',S:'Switch',V:'Valve',A:'Alarm',E:'Element',Y:'Relay',H:'High',L:'Low'},
    bubble_shapes: {circle:'field instrument',square:'DCS/shared display',diamond:'interlock/safety'},
    note_th: 'ISA-5.1 กำหนดแท็กและสัญลักษณ์เครื่องมือวัด/ควบคุม — ไม่ครอบคลุมรูปปั๊มหรือถังโดยตรง'
  };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function categoryColor(c) {
    return ({
      pipe:'#60a5fa',fitting:'#34d399',flange:'#fbbf24',valve:'#f87171',
      weld:'#a3a3a3',support:'#c084fc',special:'#fb923c',instrument:'#22d3ee',pump:'#818cf8'
    })[c] || '#94a3b8';
  }

  function mergeExtra(data) {
    data = data || { symbols: [], count: 0 };
    data.symbols = data.symbols || [];
    var have = {};
    data.symbols.forEach(function (s) { have[s.id] = true; });
    EXTRA.forEach(function (s) {
      if (!have[s.id]) { data.symbols.push(s); have[s.id] = true; }
    });
    data.count = data.symbols.length;
    data.isa5_1 = ISA5;
    data.version = data.version || '1.1.0';
    return data;
  }

  function rebuildIndex() {
    INDEX = {};
    if (!LIB || !LIB.symbols) return;
    LIB.symbols.forEach(function (sy) {
      (sy.aliases || []).forEach(function (a) { INDEX[norm(a)] = sy; });
      INDEX[norm(sy.id)] = sy;
      INDEX[norm(sy.en)] = sy;
      INDEX[norm(sy.th)] = sy;
    });
  }

  function lookup(q) {
    if (!q || !LIB) return null;
    var n = norm(q);
    if (INDEX[n]) return INDEX[n];
    var keys = Object.keys(INDEX);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(n) >= 0 || n.indexOf(keys[i]) >= 0) return INDEX[keys[i]];
    }
    return null;
  }

  function meshParams(symbolId, nps) {
    var sy = lookup(symbolId);
    if (!sy) return null;
    var od = (LIB.nps_hint_mm && LIB.nps_hint_mm[String(nps)]) || 114.3;
    return {
      id: sy.id, th: sy.th, en: sy.en, category: sy.category,
      recipe: sy.mesh3d || {}, od_mm: od, r_mm: od / 2, color: categoryColor(sy.category)
    };
  }

  function listByCategory() {
    var map = {};
    if (!LIB) return map;
    (LIB.symbols || []).forEach(function (sy) {
      (map[sy.category] = map[sy.category] || []).push(sy);
    });
    return map;
  }

  function registerWithApp() {
    window.__SYMBOL_LIB = {
      raw: LIB, lookup: lookup, meshParams: meshParams,
      listByCategory: listByCategory, all: (LIB && LIB.symbols) || [], isa5_1: ISA5
    };
    try {
      var a = window.__app;
      if (a && a.SYMS && typeof a.SYMS === 'object' && LIB) {
        LIB.symbols.forEach(function (sy) {
          try {
            if (!a.SYMS[sy.id]) a.SYMS[sy.id] = { th: sy.th, en: sy.en, aliases: sy.aliases };
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  function openBrowser() {
    if (!LIB) {
      alert('กำลังโหลดคลังสัญลักษณ์… ลองใหม่ใน 1 วินาที');
      return;
    }
    var existing = document.getElementById('symLibPanel');
    if (existing) { existing.classList.toggle('open'); return; }
    var css = document.createElement('style');
    css.textContent = '#symLibPanel{display:none;position:fixed;left:12px;top:110px;bottom:56px;width:min(420px,96vw);z-index:9600;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.2);overflow:auto;font-size:12px}#symLibPanel.open{display:block}#symLibPanel .sh{position:sticky;top:0;background:#0f766e;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}#symLibPanel .sh h3{margin:0;font-size:14px}#symLibPanel .sh button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}#symLibPanel .sb{padding:10px 12px}#symLibPanel .cat{margin:10px 0 4px;font-weight:700;color:#0f766e}#symLibPanel .row{display:flex;gap:8px;border-bottom:1px solid #eee;padding:6px 0;align-items:flex-start}#symLibPanel .dot{width:10px;height:10px;border-radius:50%;margin-top:4px;flex:0 0 auto}#symLibPanel .meta{opacity:.75;font-size:11px}#symLibPanel input{width:100%;padding:8px;border:1px solid #c5d0dc;border-radius:8px;margin-bottom:8px;box-sizing:border-box}#symLibPanel .isa{background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:8px;margin-bottom:10px;font-size:11px}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'symLibPanel';
    d.className = 'open';
    d.innerHTML = '<div class="sh"><h3>🔣 คลังสัญลักษณ์ 3D (' + (LIB.count || 0) + ')</h3><button type="button" id="symLibClose">ปิด</button></div><div class="sb">' +
      '<div class="isa"><b>ISA-5.1</b> ' + ISA5.standard + '<br/>แท็ก: ' + ISA5.tag_format +
      '<br/>ตัวอย่าง: ' + ISA5.examples.join(', ') + '<br/>' + ISA5.note_th + '</div>' +
      '<input id="symLibQ" placeholder="ค้นหา เช่น pump, gate, PT, ข้องอ…"/><div id="symLibBody"></div></div>';
    document.body.appendChild(d);
    document.getElementById('symLibClose').onclick = function () { d.classList.remove('open'); };
    function render(filter) {
      var body = document.getElementById('symLibBody');
      var f = norm(filter);
      var by = listByCategory();
      var html = '';
      Object.keys(by).sort().forEach(function (cat) {
        var rows = by[cat].filter(function (sy) {
          if (!f) return true;
          var blob = norm([sy.id, sy.th, sy.en].concat(sy.aliases || []).join(' '));
          return blob.indexOf(f) >= 0;
        });
        if (!rows.length) return;
        html += '<div class="cat">' + cat + ' (' + rows.length + ')</div>';
        rows.forEach(function (sy) {
          html += '<div class="row"><span class="dot" style="background:' + categoryColor(sy.category) + '"></span><div><b>' + sy.th + '</b> · ' + sy.en +
            '<div class="meta">' + sy.id + ' · ' + ((sy.mesh3d && sy.mesh3d.type) || '') + ' · ' + (sy.aliases || []).slice(0, 5).join(', ') + '</div></div></div>';
        });
      });
      body.innerHTML = html || '<div class="meta">ไม่พบ</div>';
    }
    render('');
    document.getElementById('symLibQ').oninput = function (e) { render(e.target.value); };
  }

  function load() {
    fetch('symbol-lib.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        LIB = mergeExtra(data);
        rebuildIndex();
        registerWithApp();
        console.info('[symbol-lib] loaded', LIB.count, 'symbols');
      })
      .catch(function () {
        LIB = mergeExtra({ symbols: [], nps_hint_mm: { '2': 60.3, '4': 114.3, '6': 168.3 } });
        rebuildIndex();
        registerWithApp();
        console.info('[symbol-lib] offline EXTRA only', LIB.count);
      });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-feat="symbol"]');
    if (!t) return;
    setTimeout(openBrowser, 50);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();

  window.SymbolLib = {
    open: openBrowser,
    lookup: lookup,
    meshParams: meshParams,
    isa5_1: ISA5,
    get data() { return LIB; }
  };
})();
