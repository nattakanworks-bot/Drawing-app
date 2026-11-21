/*! ai-assist.js — ผู้ช่วยอ่านแบบ Piping / ISO
 * ใช้ความรู้ IsoReader + FittingsKB + MTOEngine + SymbolLib
 * ไม่เรียก API ภายนอก (ทำงานออฟไลน์) — ตอบจากกฎและคลังที่สอนไว้
 */
(function () {
  var HISTORY = [];

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) return;
    el.textContent = t;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 2800);
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /** ความรู้ตอบคำถาม */
  var FAQ = [
    {
      keys: ['เริ่ม', 'อ่านยังไง', 'ลำดับ', 'how to read', 'ขั้นตอน'],
      answer: function () {
        var steps = (window.IsoReader && IsoReader.guide && IsoReader.guide().steps) || [
          '1) อ่าน LINE NO + วัสดุจาก title block',
          '2) อ่าน BOM',
          '3) อ่าน Cutting list',
          '4) ไล่ isometric + EL',
          '5) แยก shop/field weld',
          '6) อ่าน support',
          '7) ดู SEE ISO ถ้ามี'
        ];
        return 'ลำดับอ่านแบบ ISO ที่ถูกต้อง:\n• ' + steps.join('\n• ');
      }
    },
    {
      keys: ['bom', 'bill of material', 'เอ็มทูโอ', 'mto', 'ถอดปริมาณ'],
      answer: function () {
        return 'BOM = รายการชิ้นส่วนของเส้นนี้\n' +
          'วิธีใช้ผู้ช่วย:\n1) กดปุ่ม 📋 MTO\n2) วางข้อความจากคอลัมน์ DESCRIPTION\n3) กดวิเคราะห์ → ได้ชนิด/NPS/Sch/%ความมั่นใจ\n4) ดาวน์โหลด CSV\n\nหรือพิมพ์ในช่องนี้ว่า: วิเคราะห์: ตามด้วยข้อความ BOM';
      }
    },
    {
      keys: ['field', 'shop', 'เชื่อมหน้างาน', 'shop weld', 'field weld'],
      answer: function () {
        return 'แยกข้อต่อ:\n• Shop joint = เชื่อมในร้าน (มักเป็นวงกลม/สัญลักษณ์ shop)\n• Field joint = เชื่อมหน้างาน (มักทำเครื่องหมาย field / สีแดงบนแบบ mark-up)\n• ดูตาราง WELD SUMMARY: WELD-NO, SIZE, BW/SW, NDT, LOCATION\nบนแบบ Thai Oil ที่ส่งมา มี mark แดงหลายจุด = ควรตรวจว่าเป็น field change หรือ field weld';
      }
    },
    {
      keys: ['support', 'cli', 'shoe', 'รองท่อ', 'แฮงเกอร์'],
      answer: function () {
        return 'Support ที่พบบนแบบ ISO:\n• CLI / Cantilever = แขนยื่น\n• Pipe shoe / clamped shoe = รองเท้าท่อ\n• Base plate = แผ่นฐานยึดโครง\n• Guide / Anchor / Spring = ตาม spec โครงการ\nอ่าน tag บนรูปแล้วจับกับ BOM ว่า PT ไหนเป็น support';
      }
    },
    {
      keys: ['elbow', 'ข้องอ', 'tee', 'ที', 'fitting', 'ฟิตติ้ง'],
      answer: function () {
        return 'Fitting หลัก (ASME B16.9):\n• Elbow 90° LR = รัศมี 1.5×NPS (ใช้บ่อย)\n• Elbow 90° SR = 1.0×NPS\n• Elbow 45°\n• Tee equal / reducing\n• Reducer concentric / eccentric (FOB/FOT)\n• Cap, Stub end\nกด 🔧 Fitting เพื่อเปิดคลังเต็ม\nพิมพ์: หา: ข้องอ หรือ หา: weldolet';
      }
    },
    {
      keys: ['valve', 'วาล์ว', 'ball', 'gate'],
      answer: function () {
        return 'วาล์วบน ISO มักอยู่ใน BOM เป็น Ball/Gate/Globe/Check + ขนาด + ends (BW/SW/FLG)\nตัวอย่างจากแบบคุณ: 3/4" Sch160 Ball valve red bore BW\nกด 🔣 คลังสัญลักษณ์ แล้วค้น valve / BV / GV';
      }
    },
    {
      keys: ['line no', 'line number', 'หมายเลขเส้น', 'line no.'],
      answer: function () {
        return 'รูปแบบ Line No. ที่พบบ่อย:\nขนาด-รหัสเส้น-หมายเลข-suffix\nเช่น 3/4"-P107F56-2521208-H\nแปลว่า NPS 3/4", รหัสเส้น P107F56, serial 2521208, suffix H (มักเกี่ยว insulation/service)\nพิมพ์: ไลน์: 3/4"-P107F56-2521208-H เพื่อให้ช่วยแยกส่วน';
      }
    },
    {
      keys: ['3d', 'mesh', 'แปลง', 'convert'],
      answer: function () {
        return 'แปลง 2D→3D:\n1) เปิดแบบ\n2) กด แปลง 2D → 3D\n3) สลับโหมด 3D\n4) กด 🧱 Mesh 3D เพื่อใส่ mesh จากคลังสัญลักษณ์\nหมายเหตุ: ตำแหน่ง mesh ยังประมาณ — core แอปยัง minify อยู่';
      }
    },
    {
      keys: ['ar', 'เออาร์'],
      answer: function () {
        return 'โหมด AR: กด 📱 โหมด AR หลังมีโมเดล 3D\nปิดด้วยปุ่ม หยุด AR หรือ Escape\nถ้าค้าง ให้รีเฟรชหน้าแล้วเปิดใหม่';
      }
    },
    {
      keys: ['sch', 'schedule', 'sch160', 'ตารางท่อ'],
      answer: function () {
        return 'Schedule = ความหนาท่อ\nSch160 หนา ใช้แรงดันสูง/งาน process บางสาย\nฟิตติ้ง BW ต้อง match schedule กับท่อ\nขนาด OD ของ 3/4" ≈ 26.7 mm (ไม่เปลี่ยนตาม sch — เปลี่ยนความหนา)';
      }
    },
    {
      keys: ['thai oil', 'clean fuel', 'แบบนี้', 'แบบที่ส่ง'],
      answer: function () {
        var s = window.IsoReader && IsoReader.sample;
        if (!s) return 'เปิด 📐 อ่าน ISO เพื่อดูตัวอย่างแบบโครงการ';
        return 'แบบตัวอย่างที่สอนไว้:\nLine: ' + s.line_no +
          '\nวัสดุ: ' + s.material +
          '\nขนาด: ' + s.main_size + ' ' + s.schedule +
          '\nDrawing: ' + s.drawing_no +
          '\nสถานะ: ' + s.status +
          '\nกด 📐 อ่าน ISO เพื่อดูลำดับอ่านเต็ม';
      }
    },
    {
      keys: ['ช่วย', 'help', 'คำสั่ง', 'ทำอะไรได้'],
      answer: function () {
        return 'ผู้ช่วยอ่านแบบ ทำได้:\n• ตอบคำถามเรื่อง ISO / BOM / weld / support / fitting\n• วิเคราะห์: <ข้อความ BOM>\n• หา: <ชื่อสัญลักษณ์>\n• ไลน์: <line number>\n• เปิดแผง: mto / iso / fitting / symbol\nพิมพ์ «คำสั่ง» เพื่อดูรายการ';
      }
    }
  ];

  function tryAnalyze(q) {
    var m = q.match(/^(?:วิเคราะห์|analyze|mto)\s*[:：]?\s*([\s\S]+)/i);
    if (!m) return null;
    var text = m[1].trim();
    if (window.MTOEngine && MTOEngine.parseLines) {
      var items = MTOEngine.parseLines(text);
      if (!items.length) return 'ไม่พบบรรทัดให้วิเคราะห์';
      var lines = items.map(function (it) {
        return '#' + it.no + ' ' + (it.symbol || it.category) +
          ' NPS ' + (it.nps || '-') + ' Sch ' + (it.sch || '-') +
          ' qty ' + it.qty + ' (' + it.confidence + '% — ' + it.note + ')';
      });
      return 'ผลการวิเคราะห์ BOM:\n' + lines.join('\n') +
        '\n\nเปิด 📋 MTO เพื่อส่งออก CSV ได้';
    }
    if (window.IsoReader && IsoReader.parseBomLine) {
      var p = IsoReader.parseBomLine(text);
      return 'parse: ' + JSON.stringify(p, null, 2);
    }
    return 'ยังโหลดเครื่อง MTO ไม่ครบ — รีเฟรชหน้าแล้วลองใหม่';
  }

  function tryLookup(q) {
    var m = q.match(/^(?:หา|search|lookup)\s*[:：]?\s*(.+)/i);
    if (!m) return null;
    var key = m[1].trim();
    var parts = [];
    if (window.FittingsKB && FittingsKB.lookup) {
      var f = FittingsKB.lookup(key);
      if (f) parts.push('Fitting: ' + f.id + ' — ' + f.th + ' / ' + f.en + ' (' + f.std + ')');
    }
    if (window.SymbolLib && SymbolLib.lookup) {
      var s = SymbolLib.lookup(key);
      if (s) parts.push('Symbol: ' + s.id + ' — ' + s.th + ' / ' + s.en);
    }
    if (window.IsoReader && IsoReader.parseBomLine) {
      var p = IsoReader.parseBomLine(key);
      if (p && p.rule) parts.push('BOM rule: ' + p.rule + ' → ' + JSON.stringify(p.map));
    }
    return parts.length ? parts.join('\n') : 'ไม่พบ «' + key + '» ในคลัง — ลองคำอื่น หรือเปิด 🔧 Fitting / 🔣 Symbol';
  }

  function tryLine(q) {
    var m = q.match(/^(?:ไลน์|line)\s*[:：]?\s*(.+)/i);
    if (!m) return null;
    if (window.IsoReader && IsoReader.parseLineNo) {
      var p = IsoReader.parseLineNo(m[1].trim());
      if (p.ok) {
        return 'แยก Line No.:\n• NPS: ' + p.nps +
          '\n• รหัสเส้น: ' + p.fluid_or_line +
          '\n• Serial: ' + p.serial +
          (p.insulation_or_suffix ? '\n• Suffix: ' + p.insulation_or_suffix : '');
      }
      return 'รูปแบบไม่ตรงแพทเทิร์นมาตรฐาน — ค่าดิบ: ' + p.raw;
    }
    return 'IsoReader ยังไม่พร้อม';
  }

  function tryOpen(q) {
    var n = norm(q);
    if (/^เปิด\s*mto|open\s*mto/.test(n) || n === 'mto') {
      if (window.MTOEngine && MTOEngine.open) { MTOEngine.open(); return 'เปิดแผง MTO แล้ว'; }
    }
    if (/^เปิด\s*iso|open\s*iso|อ่าน\s*iso/.test(n)) {
      if (window.IsoReader && IsoReader.open) { IsoReader.open(); return 'เปิดแผงอ่าน ISO แล้ว'; }
    }
    if (/^เปิด\s*fitting|open\s*fitting/.test(n)) {
      if (window.FittingsKB && FittingsKB.open) { FittingsKB.open(); return 'เปิดคลัง Fitting แล้ว'; }
    }
    if (/^เปิด\s*symbol|คลังสัญลักษณ์/.test(n)) {
      if (window.SymbolLib && SymbolLib.open) { SymbolLib.open(); return 'เปิดคลังสัญลักษณ์ แล้ว'; }
    }
    return null;
  }

  function answer(question) {
    var q = String(question || '').trim();
    if (!q) return 'พิมพ์คำถามได้เลย เช่น «อ่านแบบยังไง» หรือ «วิเคราะห์: 3/4 Sch160 Elbow 90»';

    var a;
    a = tryOpen(q); if (a) return a;
    a = tryAnalyze(q); if (a) return a;
    a = tryLookup(q); if (a) return a;
    a = tryLine(q); if (a) return a;

    var n = norm(q);
    if (n === 'คำสั่ง' || n === 'commands') {
      return 'คำสั่งที่ใช้ได้:\n• วิเคราะห์: <ข้อความ BOM>\n• หา: <ชื่อ>\n• ไลน์: <line no>\n• เปิด mto / เปิด iso / เปิด fitting\n• คำถามทั่วไป: อ่านยังไง, field weld, support, ข้องอ, sch160';
    }

    for (var i = 0; i < FAQ.length; i++) {
      var item = FAQ[i];
      for (var j = 0; j < item.keys.length; j++) {
        if (n.indexOf(norm(item.keys[j])) >= 0) {
          return item.answer();
        }
      }
    }

    // ถ้าดูเหมือนบรรทัด BOM ให้วิเคราะห์เลย
    if (/sch\s*\d+|elbow|tee|valve|pipe|asme/i.test(q) && q.length > 8) {
      var forced = tryAnalyze('วิเคราะห์: ' + q);
      if (forced) return forced;
    }

    return 'ยังจับประเด็นไม่ชัด\nลองพิมพ์:\n• อ่านแบบยังไง\n• วิเคราะห์: 3/4" Sch160 Elbow 90 deg BW\n• หา: weldolet\n• คำสั่ง';
  }

  function pushHistory(role, text) {
    HISTORY.push({ role: role, text: text, t: Date.now() });
    if (HISTORY.length > 40) HISTORY.shift();
  }

  function openChat() {
    var id = 'aiAssistPanel';
    var ex = document.getElementById(id);
    if (ex) {
      ex.classList.add('open');
      var input = document.getElementById('aiAssistIn');
      if (input) input.focus();
      return;
    }
    if (!document.getElementById('aiAssistCss')) {
      var css = document.createElement('style');
      css.id = 'aiAssistCss';
      css.textContent = [
        '#aiAssistPanel{display:none;position:fixed;right:12px;bottom:56px;width:min(400px,96vw);height:min(520px,70vh);z-index:20010;',
        'background:#fff;border:1px solid #c5d0dc;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);',
        'display:none;flex-direction:column;overflow:hidden;font-size:13px}',
        '#aiAssistPanel.open{display:flex!important}',
        '#aiAssistPanel .hd{background:linear-gradient(120deg,#1e3a5f,#0f766e);color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}',
        '#aiAssistPanel .hd button{border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}',
        '#aiAssistPanel .msgs{flex:1;overflow:auto;padding:12px;background:#f8fafc}',
        '#aiAssistPanel .bubble{max-width:92%;margin:8px 0;padding:8px 12px;border-radius:12px;line-height:1.45;white-space:pre-wrap;word-break:break-word}',
        '#aiAssistPanel .me{background:#1e3a5f;color:#fff;margin-left:auto}',
        '#aiAssistPanel .bot{background:#fff;border:1px solid #e2e8f0;color:#1c1917}',
        '#aiAssistPanel .composer{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}',
        '#aiAssistPanel .composer input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px}',
        '#aiAssistPanel .composer button{border:0;background:#0f766e;color:#fff;border-radius:10px;padding:0 14px;font-weight:600;cursor:pointer}',
        '#aiAssistFab{position:fixed;right:16px;bottom:64px;z-index:20009;border:0;border-radius:999px;padding:12px 16px;',
        'background:#0f766e;color:#fff;font-weight:700;box-shadow:0 8px 24px rgba(15,118,110,.4);cursor:pointer;font-size:13px}'
      ].join('');
      document.head.appendChild(css);
    }

    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    d.innerHTML =
      '<div class="hd"><div><b>🤖 ผู้ช่วยอ่านแบบ</b><div style="opacity:.85;font-size:11px">ออฟไลน์ · ใช้คลัง ISO/Fitting/MTO</div></div>' +
      '<button type="button" id="aiAssistClose">ปิด</button></div>' +
      '<div class="msgs" id="aiAssistMsgs"></div>' +
      '<div class="composer"><input id="aiAssistIn" placeholder="ถามได้ เช่น อ่านแบบยังไง" autocomplete="off"/>' +
      '<button type="button" id="aiAssistSend">ส่ง</button></div>';
    document.body.appendChild(d);

    var msgs = document.getElementById('aiAssistMsgs');
    function addBubble(role, text) {
      var b = document.createElement('div');
      b.className = 'bubble ' + (role === 'me' ? 'me' : 'bot');
      b.textContent = text;
      msgs.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
    }

    addBubble('bot',
      'สวัสดี ฉันช่วยอ่านแบบ piping isometric ได้\n' +
      'ลองถาม: «อ่านแบบยังไง» «field weld» หรือ\n' +
      '«วิเคราะห์: 3/4 Sch160 Elbow 90 deg BW»'
    );

    function send() {
      var input = document.getElementById('aiAssistIn');
      var q = (input.value || '').trim();
      if (!q) return;
      input.value = '';
      addBubble('me', q);
      pushHistory('user', q);
      var res = answer(q);
      pushHistory('assistant', res);
      addBubble('bot', res);
    }

    document.getElementById('aiAssistClose').onclick = function () {
      d.classList.remove('open');
    };
    document.getElementById('aiAssistSend').onclick = send;
    document.getElementById('aiAssistIn').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  function addFab() {
    if (document.getElementById('aiAssistFab')) return;
    var fab = document.createElement('button');
    fab.id = 'aiAssistFab';
    fab.type = 'button';
    fab.innerHTML = '🤖 ช่วยอ่านแบบ';
    fab.title = 'ผู้ช่วย AI อ่านแบบ';
    fab.onclick = function () { openChat(); };
    document.body.appendChild(fab);
  }

  function addBarButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="ai"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'ai');
    b.innerHTML = '🤖 AI ช่วยอ่าน <span class="ab">AI</span>';
    bar.appendChild(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openChat();
    });
  }

  function boot() {
    addFab();
    addBarButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.AIAssist = {
    ask: answer,
    open: openChat,
    history: function () { return HISTORY.slice(); }
  };
})();
