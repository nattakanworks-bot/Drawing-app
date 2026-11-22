/*! ocr-sheet.js — อ่านทั้งแผ่นด้วย Tesseract.js แล้วส่งเข้ากฎ ISO/MTO/Fitting
 * เป้าหมาย: ดันความถูกต้องการอ่านข้อความบนแบบให้สูงขึ้น (ภาษาไทย+อังกฤษ)
 */
(function () {
  var TESS_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  var worker = null;
  var lastText = '';
  var lastItems = [];

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) { console.info('[ocr-sheet]', t); return; }
    el.textContent = t;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 3200);
  }

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = TESS_CDN;
      s.onload = function () { resolve(window.Tesseract); };
      s.onerror = function () { reject(new Error('โหลด Tesseract ไม่สำเร็จ')); };
      document.head.appendChild(s);
    });
  }

  function fileToImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('ไม่มีไฟล์'));
      if (file.type === 'application/pdf') {
        reject(new Error('ตอนนี้รองรับรูป (JPG/PNG) — PDF ใช้เครื่องมือเปิดแบบในแอปก่อน'));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('เปิดรูปไม่สำเร็จ'));
      };
      img.src = url;
    });
  }

  /** ปรับคอนทราสต์เบา ๆ ก่อน OCR */
  function preprocess(img) {
    var c = document.createElement('canvas');
    var maxW = 2000;
    var scale = img.width > maxW ? maxW / img.width : 1;
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    try {
      var id = ctx.getImageData(0, 0, c.width, c.height);
      var d = id.data;
      for (var i = 0; i < d.length; i += 4) {
        var g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
        // เพิ่ม contrast
        g = (g - 128) * 1.25 + 128;
        if (g < 0) g = 0;
        if (g > 255) g = 255;
        d[i] = d[i + 1] = d[i + 2] = g;
      }
      ctx.putImageData(id, 0, 0);
    } catch (e) {}
    return c;
  }

  async function runOcrOnSource(source, onProgress) {
    var T = await loadTesseract();
    toast('กำลัง OCR (eng+tha)…');
    var result = await T.recognize(source, 'eng+tha', {
      logger: function (m) {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100));
        }
      }
    });
    lastText = (result && result.data && result.data.text) || '';
    return {
      text: lastText,
      confidence: result && result.data ? result.data.confidence : null,
      words: result && result.data && result.data.words ? result.data.words.length : 0
    };
  }

  function extractStructured(text) {
    text = String(text || '');
    var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var lineNo = null;
    var material = null;
    var elevs = [];
    var bomish = [];

    lines.forEach(function (l) {
      if (!lineNo) {
        var m = l.match(/(\d+\/\d+|\d+)\s*["″']?\s*[-–]\s*[A-Z]?\d+[A-Z0-9]*[-–]\d+/i);
        if (m) lineNo = m[0];
        if (window.IsoReader && IsoReader.parseLineNo) {
          var p = IsoReader.parseLineNo(l);
          if (p && p.ok) lineNo = p.raw;
        }
      }
      if (/alloy|ss\s*3\d{2}|carbon\s*steel|25cr|a\d{3}/i.test(l) && !material) material = l;
      var em = l.match(/EL\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)/ig);
      if (em) {
        em.forEach(function (e) {
          var n = e.replace(/EL\s*[:=]?\s*/i, '').replace(',', '.');
          elevs.push(parseFloat(n));
        });
      }
      if (/sch\s*\d+|elbow|tee|valve|pipe|flange|reducer|asme|b16|support|cli|shoe/i.test(l)) {
        bomish.push(l);
      }
    });

    var mto = [];
    if (window.MTOEngine && MTOEngine.parseLines) {
      mto = MTOEngine.parseLines(bomish.join('\n') || text);
    }

    return {
      line_no: lineNo,
      material: material,
      elevations: elevs.slice(0, 30),
      bom_lines: bomish,
      mto: mto,
      line_count: lines.length
    };
  }

  async function ocrFile(file, onProgress) {
    var img = await fileToImage(file);
    var canvas = preprocess(img);
    var ocr = await runOcrOnSource(canvas, onProgress);
    var structured = extractStructured(ocr.text);
    lastItems = structured.mto || [];
    return { ocr: ocr, structured: structured };
  }

  async function ocrDataUrl(dataUrl, onProgress) {
    var ocr = await runOcrOnSource(dataUrl, onProgress);
    var structured = extractStructured(ocr.text);
    lastItems = structured.mto || [];
    return { ocr: ocr, structured: structured };
  }

  function openPanel() {
    var id = 'ocrSheetPanel';
    var ex = document.getElementById(id);
    if (ex) { ex.classList.add('open'); return; }
    if (!document.getElementById('ocrSheetCss')) {
      var css = document.createElement('style');
      css.id = 'ocrSheetCss';
      css.textContent = '#ocrSheetPanel{display:none;position:fixed;left:12px;top:90px;bottom:48px;width:min(460px,96vw);z-index:20025;background:#fff;border:1px solid #c5d0dc;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:auto;font-size:12px}#ocrSheetPanel.open{display:block!important}#ocrSheetPanel .hd{position:sticky;top:0;background:#4c1d95;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;z-index:1}#ocrSheetPanel .hd button,#ocrSheetPanel .bd button{border:0;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600}#ocrSheetPanel .hd button{background:rgba(255,255,255,.2);color:#fff}#ocrSheetPanel .bd{padding:10px 12px}#ocrSheetPanel textarea{width:100%;min-height:100px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px;font-size:11px}#ocrSheetPanel .bar{height:8px;background:#e9d5ff;border-radius:99px;overflow:hidden;margin:8px 0}#ocrSheetPanel .bar>i{display:block;height:100%;width:0;background:#7c3aed}';
      document.head.appendChild(css);
    }
    var d = document.createElement('div');
    d.id = id;
    d.className = 'open';
    d.innerHTML = '<div class="hd"><b>🔤 OCR ทั้งแผ่น → MTO</b><button type="button" id="ocrSClose">ปิด</button></div>' +
      '<div class="bd">' +
      '<p>อัปโหลดรูปแบบ ISO (ถ่าย/สแกน ชัด ๆ) ระบบจะ OCR ภาษาไทย+อังกฤษ แล้วแยก BOM / Line No. / EL</p>' +
      '<input type="file" id="ocrSFile" accept="image/*" capture="environment"/>' +
      '<div class="bar"><i id="ocrSProg"></i></div>' +
      '<p id="ocrSStatus" style="opacity:.8">พร้อม</p>' +
      '<button type="button" id="ocrSRun" style="background:#7c3aed;color:#fff;margin:6px 0">เริ่ม OCR</button> ' +
      '<button type="button" id="ocrSMto" style="background:#0f766e;color:#fff">ส่งเข้า MTO</button> ' +
      '<button type="button" id="ocrSCopy" style="background:#e2e8f0">คัดลอกข้อความ</button>' +
      '<h4>ผลโครงสร้าง</h4><pre id="ocrSStruct" style="background:#f8fafc;padding:8px;border-radius:8px;font-size:11px;max-height:160px;overflow:auto">{}</pre>' +
      '<h4>ข้อความดิบ</h4><textarea id="ocrSText" readonly placeholder="ผล OCR จะโชว์ที่นี่"></textarea>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById('ocrSClose').onclick = function () { d.classList.remove('open'); };
    var lastResult = null;
    document.getElementById('ocrSRun').onclick = async function () {
      var f = document.getElementById('ocrSFile').files[0];
      if (!f) { toast('เลือกไฟล์รูปก่อน'); return; }
      document.getElementById('ocrSStatus').textContent = 'กำลังประมวลผล…';
      try {
        lastResult = await ocrFile(f, function (p) {
          document.getElementById('ocrSProg').style.width = p + '%';
          document.getElementById('ocrSStatus').textContent = 'OCR ' + p + '%';
        });
        document.getElementById('ocrSText').value = lastResult.ocr.text;
        document.getElementById('ocrSStruct').textContent = JSON.stringify(lastResult.structured, null, 2);
        document.getElementById('ocrSStatus').textContent =
          'เสร็จ confidence≈' + (lastResult.ocr.confidence != null ? Math.round(lastResult.ocr.confidence) : '-') +
          ' · บรรทัด BOM ' + (lastResult.structured.bom_lines || []).length +
          ' · MTO ' + (lastResult.structured.mto || []).length;
        toast('OCR เสร็จ');
      } catch (e) {
        document.getElementById('ocrSStatus').textContent = e.message || String(e);
        toast(e.message || 'OCR error');
      }
    };
    document.getElementById('ocrSMto').onclick = function () {
      if (!lastResult) { toast('ยังไม่มีผล OCR'); return; }
      if (window.MTOEngine && MTOEngine.open) {
        MTOEngine.open();
        setTimeout(function () {
          var ta = document.getElementById('mtoIn');
          if (ta) {
            ta.value = (lastResult.structured.bom_lines && lastResult.structured.bom_lines.length)
              ? lastResult.structured.bom_lines.join('\n')
              : lastResult.ocr.text;
          }
        }, 200);
        toast('ส่งข้อความเข้าแผง MTO');
      } else toast('MTOEngine ยังไม่พร้อม');
    };
    document.getElementById('ocrSCopy').onclick = function () {
      var t = document.getElementById('ocrSText').value;
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      toast('คัดลอกแล้ว');
    };
  }

  function addBtn() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="ocrsheet"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'ocrsheet');
    b.innerHTML = '🔤 OCR แผ่น <span class="ab">OCR+</span>';
    bar.appendChild(b);
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openPanel(); };
  }

  function boot() { addBtn(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.OcrSheet = {
    ocrFile: ocrFile,
    ocrDataUrl: ocrDataUrl,
    extract: extractStructured,
    lastText: function () { return lastText; },
    open: openPanel
  };
})();
