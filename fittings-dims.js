/*! fittings-dims.js — ตารางขนาด fitting / flange / reducer (แนวทาง ASME)
 * ใช้ประมาณการ + ป้อนขนาดให้ mesh 3D — งานสั่งของยืนยันตาราง ASME ฉบับเต็ม
 */
(function () {
  var NPS = ['0.5','0.75','1','1.25','1.5','2','2.5','3','3.5','4','5','6','8','10','12','14','16','18','20','24'];

  var OD = {
    '0.5':21.3,'0.75':26.7,'1':33.4,'1.25':42.2,'1.5':48.3,'2':60.3,'2.5':73.0,'3':88.9,'3.5':101.6,
    '4':114.3,'5':141.3,'6':168.3,'8':219.1,'10':273.0,'12':323.9,'14':355.6,'16':406.4,'18':457,'20':508,'24':610
  };

  var EL90_LR_A = {
    '0.5':38,'0.75':38,'1':38,'1.25':48,'1.5':57,'2':76,'2.5':95,'3':114,'3.5':133,
    '4':152,'5':190,'6':229,'8':305,'10':381,'12':457,'14':533,'16':610,'18':686,'20':762,'24':914
  };
  var EL90_SR_A = {
    '1':25,'1.25':32,'1.5':38,'2':51,'2.5':64,'3':76,'3.5':89,'4':102,'5':127,'6':152,
    '8':203,'10':254,'12':305,'14':356,'16':406,'18':457,'20':508,'24':610
  };
  var EL45_B = {
    '0.5':16,'0.75':19,'1':22,'1.25':25,'1.5':29,'2':35,'2.5':44,'3':51,'3.5':57,
    '4':64,'5':79,'6':95,'8':127,'10':159,'12':190,'14':222,'16':254,'18':286,'20':318,'24':381
  };
  var TEE_C = {
    '0.5':25,'0.75':29,'1':38,'1.25':48,'1.5':57,'2':64,'2.5':76,'3':86,'3.5':95,
    '4':105,'5':124,'6':143,'8':178,'10':216,'12':254,'14':279,'16':305,'18':343,'20':381,'24':432
  };
  var CAP_E = {
    '0.5':25,'0.75':25,'1':38,'1.25':38,'1.5':38,'2':38,'2.5':38,'3':51,'3.5':51,
    '4':51,'5':64,'6':64,'8':76,'10':89,'12':102,'14':127,'16':127,'18':152,'20':152,'24':178
  };

  // Reducer H (mm) — คู่ใหญ่xเล็ก ที่ใช้บ่อยในงาน process + ขยาย
  var RED_H = {
    '0.75x0.5':38,'1x0.75':51,'1x0.5':51,'1.25x1':51,'1.25x0.75':51,'1.5x1.25':64,'1.5x1':64,'1.5x0.75':64,
    '2x1.5':76,'2x1.25':76,'2x1':76,'2x0.75':76,'2.5x2':89,'2.5x1.5':89,'2.5x1':89,
    '3x2.5':89,'3x2':89,'3x1.5':89,'3x1':89,'3.5x3':102,'3.5x2.5':102,'3.5x2':102,
    '4x3.5':102,'4x3':102,'4x2.5':102,'4x2':102,'4x1.5':102,'5x4':127,'5x3':127,'5x2':127,
    '6x5':140,'6x4':140,'6x3':140,'6x2.5':140,'6x2':140,'8x6':152,'8x5':152,'8x4':152,'8x3':152,'8x2':152,
    '10x8':178,'10x6':178,'10x4':178,'12x10':203,'12x8':203,'12x6':203,'12x4':203,
    '14x12':223,'14x10':223,'16x14':254,'16x12':254,'16x10':254,'16x8':254,
    '18x16':279,'18x14':279,'18x12':279,'20x18':305,'20x16':305,'20x12':305,'24x20':368,'24x16':368,'24x12':368
  };

  function flgRow(od, t, bc, nbolt, bolt) {
    return { od: od, t: t, bc: bc, nbolt: nbolt, bolt: bolt };
  }

  // WN RF approx mm — Class 150 / 300 / 600 (ขนาดอ้างอิงสาธารณะ)
  var FLG150 = {
    '0.5':flgRow(90,11.2,60.3,4,'1/2'),'0.75':flgRow(100,12.7,69.9,4,'1/2'),'1':flgRow(110,14.3,79.4,4,'1/2'),
    '1.25':flgRow(115,15.9,88.9,4,'1/2'),'1.5':flgRow(125,17.5,98.4,4,'1/2'),'2':flgRow(150,19.1,120.7,4,'5/8'),
    '2.5':flgRow(180,22.3,139.7,4,'5/8'),'3':flgRow(190,23.9,152.4,4,'5/8'),'4':flgRow(230,23.9,190.5,8,'5/8'),
    '5':flgRow(255,23.9,215.9,8,'3/4'),'6':flgRow(280,25.4,241.3,8,'3/4'),'8':flgRow(345,28.6,298.5,8,'3/4'),
    '10':flgRow(405,30.2,362.0,12,'7/8'),'12':flgRow(485,31.8,431.8,12,'7/8'),'14':flgRow(535,35.1,476.3,12,'1'),
    '16':flgRow(595,36.6,539.8,16,'1'),'18':flgRow(635,39.7,577.9,16,'1-1/8'),'20':flgRow(700,42.9,635.0,20,'1-1/8'),
    '24':flgRow(815,47.8,749.3,20,'1-1/4')
  };
  var FLG300 = {
    '0.5':flgRow(95,14.3,66.7,4,'1/2'),'0.75':flgRow(115,15.9,82.6,4,'5/8'),'1':flgRow(125,17.5,88.9,4,'5/8'),
    '1.25':flgRow(135,19.1,98.4,4,'5/8'),'1.5':flgRow(155,20.7,114.3,4,'3/4'),'2':flgRow(165,22.3,127.0,8,'5/8'),
    '2.5':flgRow(190,25.4,149.2,8,'3/4'),'3':flgRow(210,28.6,168.3,8,'3/4'),'4':flgRow(255,31.8,200.0,8,'3/4'),
    '5':flgRow(280,35.1,235.0,8,'3/4'),'6':flgRow(320,36.6,269.9,12,'3/4'),'8':flgRow(380,41.3,330.2,12,'7/8'),
    '10':flgRow(445,47.8,387.4,16,'1'),'12':flgRow(520,50.8,450.8,16,'1-1/8'),'14':flgRow(585,54.0,514.4,20,'1-1/8'),
    '16':flgRow(650,57.2,571.5,20,'1-1/4'),'18':flgRow(710,60.5,628.6,24,'1-1/4'),'20':flgRow(775,63.5,685.8,24,'1-1/4'),
    '24':flgRow(915,70.0,812.8,24,'1-1/2')
  };
  var FLG600 = {
    '0.5':flgRow(95,14.3,66.7,4,'1/2'),'0.75':flgRow(115,15.9,82.6,4,'5/8'),'1':flgRow(125,17.5,88.9,4,'5/8'),
    '1.25':flgRow(135,20.7,98.4,4,'5/8'),'1.5':flgRow(155,22.3,114.3,4,'3/4'),'2':flgRow(165,25.4,127.0,8,'5/8'),
    '2.5':flgRow(190,28.6,149.2,8,'3/4'),'3':flgRow(210,31.8,168.3,8,'3/4'),'4':flgRow(275,38.1,215.9,8,'7/8'),
    '5':flgRow(330,44.5,266.7,8,'1'),'6':flgRow(355,47.8,292.1,12,'1'),'8':flgRow(420,55.6,349.2,12,'1-1/8'),
    '10':flgRow(510,63.5,431.8,16,'1-1/4'),'12':flgRow(560,66.7,489.0,20,'1-1/4'),'14':flgRow(605,69.9,527.0,20,'1-3/8'),
    '16':flgRow(685,76.2,603.2,20,'1-1/2'),'18':flgRow(745,82.6,654.0,20,'1-5/8'),'20':flgRow(815,88.9,723.9,24,'1-5/8'),
    '24':flgRow(940,101.6,838.2,24,'1-7/8')
  };

  var VALVE_FTF = {
    GV: { '2':178,'3':203,'4':229,'6':267,'8':292,'10':330,'12':356 },
    BV: { '0.75':65,'1':70,'1.5':90,'2':110,'3':140,'4':170,'6':220,'8':260,'10':300 },
    GL: { '1':130,'1.5':165,'2':200,'3':240,'4':290,'6':380,'8':450 },
    CK: { '2':150,'3':180,'4':200,'6':250,'8':280,'10':320,'12':350 }
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
    s = s.replace('1-1/4','1.25').replace('1-1/2','1.5').replace('2-1/2','2.5').replace('3-1/2','3.5');
    s = s.replace(/^1\/2$/,'0.5').replace(/^3\/4$/,'0.75');
    if (OD[s] != null) return s;
    if (!isNaN(n) && OD[String(n)]) return String(n);
    return s;
  }

  function reducerH(large, small) {
    var a = keyNps(large), b = keyNps(small);
    var hk = a + 'x' + b;
    if (RED_H[hk] != null) return { H_mm: RED_H[hk], exact: true, key: hk };
    // สลับถ้าใส่กลับ
    var hk2 = b + 'x' + a;
    if (RED_H[hk2] != null) return { H_mm: RED_H[hk2], exact: true, key: hk2, swapped: true };
    if (OD[a] && OD[b]) {
      return { H_mm: Math.round(Math.max(OD[a], OD[b]) * 0.85), exact: false, key: hk };
    }
    return { H_mm: null, exact: false, key: hk };
  }

  function flange(nps, cls) {
    var k = keyNps(nps);
    var c = String(cls || '150').replace(/class|cl|#/gi, '').trim();
    var table = c === '300' ? FLG300 : (c === '600' ? FLG600 : FLG150);
    var row = table[k] || null;
    return { nps: k, class: c, flange: row, facing: 'RF (typical)', type: 'WN approx' };
  }

  function dim(kind, nps, nps2, cls) {
    var k = keyNps(nps);
    var out = { kind: kind, nps: k, od_mm: OD[k] || null, unit: 'mm' };
    kind = String(kind || '').toUpperCase();
    if (kind === 'EL90_LR' || kind === 'ELBOW90_LR') out.A_mm = EL90_LR_A[k] || null;
    else if (kind === 'EL90_SR' || kind === 'ELBOW90_SR') out.A_mm = EL90_SR_A[k] || null;
    else if (kind === 'EL45' || kind === 'ELBOW45') out.B_mm = EL45_B[k] || null;
    else if (kind === 'TEE') { out.C_mm = TEE_C[k] || null; out.M_mm = TEE_C[k] || null; }
    else if (kind === 'CAP') out.E_mm = CAP_E[k] || null;
    else if (kind === 'RED' || kind === 'RED_CON' || kind === 'REDUCER') {
      var r = reducerH(nps, nps2 || nps);
      out.nps_large = keyNps(nps); out.nps_small = keyNps(nps2 || nps);
      out.H_mm = r.H_mm; out.exact = r.exact;
    } else if (kind.indexOf('FLG') === 0 || kind === 'FLANGE') {
      var f = flange(nps, cls || kind.replace(/\D/g, '') || '150');
      out.class = f.class; out.flange = f.flange;
    } else if (VALVE_FTF[kind]) {
      out.ftf_mm = VALVE_FTF[kind][k] || null;
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
      flange150: FLG150[k] || null,
      flange300: FLG300[k] || null,
      flange600: FLG600[k] || null
    };
  }

  /** ให้ mesh ใช้: คืน scale/radius จาก NPS + ชนิด */
  function meshParamsFor(symbolId, nps) {
    var k = keyNps(nps || '4');
    var od = OD[k] || 114.3;
    var r = od / 2;
    var id = String(symbolId || '').toUpperCase();
    var p = { nps: k, od_mm: od, radius_mm: r };
    if (/EL90_LR|ELBOW.*LR/.test(id)) {
      p.bend_radius_mm = EL90_LR_A[k] || r * 3;
      p.A_mm = EL90_LR_A[k];
      p.angle_deg = 90;
    } else if (/EL90_SR/.test(id)) {
      p.bend_radius_mm = EL90_SR_A[k] || r * 2;
      p.A_mm = EL90_SR_A[k];
      p.angle_deg = 90;
    } else if (/EL45/.test(id)) {
      p.bend_radius_mm = EL90_LR_A[k] || r * 3;
      p.B_mm = EL45_B[k];
      p.angle_deg = 45;
    } else if (/TEE/.test(id)) {
      p.C_mm = TEE_C[k];
      p.branch_radius_mm = r;
    } else if (/CAP/.test(id)) {
      p.E_mm = CAP_E[k];
    } else if (/RED/.test(id)) {
      p.length_mm = RED_H[k + 'x' + k] || Math.round(od * 0.9);
    } else if (/FLG|FLANGE/.test(id)) {
      var f = FLG150[k];
      if (f) { p.flange_od_mm = f.od; p.flange_t_mm = f.t; }
    }
    // scale เทียบโมเดลหน่วยเมตรใน Three.js
    p.radius_m = r / 1000;
    p.od_m = od / 1000;
    return p;
  }

  function patchFittingsKB() {
    if (!window.FittingsKB) return;
    FittingsKB.dims = function (nps) {
      var p = packageForNps(nps);
      return {
        nps: p.nps, od_mm: p.od_mm,
        el90_lr_A_mm: p.elbow90_lr_A, el90_sr_A_mm: p.elbow90_sr_A,
        el45_B_mm: p.elbow45_B, tee_C_mm: p.tee_C, cap_E_mm: p.cap_E,
        flange150: p.flange150, flange300: p.flange300, flange600: p.flange600,
        note: 'fittings-dims.js — B16.5/B16.9 แนวทาง'
      };
    };
    FittingsKB.dim = dim;
    FittingsKB.flange = flange;
    FittingsKB.reducerH = reducerH;
    FittingsKB.meshParamsFor = meshParamsFor;
    FittingsKB.packageForNps = packageForNps;
    FittingsKB.tables = {
      EL90_LR_A: EL90_LR_A, EL90_SR_A: EL90_SR_A, EL45_B: EL45_B, TEE_C: TEE_C, CAP_E: CAP_E,
      RED_H: RED_H, FLG150: FLG150, FLG300: FLG300, FLG600: FLG600, VALVE_FTF: VALVE_FTF, OD: OD
    };
  }

  function patchMeshBuilder() {
    if (!window.MeshBuilder) return;
    MeshBuilder.dimsFor = meshParamsFor;
    // เก็บของเดิม
    if (!MeshBuilder._buildAllOrig && MeshBuilder.buildAll) {
      MeshBuilder._buildAllOrig = MeshBuilder.buildAll;
    }
    // ช่วย log ว่ามีตารางขนาดแล้ว
    MeshBuilder.hasFittingDims = true;
  }

  function openQuick() {
    var id = 'fitDimsPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('fitDimsCss')) {
      var css = document.createElement('style');
      css.id = 'fitDimsCss';
      css.textContent = '#fitDimsPanel{display:none;position:fixed;left:12px;bottom:56px;width:min(440px,96vw);max-height:72vh;z-index:20006;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:auto;font-size:12px}#fitDimsPanel.open{display:block!important}#fitDimsPanel .hd{position:sticky;top:0;background:#7c2d12;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;z-index:1}#fitDimsPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}#fitDimsPanel .bd{padding:10px 12px}#fitDimsPanel table{width:100%;border-collapse:collapse;margin-top:8px}#fitDimsPanel td,#fitDimsPanel th{border:1px solid #eee;padding:4px 6px;text-align:left}#fitDimsPanel select{padding:8px;border:1px solid #cbd5e1;border-radius:8px;margin:4px}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id; d.className = 'open';
    var opts = NPS.map(function (n) { return '<option value="' + n + '">' + n + '"</option>'; }).join('');
    d.innerHTML = '<div class="hd"><b>📏 ขนาด Fit · Flange 150/300/600</b><button type="button" id="fdClose">ปิด</button></div>' +
      '<div class="bd">NPS <select id="fdNps">' + opts + '</select> ' +
      'Class <select id="fdCls"><option>150</option><option>300</option><option>600</option></select> ' +
      '<button type="button" id="fdGo" style="background:#7c2d12;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer">แสดง</button>' +
      '<pre id="fdOut" style="background:#f8fafc;padding:8px;border-radius:8px;font-size:11px;margin-top:8px"></pre>' +
      '<p style="opacity:.8">Reducer ตัวอย่าง 6×4: <code id="fdRed"></code></p></div>';
    document.body.appendChild(d);
    document.getElementById('fdClose').onclick = function () { d.classList.remove('open'); };
    function show() {
      var nps = document.getElementById('fdNps').value;
      var cls = document.getElementById('fdCls').value;
      var pack = packageForNps(nps);
      pack.flange_selected = flange(nps, cls);
      pack.mesh_example = meshParamsFor('EL90_LR', nps);
      document.getElementById('fdOut').textContent = JSON.stringify(pack, null, 2);
      document.getElementById('fdRed').textContent = JSON.stringify(reducerH('6', '4'));
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
    patchMeshBuilder();
    addBtn();
    setTimeout(function () { patchFittingsKB(); patchMeshBuilder(); }, 1000);
    setTimeout(function () { patchFittingsKB(); patchMeshBuilder(); }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.FittingsDims = {
    dim: dim,
    flange: flange,
    reducerH: reducerH,
    packageForNps: packageForNps,
    meshParamsFor: meshParamsFor,
    tables: { EL90_LR_A: EL90_LR_A, TEE_C: TEE_C, RED_H: RED_H, FLG150: FLG150, FLG300: FLG300, FLG600: FLG600, OD: OD },
    open: openQuick
  };
})();
