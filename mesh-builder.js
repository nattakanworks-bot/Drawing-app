/*! mesh-builder.js — สร้าง mesh 3D จาก SymbolLib.meshParams แล้วต่อกับ convert3d */
(function () {
  var SYM_GROUP = null;
  var THREE_REF = null;
  var loading = null;

  function toast(t) {
    var el = document.getElementById('featToast');
    if (!el) { try { console.info('[mesh]', t); } catch (e) {} return; }
    el.textContent = t;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 3200);
  }

  function getApp() { return window.__app || null; }

  function getV3() {
    var a = getApp();
    return a && a.V3 ? a.V3 : null;
  }

  /** หา THREE จาก scene ที่มีอยู่ หรือโหลดจาก CDN */
  function resolveTHREE() {
    if (THREE_REF) return Promise.resolve(THREE_REF);
    if (window.THREE && window.THREE.Mesh) {
      THREE_REF = window.THREE;
      return Promise.resolve(THREE_REF);
    }
    // ขโมย constructor จาก mesh ใน scene
    var v3 = getV3();
    if (v3 && v3.group) {
      var stolen = {};
      v3.group.traverse(function (o) {
        if (o.isMesh && o.geometry && o.material) {
          stolen.Mesh = o.constructor;
          if (!stolen.Material) stolen.Material = o.material.constructor;
        }
        if (o.isGroup && !stolen.Group) stolen.Group = o.constructor;
      });
      if (stolen.Mesh && v3.scene) {
        // ยังขาด Geometry classes — โหลด CDN อยู่ดี
      }
    }
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
      s.onload = function () {
        THREE_REF = window.THREE;
        resolve(THREE_REF);
      };
      s.onerror = function () {
        reject(new Error('โหลด Three.js ไม่สำเร็จ'));
      };
      document.head.appendChild(s);
    });
    return loading;
  }

  function mat(THREE, color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color || 0x94a3b8,
      metalness: opts.metalness != null ? opts.metalness : 0.25,
      roughness: opts.roughness != null ? opts.roughness : 0.55,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1,
      side: THREE.DoubleSide
    });
  }

  function colorOf(cat) {
    return ({
      pipe: 0x60a5fa,
      fitting: 0x34d399,
      flange: 0xfbbf24,
      valve: 0xf87171,
      weld: 0xa3a3a3,
      support: 0xc084fc,
      special: 0xfb923c,
      instrument: 0x22d3ee,
      pump: 0x818cf8
    })[cat] || 0x94a3b8;
  }

  /** สร้าง Object3D จาก recipe */
  function buildFromRecipe(THREE, recipe, p) {
    recipe = recipe || {};
    var type = recipe.type || 'cylinder';
    var r = (p && p.r_mm) ? p.r_mm / 1000 : 0.05; // เมตร
    var od = (p && p.od_mm) ? p.od_mm / 1000 : r * 2;
    r = od / 2;
    var col = (p && p.color) ? p.color : colorOf(p && p.category);
    if (typeof col === 'string' && col[0] === '#') col = parseInt(col.slice(1), 16);
    var g, m, mesh, group;

    switch (type) {
      case 'cylinder': {
        var len = 0.5;
        g = new THREE.CylinderGeometry(r * 0.92, r * 0.92, len, 24, 1, true);
        mesh = new THREE.Mesh(g, mat(THREE, col));
        mesh.rotation.z = Math.PI / 2;
        return mesh;
      }
      case 'torus_arc': {
        var ang = (recipe.angle_deg || 90) * Math.PI / 180;
        var bend = (recipe.bend_radius === '1.0*NPS') ? r * 2 : r * 3; // approx LR=1.5D
        g = new THREE.TorusGeometry(bend, r * 0.9, 12, 24, ang);
        mesh = new THREE.Mesh(g, mat(THREE, col));
        mesh.rotation.x = Math.PI / 2;
        return mesh;
      }
      case 'tee': {
        group = new THREE.Group();
        var run = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.4, 20, 1, true),
          mat(THREE, col)
        );
        run.rotation.z = Math.PI / 2;
        var br = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.25, 20, 1, true),
          mat(THREE, col)
        );
        br.position.y = 0.12;
        group.add(run); group.add(br);
        return group;
      }
      case 'cone_frustum':
      case 'cone_frustum_offset': {
        var r1 = r * 1.2, r2 = r * 0.7;
        g = new THREE.CylinderGeometry(r2, r1, 0.25, 24);
        mesh = new THREE.Mesh(g, mat(THREE, col));
        mesh.rotation.z = Math.PI / 2;
        if (type === 'cone_frustum_offset') mesh.position.y = (r1 - r2) * 0.35;
        return mesh;
      }
      case 'cap': {
        g = new THREE.SphereGeometry(r, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        mesh = new THREE.Mesh(g, mat(THREE, col));
        mesh.rotation.z = -Math.PI / 2;
        return mesh;
      }
      case 'cross': {
        group = new THREE.Group();
        var a = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.4, 16, 1, true), mat(THREE, col));
        a.rotation.z = Math.PI / 2;
        var b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.4, 16, 1, true), mat(THREE, col));
        group.add(a); group.add(b);
        return group;
      }
      case 'lateral': {
        group = new THREE.Group();
        var main = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.4, 16, 1, true), mat(THREE, col));
        main.rotation.z = Math.PI / 2;
        var lat = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.28, 16, 1, true), mat(THREE, col));
        lat.rotation.z = Math.PI / 4;
        lat.position.set(0.1, 0.1, 0);
        group.add(main); group.add(lat);
        return group;
      }
      case 'annulus_disc': {
        // flange: ring + thin disc
        group = new THREE.Group();
        var outer = (recipe.od === 'flange_OD') ? r * 2.2 : r * 2.0;
        var tube = Math.max(outer * 0.08, 0.008);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(outer * 0.55, tube, 8, 24), mat(THREE, col, { metalness: 0.4 }));
        ring.rotation.y = Math.PI / 2;
        var face = new THREE.Mesh(new THREE.CylinderGeometry(outer * 0.5, outer * 0.5, 0.02, 24), mat(THREE, col));
        face.rotation.z = Math.PI / 2;
        group.add(ring); group.add(face);
        return group;
      }
      case 'valve': {
        group = new THREE.Group();
        var bodyStyle = recipe.body || 'body_gate';
        var bodyLen = 0.22;
        var bodyR = r * 1.15;
        var body = new THREE.Mesh(
          new THREE.CylinderGeometry(bodyR, bodyR, bodyLen, 20),
          mat(THREE, col, { metalness: 0.35 })
        );
        body.rotation.z = Math.PI / 2;
        group.add(body);
        // ends
        var endL = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.06, 16), mat(THREE, 0xcbd5e1));
        endL.rotation.z = Math.PI / 2;
        endL.position.x = -bodyLen / 2;
        var endR = endL.clone(); endR.position.x = bodyLen / 2;
        group.add(endL); group.add(endR);
        // stem + handwheel
        if (recipe.stem !== 'none') {
          var stem = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.15, r * 0.15, 0.2, 8), mat(THREE, 0x64748b));
          stem.position.y = bodyR + 0.08;
          group.add(stem);
          if (recipe.handwheel || bodyStyle.indexOf('gate') >= 0 || bodyStyle.indexOf('globe') >= 0) {
            var hw = new THREE.Mesh(new THREE.TorusGeometry(r * 0.55, r * 0.08, 8, 16), mat(THREE, 0x1e293b));
            hw.position.y = bodyR + 0.18;
            group.add(hw);
          }
          if (recipe.actuator === 'motor') {
            var box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), mat(THREE, 0x334155));
            box.position.y = bodyR + 0.22;
            group.add(box);
          }
          if (recipe.actuator === 'pneumatic') {
            var cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), mat(THREE, 0xf8fafc));
            cyl.position.y = bodyR + 0.22;
            group.add(cyl);
          }
        }
        // check valve arrow hint
        if (bodyStyle.indexOf('check') >= 0) {
          var cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, 0.08, 10), mat(THREE, 0xfef3c7));
          cone.rotation.z = -Math.PI / 2;
          cone.position.x = 0.05;
          group.add(cone);
        }
        return group;
      }
      case 'pump': {
        group = new THREE.Group();
        var style = recipe.style || 'centrifugal';
        // volute / casing
        var casing = new THREE.Mesh(
          new THREE.SphereGeometry(r * 2.2, 20, 16),
          mat(THREE, col, { metalness: 0.3 })
        );
        group.add(casing);
        // suction / discharge nozzles
        var noz = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.2, 16), mat(THREE, 0x94a3b8));
        noz.rotation.z = Math.PI / 2;
        noz.position.x = r * 2.2;
        group.add(noz);
        var noz2 = noz.clone();
        noz2.rotation.z = 0;
        noz2.position.set(0, r * 2.2, 0);
        group.add(noz2);
        // motor for centrifugal
        if (style === 'centrifugal' || style === 'vertical') {
          var motor = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, r * 2.5, 16), mat(THREE, 0x1e3a5f));
          motor.position.z = -(r * 2.5);
          motor.rotation.x = Math.PI / 2;
          group.add(motor);
        }
        return group;
      }
      case 'weld_ring': {
        g = new THREE.TorusGeometry(r, r * 0.12, 6, 16);
        mesh = new THREE.Mesh(g, mat(THREE, 0xfbbf24, { metalness: 0.5 }));
        mesh.rotation.y = Math.PI / 2;
        return mesh;
      }
      case 'support': {
        group = new THREE.Group();
        var base = new THREE.Mesh(new THREE.BoxGeometry(r * 3, 0.04, r * 2), mat(THREE, 0xa78bfa));
        base.position.y = -r - 0.02;
        group.add(base);
        var clamp = new THREE.Mesh(new THREE.TorusGeometry(r * 1.1, r * 0.15, 6, 16, Math.PI), mat(THREE, 0xc084fc));
        clamp.rotation.x = Math.PI / 2;
        group.add(clamp);
        return group;
      }
      case 'spectacle': {
        group = new THREE.Group();
        var d1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.015, 20), mat(THREE, 0xfb923c));
        d1.rotation.z = Math.PI / 2;
        d1.position.y = r * 1.7;
        var d2 = d1.clone();
        d2.position.y = -r * 1.7;
        // open ring vs solid
        var hole = new THREE.Mesh(new THREE.TorusGeometry(r * 1.1, 0.01, 4, 16), mat(THREE, 0xfed7aa));
        hole.rotation.y = Math.PI / 2;
        hole.position.y = r * 1.7;
        group.add(d1); group.add(d2); group.add(hole);
        return group;
      }
      case 'orifice_plate': {
        g = new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.01, 24);
        mesh = new THREE.Mesh(g, mat(THREE, 0xf59e0b));
        mesh.rotation.z = Math.PI / 2;
        return mesh;
      }
      case 'strainer_y': {
        group = new THREE.Group();
        var runS = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.3, 16), mat(THREE, col));
        runS.rotation.z = Math.PI / 2;
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.22, 12), mat(THREE, 0xfbbf24));
        leg.rotation.z = Math.PI / 3;
        leg.position.set(0.05, -0.1, 0);
        group.add(runS); group.add(leg);
        return group;
      }
      case 'olet': {
        group = new THREE.Group();
        var saddle = new THREE.Mesh(new THREE.SphereGeometry(r * 1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(THREE, col));
        var branch = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.15, 12), mat(THREE, col));
        branch.position.y = r * 0.9;
        group.add(saddle); group.add(branch);
        return group;
      }
      case 'instrument_bubble':
      case 'nozzle_small': {
        group = new THREE.Group();
        var stemN = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.12, 8), mat(THREE, 0x64748b));
        stemN.position.y = 0.06;
        var bubble = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 12, 10), mat(THREE, 0x22d3ee, { transparent: true, opacity: 0.85 }));
        bubble.position.y = 0.16;
        group.add(stemN); group.add(bubble);
        return group;
      }
      case 'disc': {
        g = new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.012, 20);
        mesh = new THREE.Mesh(g, mat(THREE, col));
        mesh.rotation.z = Math.PI / 2;
        return mesh;
      }
      case 'socket':
      case 'thread_mark': {
        g = new THREE.TorusGeometry(r * 1.05, r * 0.08, 6, 12);
        return new THREE.Mesh(g, mat(THREE, 0xe2e8f0));
      }
      default: {
        g = new THREE.BoxGeometry(r * 2, r * 2, r * 2);
        return new THREE.Mesh(g, mat(THREE, col));
      }
    }
  }

  function ensureSymGroup(THREE, v3) {
    if (SYM_GROUP && SYM_GROUP.parent) return SYM_GROUP;
    SYM_GROUP = new THREE.Group();
    SYM_GROUP.name = 'SymbolLibMeshes';
    if (v3.group) v3.group.add(SYM_GROUP);
    else if (v3.scene) v3.scene.add(SYM_GROUP);
    return SYM_GROUP;
  }

  function clearSymGroup() {
    if (!SYM_GROUP) return;
    while (SYM_GROUP.children.length) {
      var c = SYM_GROUP.children.pop();
      c.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose && m.dispose(); });
          else o.material.dispose && o.material.dispose();
        }
      });
    }
  }

  /** เดาสัญลักษณ์จาก element ของแอป */
  function guessSymbolId(el) {
    if (!el) return null;
    var blob = [el.type, el.kind, el.name, el.tag, el.sym, el.label, el.iso && el.iso.type]
      .filter(Boolean).join(' ');
    if (window.SymbolLib && SymbolLib.lookup) {
      var hit = SymbolLib.lookup(blob);
      if (hit) return hit.id;
    }
    var a = getApp();
    if (a && typeof a.kindOf === 'function') {
      try {
        var k = a.kindOf(el);
        if (k && window.SymbolLib) {
          var h2 = SymbolLib.lookup(k);
          if (h2) return h2.id;
        }
        if (k === 'pipe') return 'PIPE';
        if (k === 'valve') return 'GV';
      } catch (e) {}
    }
    // heuristics
    var t = String(el.type || '').toLowerCase();
    if (/pipe|line/.test(t)) return 'PIPE';
    if (/elbow|el90|bend/.test(t)) return 'EL90_LR';
    if (/tee/.test(t)) return 'TEE';
    if (/reduc/.test(t)) return 'RED_CON';
    if (/flange|flg/.test(t)) return 'FLG_WN';
    if (/gate/.test(t)) return 'GV';
    if (/globe/.test(t)) return 'GL';
    if (/ball/.test(t)) return 'BV';
    if (/check|nrv/.test(t)) return 'CK';
    if (/butterfly/.test(t)) return 'BF';
    if (/valve/.test(t)) return 'GV';
    if (/pump/.test(t)) return 'PMP_CENT';
    if (/support|shoe|anchor/.test(t)) return 'SUP_SHOE';
    return null;
  }

  function npsOf(el) {
    if (!el) return '4';
    var n = el.nps || el.dn || el.size || el.dia || (el.iso && el.iso.nps);
    if (n == null) return '4';
    return String(n).replace(/[^
0-9.]/g, '') || '4';
  }

  function posOf(el) {
    // พิกัดในโปรเจกต์ — หลายรูปแบบ
    var x = el.x != null ? el.x : (el.cx != null ? el.cx : (el.p && el.p.x));
    var y = el.y != null ? el.y : (el.cy != null ? el.cy : (el.p && el.p.y));
    var z = el.z != null ? el.z : (el.elev != null ? el.elev : (el.p && el.p.z));
    if (x == null) x = 0;
    if (y == null) y = 0;
    if (z == null) z = 0;
    // แอปมักใช้หน่วย mm หรือ drawing unit — สเกลคร่าว ๆ เป็นเมตร
    var s = 0.001;
    return { x: x * s, y: z * s, z: -y * s };
  }

  async function buildAllFromProject(opts) {
    opts = opts || {};
    var THREE = await resolveTHREE();
    var app = getApp();
    var v3 = getV3();
    if (!v3 || !v3.inited) {
      toast('ยังไม่มีฉาก 3D — กดแปลง 2D→3D ก่อน');
      return { count: 0 };
    }
    var project = app && app.S && app.S.project;
    var elements = (project && project.elements) || [];
    clearSymGroup();
    var group = ensureSymGroup(THREE, v3);
    var count = 0;
    var demo = opts.demo || elements.length === 0;

    if (demo) {
      // จัดโชว์คลังสัญลักษณ์เป็นแถว
      var ids = ['PIPE','EL90_LR','TEE','RED_CON','FLG_WN','GV','GL','BV','CK','BF','PMP_CENT','PT','FT','SUP_SHOE','SPEC'];
      ids.forEach(function (id, i) {
        var p = window.SymbolLib && SymbolLib.meshParams(id, '6');
        if (!p) return;
        var obj = buildFromRecipe(THREE, p.recipe, p);
        if (!obj) return;
        obj.position.set((i % 5) * 0.6, 0, -Math.floor(i / 5) * 0.6);
        obj.userData.symbolId = id;
        group.add(obj);
        count++;
      });
      toast('แสดงตัวอย่าง mesh สัญลักษณ์ ' + count + ' ชิ้น (ไม่มี element ในโปรเจกต์)');
    } else {
      elements.forEach(function (el, idx) {
        var sid = guessSymbolId(el);
        if (!sid) return;
        var p = window.SymbolLib && SymbolLib.meshParams(sid, npsOf(el));
        if (!p) return;
        var obj = buildFromRecipe(THREE, p.recipe, p);
        if (!obj) return;
        var pos = posOf(el);
        obj.position.set(pos.x, pos.y, pos.z);
        obj.userData.symbolId = sid;
        obj.userData.elementIndex = idx;
        group.add(obj);
        count++;
      });
      toast('สร้าง mesh สัญลักษณ์ ' + count + ' / element ' + elements.length);
    }

    try {
      if (app.V3fn && typeof app.V3fn.fit === 'function') app.V3fn.fit();
    } catch (e) {}
    return { count: count };
  }

  function wrapConvert3d() {
    var app = getApp();
    if (!app || typeof app.convert3d !== 'function' || app.convert3d.__meshWrapped) return;
    var orig = app.convert3d.bind(app);
    app.convert3d = async function (opts) {
      var r = await Promise.resolve(orig(opts));
      try {
        // รอให้ rebuild เสร็จ
        setTimeout(function () {
          buildAllFromProject({}).catch(function (e) {
            console.warn('[mesh] post-convert', e);
          });
        }, 600);
      } catch (e) {}
      return r;
    };
    app.convert3d.__meshWrapped = true;
  }

  function addToolbarButton() {
    var bar = document.getElementById('featBar');
    if (!bar || document.querySelector('[data-feat="mesh3d"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fb ready';
    b.setAttribute('data-feat', 'mesh3d');
    b.title = 'สร้าง mesh 3D จากคลังสัญลักษณ์';
    b.innerHTML = '🧱 Mesh 3D <span class="ab">Mesh</span>';
    bar.appendChild(b);
    b.addEventListener('click', function () {
      buildAllFromProject({}).catch(function (e) {
        toast('Mesh error: ' + (e && e.message));
      });
    });
  }

  function boot() {
    addToolbarButton();
    wrapConvert3d();
    // ลอง wrap อีกครั้งหลัง app พร้อม
    setTimeout(wrapConvert3d, 1500);
    setTimeout(wrapConvert3d, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.MeshBuilder = {
    buildAll: buildAllFromProject,
    buildFromRecipe: function (recipe, p) {
      return resolveTHREE().then(function (THREE) {
        return buildFromRecipe(THREE, recipe, p);
      });
    },
    clear: clearSymGroup
  };
})();
