/* Ajedrez Academy · prueba de nivel (partida contra un bot analizada por el motor) y tour para usuarios nuevos. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var BOT = { level: 2, name: 'Alfil Álex', elo: 1100 }, MAX_MOVES = 25, MIN_MOVES = 8;
  var LEVELS = [ // Elo estimado → nivel de la app y tomos desbloqueados
    { min: 0, id: 'novato', pass: [], t: 'Principiante' },
    { min: 700, id: 'basico', pass: [1], t: 'Básico' },
    { min: 1000, id: 'intermedio', pass: [1, 2], t: 'Intermedio' },
    { min: 1500, id: 'avanzado', pass: [1, 2, 3], t: 'Avanzado' },
    { min: 1900, id: 'avanzado', pass: [1, 2, 3, 4], t: 'Experto' }];
  var TOMOS = ['', 'Rudimentos', 'Táctica', 'Estrategia', 'Finales'];
  function levelFor(elo) { var l = LEVELS[0]; LEVELS.forEach(function (x) { if (elo >= x.min) l = x; }); return l; }
  // Pérdida media en centipeones (ACPL) de las jugadas propias, sin las de teoría; cada jugada se topa en 600
  function acpl(moves) { var mine = moves.filter(function (m) { return m.color === 0 && m.cls !== 'book' && m.cls !== 'forced'; }); if (!mine.length) return 60;
    var sum = 0; mine.forEach(function (m) { var b = Math.max(-1500, Math.min(1500, m.evalBefore)), a = Math.max(-1500, Math.min(1500, m.evalAfter)); sum += Math.min(600, Math.max(0, b - a)); }); return sum / mine.length; }
  function estimate(cpl, result, moves, finalEval) {
    var e = 2500 - 600 * Math.log(Math.max(8, cpl) / 8);           // ACPL 25 ≈ 1800 · 60 ≈ 1300 · 100 ≈ 1000 · 200 ≈ 570
    e += result === 'win' ? 120 : result === 'loss' ? -120 : 0;
    if (finalEval < -500) e -= 150;                                  // terminó muy por debajo
    if (moves < 12) e -= (12 - moves) * 20;                          // partidas muy cortas: menos fiables
    return Math.max(400, Math.min(2200, Math.round(e / 50) * 50)); }
  function go(h) { location.hash = h; window.scrollTo(0, 0); }
  function esSan(s) { var n = 'es'; try { n = (JSON.parse(localStorage.getItem('chess-academy/v1')) || {}).settings.notation || 'es'; } catch (e) {} if (n === 'en') return s;
    var M = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' }; return s.replace(/^([KQRBN])/, function (a, d) { return M[d]; }).replace(/=([QRBN])/, function (a, d) { return '=' + M[d]; }); }

  /* Tarjeta en el inicio (sustituye a «¿Cuál es tu nivel?») */
  window.AA_NIVEL = function () {
    var UI = window.AA_UI, h = UI.React.createElement;
    return h('div', { className: 'level-pick card nv-card' },
      h('div', { className: 'nv-head' }, h(UI.Mascot, { kind: 'caballo', mood: 'point', size: 84 }),
        h('div', null, h('h2', null, 'Descubre tu nivel jugando'),
          h('p', { className: 'muted' }, 'Juega una partida y te decimos tu nivel. Saltarás lo que ya sabes.'))),
      h('div', { className: 'nv-actions' },
        h('button', { className: 'btn btn-primary btn-big', onClick: function () { go('nivel'); } }, h('span', null, 'Jugar la partida de nivel')),
        h('button', { className: 'nv-skip', onClick: function () { UI.update(function (a) { a.level = 'novato'; a.tomoPass = a.tomoPass || []; if (!a.puzzle.solved) a.puzzle.rating = 500; }); } }, 'Aún no sé jugar: empezar desde cero')));
  };

  /* Página de la partida de nivel (#nivel) */
  function Nivel() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var st = R.useState({ fen: UI.START, ucis: [], sans: [], last: null, phase: 'play', thinking: false, result: null, reason: '' }), g = st[0], set = st[1];
    var gRef = R.useRef(g); gRef.current = g;
    function over(c) { var ch = new UI.Chess(c.fen); if (ch.legal().length) return null; return ch.inCheck() ? (ch.turn ? 'win' : 'loss') : 'draw'; }
    function botMove(c) {
      set(Object.assign({}, c, { thinking: true }));
      UI.engine({ type: 'bot', fen: c.fen, level: BOT.level, book: c.fen === UI.START ? UI.book() : undefined }).then(function (r) {
        var cur = gRef.current; if (cur.phase !== 'play') return;
        var ch = new UI.Chess(cur.fen), m = ch.parse(r.move); if (m === null) { set(Object.assign({}, cur, { thinking: false })); return; }
        var san = ch.san(m); ch.make(m); UI.sound(ch.inCheck() ? 'check' : 'move');
        var n = Object.assign({}, cur, { fen: ch.fen(), ucis: cur.ucis.concat(r.move), sans: cur.sans.concat(san), last: r.move, thinking: false });
        var res = over(n); if (res) { finish(n, res, res === 'loss' ? 'te han dado mate' : 'tablas'); return; }
        set(n); }).catch(function () { set(Object.assign({}, gRef.current, { thinking: false })); });
    }
    function onMove(u) {
      if (g.phase !== 'play' || g.thinking) return false;
      var ch = new UI.Chess(g.fen); if (ch.turn) return false; var m = ch.parse(u); if (m === null) return false;
      var san = ch.san(m); ch.make(m); UI.sound(ch.inCheck() ? 'check' : 'move');
      var n = Object.assign({}, g, { fen: ch.fen(), ucis: g.ucis.concat(ch.uci ? u : u), sans: g.sans.concat(san), last: u });
      var res = over(n); if (res) { finish(n, res, res === 'win' ? '¡has dado mate!' : 'tablas'); return true; }
      if (n.ucis.length >= MAX_MOVES * 2) { finish(n, 'draw', 'fin de la partida de nivel'); return true; }
      set(n); setTimeout(function () { botMove(gRef.current); }, 250); return true;
    }
    function finish(c, result, reason) {
      set(Object.assign({}, c, { phase: 'analyze', result: result, reason: reason, pct: 0 }));
      UI.engine({ type: 'review', fen: UI.START, ucis: c.ucis, timeMs: 350, book: UI.book() }, function (p) { if (p && p.type === 'progress') set(function (x) { return Object.assign({}, x, { pct: p.done / p.total }); }); })
        .then(function (r) {
          var acc = UI.accuracy(r.moves, 0).accuracy, moves = Math.ceil(c.ucis.length / 2), cpl = acpl(r.moves), last = r.moves[r.moves.length - 1];
          var elo = estimate(cpl, result, moves, last ? last.evalAfter : 0), lv = levelFor(elo);
          set(Object.assign({}, gRef.current, { phase: 'done', acc: acc, cpl: cpl, elo: elo, lv: lv, moves: moves }));
          UI.sound('correct');
        }).catch(function () { set(Object.assign({}, gRef.current, { phase: 'done', acc: null, elo: 900, lv: levelFor(900), moves: Math.ceil(c.ucis.length / 2) })); });
    }
    function accept() {
      var lv = g.lv, elo = g.elo;
      UI.update(function (a) { a.level = lv.id; a.tomoPass = Array.from(new Set((a.tomoPass || []).concat(lv.pass))); a.placementElo = elo; if (!a.puzzle.solved) a.puzzle.rating = Math.max(400, elo - 100); });
      try { localStorage.removeItem('chess-academy/tour'); } catch (e) {}
      go('inicio');
    }
    var moves = Math.ceil(g.ucis.length / 2);
    if (g.phase === 'done') {
      var unlocked = g.lv.pass.map(function (t) { return 'Tomo ' + ['', 'I', 'II', 'III', 'IV'][t] + ' · ' + TOMOS[t]; });
      return h('div', { className: 'page-retos nv-page' }, h('div', { className: 'nv-result' },
        h(UI.Mascot, { kind: 'caballo', mood: 'happy', size: 110 }),
        h('small', null, 'Tu nivel estimado'),
        h('b', { className: 'nv-elo' }, g.elo, h('span', null, ' Elo')),
        h('span', { className: 'nv-lv' }, g.lv.t),
        h('div', { className: 'nv-stats' },
          h('span', null, h('b', null, g.cpl != null ? Math.round(g.cpl) : '—'), h('small', null, 'pérdida media (centipeones)')),
          h('span', null, h('b', null, g.result === 'win' ? 'Victoria' : g.result === 'loss' ? 'Derrota' : g.result === 'none' ? 'Sin terminar' : 'Tablas'), h('small', null, g.reason)),
          h('span', null, h('b', null, g.moves), h('small', null, 'jugadas'))),
        h('p', null, unlocked.length ? 'Desbloqueamos ' + unlocked.join(', ') + '. Empezarás en el siguiente tomo.' : 'Empezarás desde el principio: el Tomo I te enseña todo lo básico.'),
        h('p', { className: 'muted small' }, 'Es una estimación con una sola partida. Siempre puedes hacer la «Prueba para saltarlo» de cualquier tomo.'),
        h('div', { className: 'row-actions' },
          h('button', { className: 'btn btn-primary btn-big', onClick: accept }, h('span', null, 'Empezar')),
          h('button', { className: 'btn', onClick: function () { set({ fen: UI.START, ucis: [], sans: [], last: null, phase: 'play', thinking: false }); } }, h('span', null, 'Repetir la partida')))));
    }
    return h('div', { className: 'page-retos nv-page' },
      h('div', { className: 'nv-top' }, h('div', null, h('h1', null, 'Partida de nivel'),
        h('p', { className: 'muted' }, 'Juegas con blancas contra ' + BOT.name + ' (' + BOT.elo + '). Juega como en una partida normal: no hay prisa.'))),
      h('div', { className: 'nv-stage' },
        h('div', { className: 'nv-board' }, h(UI.Board, { fen: g.fen, interactive: g.phase === 'play' && !g.thinking, onMove: onMove, lastMove: g.last, orientation: 'w', allowColor: 'w' })),
        h('div', { className: 'nv-side' },
          g.phase === 'analyze'
            ? h('div', { className: 'card nv-box' }, h('b', null, 'Analizando tus jugadas…'), h('div', { className: 'mm-bar nv-bar' }, h('i', { style: { transform: 'scaleX(' + (g.pct || 0) + ')' } })), h('p', { className: 'muted small' }, 'El motor revisa cada jugada para calcular tu precisión.'))
            : h('div', { className: 'card nv-box' },
                h('b', null, g.thinking ? BOT.name + ' está pensando…' : 'Tu turno'),
                h('p', { className: 'muted small' }, 'Jugada ' + Math.max(1, moves) + ' de ' + MAX_MOVES + ' como máximo. Se evalúa al terminar la partida o al llegar a ' + MAX_MOVES + ' jugadas.'),
                h('div', { className: 'nv-moves' }, g.sans.map(function (s, i) { return h('span', { key: i }, i % 2 === 0 ? (i / 2 + 1) + '. ' : '', esSan(s)); })),
                h('button', { className: 'btn', disabled: moves < MIN_MOVES || g.thinking, onClick: function () { finish(g, 'none', 'evaluada antes del final'); } },
                  h('span', null, moves < MIN_MOVES ? 'Evaluar (desde la jugada ' + MIN_MOVES + ')' : 'Terminar y evaluar')),
                h('button', { className: 'nv-skip', onClick: function () { finish(g, 'loss', 'abandono'); } }, 'Rendirse')))));
  }
  PAGES.nivel = Nivel;

  /* ───── Tour para usuarios nuevos ───── */
  var TOUR_KEY = 'chess-academy/tour';
  var STEPS = [
    { sel: null, t: '¡Bienvenido a Ajedrez Academy!', d: 'Te enseño la app en 30 segundos. Puedes saltarlo cuando quieras.' },
    { sel: '.pnode.open', t: 'Tu camino de lecciones', d: 'Cada círculo es una lección de unos 5 minutos. Empieza por la que salta y sigue el camino.' },
    { sel: '.side-col .card-cta.c-green', t: 'Continuar', d: 'Siempre te lleva a la siguiente lección que te toca.' },
    { sel: '.card.quests', t: 'Misiones de hoy', d: 'Tres misiones diarias. Si las completas, abres el cofre: XP extra y un protector de racha.' },
    { sel: '.card.daily-goal', t: 'Racha y meta diaria', d: 'Practica un poco cada día para mantener tu racha. Puedes elegir una meta suave, normal o intensa.' },
    { sel: '.rail .nav.c-red', t: 'Táctica', d: 'Problemas de partidas reales adaptados a tu nivel.' },
    { sel: '.rail .nav.c-orange', alt: '.rail ul li:nth-child(4) .nav', t: 'Aperturas', d: 'Cursos paso a paso, con las trampas para castigar los errores del rival.' },
    { sel: '.aa-nav-lb', t: 'Clasificación y retos', d: 'Compite cada semana y prueba el reto de Memoria relámpago.' },
    { sel: '#aa-chip', t: 'Tu cuenta', d: 'Tu progreso se guarda solo. Desde aquí cierras sesión; los ajustes están en la barra.' }];
  var tourEl = null, idx = 0;
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function stepsNow() { return STEPS.filter(function (s) { if (!s.sel) return true; var el = document.querySelector(s.sel) || (s.alt && document.querySelector(s.alt)); return visible(el); }); }
  function endTour() { try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {} if (tourEl) { tourEl.remove(); tourEl = null; } removeEventListener('resize', place); }
  function place() {
    if (!tourEl) return; var steps = tourEl._steps, s = steps[idx], spot = tourEl.querySelector('.tr-spot'), card = tourEl.querySelector('.tr-card');
    card.querySelector('.tr-t').textContent = s.t; card.querySelector('.tr-d').textContent = s.d;
    card.querySelector('.tr-n').textContent = (idx + 1) + ' / ' + steps.length;
    card.querySelector('.tr-next').textContent = idx === 0 ? 'Empezar el tour' : idx === steps.length - 1 ? '¡Listo!' : 'Siguiente';
    var el = s.sel ? (document.querySelector(s.sel) || (s.alt && document.querySelector(s.alt))) : null;
    if (!el) { spot.style.cssText = 'left:50%;top:45%;width:0;height:0'; card.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%)'; card.classList.add('center'); return; }
    card.classList.remove('center');
    el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    var r = el.getBoundingClientRect(), pad = 8;
    spot.style.cssText = 'left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
    var cw = Math.min(320, innerWidth - 24), below = r.bottom + 16 + 170 < innerHeight, right = r.right + 16 + cw < innerWidth && r.width < innerWidth * .35;
    var left = right ? r.right + 16 : Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2));
    var top = right ? Math.max(12, Math.min(innerHeight - 190, r.top)) : below ? r.bottom + 16 : Math.max(12, r.top - 16 - 170);
    card.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + cw + 'px';
  }
  function startTour() {
    if (tourEl) return; var steps = stepsNow(); if (steps.length < 2) return; idx = 0;
    tourEl = document.createElement('div'); tourEl.className = 'aa-tour'; tourEl._steps = steps;
    tourEl.innerHTML = '<div class="tr-spot"></div><div class="tr-card" role="dialog" aria-live="polite"><span class="tr-n"></span><b class="tr-t"></b><p class="tr-d"></p>' +
      '<div class="tr-btns"><button type="button" class="tr-skip">Saltar</button><button type="button" class="tr-next btn btn-primary"></button></div></div>';
    document.body.appendChild(tourEl);
    tourEl.querySelector('.tr-skip').onclick = endTour;
    tourEl.querySelector('.tr-next').onclick = function () { if (idx >= steps.length - 1) { endTour(); return; } idx++; place(); };
    addEventListener('resize', place); place();
  }
  window.AA_TOUR = function () { try { localStorage.removeItem(TOUR_KEY); } catch (e) {} if (location.hash !== '#inicio') go('inicio'); setTimeout(startTour, 700); };
  function maybeTour() {
    var done = false; try { done = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) {}
    if (done || tourEl || (location.hash && location.hash !== '#inicio')) return;
    if (document.documentElement.classList.contains('aa-lock') || document.getElementById('aa-login')) return;
    var s; try { s = JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) { s = {}; }
    if (!s.level || !document.querySelector('.pnode.open')) return;
    setTimeout(startTour, 600);
  }
  setInterval(maybeTour, 1500);

  // «Ver el tour otra vez» en Ajustes
  new MutationObserver(function () {
    var d = document.querySelector('.progress > details.settings'); if (!d || d.querySelector('.nv-tour-btn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn nv-tour-btn'; b.innerHTML = '<span>Ver el tour de la app otra vez</span>';
    b.onclick = function () { window.AA_TOUR(); }; d.appendChild(b);
    var b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'btn nv-tour-btn'; b2.innerHTML = '<span>Repetir la prueba de nivel</span>';
    b2.onclick = function () { go('nivel'); }; d.appendChild(b2);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
