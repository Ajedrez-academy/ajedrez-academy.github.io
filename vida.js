/* Ajedrez Academy · «Vida»: más ilustración y animación en Jugar, Partidas y Evaluar.
   Todo se añade encima de lo que pinta la app (sin tocar su lógica): personajes de los bots,
   arena del duelo, biblioteca de partidas con miniaturas y las claves de Evaluar en barras. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  /* ================= Personajes de los bots ================= */
  var BOTS = [
    { n: 'Peón Pepe', p: 'peon', elo: 400, c: '#2bb45c', d: '#1d8a44', l: '#d9f4e1', acc: 'brote',
      q: '¡Hola! Todavía confundo el caballo con el alfil… ¿jugamos una?' },
    { n: 'Caballero Carla', p: 'caballo', elo: 800, c: '#14b8a6', d: '#0e8a7d', l: '#ccfbf1', acc: 'crin',
      q: 'Voy a por tu rey desde la primera jugada. ¡Cuidado con mis saltos!' },
    { n: 'Alfil Álex', p: 'alfil', elo: 1100, c: '#2fa8ff', d: '#1b7fd1', l: '#dbeefe', acc: 'gafas',
      q: 'Cuento cada pieza dos veces. Si dejas una colgada, la veo.' },
    { n: 'Torre Tere', p: 'torre', elo: 1400, c: '#8b5cf6', d: '#6a3fd1', l: '#ede4ff', acc: 'casco',
      q: 'Paciencia, estructura y columnas abiertas. Yo no tengo prisa.' },
    { n: 'Dama Diana', p: 'dama', elo: 1700, c: '#f0509b', d: '#c42f76', l: '#fde1ef', acc: 'pendientes',
      q: 'Un solo error y lo castigo. ¿Te atreves?' },
    { n: 'Rey Ramón', p: 'rey', elo: 1900, c: '#ff4b4b', d: '#c92f2f', l: '#ffe0e0', acc: 'bigote',
      q: 'Juego con el motor a plena potencia. Que gane el mejor.' }
  ];
  var ORO = '#ffcf3f', ORO_D = '#d99a00', TINTA = '#1f2933';

  function cara(cx, cy, mood) {
    var boca = mood === 'feliz' ? '<path d="M' + (cx - 9) + ' ' + (cy + 12) + 'q9 10 18 0" fill="' + TINTA + '"/>'
      : mood === 'preocupado' ? '<ellipse cx="' + cx + '" cy="' + (cy + 15) + '" rx="4" ry="5" fill="' + TINTA + '"/><path class="vx-gota" d="M' + (cx + 24) + ' ' + (cy - 14) + 'c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10z" fill="#7cc8ff"/>'
      : mood === 'serio' ? '<path d="M' + (cx - 7) + ' ' + (cy + 15) + 'h14" stroke="' + TINTA + '" stroke-width="3.2" stroke-linecap="round"/>'
      : '<path d="M' + (cx - 8) + ' ' + (cy + 12) + 'q8 7 16 0" fill="none" stroke="' + TINTA + '" stroke-width="3.2" stroke-linecap="round"/>';
    return '<g class="vx-cara">' +
      '<circle cx="' + (cx - 17) + '" cy="' + (cy + 9) + '" r="5" fill="#ff7aa2" opacity=".35"/><circle cx="' + (cx + 17) + '" cy="' + (cy + 9) + '" r="5" fill="#ff7aa2" opacity=".35"/>' +
      '<g class="vx-ojos" style="transform-origin:' + cx + 'px ' + cy + 'px">' +
      '<ellipse cx="' + (cx - 9) + '" cy="' + cy + '" rx="6" ry="7.5" fill="#fff"/><ellipse cx="' + (cx + 9) + '" cy="' + cy + '" rx="6" ry="7.5" fill="#fff"/>' +
      '<g class="vx-pupilas"><circle cx="' + (cx - 8) + '" cy="' + (cy + 1) + '" r="3.6" fill="' + TINTA + '"/><circle cx="' + (cx + 10) + '" cy="' + (cy + 1) + '" r="3.6" fill="' + TINTA + '"/>' +
      '<circle cx="' + (cx - 6.6) + '" cy="' + (cy - 1) + '" r="1.2" fill="#fff"/><circle cx="' + (cx + 11.4) + '" cy="' + (cy - 1) + '" r="1.2" fill="#fff"/></g></g>' +
      boca + '</g>';
  }
  function personaje(b, mood) {
    var c = b.c, d = b.d, l = b.l, s = '', f = [60, 60];
    var base = '<ellipse class="vx-sombra" cx="60" cy="143" rx="36" ry="5" fill="#000" opacity=".16"/>' +
      '<rect x="18" y="122" width="84" height="16" rx="8" fill="' + d + '"/>' +
      '<path d="M28 126C28 102 40 92 60 92s32 10 32 34z" fill="' + c + '"/>';
    var brillo = function (x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 ' + x + ' ' + y + ')"/>'; };
    switch (b.p) {
      case 'peon':
        s = base + '<rect x="40" y="84" width="40" height="11" rx="5.5" fill="' + d + '"/><circle cx="60" cy="56" r="32" fill="' + c + '"/>' + brillo(46, 38);
        f = [60, 56];
        s += '<g class="vx-acc vx-brote"><path d="M60 25c0-6 1-10 4-13" stroke="' + d + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M64 13c6-6 15-5 17-1-6 5-12 5-17 1z" fill="#7be495"/><path d="M62 16c-6-5-13-4-15 0 5 4 10 4 15 0z" fill="#a7f0b9"/></g>';
        break;
      case 'caballo':
        s = base + '<path d="M40 96C34 74 36 50 50 36l4-20 9 12c20 2 34 18 34 36 0 8-6 13-14 10l-10-5c-1 10 3 18 9 27z" fill="' + c + '"/>' +
          '<path d="M52 30l-4-16 9 11z" fill="' + d + '"/>' +
          '<g class="vx-acc vx-crin"><path d="M50 38c-8 4-12 12-13 20 4-4 8-5 11-5-5 6-7 13-6 20 3-5 7-8 11-9-3 6-3 12-1 18" fill="none" stroke="' + d + '" stroke-width="6" stroke-linecap="round"/></g>' +
          '<circle cx="88" cy="66" r="2.6" fill="' + d + '"/>' + brillo(64, 40);
        f = [70, 52];
        break;
      case 'alfil':
        s = base + '<rect x="40" y="84" width="40" height="11" rx="5.5" fill="' + d + '"/>' +
          '<path d="M60 14c22 18 30 42 26 60-2 11-11 16-26 16s-24-5-26-16c-4-18 4-42 26-60z" fill="' + c + '"/><circle cx="60" cy="12" r="7" fill="' + c + '"/>' +
          '<path d="M69 24L57 40" stroke="' + d + '" stroke-width="5" stroke-linecap="round"/>' + brillo(48, 44);
        f = [60, 64];
        break;
      case 'torre':
        s = base + '<rect x="32" y="44" width="56" height="52" rx="7" fill="' + c + '"/>' +
          '<path d="M29 22h15v12h8V22h16v12h8V22h15v26H29z" fill="' + c + '"/>' +
          '<g class="vx-acc vx-casco"><rect x="29" y="40" width="62" height="9" rx="4.5" fill="' + d + '"/></g>' + brillo(42, 58);
        f = [60, 68];
        break;
      case 'dama':
        s = base + '<rect x="40" y="86" width="40" height="10" rx="5" fill="' + d + '"/><circle cx="60" cy="62" r="30" fill="' + c + '"/>' +
          '<g class="vx-acc vx-corona"><path d="M33 42l5-24 12 15 10-21 10 21 12-15 5 24z" fill="' + ORO + '" stroke="' + ORO_D + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<circle cx="38" cy="18" r="4.5" fill="' + ORO + '"/><circle cx="60" cy="11" r="5" fill="' + ORO + '"/><circle cx="82" cy="18" r="4.5" fill="' + ORO + '"/><circle cx="60" cy="34" r="3.4" fill="#ff5fa2"/></g>' +
          '<g class="vx-acc"><circle cx="31" cy="72" r="4" fill="' + ORO + '"/><circle cx="89" cy="72" r="4" fill="' + ORO + '"/></g>' + brillo(46, 46);
        f = [60, 64];
        break;
      default: // rey
        s = base + '<rect x="40" y="86" width="40" height="10" rx="5" fill="' + d + '"/><circle cx="60" cy="62" r="30" fill="' + c + '"/>' +
          '<g class="vx-acc vx-corona"><path d="M34 42l3-17 12 9 11-12 11 12 12-9 3 17z" fill="' + ORO + '" stroke="' + ORO_D + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<rect x="56" y="0" width="8" height="22" rx="2" fill="' + ORO + '" stroke="' + ORO_D + '" stroke-width="1.5"/><rect x="50" y="6" width="20" height="7" rx="2" fill="' + ORO + '" stroke="' + ORO_D + '" stroke-width="1.5"/></g>' + brillo(46, 46);
        f = [60, 62];
    }
    s += cara(f[0], f[1], mood || (b.p === 'rey' || b.p === 'torre' ? 'serio' : 'feliz'));
    if (b.acc === 'gafas') s += '<g class="vx-acc" fill="none" stroke="' + TINTA + '" stroke-width="2.4"><circle cx="' + (f[0] - 9) + '" cy="' + f[1] + '" r="9.5"/><circle cx="' + (f[0] + 9) + '" cy="' + f[1] + '" r="9.5"/></g>';
    if (b.acc === 'bigote') s += '<path class="vx-acc" d="M' + (f[0] - 16) + ' ' + (f[1] + 12) + 'c6-6 12-5 16-1 4-4 10-5 16 1-6 3-11 3-16 0-5 3-10 3-16 0z" fill="' + TINTA + '"/>';
    return '<svg class="vx-pj vx-pj-' + b.p + '" viewBox="0 -6 120 156" aria-hidden="true"><g class="vx-cuerpo">' + s + '</g></svg>';
  }
  window.AA_PERSONAJE = function (i, mood) { return personaje(BOTS[i] || BOTS[0], mood); };

  /* ================= JUGAR: arena y elenco ================= */
  function nivelUsuario() {
    try { var s = JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; return s.placementElo || (s.puzzle && s.puzzle.rating) || 800; } catch (e) { return 800; }
  }
  var arenaSel = -1;
  function jugar() {
    var setup = document.querySelector('.play-setup'); if (!setup) { arenaSel = -1; return; }
    var bots = setup.querySelectorAll('.bots > .bot'); if (!bots.length) return;
    setup.classList.toggle('vx-on', true);
    // personajes en las tarjetas
    bots.forEach(function (bt, i) {
      bt.style.setProperty('--vc', BOTS[i].c); bt.style.setProperty('--vd', BOTS[i].d); bt.style.setProperty('--vl', BOTS[i].l);
      var av = bt.querySelector('.bot-av');
      if (av && !av.querySelector('.vx-pj')) { av.insertAdjacentHTML('beforeend', personaje(BOTS[i])); }
    });
    var sel = Array.prototype.findIndex.call(bots, function (b) { return b.classList.contains('on'); });
    if (sel < 0) sel = 2;
    var arena = setup.querySelector(':scope > .vx-arena');
    if (!arena) {
      arena = document.createElement('section'); arena.className = 'vx-arena'; arena.setAttribute('aria-live', 'polite');
      setup.insertBefore(arena, setup.querySelector('.bots'));
      arenaSel = -1;
    }
    if (sel === arenaSel) return;
    var prev = arenaSel; arenaSel = sel;
    var b = BOTS[sel], yo = nivelUsuario(), pct = Math.round((b.elo - 300) / 1700 * 100);
    var dif = b.elo - yo, txtDif = Math.abs(dif) < 150 ? 'Rival a tu altura' : dif > 0 ? (dif > 500 ? 'Un reto muy duro' : 'Un poco más fuerte que tú') : (dif < -500 ? 'Ideal para calentar' : 'Algo más flojo que tú');
    arena.style.setProperty('--vc', b.c); arena.style.setProperty('--vd', b.d); arena.style.setProperty('--vl', b.l);
    arena.innerHTML =
      '<div class="vx-lado vx-tu"><div class="vx-avatar-tu" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="24" r="12" fill="currentColor"/><path d="M10 58c2-14 11-20 22-20s20 6 22 20z" fill="currentColor"/></svg></div>' +
        '<b>Tú</b><small>Nivel ~' + yo + '</small></div>' +
      '<div class="vx-vs" aria-hidden="true"><span>VS</span></div>' +
      '<div class="vx-lado vx-bot"><div class="vx-pj-w' + (prev >= 0 ? ' vx-entra' : '') + '">' + personaje(b) + '</div>' +
        '<div class="vx-bocadillo">' + b.q + '</div>' +
        '<b>' + b.n + '</b><small>~' + b.elo + ' Elo · ' + txtDif + '</small>' +
        '<div class="vx-medidor" aria-label="Fuerza ' + b.elo + '"><i style="width:' + pct + '%"></i></div></div>';
  }

  /* ================= PARTIDA: el rival reacciona ================= */
  var rivalFirma = '';
  function partida() {
    var pg = document.querySelector('.playgame'); if (!pg) { rivalFirma = ''; return; }
    if (!/^#partida-/.test(location.hash)) { var vx = pg.querySelector('.vx-rival'); if (vx) vx.remove(); pg.classList.remove('vx-on'); rivalFirma = ''; return; }
    var side = pg.querySelector('.pg-side'), av = pg.querySelector('.pg-player .bot-av:not(.you)'); if (!side || !av) return;
    var lv = +((av.className.match(/lv(\d)/) || [])[1] || 0), b = BOTS[lv];
    pg.classList.toggle('vx-on', true); pg.style.setProperty('--vc', b.c); pg.style.setProperty('--vd', b.d); pg.style.setProperty('--vl', b.l);
    if (!av.querySelector('.vx-pj')) av.insertAdjacentHTML('beforeend', personaje(b));
    var yoBlancas = !/-b$/.test(location.hash);
    var lbl = pg.querySelector('.eb-lbl'), txt = lbl ? lbl.textContent.trim() : '0', v = 0;
    if (/^#?-?M|^M/.test(txt)) v = txt.indexOf('-') >= 0 ? -99 : 99; else v = parseFloat(txt.replace(',', '.').replace('−', '-')) || 0;
    if (lbl && lbl.classList.contains('b') && v > 0) v = -v;
    var mio = yoBlancas ? v : -v;
    var turnoBot = !window.AA_TABLERO || !window.AA_TABLERO.el || !window.AA_TABLERO.el.current || !document.contains(window.AA_TABLERO.el.current);
    var over = pg.querySelector('.over'), fin = !!over, res = '';
    if (over) { var ot = over.textContent.toLowerCase(); res = /ganad|victoria/.test(ot) ? 'win' : /perdid|derrota/.test(ot) ? 'loss' : 'draw'; over.classList.toggle('vx-over', true); over.classList.toggle('vx-' + res, true); }
    var mood = fin ? (res === 'win' ? 'preocupado' : res === 'loss' ? 'feliz' : 'normal') : mio > 1.5 ? 'preocupado' : mio < -1.5 ? 'feliz' : (b.p === 'rey' || b.p === 'torre' ? 'serio' : 'normal');
    var frase = fin ? (res === 'win' ? '¡Me has ganado! Pide la revancha cuando quieras.' : res === 'loss' ? '¡Buena partida! Revísala y busca tu revancha.' : 'Tablas. Muy igualado, ¿otra?') : turnoBot ? 'Pensando' : mio > 3 ? '¡Uf! Me estás dando una lección…' : mio > 1.5 ? 'Hmm… esto se complica.' : mio < -3 ? 'Ríndete, no tienes escapatoria.' : mio < -1.5 ? 'Creo que voy ganando.' : 'Tu turno. Te estoy vigilando.';
    var firma = lv + mood + frase;
    var box = side.querySelector(':scope > .vx-rival');
    if (!box) { box = document.createElement('div'); box.className = 'vx-rival'; side.insertBefore(box, side.firstChild); rivalFirma = ''; }
    if (firma === rivalFirma) return; rivalFirma = firma;
    if (res === 'win') setTimeout(function () { confeti(over); }, 150);
    box.innerHTML = '<div class="vx-rival-pj vx-m-' + mood + '">' + personaje(b, mood === 'normal' ? undefined : mood) + '</div>' +
      '<div class="vx-rival-tx"><small>Tu rival · ~' + b.elo + '</small><b>' + b.n + '</b>' +
      '<p class="vx-rival-dice' + (turnoBot && !fin ? ' piensa' : '') + '">' + frase + (turnoBot && !fin ? '<span class="vx-puntos"><i></i><i></i><i></i></span>' : '') + '</p></div>';
  }

  /* ================= PARTIDAS: biblioteca ilustrada ================= */
  var PAL = [['#ff9600', '#c46a00'], ['#2fa8ff', '#1b7fd1'], ['#8b5cf6', '#6a3fd1'], ['#14b8a6', '#0e8a7d'], ['#f0509b', '#c42f76'], ['#2bb45c', '#1d8a44'], ['#ff4b4b', '#c92f2f']];
  function colorDe(txt) { var h = 0; for (var i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) >>> 0; return PAL[h % PAL.length]; }
  var fenCache = {};
  function fenFinal(moves) {
    if (fenCache[moves]) return fenCache[moves];
    var UI = window.AA_UI, ch = new UI.Chess();
    var toks = moves.replace(/\{[^}]*\}/g, ' ').replace(/\d+\.(\.\.)?/g, ' ').replace(/1-0|0-1|1\/2-1\/2|\*/g, ' ').trim().split(/\s+/);
    for (var i = 0; i < toks.length; i++) { if (!toks[i]) continue; var m = null; try { m = ch.parse(toks[i]); } catch (e) {} if (m === null || m === undefined) break; ch.make(m); }
    return (fenCache[moves] = ch.fen());
  }
  function datosPartidas() {
    var U = window.AA_UI || {}, out = [];
    try { (U.msGames || []).forEach(function (g) { out.push({ t: g.title, w: g.white, b: g.black, y: g.year, ev: g.event, mv: g.moves, grupo: 'ms', cap: g.chapter }); }); } catch (e) {}
    try { (U.games || []).forEach(function (g) { out.push({ t: g.title, w: g.white, b: g.black, y: g.year, ev: g.event, mv: g.pgn, grupo: 'clas', cap: (g.concepts || [])[0] || '' }); }); } catch (e) {}
    try { (U.grauGames || []).forEach(function (g) { out.push({ t: g.theme, w: g.white, b: g.black, y: g.year, ev: g.place, mv: g.moves, grupo: 'grau', cap: g.opening }); }); } catch (e) {}
    return out;
  }
  function apellido(n) { n = String(n || '').replace(/\(.*?\)/g, '').trim(); var p = n.split(/\s+y\s+|\s*,\s*/)[0].split(/\s+/); return p[p.length - 1] || n; }
  function inicial(n) { return apellido(n).charAt(0).toUpperCase(); }
  var ioMini = null;
  function pintarMini(el) {
    var U = window.AA_UI; if (!U || !U.createRoot || el.dataset.r) return;
    el.dataset.r = '1';
    try { U.createRoot(el).render(U.React.createElement(U.Board, { fen: el.dataset.fen, coords: false, quiet: true })); } catch (e) {}
  }
  function partidas() {
    var lib = document.querySelector('.library'); if (!lib || !window.AA_UI) return;
    var D = datosPartidas(); if (!D.length) return;
    lib.classList.toggle('vx-on', true);
    var porT = {}; D.forEach(function (d) { porT[d.t] = d; });
    // portada
    if (!lib.querySelector(':scope > .vx-lib-hero')) {
      var ys = D.map(function (d) { return d.y; }).filter(Boolean), y0 = Math.floor(Math.min.apply(null, ys) / 10) * 10, y1 = Math.ceil((Math.max.apply(null, ys) + 1) / 10) * 10;
      var jug = {}; D.forEach(function (d) { jug[apellido(d.w)] = 1; jug[apellido(d.b)] = 1; });
      var hero = document.createElement('section'); hero.className = 'vx-lib-hero';
      hero.innerHTML = '<div class="vx-lib-deco" aria-hidden="true">' + ['torre', 'caballo', 'alfil', 'dama', 'rey', 'alfil', 'caballo', 'torre'].map(function (n) { return window.AA_ICONO ? window.AA_ICONO(n) : ''; }).join('') + '</div>' +
        '<div class="vx-lib-top"><div><small>Biblioteca</small><h1>Partidas inmortales</h1><p>' + y0 + '–' + (y1 - 1) + ': las partidas que enseñaron a jugar a generaciones, comentadas jugada a jugada.</p></div>' +
        '<div class="vx-lib-nums"><span><b>' + D.length + '</b><small>partidas</small></span><span><b>' + Object.keys(jug).length + '</b><small>jugadores</small></span><span><b>' + (y1 - y0) + '</b><small>años de historia</small></span></div></div>';
      lib.insertBefore(hero, lib.firstChild);
    }
    // tarjetas
    if (!ioMini && 'IntersectionObserver' in window) ioMini = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { pintarMini(e.target); ioMini.unobserve(e.target); } }); }, { rootMargin: '300px' });
    lib.querySelectorAll('.game-card:not(.vx-c)').forEach(function (card) {
      var t = (card.querySelector(':scope > b') || {}).textContent, d = porT[t]; if (!d) return;
      card.classList.add('vx-c');
      var col = colorDe(d.cap || d.t);
      card.style.setProperty('--gc', col[0]); card.style.setProperty('--gd', col[1]);
      var fen = ''; try { fen = fenFinal(d.mv || ''); } catch (e) {}
      var top = document.createElement('div'); top.className = 'vx-c-top';
      top.innerHTML = '<div class="vx-mini" data-fen="' + fen + '"></div><div class="vx-c-meta"><b class="vx-c-y">' + (d.y || '') + '</b><small>' + (d.ev || '') + '</small>' +
        '<span class="vx-duelo"><i class="vx-bl" title="' + d.w + '">' + inicial(d.w) + '</i><em>vs</em><i class="vx-ng" title="' + d.b + '">' + inicial(d.b) + '</i></span></div>';
      card.insertBefore(top, card.firstChild);
      var mini = top.querySelector('.vx-mini');
      if (ioMini) ioMini.observe(mini); else pintarMini(mini);
    });
  }

  /* ================= EVALUAR: claves en barras ================= */
  var evFirma = '', confetiFirma = '';
  function evaluar() {
    var ev = document.querySelector('.evaltr'); if (!ev) { evFirma = ''; return; }
    var L = ev.querySelector('.stage-l'), opts = ev.querySelector('.quiz-opts.five'); if (!L || !opts) return;
    ev.classList.toggle('vx-on', true);
    var lbar = ev.querySelector('.lbar'), txt = lbar ? lbar.innerText : '', m = txt.match(/Motor:\s*([+\-−]?\d+(?:[.,]\d+)?|[+\-−]?M\d+)/);
    var respondido = !!opts.querySelector('.quiz-opt:disabled') && !!m;
    var firma = respondido ? m[1] : 'q' + (ev.querySelector('.ev-turn') || {}).className + (ev.querySelector('.lprog i') || { style: {} }).style.cssText;
    if (firma === evFirma) return; evFirma = firma;
    if (!respondido) {
      // gráfico de claves anterior fuera
      var old = L.querySelector('.vx-claves'); if (old) old.remove();
      return;
    }
    // claves como barras
    var tab = L.querySelector('.keys-table table');
    if (tab && !L.querySelector('.vx-claves')) {
      var filas = Array.prototype.map.call(tab.querySelectorAll('tbody tr'), function (tr) { var td = tr.querySelectorAll('td'); return { n: td[0].textContent, v: parseFloat((td[2] || td[1]).textContent.replace('−', '-')) || 0, tot: tr.classList.contains('tot') }; });
      var mx = Math.max(1, Math.max.apply(null, filas.map(function (f) { return Math.abs(f.v); })));
      var html = '<div class="vx-claves" aria-hidden="true"><div class="vx-cl-h"><span>Negras</span><span>Blancas</span></div>' + filas.map(function (f, i) {
        var w = Math.abs(f.v) / mx * 50;
        return '<div class="vx-cl-f' + (f.tot ? ' tot' : '') + '" style="--d:' + (i * 0.07) + 's"><span class="vx-cl-n">' + f.n + '</span><span class="vx-cl-b"><i class="' + (f.v >= 0 ? 'w' : 'n') + '" style="--w:' + w + '%"></i></span><b>' + (f.v > 0 ? '+' : '') + f.v.toFixed(1) + '</b></div>';
      }).join('') + '</div>';
      L.querySelector('.keys-table').insertAdjacentHTML('beforebegin', html);
    }
    // confeti si acierta
    if (lbar && lbar.classList.contains('lbar-ok') && confetiFirma !== firma + txt.length) { confetiFirma = firma + txt.length; confeti(opts.querySelector('.right') || opts); }
  }
  function confeti(cerca) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = cerca.getBoundingClientRect(), cont = document.createElement('div'); cont.className = 'vx-confeti';
    cont.style.left = (r.left + r.width / 2) + 'px'; cont.style.top = (r.top + r.height / 2) + 'px';
    var cols = ['#2bb45c', '#ffcf3f', '#2fa8ff', '#f0509b', '#8b5cf6', '#ff9600'];
    for (var i = 0; i < 34; i++) {
      var p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 130;
      p.style.setProperty('--x', Math.cos(a) * d + 'px'); p.style.setProperty('--y', (Math.sin(a) * d - 60) + 'px'); p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      p.style.background = cols[i % cols.length]; p.style.animationDelay = (Math.random() * 0.12) + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      cont.appendChild(p);
    }
    document.body.appendChild(cont); setTimeout(function () { cont.remove(); }, 1600);
  }

  /* ================= VISOR de partidas: cabecera ================= */
  function visor() {
    var rv = document.querySelector('.review'), head = rv && rv.querySelector('.rv-head'); if (!head || head.classList.contains('vx-rv')) return;
    var t = (head.querySelector('h1') || {}).textContent, D = datosPartidas(), d = null;
    for (var i = 0; i < D.length; i++) if (D[i].t === t) { d = D[i]; break; }
    if (!d) return;
    head.classList.add('vx-rv'); var col = colorDe(d.cap || d.t);
    head.style.setProperty('--gc', col[0]); head.style.setProperty('--gd', col[1]);
    head.insertAdjacentHTML('beforeend', '<div class="vx-rv-meta"><span class="vx-rv-jug"><i class="vx-bl">' + inicial(d.w) + '</i><b>' + apellido(d.w) + '</b></span><em>vs</em>' +
      '<span class="vx-rv-jug"><i class="vx-ng">' + inicial(d.b) + '</i><b>' + apellido(d.b) + '</b></span><span class="vx-rv-y">' + (d.y || '') + '</span></div>');
  }

  /* ================= REVISIÓN: guardar solo si quieres ================= */
  function revision() {
    var m = location.hash.match(/^#revision-(.+)$/), head = document.querySelector('.rv-head');
    var old = document.querySelector('.vx-guardar');
    if (!m || !head) { if (old) old.remove(); return; }
    var st = {}; try { st = JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) {}
    var g = (st.games || []).filter(function (x) { return x.id === m[1]; })[0]; if (!g) return;
    var sub = head.querySelector('p.muted'); if (sub && /^\*\s·\s/.test(sub.textContent)) sub.textContent = sub.textContent.replace(/^\*\s·\s/, '');
    if (g.bot != null) { if (old) old.remove(); return; } // las partidas contra bots ya están en «Tus partidas»
    var estado = g.tmp ? 'tmp' : 'ok';
    if (old && old.dataset.e === estado && old.dataset.id === g.id) return;
    if (old) old.remove();
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn vx-guardar' + (g.tmp ? ' btn-primary' : '');
    b.dataset.e = estado; b.dataset.id = g.id;
    b.innerHTML = '<span>' + (g.tmp ? 'Guardar en mis partidas' : 'Quitar de mis partidas') + '</span>';
    b.addEventListener('click', function () {
      var id = g.id, guardar = !!g.tmp;
      window.AA_UI.update(function (a) {
        if (guardar) a.games.forEach(function (x) { if (x.id === id) delete x.tmp; });
        else a.games.forEach(function (x) { if (x.id === id) x.tmp = true; });
      });
      if (window.AA_TOAST) window.AA_TOAST(guardar ? 'Guardada en «Tus partidas».' : 'Quitada de «Tus partidas».');
    });
    head.appendChild(b);
  }

  /* ================= ANÁLISIS: sin frases repetidas ================= */
  function analisis() {
    document.querySelectorAll('.main .card').forEach(function (c) {
      var t = c.firstElementChild; if (!t || !/^¿Por qué\?/.test(t.textContent)) return;
      Array.prototype.forEach.call(c.querySelectorAll('p, small, div'), function (el) {
        if (/^Ningún factor destaca/.test(el.textContent.trim())) el.style.display = 'none';
      });
    });
  }

  /* ================= Bucle ================= */
  var pend = false;
  function tick() { pend = false; try { jugar(); partida(); partidas(); evaluar(); visor(); revision(); if (/^#analisis/.test(location.hash)) analisis(); } catch (e) { if (window.console) console.warn('vida', e); } }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();
