/*! mto-engine.js — MTO / takeoff จากข้อความ BOM + ตาราง NPS + ส่งออก CSV
 * ทำชั้นที่ทำได้โดยไม่แก้ app.js ที่ minify
 */
(function () {
  // —— ตาราง OD (mm) ASME B36.10 แนวทาง ——
  var OD = {
    '0.5':21.3,'1/2':21.3,'0.75':26.7,'3/4':26.7,'1':33.4,'1.25':42.2,'1-1/4':42.2,
    '1.5':48.3,'1-1/2':48.3,'2':60.3,'2.5':73.0,'2-1/2':73.0,'3':88.9,'4':114.3,
    '6':168.3,'8':219.1,'10':273.0,'12':323.9,'14':355.6,'16':406.4,'18':457,'20':508,'24':610
  };

  // Center-to-end 90° LR / SR (mm) คร่าว ๆ 1.5×NPS / 1×NPS (NPS≥1)
  function A_LR(nps){ var n=parseNps(nps); return Math.round(n*1.5*25.4); }
  function A_SR(nps){ var n=parseNps(nps); return Math.round(n*1.0*25.4); }

  function parseNps(s){
    s=String(s||'4').replace(/["″in]/gi,'').trim();
    if(s.indexOf('/')>=0){ var p=s.split('/'); return parseFloat(p[0])/parseFloat(p[1]); }
    return parseFloat(s)||4;
  }
  function norm(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }

  // —— กฎแยกชนิดจากข้อความ (ขยายจากแบบ Thai Oil + ทั่วไป) ——
  var RULES = [
    { id:'PIPE', re:/\bpipe\b|ท่อ|asme\s*b36/i, cat:'pipe', sym:'PIPE' },
    { id:'EL90_LR', re:/elbow\s*90|90\s*deg.*(?:elbow|lr)|el\s*90|ข้องอ\s*90|long\s*radius/i, cat:'fitting', sym:'EL90_LR' },
    { id:'EL90_SR', re:/short\s*radius|90\s*sr|sr\s*elbow|ข้องอสั้น/i, cat:'fitting', sym:'EL90_SR' },
    { id:'EL45', re:/elbow\s*45|45\s*deg|ข้องอ\s*45|el\s*45/i, cat:'fitting', sym:'EL45' },
    { id:'TEE_EQ', re:/tee\s*equal|equal\s*tee|tee(?!\s*red)|ที\s*เท่า|\btee\b.*b16\.?9/i, cat:'fitting', sym:'TEE' },
    { id:'TEE_RED', re:/reducing\s*tee|tee\s*red|ที\s*ลด/i, cat:'fitting', sym:'TEE_RED' },
    { id:'RED_CON', re:/concentric\s*reducer|reducer(?!.*ecc)|รีดิวเซอร์(?!.*นอก)/i, cat:'fitting', sym:'RED_CON' },
    { id:'RED_ECC', re:/eccentric|ecc\s*reducer|fob|fot|รีดิวเซอร์นอก/i, cat:'fitting', sym:'RED_ECC' },
    { id:'CAP', re:/\bcap\b|end\s*cap|ฝาปิด/i, cat:'fitting', sym:'CAP' },
    { id:'FLG', re:/flange|wnrf|หน้าแปลน/i, cat:'flange', sym:'FLG_WN' },
    { id:'BV', re:/ball\s*valve|วาล์วบอล|floating\s*metal\s*seat/i, cat:'valve', sym:'BV' },
    { id:'GV', re:/gate\s*valve|วาล์วเกต/i, cat:'valve', sym:'GV' },
    { id:'GL', re:/globe\s*valve|วาล์วโกลบ/i, cat:'valve', sym:'GL' },
    { id:'CK', re:/check\s*valve|วาล์วเช็ค|nrv/i, cat:'valve', sym:'CK' },
    { id:'SUP_CLI', re:/cantilever|cli-?\d/i, cat:'support', sym:'SUP_CANTILEVER' },
    { id:'SUP_SHOE', re:/pipe\s*shoe|clamped.*shoe|shoe\s*0/i, cat:'support', sym:'SUP_SHOE' },
    { id:'SUP_BASE', re:/base\s*plate|anchored\s*base/i, cat:'support', sym:'SUP_BASE' },
    { id:'WOL', re:/weldolet|\bwol\b/i, cat:'fitting', sym:'WOL' },
    { id:'BW', re:/\bbw\b|butt\s*weld/i, cat:'joint', sym:'BW' }
  ];

  function classify(text){
    var t=String(text||'');
    for(var i=0;i<RULES.length;i++){
      if(RULES[i].re.test(t)) return RULES[i];
    }
    return null;
  }

  function extractSize(text){
    var t=String(text||'');
    var m=t.match(/(\d+\/\d+|\d+(?:\.\d+)?)\s*["″']?\s*(?:"|″)?(?:\s*sch(?:edule)?\s*(\d+))?/i);
    var nps=null, sch=null;
    if(m){ nps=m[1]; sch=m[2]||null; }
    var m2=t.match(/sch(?:edule)?\s*(\d+)/i);
    if(m2) sch=m2[1];
    return { nps:nps, sch:sch, od_mm: nps? (OD[nps]||OD[String(parseNps(nps))]||null):null };
  }

  function extractQty(text){
    var m=String(text||'').match(/(?:qty|จำนวน|x)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if(m) return parseFloat(m[1]);
    // trailing number isolated
    m=String(text||'').trim().match(/\s(\d+)$/);
    return m? parseFloat(m[1]):1;
  }

  function confidence(rule, text){
    if(!rule) return 0.2;
    var c=0.55;
    if(/asme\s*b16|asme\s*b36/i.test(text)) c+=0.15;
    if(/sch\s*\d+/i.test(text)) c+=0.1;
    if(extractSize(text).nps) c+=0.1;
    if(rule.cat==='valve'||rule.cat==='fitting') c+=0.05;
    return Math.min(0.98, c);
  }

  /** แปลงหลายบรรทัด → รายการ MTO */
  function parseLines(text){
    var lines=String(text||'').split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean);
    var items=[];
    lines.forEach(function(line, idx){
      var rule=classify(line);
      var size=extractSize(line);
      var qty=extractQty(line);
      var conf=confidence(rule, line);
      // ลอง FittingsKB / IsoReader
      try{
        if(window.IsoReader&&IsoReader.parseBomLine){
          var p=IsoReader.parseBomLine(line);
          if(p&&p.map&&!rule){
            rule={ id:p.rule, cat:p.map.kind, sym:p.map.symbol||p.rule };
            conf=Math.max(conf,0.6);
          }
        }
        if(window.FittingsKB&&FittingsKB.lookup&&!rule){
          var f=FittingsKB.lookup(line);
          if(f){ rule={ id:f.id, cat:'fitting', sym:f.id }; conf=Math.max(conf,0.65); }
        }
      }catch(e){}
      items.push({
        no: idx+1,
        raw: line,
        category: rule? rule.cat: 'unknown',
        symbol: rule? rule.sym: '',
        rule_id: rule? rule.id: '',
        nps: size.nps||'',
        sch: size.sch||'',
        od_mm: size.od_mm||'',
        qty: qty,
        confidence: Math.round(conf*100),
        note: conf<0.5? 'ควรตรวจด้วยตา': (conf<0.75? 'ค่อนข้างมั่นใจ':'มั่นใจ')
      });
    });
    return items;
  }

  function aggregate(items){
    var map={};
    items.forEach(function(it){
      if(it.category==='unknown') return;
      var key=[it.symbol||it.category, it.nps, it.sch].join('|');
      if(!map[key]){
        map[key]={ symbol:it.symbol, category:it.category, nps:it.nps, sch:it.sch, qty:0, confidence_min:100, samples:[] };
      }
      map[key].qty += Number(it.qty)||1;
      map[key].confidence_min = Math.min(map[key].confidence_min, it.confidence);
      if(map[key].samples.length<3) map[key].samples.push(it.raw);
    });
    return Object.keys(map).map(function(k){ return map[k]; });
  }

  function toCSV(rows){
    var head=['no','category','symbol','nps','sch','od_mm','qty','confidence_%','note','raw'];
    var esc=function(v){
      v=String(v==null?'':v);
      if(/[",\n]/.test(v)) return '"'+v.replace(/"/g,'""')+'"';
      return v;
    };
    var lines=[head.join(',')];
    rows.forEach(function(r){
      lines.push([r.no,r.category,r.symbol,r.nps,r.sch,r.od_mm,r.qty,r.confidence,r.note,r.raw].map(esc).join(','));
    });
    return lines.join('\n');
  }

  function downloadCSV(filename, text){
    var blob=new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename||'mto.csv';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  }

  // ตัวอย่างจากแบบ Thai Oil ที่คุยกัน
  var DEMO_BOM = [
    '3/4" Sch160 Pipe PE ASME B36.10M',
    '3/4" Sch160 Tee equal BW ASME B16.9',
    '3/4" Sch160 Elbow 90 deg BW LR ASME B16.9',
    '3/4" Sch160 Ball valve red bore BW',
    'Anchored base plate on steel 3/4',
    'Clamped pipe shoe 0.75',
    'Cantilever support CLI-1 3/4'
  ].join('\n');

  function openPanel(){
    var id='mtoPanel';
    var ex=document.getElementById(id);
    if(ex){ ex.classList.add('open'); return; }
    if(!document.getElementById('mtoCss')){
      var css=document.createElement('style');
      css.id='mtoCss';
      css.textContent='#mtoPanel{display:none;position:fixed;right:12px;top:96px;bottom:48px;width:min(460px,96vw);z-index:20003;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:auto;font-size:12px}#mtoPanel.open{display:block!important}#mtoPanel .hd{position:sticky;top:0;background:#0f766e;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;z-index:1}#mtoPanel .hd button,#mtoPanel .bd button{border:0;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:600}#mtoPanel .hd button{background:rgba(255,255,255,.2);color:#fff}#mtoPanel .bd{padding:10px 12px}#mtoPanel textarea{width:100%;min-height:120px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px;font-size:12px}#mtoPanel table{width:100%;border-collapse:collapse;margin-top:8px}#mtoPanel th,#mtoPanel td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}#mtoPanel .low{color:#b91c1c}#mtoPanel .mid{color:#b45309}#mtoPanel .hi{color:#047857}#mtoPanel .rowbtns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#mtoPanel .rowbtns button{background:#ccfbf1;color:#115e59}';
      document.head.appendChild(css);
    }
    var d=document.createElement('div');
    d.id=id; d.className='open';
    d.innerHTML='<div class="hd"><h3 style="margin:0;font-size:14px">📋 MTO จาก BOM / ข้อความ</h3><button type="button" id="mtoClose">ปิด</button></div>'+
      '<div class="bd"><p style="margin-top:0">วางข้อความจาก <b>BILL OF MATERIALS</b> หรือ OCR ทีละบรรทัด แล้วกดวิเคราะห์ — ส่งออก CSV ได้</p>'+
      '<textarea id="mtoIn" placeholder="วางบรรทัด BOM ที่นี่…"></textarea>'+
      '<div class="rowbtns">'+
      '<button type="button" id="mtoDemo">ใส่ตัวอย่างแบบ Thai Oil</button>'+
      '<button type="button" id="mtoRun">วิเคราะห์</button>'+
      '<button type="button" id="mtoCsv">ดาวน์โหลด CSV</button>'+
      '<button type="button" id="mtoAgg">สรุปรวมชนิด</button></div>'+
      '<div id="mtoOut"></div></div>';
    document.body.appendChild(d);
    var lastItems=[];
    function render(items){
      lastItems=items;
      var html='<table><tr><th>#</th><th>ชนิด</th><th>Sym</th><th>NPS</th><th>Sch</th><th>Qty</th><th>%</th><th>หมายเหตุ</th></tr>';
      items.forEach(function(it){
        var cls=it.confidence>=75?'hi':(it.confidence>=50?'mid':'low');
        html+='<tr><td>'+it.no+'</td><td>'+it.category+'</td><td>'+it.symbol+'</td><td>'+it.nps+'</td><td>'+it.sch+'</td><td>'+it.qty+'</td><td class="'+cls+'">'+it.confidence+'</td><td>'+it.note+'</td></tr>';
      });
      html+='</table>';
      document.getElementById('mtoOut').innerHTML=html;
    }
    document.getElementById('mtoClose').onclick=function(){ d.classList.remove('open'); };
    document.getElementById('mtoDemo').onclick=function(){ document.getElementById('mtoIn').value=DEMO_BOM; };
    document.getElementById('mtoRun').onclick=function(){
      render(parseLines(document.getElementById('mtoIn').value));
    };
    document.getElementById('mtoCsv').onclick=function(){
      if(!lastItems.length) render(parseLines(document.getElementById('mtoIn').value));
      downloadCSV('mto-takeoff.csv', toCSV(lastItems));
    };
    document.getElementById('mtoAgg').onclick=function(){
      if(!lastItems.length) lastItems=parseLines(document.getElementById('mtoIn').value);
      var agg=aggregate(lastItems);
      var html='<table><tr><th>Symbol</th><th>Cat</th><th>NPS</th><th>Sch</th><th>Qty รวม</th><th>min%</th></tr>';
      agg.forEach(function(a){
        html+='<tr><td>'+a.symbol+'</td><td>'+a.category+'</td><td>'+a.nps+'</td><td>'+a.sch+'</td><td>'+a.qty+'</td><td>'+a.confidence_min+'</td></tr>';
      });
      html+='</table>';
      document.getElementById('mtoOut').innerHTML=html;
    };
  }

  function addButton(){
    var bar=document.getElementById('featBar');
    if(!bar||document.querySelector('[data-feat="mto"]')) return;
    var b=document.createElement('button');
    b.type='button'; b.className='fb ready';
    b.setAttribute('data-feat','mto');
    b.title='MTO / ถอดปริมาณจาก BOM';
    b.innerHTML='📋 MTO <span class="ab">MTO</span>';
    bar.appendChild(b);
    b.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); openPanel(); });
  }

  function boot(){ addButton(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.MTOEngine={
    parseLines:parseLines,
    aggregate:aggregate,
    toCSV:toCSV,
    open:openPanel,
    OD:OD,
    A_LR:A_LR,
    A_SR:A_SR
  };
})();
