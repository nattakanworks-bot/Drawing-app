/*! fittings-dims.js — ตาราง center-to-end / end-to-end แนวทาง ASME B16.9 (mm)
 * ค่าอ้างอิงสาธารณะที่ใช้ในงานประมาณการและโมเดล — งานสั่งของให้ยืนยันจากตาราง ASME ฉบับเต็ม
 */
(function () {
  // NPS keys แบบทศนิยมและเศษส่วน
  var NPS = ['0.5','0.75','1','1.25','1.5','2','2.5','3','3.5','4','5','6','8','10','12','14','16','18','20','24'];

  // OD mm
  var OD = {
    '0.5':21.3,'0.75':26.7,'1':33.4,'1.25':42.2,'1.5':48.3,'2':60.3,'2.5':73.0,'3':88.9,'3.5':101.6,
    '4':114.3,'5':141.3,'6':168.3,'8':219.1,'10':273.0,'12':323.9,'14':355.6,'16':406.4,'18':457,'20':508,'24':610
  };

  // Elbow 90° LR center-to-end A (mm) — ค่ามาตรฐานที่พบบ่อย
  var EL90_LR_A = {
    '0.5':38,'0.75':38,'1':38,'1.25':48,'1.5':57,'2':76,'2.5':95,'3':114,'3.5':133,
    '4':152,'5':190,'6':229,'8':305,'10':381,'12':457,'14':533,'16':610,'18':686,'20':762,'24':914
  };
  // Elbow 90° SR A (mm)
  var EL90_SR_A = {
    '1':25,'1.25':32,'1.5':38,'2':51,'2.5':64,'3':76,'3.5':89,'4':102,'5':127,'6':152,
    '8':203,'10':254,'12':305,'14':356,'16':406,'18':457,'20':508,'24':610
  };
  // Elbow 45° LR center-to-end B (mm)
  var EL45_B = {
    '0.5':16,'0.75':19,'1':22,'1.25':25,'1.5':29,'2':35,'2.5':44,'3':51,'3.5':57,
    '4':64,'5':79,'6':95,'8':127,'10':159,'12':190,'14':222,'16':254,'18':286,'20':318,'24':381
  };
  // Equal Tee C / M center-to-end (mm) — run & branch เท่ากัน
  var TEE_C = {
    '0.5':25,'0.75':29,'1':38,'1.25':48,'1.5':57,'2':64,'2.5':76,'3':86,'3.5':95,
    '4':105,'5':124,'6':143,'8':178,'10':216,'12':254,'14':279,'16':305,'18':343,'20':381,'24':432
  };
  // Cap length E approx (mm)
  var CAP_E = {
    '0.5':25,'0.75':25,'1':38,'1.25':38,'1.5':38,'2':38,'2.5':38,'3':51,'3.5':51,
    '4':51,'5':64,'6':64,'8':76,'10':89,'12':102,'14':127,'16':127,'18':152,'20':152,'24':178
  };
  // Concentric reducer overall length H (mm) — คีย์ "ใหญ่xเล็ก" แบบยอดฮิต + กฎประมาณ
  var RED_H = {
    '2x1.5':76,'2x1':76,'2.5x2':89,'3x2':89,'3x2.5':89,'4x3':102,'4x2':102,'6x4':140,'6x3':140,
    '8x6':152,'8x4':152,'10x8':178,'10x6':178,'12x10':203,'12x8':203,'12x6':203,'16x12':305,'20x16':356,'24x20':406
  };

  // Flange WN RF Class 150 thickness / OD approx (mm) — ย่อ
  var FLG150 = {
    '0.5':{od:90,t:11.2,bc:60.3,nbolt:4,bolt:'1/2'},
    '0.75':{od:100,t:12.7,bc:69.9,nbolt:4,bolt:'1/2'},
    '1':{od:110,t:14.3,bc:79.4,nbolt:4,bolt:'1/2'},
    '1.5':{od:125,t:17.5,bc:98.4,nbolt:4,bolt:'1/2'},
    '2':{od:150,t:19.1,bc:120.7,nbolt:4,bolt:'5/8'},
    '3':{od:190,t:23.9,bc:152.4,nbolt:4,bolt:'5/8'},
    '4':{od:230,t:23.9,bc:190.5,nbolt:8,bolt:'5/8'},
    '6':{od:280,t:25.4,bc:241.3,nbolt:8,bolt:'3/4'},
    '8':{od:345,t:28.6,bc:298.5,nbolt:8,bolt:'3/4'},
    '10':{od:405,t:30.2,bc:362.0,nbolt:12,bolt:'7/8'},
    '12':{od:485,t:31.8,bc:431.8,nbolt:12,bolt:'7/8'}
  };

  // Face-to-face วาล์วโดยประมาณ (mm) — ASME B16.10 แนวทาง short pattern / คร่าว ๆ
  var VALVE_FTF = {
    GV: { '2':178,'3':203,'4':229,'6':267,'8':292,'10':330,'12':356 },
    BV: { '0.75':65,'1':70,'1.5':90,'2':110,'3':140,'4':170,'6':220,'8':260 },
    GL: { '1':130,'1.5':165,'2':200,'3':240,'4':290,'6':380 },
    CK: { '2':150,'3':180,'4':200,'6':250,'8':280,'10':320 }
  };

  function keyNps(nps) {
    var s = String(nps || '').replace(/["″'in]/gi,'').trim();
    if (OD[s] != null) return s;
    var n = parseFloat(s);
    if (s.indexOf('/') >= 0) {
      var p = s.split('/');
      n = parseFloat(p[0]) / parseFloat(p[1]);
    }
    var map = {0.5:'0.5',0.75:'0.75',1.25:'1.25',1.5:'1.5',2.5:'2.5',3.5:'3.5'};
    if (map[n]) return map[n];
    if (!isNaN(n) && OD[String(n)]) return String(n);
    // 1-1/2 style
    s = s.replace('1-1/4','1.25').replace('1-1/2','1.5').replace('2-1/2','2.5').replace('3-1/2','3.5');
    s = s.replace('1/2','0.5').replace('3/4','0.75');
    if (OD[s] != null) return s;
    return s;
  }

  function dim(kind, nps, nps2) {
    var k = keyNps(nps);
    var out = { kind: kind, nps: k, od_mm: OD[k] || null, unit: 'mm', source: 'B16.9-style reference table' };
    if (kind === 'EL90_LR' || kind === 'elbow90_lr') {
      out.A_mm = EL90_LR_A[k] || null;
      out.rule = 'center-to-end A';
    } else if (kind === 'EL90_SR' || kind === 'elbow90_sr') {
      out.A_mm = EL90_SR_A[k] || null;
    } else if (kind === 'EL45' || kind === 'elbow45') {
      out.B_mm = EL45_B[k] || null;
    } else if (kind === 'TEE' || kind === 'tee') {
      out.C_mm = TEE_C[k] || null;
      out.M_mm = TEE_C[k] || null;
    } else if (kind === 'CAP' || kind === 'cap') {
      out.E_mm = CAP_E[k] || null;
    } else if (kind === 'RED' || kind === 'RED_CON' || kind === 'reducer') {
      var k2 = keyNps(nps2 || nps);
      var hk = k + 'x' + k2;
      out.nps_large = k;
      out.nps_small = k2;
      out.H_mm = RED_H[hk] || (OD[k] && OD[k2] ? Math.round((OD[k] + OD[k2]) * 0.55) : null);
      out.note = RED_H[hk] ? 'จากตารางยอดใช้' : 'ประมาณจาก OD (ยืนยันตารางจริงก่อนสั่งของ)';
    } else if (kind === 'FLG150' || kind === 'flange150') {
      out.flange = FLG150[k] || null;
    } else if (kind === 'GV' || kind === 'BV' || kind === 'GL' || kind === 'CK') {
      out.ftf_mm = (VALVE_FTF[kind] && VALVE_FTF[kind][k]) || null;
      out.note = 'face-to-face โดยประมาณ';
    } else {
      out.A_mm = EL90_LR_A[k] || null;
      out.C_mm = TEE_C[k] || null;
    }
    return out;
  }

  function packageForNps(nps) {
    var k = keyNps(nps);
    return {
      nps: k,
      od_mm: OD[k] || null,
      elbow90_lr_A: EL90_LR_A[k] || null,
      elbow90_sr_A: EL90_SR_A[k] || null,
      elbow45_B: EL45_B[k] || null,
      tee_C: TEE_C[k] || null,
      cap_E: CAP_E[k] || null,
      flange150: FLG150[k] || null
    };
  }

  // ผสานเข้า FittingsKB.dims
  function patchFittingsKB() {
    if (!window.FittingsKB) return;
    var old = FittingsKB.dims;
    FittingsKB.dims = function (nps) {
      var p = packageForNps(nps);
      return {
        nps: p.nps,
        od_mm: p.od_mm,
        el90_lr_A_mm: p.elbow90_lr_A,
        el90_sr_A_mm: p.elbow90_sr_A,
        el45_B_mm: p.elbow45_B,
        tee_C_mm: p.tee_C,
        cap_E_mm: p.cap_E,
        flange150: p.flange150,
        note: 'ตาราง fittings-dims.js (แนวทาง B16.9) — ใช้ประมาณการ/โมเดล'
      };
    };
    FittingsKB.dim = dim;
    FittingsKB.packageForNps = packageForNps;
    FittingsKB.tables = {
      EL90_LR_A: EL90_LR_A,
      EL90_SR_A: EL90_SR_A,
      EL45_B: EL45_B,
      TEE_C: TEE_C,
      CAP_E: CAP_E,
      RED_H: RED_H,
      FLG150: FLG150,
      VALVE_FTF: VALVE_FTF,
      OD: OD
    };
  }

  function openQuick() {
    var id = 'fitDimsPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('fitDimsCss')) {
      var css = document.createElement('style');
      css.id = 'fitDimsCss';
      css.textContent = '#fitDimsPanel{display:none;position:fixed;left:12px;bottom:56px;width:min(420px,96vw);max-height:70vh;z-index:20006;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:auto;font-size:12px}#fitDimsPanel.open{display:block!important}#fitDimsPanel .hd{position:sticky;top:0;background:#7c2d12;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;z-index:1}#fitDimsPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}#fitDimsPanel .bd{padding:10px 12px}#fitDimsPanel table{width:100%;border-collapse:collapse;margin-top:8px}#fitDimsPanel td,#fitDimsPanel th{border:1px solid #eee;padding:4px 6px;text-align:left}#fitDimsPanel input,#fitDimsPanel select{padding:8px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 4px 4px 0}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id; d.className = 'open';
    var opts = NPS.map(function (n) { return '<option value="' + n + '">' + n + '"</option>'; }).join('');
    d.innerHTML = '<div class="hd"><b>📏 ตารางขนาด Fitting (B16.9)</b><button type="button" id="fdClose">ปิด</button></div>' +
      '<div class="bd"><label>NPS </label><select id="fdNps">' + opts + '</select> ' +
      '<button type="button" id="fdGo" style="background:#7c2d12;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer">แสดง</button>' +
      '<pre id="fdOut" style="background:#f8fafc;padding:8px;border-radius:8px;font-size:11px;margin-top:8px"></pre>' +
      '<p style="opacity:.75">รวม Elbow 90 LR/SR, 45°, Tee, Cap, Flange 150, Reducer ยอดใช้</p></div>';
    document.body.appendChild(d);
    document.getElementById('fdClose').onclick = function () { d.classList.remove('open'); };
    function show() {
      document.getElementById('fdOut').textContent = JSON.stringify(packageForNps(document.getElementById('fdNps').value), null, 2);
    }
    document.getElementById('fdGo').onclick = show;
    document.getElementById('fdNps').value = '0.75';
    show();
  }

  function addBtn() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="fitdims"]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'fb ready';
    b.setAttribute('data-feat', 'fitdims');
    b.innerHTML = '📏 ขนาด Fit <span class="ab">Dim</span>';
    bar.appendChild(b);
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openQuick(); };
  }

  function boot() {
    patchFittingsKB();
    addBtn();
    setTimeout(patchFittingsKB, 800);
    setTimeout(patchFittingsKB, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.FittingsDims = {
    dim: dim,
    packageForNps: packageForNps,
    tables: { EL90_LR_A: EL90_LR_A, EL90_SR_A: EL90_SR_A, EL45_B: EL45_B, TEE_C: TEE_C, CAP_E: CAP_E, RED_H: RED_H, FLG150: FLG150, VALVE_FTF: VALVE_FTF, OD: OD },
    open: openQuick
  };
})();
