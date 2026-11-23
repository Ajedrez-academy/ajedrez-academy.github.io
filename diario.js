/* Ajedrez Academy · Problema del día (#problema-del-dia).
   El mismo problema para todo el mundo cada día, racha de días resueltos y resultado para compartir. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var KEY = 'aa-diario';
  var URL_SITIO = 'https://ajedrez-academy.github.io/#problema-del-dia';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function hoyISO(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function diaN(d) { d = d || new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function leer() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function racha(o) {
    var n = 0, d = new Date();
    if (!(o[hoyISO(d)] && o[hoyISO(d)].ok)) d.setDate(d.getDate() - 1); // hoy aún no cuenta en contra
    while (o[hoyISO(d)] && o[hoyISO(d)].ok) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // Elige el problema del día: misma elección para todos, dificultad media (1000–1700), varía el tema
  var cache = null;
  function problemaDe(n) {
    var P = (window.AA_UI && window.AA_UI.puzzles) || [];
    if (!P.length) return null;
    if (!cache) cache = P.filter(function (p) { return p.rating >= 1000 && p.rating <= 1700 && p.sol && p.sol.length <= 3; });
    var pool = cache.length ? cache : P;
    var h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
    return pool[h % pool.length];
  }
  window.AA_DIARIO = { leer: leer, racha: racha, hoy: hoyISO, problema: function () { return problemaDe(diaN()); } };

  function Diario() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var p = R.useMemo(function () { return problemaDe(diaN()); }, []);
    var inicio = R.useMemo(function () {
      if (!p) return null;
      var ch = new UI.Chess(p.fen), m = ch.parse(p.last); if (m !== null) ch.make(m);
      return { fen: ch.fen(), color: ch.turn ? 'b' : 'w' };
    }, [p]);
    var reg0 = leer()[hoyISO()] || null;
    var st = R.useState({ fen: inicio && inicio.fen, last: p && p.last, i: 0, fallos: reg0 ? reg0.fallos : 0, estado: reg0 && reg0.ok ? 'hecho' : 'jugando', flash: null, pista: false, msg: '' }), g = st[0], set = st[1];
    var gRef = R.useRef(g); gRef.current = g;
    var copiado = R.useState(''), cop = copiado[0], setCop = copiado[1];
    var ya = R.useState(!!(reg0 && reg0.ok))[0];

    if (!p) return h('div', { className: 'page-retos pd-page' }, h('p', null, 'Cargando el problema…'));

    function registrar(ok, fallos) {
      var o = leer(), k = hoyISO();
      if (o[k] && o[k].ok) return;
      o[k] = { ok: ok, fallos: fallos, id: p.id };
      // conserva solo los últimos 400 días
      var ks = Object.keys(o).sort(); while (ks.length > 400) delete o[ks.shift()];
      guardar(o);
    }
    function onMove(u) {
      var c = gRef.current; if (c.estado !== 'jugando') return false;
      var ch = new UI.Chess(c.fen), m = ch.parse(u); if (m === null) return false;
      var esperado = p.sol[c.i];
      var prueba = ch.clone ? ch.clone() : new UI.Chess(c.fen); var pm = prueba.parse(u); prueba.make(pm);
      var esMate = prueba.inCheck() && prueba.legal().length === 0;
      if (u === esperado || (esperado && u.slice(0, 4) === esperado.slice(0, 4) && u.length === 4) || esMate) {
        ch.make(m); UI.sound(ch.inCheck() ? 'check' : 'move');
        var i = c.i + 1, fen = ch.fen();
        if (i >= p.sol.length || esMate) {
          registrar(true, c.fallos);
          if (!ya) try { UI.xp(c.fallos ? 10 : 20); } catch (e) {}
          set(Object.assign({}, c, { fen: fen, last: u, i: i, estado: 'hecho', flash: 'ok', pista: false }));
          setTimeout(function () { UI.sound('correct'); }, 200);
          return true;
        }
        set(Object.assign({}, c, { fen: fen, last: u, i: i, pista: false, flash: null, msg: '¡Bien! Sigue…' }));
        setTimeout(function () { // responde el rival
          var c2 = gRef.current, ch2 = new UI.Chess(c2.fen), r = p.sol[c2.i], m2 = ch2.parse(r);
          if (m2 === null) return; ch2.make(m2); UI.sound(ch2.inCheck() ? 'check' : 'move');
          set(Object.assign({}, c2, { fen: ch2.fen(), last: r, i: c2.i + 1 }));
        }, 450);
        return true;
      }
      UI.sound('wrong');
      var f = c.fallos + 1;
      var o = leer(); if (!(o[hoyISO()] && o[hoyISO()].ok)) { o[hoyISO()] = { ok: false, fallos: f, id: p.id }; guardar(o); }
      set(Object.assign({}, c, { fallos: f, flash: 'bad', msg: f >= 2 ? 'No es esa. Usa la pista si la necesitas.' : 'No es esa. Vuelve a mirar: ¿qué jugada fuerza al rival?' }));
      return false;
    }
    function compartir() {
      var o = leer(), r = racha(o), d = new Date(), reg = o[hoyISO()] || { fallos: g.fallos };
      var txt = '♟️ Ajedrez Academy · Problema del día ' + d.getDate() + ' ' + MESES[d.getMonth()] + '\n' +
        (reg.fallos ? '✅ Resuelto (' + (reg.fallos + 1) + ' intentos)' : '✅ ¡A la primera!') + (r > 1 ? '  🔥 ' + r + ' días seguidos' : '') +
        '\n' + '🟩'.repeat(1) + '🟥'.repeat(Math.min(5, reg.fallos || 0)) + '\n' + URL_SITIO;
      var hecho = function () { setCop('¡Copiado! Pégalo donde quieras.'); setTimeout(function () { setCop(''); }, 2500); };
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { navigator.share({ text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(hecho, function () { prompt('Copia tu resultado:', txt); });
      else prompt('Copia tu resultado:', txt);
    }
    var o = leer(), r = racha(o);
    var turno = inicio.color === 'w' ? 'blancas' : 'negras';
    var tema = (p.themes || []).filter(function (t) { return t !== 'material'; })[0];
    var pistaSq = g.pista && p.sol[g.i] ? p.sol[g.i].slice(0, 2) : null;
    var semana = []; for (var k = 6; k >= 0; k--) { var d = new Date(); d.setDate(d.getDate() - k); var x = o[hoyISO(d)]; semana.push({ l: 'LMXJVSD'[(d.getDay() + 6) % 7], s: x ? (x.ok ? 'ok' : 'ko') : '' }); }

    return h('div', { className: 'page-retos pd-page' },
      h('div', { className: 'pd-top' },
        h('div', null, h('small', { className: 'pd-kicker' }, 'Problema del día · ' + new Date().getDate() + ' ' + MESES[new Date().getMonth()]),
          h('h1', null, 'Juegan las ' + turno + (p.mate ? ' y dan mate en ' + p.mate : '')),
          h('p', { className: 'muted' }, 'El mismo problema para todos hoy. Encuentra la mejor jugada' + (p.sol.length > 1 ? ' y sigue hasta el final.' : '.'))),
        h('div', { className: 'pd-racha', title: 'Días seguidos resolviendo el problema del día' }, h('b', null, '🔥 ', r), h('small', null, r === 1 ? 'día seguido' : 'días seguidos'))),
      h('div', { className: 'nv-stage' },
        h('div', { className: 'nv-board' }, h(UI.Board, { fen: g.fen, interactive: g.estado === 'jugando', onMove: onMove, lastMove: g.last, orientation: inicio.color, allowColor: inicio.color, hint: pistaSq, flash: g.flash })),
        h('div', { className: 'nv-side' },
          g.estado === 'hecho'
            ? h('div', { className: 'card nv-box pd-ok' },
                h(UI.Mascot, { kind: 'caballo', mood: 'happy', size: 84 }),
                h('b', null, g.fallos ? '¡Resuelto!' : '¡A la primera!'),
                h('p', { className: 'muted small' }, (ya ? 'Ya lo resolviste hoy. ' : (g.fallos ? '+10 XP. ' : '+20 XP. ')) + 'Mañana hay otro problema nuevo.'),
                tema ? h('p', { className: 'small' }, 'Tema: ', h('b', null, tema)) : null,
                h('button', { className: 'btn btn-primary', onClick: compartir }, h('span', null, 'Compartir mi resultado')),
                cop ? h('p', { className: 'pd-copiado', role: 'status' }, cop) : null,
                h('button', { className: 'btn', onClick: function () { UI.go('tactica'); } }, h('span', null, 'Seguir con más táctica')))
            : h('div', { className: 'card nv-box' },
                h('b', null, 'Tu turno'),
                h('p', { className: 'muted small', role: 'status' }, g.msg || 'Mueve una pieza en el tablero.'),
                g.fallos ? h('p', { className: 'small' }, 'Intentos fallidos: ' + g.fallos) : null,
                h('button', { className: 'btn', onClick: function () { set(Object.assign({}, g, { pista: true })); } }, h('span', null, 'Pista: ¿qué pieza muevo?'))),
          h('div', { className: 'card pd-semana', 'aria-label': 'Tus últimos 7 días' },
            h('small', null, 'Tu semana'),
            h('div', null, semana.map(function (s, i) { return h('span', { key: i, className: 'pd-d ' + s.s, title: s.s === 'ok' ? 'Resuelto' : s.s === 'ko' ? 'Intentado' : 'Sin jugar' }, h('i', null, s.s === 'ok' ? '✓' : s.s === 'ko' ? '·' : ''), s.l); }))))));
  }
  PAGES['problema-del-dia'] = Diario;

  /* Tarjeta en Inicio (DOM simple; se reinyecta si React repinta) */
  function tarjeta() {
    var col = document.querySelector('.home .path-col'); if (!col || !window.AA_UI || !window.AA_UI.puzzles) return;
    var o = leer(), reg = o[hoyISO()], r = racha(o), ok = !!(reg && reg.ok);
    var firma = hoyISO() + (ok ? 'ok' : reg ? 'ko' : '') + r;
    var el = col.querySelector(':scope > .pd-card');
    if (el && el.dataset.f === firma) return;
    if (!el) {
      el = document.createElement('button'); el.type = 'button'; el.className = 'card pd-card';
      el.addEventListener('click', function () { location.hash = 'problema-del-dia'; window.scrollTo(0, 0); });
      var ref = col.querySelector(':scope > .aa-tomos') || col.querySelector(':scope > .unit');
      col.insertBefore(el, ref);
    }
    el.dataset.f = firma; el.classList.toggle('hecho', ok);
    el.innerHTML = '<span class="pd-ico" aria-hidden="true">' + (ok ? '✓' : '♞') + '</span>' +
      '<span class="pd-tx"><small>Problema del día</small><b>' + (ok ? 'Resuelto. Vuelve mañana' : reg ? 'Te falta poco: inténtalo otra vez' : 'Un problema nuevo te espera') + '</b></span>' +
      '<span class="pd-fire" title="Días seguidos">🔥 ' + r + '</span>';
  }
  var pend = false;
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(function () { pend = false; tarjeta(); }); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
