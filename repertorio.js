/* Ajedrez Academy · Aperturas más visuales.
   - Lista: el tablero de cada tarjeta reproduce la apertura al pasar por encima; jugadas escritas debajo;
     cabecera con un tablero que se juega solo y el método en 5 pasos.
   - Curso: portada con la posición, anillo de maestría y cifras; casillas clave en un mini tablero.
   - Explorador: barras por número de líneas, color por tipo y flecha de la jugada al pasar por encima. */
(function () {
  'use strict';
  function ic(n) { return window.AA_ICONO ? window.AA_ICONO(n) : ''; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var EN2ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' }, ES2EN = { R: 'K', D: 'Q', T: 'R', A: 'B', C: 'N' };
  function es(san) { return san.replace(/^([KQRBN])/, function (a, d) { return EN2ES[d]; }).replace(/=([QRBN])/, function (a, d) { return '=' + EN2ES[d]; }); }
  function aperturas() { return (window.AA_UI && window.AA_UI.openings) || []; }
  function porNombre(n) { n = (n || '').trim(); return aperturas().filter(function (o) { return o.name === n; })[0]; }
  function porId(id) { return aperturas().filter(function (o) { return o.id === id; })[0]; }
  var cacheJ = {};
  function jugadas(first) {
    if (cacheJ[first]) return cacheJ[first];
    var U = window.AA_UI, ch = new U.Chess(), out = { fens: [ch.fen()], ucis: [null], sans: [] };
    (first || '').trim().split(/\s+/).forEach(function (t) {
      if (!t) return; var m = null; try { m = ch.parse(t); } catch (e) {} if (m == null) return;
      var san = ch.san(m), uci = ch.uci(m); ch.make(m);
      out.fens.push(ch.fen()); out.ucis.push(uci); out.sans.push(es(san));
    });
    return (cacheJ[first] = out);
  }
  function textoJugadas(j, activa) {
    return j.sans.map(function (s, i) { return '<span class="' + (i === activa ? 'on' : '') + '">' + (i % 2 === 0 ? (i / 2 + 1) + '.' : '') + s + '</span>'; }).join('');
  }

  /* ---------- Tablero animado (usa el tablero de la app) ---------- */
  function Animador(caja, o, opts) {
    opts = opts || {};
    var U = window.AA_UI; if (!U || !U.createRoot) return null;
    var capa = document.createElement('div'); capa.className = 'or-anim' + (opts.cls ? ' ' + opts.cls : ''); caja.appendChild(capa);
    var root = U.createRoot(capa), j = jugadas(o.first), i = 0, t = 0, vivo = true;
    function pinta() { root.render(U.React.createElement(U.Board, { fen: j.fens[i], lastMove: j.ucis[i] || undefined, coords: false, quiet: true, orientation: o.side === 'b' ? 'b' : 'w', arrows: opts.flechas && i === j.fens.length - 1 ? [] : [] })); if (opts.paso) opts.paso(i - 1); }
    function sig() {
      if (!vivo) return;
      if (i < j.fens.length - 1) { i++; pinta(); t = setTimeout(sig, opts.ritmo || 650); }
      else if (opts.bucle) { t = setTimeout(function () { i = 0; pinta(); t = setTimeout(sig, 700); }, 1800); }
    }
    pinta(); requestAnimationFrame(function () { capa.classList.add('ver'); });
    t = setTimeout(sig, reduce.matches ? 0 : 350);
    if (reduce.matches) { i = j.fens.length - 1; pinta(); clearTimeout(t); }
    return { parar: function () { vivo = false; clearTimeout(t); capa.classList.remove('ver'); setTimeout(function () { try { root.unmount(); } catch (e) {} capa.remove(); }, 250); if (opts.paso) opts.paso(-2); } };
  }

  /* ================= LISTA DE APERTURAS ================= */
  var demo = null;
  function lista() {
    var ops = document.querySelector('.openings'); if (!ops) { if (demo) { demo.parar(); demo = null; } return; }
    var hero = ops.querySelector('.op-hero');
    if (hero && !hero.classList.contains('or-on')) {
      hero.classList.add('or-on');
      var tx = hero.firstElementChild;
      tx.insertAdjacentHTML('beforeend', '<p class="or-sub">Aprende la línea, entiende las ideas y repásala hasta que salga sola.</p>');
    }
    ops.querySelectorAll('.fam:not(.or-c)').forEach(function (f) {
      var o = porNombre((f.querySelector('.fam-main > b') || {}).textContent); if (!o) return;
      f.classList.add('or-c'); f.classList.add(o.side === 'b' ? 'or-negras' : 'or-blancas');
      var j = jugadas(o.first), small = f.querySelector('.fam-main > small');
      var lin = document.createElement('div'); lin.className = 'or-jug'; lin.innerHTML = textoJugadas(j, -1);
      if (small) small.insertAdjacentElement('afterend', lin);
      var tab = f.querySelector('.fam-board');
      if (tab) tab.insertAdjacentHTML('beforeend', '<span class="or-lado">' + (o.side === 'b' ? 'Negras' : 'Blancas') + '</span><span class="or-play" aria-hidden="true">' + ic('play') + '</span>');
      var anim = null;
      var empieza = function () { if (anim || !tab) return; f.classList.add('or-jugando'); anim = Animador(tab, o, { paso: function (k) { lin.innerHTML = textoJugadas(j, k); } }); };
      var acaba = function () { if (!anim) return; anim.parar(); anim = null; f.classList.remove('or-jugando'); lin.innerHTML = textoJugadas(j, -1); };
      f.addEventListener('mouseenter', empieza); f.addEventListener('mouseleave', acaba);
      f.addEventListener('focusin', empieza); f.addEventListener('focusout', function (e) { if (!f.contains(e.relatedTarget)) acaba(); });
      if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.intersectionRatio > .85) empieza(); else acaba(); }); }, { threshold: [0, .85] }).observe(tab);
      }
    });
  }

  /* ================= PÁGINA DEL CURSO ================= */
  function tableroFijo(caja, fen, orient, marcas) {
    var U = window.AA_UI; if (!U || !U.createRoot || caja.dataset.r) return;
    caja.dataset.r = '1';
    U.createRoot(caja).render(U.React.createElement(U.Board, { fen: fen, coords: false, quiet: true, orientation: orient, marks: marcas || [] }));
  }
  function curso() {
    var m = location.hash.match(/^#curso-(.+)$/); if (!m) return;
    var o = porId(m[1]), head = document.querySelector('.main .fam-head'); if (!o || !head) return;
    var page = head.parentElement;
    if (!head.classList.contains('or-on')) {
      head.classList.add('or-on');
      var j = jugadas(o.first);
      var hero = document.createElement('div'); hero.className = 'or-hero';
      hero.innerHTML = '<div class="or-hero-b"></div><div class="or-hero-tx"><span class="or-lado2">' + ic('rey') + (o.side === 'b' ? 'Con negras' : 'Con blancas') + '</span>' +
        '<div class="or-jug grande">' + textoJugadas(j, j.sans.length - 1) + '</div><p>' + (o.blurb || '') + '</p></div>' +
        '<div class="or-maes"><svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" class="f"/><circle cx="48" cy="48" r="40" class="p"/></svg><b>0%</b><small>maestría</small></div>' +
        '<div class="or-cifras"></div>';
      head.insertAdjacentElement('afterend', hero);
      tableroFijo(hero.querySelector('.or-hero-b'), j.fens[j.fens.length - 1], o.side === 'b' ? 'b' : 'w');
    }
    var hero2 = page.querySelector(':scope > .or-hero'); if (!hero2) return;
    // cifras desde lo que pinta la app (se actualizan solas)
    var sub = (head.querySelector('p.muted') || {}).textContent || '', mm = sub.match(/(\d+) de (\d+) líneas.*?(\d+) secciones/);
    var pct = parseInt(((head.querySelector('.mastery-big b') || {}).textContent || '0'), 10) || 0;
    var firma = sub + '|' + pct;
    if (hero2.dataset.f !== firma) {
      hero2.dataset.f = firma;
      var circ = 2 * Math.PI * 40, p = hero2.querySelector('.or-maes .p');
      p.style.strokeDasharray = circ; p.style.strokeDashoffset = circ * (1 - pct / 100);
      hero2.querySelector('.or-maes b').textContent = pct + '%';
      if (mm) hero2.querySelector('.or-cifras').innerHTML = '<span><b>' + mm[1] + '<em>/' + mm[2] + '</em></b><small>líneas aprendidas</small></span><span><b>' + mm[3] + '</b><small>secciones</small></span>';
    }
    // casillas clave en un mini tablero
    var plan = page.querySelector('.plan-card');
    if (plan && !plan.querySelector('.or-clave')) {
      var codes = Array.prototype.map.call(plan.querySelectorAll('code'), function (c) { return c.textContent.trim(); }).filter(function (s) { return /^[a-h][1-8]$/.test(s); });
      if (codes.length) {
        var j2 = jugadas(o.first), w = document.createElement('div'); w.className = 'or-clave';
        w.innerHTML = '<div class="or-clave-b"></div><small>Casillas clave</small>';
        plan.appendChild(w); plan.classList.add('or-con-clave');
        tableroFijo(w.querySelector('.or-clave-b'), j2.fens[j2.fens.length - 1], o.side === 'b' ? 'b' : 'w', codes);
      }
    }
  }

  /* ================= EXPLORADOR ================= */
  var flechaCapa = null;
  function flecha(cb, uci, color) {
    if (!cb) return;
    if (!flechaCapa || !cb.contains(flechaCapa)) { flechaCapa = document.createElement('div'); flechaCapa.className = 'or-flecha'; cb.appendChild(flechaCapa); }
    if (!uci) { flechaCapa.innerHTML = ''; return; }
    var a = Array.prototype.find.call(cb.querySelectorAll('.coord text'), function (x) { return /^[a-h]$/.test(x.textContent); });
    var negras = a && a.textContent === 'h';
    var p = function (s) { var f = s.charCodeAt(0) - 97, r = +s[1] - 1; return negras ? [(7 - f) * 100 + 50, r * 100 + 50] : [f * 100 + 50, (7 - r) * 100 + 50]; };
    var A = p(uci.slice(0, 2)), B = p(uci.slice(2, 4)), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    flechaCapa.innerHTML = '<svg viewBox="0 0 800 800" aria-hidden="true"><defs><marker id="or-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + color + '"/></marker></defs>' +
      '<line x1="' + (A[0] + ux * 16) + '" y1="' + (A[1] + uy * 16) + '" x2="' + (B[0] - ux * 30) + '" y2="' + (B[1] - uy * 30) + '" stroke="' + color + '" stroke-width="20" stroke-linecap="round" opacity=".85" marker-end="url(#or-ah)"/></svg>';
  }
  function explorador() {
    if (!/^#apertura-/.test(location.hash)) return;
    var tree = document.querySelector('.main .tree'); if (!tree) return;
    var botones = tree.querySelectorAll('.tree-mv'); if (!botones.length) return;
    var datos = Array.prototype.map.call(botones, function (b) { var t = (b.querySelector('span') || {}).textContent || '', n = (t.match(/(\d+) líneas/) || [])[1]; return { b: b, n: n ? +n : 1, cast: /error del rival/.test(t), teo: !!b.querySelector('.tree-book') }; });
    var max = Math.max.apply(null, datos.map(function (d) { return d.n; }));
    tree.classList.add('or-on');
    datos.forEach(function (d) {
      d.b.classList.toggle('or-teo', d.teo); d.b.classList.toggle('or-cast', d.cast && !d.teo);
      var bar = d.b.querySelector('.or-barra');
      if (!bar) { bar = document.createElement('i'); bar.className = 'or-barra'; bar.setAttribute('aria-hidden', 'true'); d.b.insertBefore(bar, d.b.firstChild); }
      bar.style.width = Math.max(6, Math.round(d.n / max * 100)) + '%';
      if (!d.b.dataset.or) {
        d.b.dataset.or = '1';
        var muestra = function () {
          var t = window.AA_TABLERO, cb = document.querySelector('.main .stage-b .cb'); if (!t || !cb) return;
          var san = (d.b.querySelector('b') || {}).textContent || '';
          var en = san.replace(/^([RDTAC])/, function (a, x) { return ES2EN[x]; }).replace(/=([DTAC])/, function (a, x) { return '=' + ES2EN[x]; });
          try { var ch = new window.AA_UI.Chess(t.fen), mv = ch.parse(en); if (mv != null) flecha(cb, ch.uci(mv), d.b.classList.contains('or-cast') ? '#ef4444' : '#2fa8ff'); } catch (e) {}
        };
        d.b.addEventListener('mouseenter', muestra); d.b.addEventListener('focus', muestra);
        d.b.addEventListener('mouseleave', function () { flecha(document.querySelector('.main .stage-b .cb'), null); });
        d.b.addEventListener('blur', function () { flecha(document.querySelector('.main .stage-b .cb'), null); });
        d.b.addEventListener('click', function () { flecha(document.querySelector('.main .stage-b .cb'), null); });
      }
    });
  }

  var pend = false;
  function tick() { pend = false; try { lista(); curso(); explorador(); } catch (e) { if (window.console) console.warn('repertorio', e); } }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
