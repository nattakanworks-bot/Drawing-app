/*! iso-reader.js — สอนแอปอ่านแบบ Piping Isometric แบบโครงการ (Thai Oil / EPC)
 * อ้างอิงโครงสร้างจริงจากแบบ ISO: Line 3/4"-P107F56, Alloy 25Cr, Sch160
 */
(function () {
  /** โครงสร้างแผ่น ISO มาตรฐานโรงงาน */
  var SHEET_LAYOUT = {
    title: 'Piping Isometric Drawing',
    zones: {
      north: 'มุมซ้ายบน — ลูกศร N (North)',
      iso_view: 'กลางซ้าย — รูป isometric ท่อ + มิติ mm + elevation',
      detail_bubbles: 'ซ้าย — วงรี/กรอบ SEE ISO / detail support',
      bom: 'ขวาบน — BILL OF MATERIALS (PT NO, DESCRIPTION, SIZE, ITEM CODE, QTY)',
      cutting_list: 'ขวากลาง — CUTTING LIST (PIECE, SIZE, ITEM CODE, LENGTH)',
      flange_joint: 'ขวา — FLANGE JOINT NO',
      title_block: 'ล่างขวา — LINE NO, WBS, DRAWING NO, PROJECT, MATERIAL',
      weld_summary: 'ล่างกลาง — WELD SUMMARY (WELD-NO, SIZE, TYPE, NDT, LOCATION)',
      revision: 'ล่างซ้าย — REVISION CONTROL / ISSUED FOR CONSTRUCTION',
      legend: 'ล่างซ้าย — LEGEND สัญลักษณ์ข้อต่อ/support'
    }
  };

  /** รูปแบบ Line Number ที่พบบ่อย */
  var LINE_NO_PATTERN =
    /^(\d+\/?\d*(?:\"|in)?)[-–]([A-Z]?\d+[A-Z]?\d*)[-–](\d+)[-–]?([A-Z])?/i;
  // ตัวอย่าง: 3/4"-P107F56-2521208-H

  /** รู้จำข้อความจาก BOM / callout */
  var BOM_RULES = [
    {
      id: 'PIPE',
      test: /pipe\s*(pe|be)?\s*asme\s*b36\.?10|ท่อ|sch\s*\d+/i,
      map: { kind: 'pipe', std: 'ASME B36.10' },
      note: 'ท่อ — ดู SIZE + Sch ในคอลัมน์ SIZE/DESCRIPTION'
    },
    {
      id: 'TEE',
      test: /tee\s*(equal|red)?|ที\s*(เท่า|ลด)?|asme\s*b16\.?9.*tee/i,
      map: { kind: 'fitting', symbol: 'TEE', std: 'ASME B16.9' }
    },
    {
      id: 'ELBOW90',
      test: /elbow\s*90|90\s*deg|el\s*90|ข้องอ\s*90|lr\s*asme\s*b16\.?9/i,
      map: { kind: 'fitting', symbol: 'EL90_LR', std: 'ASME B16.9' }
    },
    {
      id: 'ELBOW45',
      test: /elbow\s*45|45\s*deg|ข้องอ\s*45/i,
      map: { kind: 'fitting', symbol: 'EL45', std: 'ASME B16.9' }
    },
    {
      id: 'BALL_VALVE',
      test: /ball\s*valve|วาล์วบอล|floating\s*metal\s*seat/i,
      map: { kind: 'valve', symbol: 'BV' }
    },
    {
      id: 'GATE_VALVE',
      test: /gate\s*valve|วาล์วเกต/i,
      map: { kind: 'valve', symbol: 'GV' }
    },
    {
      id: 'SUPPORT_CLI',
      test: /cantilever\s*support|cli-?\d|support.*cli/i,
      map: { kind: 'support', symbol: 'SUP_CANTILEVER' }
    },
    {
      id: 'PIPE_SHOE',
      test: /pipe\s*shoe|clamp(ed)?\s*(pipe)?\s*shoe|shoe\s*0\.\d+/i,
      map: { kind: 'support', symbol: 'SUP_SHOE' }
    },
    {
      id: 'BASE_PLATE',
      test: /anchored\s*base\s*plate|base\s*plate\s*on\s*steel/i,
      map: { kind: 'support', symbol: 'SUP_BASE' }
    },
    {
      id: 'REDUCER',
      test: /reducer|concentric|eccentric|รีดิวเซอร์/i,
      map: { kind: 'fitting', symbol: 'RED_CON' }
    },
    {
      id: 'FLANGE',
      test: /flange|wnrf|sor|หน้าแปลน/i,
      map: { kind: 'flange', symbol: 'FLG_WN' }
    }
  ];

  /** สัญลักษณ์ข้อต่อบนแบบ (LEGEND) */
  var JOINT_SYMBOLS = {
    shop_joint: { mark: '○ / วงกลมทึบหรือเปิด', meaning: 'Shop joint — เชื่อมในร้าน', field: false },
    field_joint: { mark: '△ / สี่เหลี่ยม field', meaning: 'Field joint — เชื่อมหน้างาน', field: true },
    field_weld_bw: { mark: 'BW + เลข weld', meaning: 'Butt weld หน้างาน', type: 'BW' },
    socket_weld: { mark: 'SW', meaning: 'Socket weld', type: 'SW' },
    threaded: { mark: 'THD / screwed', meaning: 'ข้อต่อเกลียว', type: 'THD' },
    flanged: { mark: 'FLG / flange joint no', meaning: 'หน้าแปลน', type: 'FLG' }
  };

  /** Weld Summary columns */
  var WELD_COLS = ['WELD-NO', 'SIZE', 'WELD-TYPE', 'NDT', 'LOCATION', 'NPS NO'];

  /** ตัวอย่างจากแบบจริง (Clean Fuel / 3/4" Sch160) — ใช้เป็น template รู้จำ */
  var SAMPLE_FROM_DRAWING = {
    owner: 'Thai Oil Public Company Limited',
    project: 'CLEAN FUEL PROJECT',
    site: 'SRIRACHA THAILAND',
    line_no: '3/4"-P107F56-2521208-H',
    drawing_no: 'R1118111-10700-PI-ISO-P107F56',
    wbs_line_id: 'C03BSTB026-P107F56-02',
    area_no: '10700',
    sheet_rev: '2402 0A',
    material: 'Alloy 25Cr',
    main_size: '3/4"',
    schedule: 'Sch160',
    piping_class: 'ดู title block / piping class',
    status: 'ISSUED FOR CONSTRUCTION',
    bom_highlight: [
      { pt: 1, desc: '3/4" Sch160 Pipe PE ASME B36.10M', size: '3/4', qty: 'หลายความยาว' },
      { pt: 2, desc: '3/4" Sch160 Tee equal BW ASME B16.9', size: '3/4', qty: 1 },
      { pt: 3, desc: '3/4" Sch160 Elbow 90 deg BW LR ASME B16.9', size: '3/4', qty: 1 },
      { pt: 4, desc: '3/4" Sch160 Ball valve red bore BW', size: '3/4', qty: 1 },
      { pt: 5, desc: 'Anchored base plate on steel', size: '3/4' },
      { pt: 6, desc: 'Clamped pipe shoe', size: '3/4' },
      { pt: 8, desc: 'Cantilever support CLI-1', size: '3/4' }
    ],
    reading_order: [
      '1) อ่าน LINE NO + SIZE + MATERIAL จาก title block',
      '2) อ่าน BOM → รายการชิ้นส่วน (pipe/fitting/valve/support)',
      '3) อ่าน CUTTING LIST → ความยาวท่อแต่ละ piece',
      '4) ไล่ isometric จากต้นทาง → ปลายทาง ตามลูกศร flow / elevation',
      '5) จับ elevation (EL=…) และพิกัดมิติ mm',
      '6) แยก shop weld vs field weld จากสัญลักษณ์ + WELD SUMMARY',
      '7) อ่าน support tag (CLI, shoe) และจุดยึด',
      '8) ดู continuation “SEE ISO …” ถ้าเส้นต่อแผ่นอื่น',
      '9) ตรวจ REV / ISSUED FOR CONSTRUCTION ก่อนใช้หน้างาน'
    ]
  };

  /** Parse ข้อความ callout / BOM บรรทัด */
  function parseBomLine(text) {
    text = String(text || '');
    var hit = null;
    for (var i = 0; i < BOM_RULES.length; i++) {
      if (BOM_RULES[i].test.test(text)) {
        hit = BOM_RULES[i];
        break;
      }
    }
    var size = null;
    var m = text.match(/(\d+\/\d+|\d+(?:\.\d+)?)\s*["″]?\s*(?:sch\s*(\d+))?/i);
    if (m) size = { nps: m[1], sch: m[2] || null };
    var el = null;
    var em = text.match(/EL\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (em) el = parseFloat(em[1]);
    return {
      raw: text,
      rule: hit ? hit.id : null,
      map: hit ? hit.map : null,
      size: size,
      elevation: el
    };
  }

  function parseLineNo(s) {
    s = String(s || '').trim();
    var m = s.match(LINE_NO_PATTERN);
    if (!m) return { raw: s, ok: false };
    return {
      raw: s,
      ok: true,
      nps: m[1],
      fluid_or_line: m[2],
      serial: m[3],
      insulation_or_suffix: m[4] || null
    };
  }

  /** คำแนะนำเมื่อเจอแบบชุดนี้ */
  function guideForThisSheet() {
    return {
      title: 'วิธีอ่านแบบ ISO ชุดนี้ (Thai Oil / Clean Fuel ตัวอย่าง)',
      steps: SAMPLE_FROM_DRAWING.reading_order,
      key_fields: {
        line_no: SAMPLE_FROM_DRAWING.line_no,
        material: SAMPLE_FROM_DRAWING.material,
        size_sch: SAMPLE_FROM_DRAWING.main_size + ' ' + SAMPLE_FROM_DRAWING.schedule,
        drawing_no: SAMPLE_FROM_DRAWING.drawing_no
      },
      legend_tips: JOINT_SYMBOLS,
      bom_tips: 'คอลัมน์ PT NO = หมายเลขอ้างในรูป; DESCRIPTION มี size+spec; QTY บางบรรทัดถูกไฮไลต์เมื่อมี field change',
      weld_tips: 'WELD SUMMARY: BW = butt weld, ดู NDT (RT/MT/PT) และ LOCATION เลขอ้างจุดบน iso',
      support_tips: 'CLI-1 = cantilever; pipe shoe / clamped shoe = รองท่อ; base plate = ฐานยึดโครงเหล็ก'
    };
  }

  function openPanel() {
    var id = 'isoReaderPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('isoReaderCss')) {
      var css = document.createElement('style');
      css.id = 'isoReaderCss';
      css.textContent = '#isoReaderPanel{display:none;position:fixed;left:12px;top:96px;bottom:48px;width:min(440px,96vw);z-index:20002;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:auto;font-size:12px;color:#1c1917}#isoReaderPanel.open{display:block!important}#isoReaderPanel .hd{position:sticky;top:0;background:#1e3a5f;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;z-index:1}#isoReaderPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}#isoReaderPanel .bd{padding:10px 12px;line-height:1.45}#isoReaderPanel h4{margin:12px 0 4px;color:#1e3a5f}#isoReaderPanel code,#isoReaderPanel pre{background:#f1f5f9;padding:2px 6px;border-radius:6px;font-size:11px}#isoReaderPanel ol{padding-left:18px}#isoReaderPanel table{width:100%;border-collapse:collapse;margin:6px 0}#isoReaderPanel td,#isoReaderPanel th{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}#isoReaderPanel .tag{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:6px;padding:1px 6px;margin:2px;font-size:11px}';
      document.head.appendChild(css);
    }
    var g = guideForThisSheet();
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    d.innerHTML =
      '<div class="hd"><h3 style="margin:0;font-size:14px">📐 อ่านแบบ ISO (EPC / Thai Oil)</h3>' +
      '<button type="button" id="isoReaderClose">ปิด</button></div><div class="bd">' +
      '<p><b>ตัวอย่างจากแบบที่คุณส่ง:</b><br/>' +
      '<span class="tag">' + SAMPLE_FROM_DRAWING.line_no + '</span> ' +
      '<span class="tag">' + SAMPLE_FROM_DRAWING.material + '</span> ' +
      '<span class="tag">' + SAMPLE_FROM_DRAWING.main_size + ' ' + SAMPLE_FROM_DRAWING.schedule + '</span></p>' +
      '<p>Drawing: <code>' + SAMPLE_FROM_DRAWING.drawing_no + '</code><br/>' +
      'สถานะ: <b>' + SAMPLE_FROM_DRAWING.status + '</b> · ' + SAMPLE_FROM_DRAWING.project + '</p>' +
      '<h4>ลำดับการอ่านที่ถูกต้อง</h4><ol>' +
      g.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
      '</ol>' +
      '<h4>โซนบนแผ่นแบบ</h4><ul>' +
      Object.keys(SHEET_LAYOUT.zones).map(function (k) {
        return '<li><b>' + k + '</b> — ' + SHEET_LAYOUT.zones[k] + '</li>';
      }).join('') +
      '</ul>' +
      '<h4>BOM ที่โปรแกรมรู้จักจากชุดนี้</h4><table><tr><th>PT</th><th>คำอธิบาย</th></tr>' +
      SAMPLE_FROM_DRAWING.bom_highlight.map(function (b) {
        return '<tr><td>' + b.pt + '</td><td>' + b.desc + '</td></tr>';
      }).join('') +
      '</table>' +
      '<h4>สัญลักษณ์ข้อต่อ</h4><ul>' +
      Object.keys(JOINT_SYMBOLS).map(function (k) {
        var j = JOINT_SYMBOLS[k];
        return '<li><b>' + k + '</b>: ' + j.mark + ' → ' + j.meaning + '</li>';
      }).join('') +
      '</ul>' +
      '<h4>ลอง parse ข้อความ</h4>' +
      '<input id="isoParseIn" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box" placeholder="วางข้อความ BOM เช่น 3/4 Sch160 Elbow 90 deg BW"/>' +
      '<pre id="isoParseOut" style="margin-top:8px;padding:8px;border-radius:8px">{}</pre>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('isoReaderClose').onclick = function () { d.classList.remove('open'); };
    document.getElementById('isoParseIn').oninput = function (e) {
      document.getElementById('isoParseOut').textContent = JSON.stringify(parseBomLine(e.target.value), null, 2);
    };
  }

  function addButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="iso"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'iso');
    b.title = 'สอนอ่านแบบ Piping Isometric';
    b.innerHTML = '📐 อ่าน ISO <span class="ab">ISO</span>';
    bar.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPanel();
    });
  }

  function register() {
    window.__ISO_READER = {
      layout: SHEET_LAYOUT,
      sample: SAMPLE_FROM_DRAWING,
      parseBomLine: parseBomLine,
      parseLineNo: parseLineNo,
      guide: guideForThisSheet,
      joints: JOINT_SYMBOLS,
      weldCols: WELD_COLS
    };
    // ผสานกฎเข้า SymbolLib / Fittings ถ้ามี
    try {
      if (window.FittingsKB && FittingsKB.lookup) {
        /* already have fittings */
      }
      if (window.__app && window.__app.ISO) {
        console.info('[iso-reader] app.ISO available — knowledge layer ready');
      }
    } catch (e) {}
  }

  function boot() {
    register();
    addButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.IsoReader = {
    open: openPanel,
    parseBomLine: parseBomLine,
    parseLineNo: parseLineNo,
    guide: guideForThisSheet,
    sample: SAMPLE_FROM_DRAWING
  };
})();
