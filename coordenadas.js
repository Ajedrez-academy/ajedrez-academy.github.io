/* Ajedrez Academy · Entrenador de coordenadas (#coordenadas).
   30 segundos para tocar todas las casillas que puedas, con blancas o negras abajo. Guarda el récord. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var KEY = 'aa-coords', DUR = 30;
  var F = 'abcdefgh';
  function leer() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function azar(prev) { var s; do { s = F[Math.floor(Math.random() * 8)] + (1 + Math.floor(Math.random() * 8)); } while (s === prev); return s; }

  function Coordenadas() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var st = R.useState({ fase: 'inicio', lado: 'w', ladoSel: 'w', obj: 'e4', pts: 0, fallos: 0, fin: 0, flash: null, nuevo: false, conCoords: false }), g = st[0], set = st[1];
    var gRef = R.useRef(g); gRef.current = g;
    var reloj = R.useState(0), resta = reloj[0], setResta = reloj[1];
    var rec = leer();
    R.useEffect(function () {
      if (g.fase !== 'jugando') return;
      var t = setInterval(function () {
        var r = Math.max(0, Math.ceil((gRef.current.fin - Date.now()) / 1000)); setResta(r);
        if (r <= 0) { clearInterval(t); terminar(); }
      }, 200);
      return function () { clearInterval(t); };
    }, [g.fase]);
    R.useEffect(function () { // teclado: Espacio/Enter para empezar
      function k(e) { if ((e.key === 'Enter' || e.key === ' ') && gRef.current.fase !== 'jugando' && !/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) { e.preventDefault(); empezar(); } }
      document.addEventListener('keydown', k); return function () { document.removeEventListener('keydown', k); };
    }, []);
    function empezar() {
      var c = gRef.current, lado = c.ladoSel === 'r' ? (Math.random() < .5 ? 'w' : 'b') : c.ladoSel;
      set(Object.assign({}, c, { fase: 'jugando', lado: lado, obj: azar(), pts: 0, fallos: 0, fin: Date.now() + DUR * 1000, flash: null, nuevo: false }));
      setResta(DUR);
    }
    function terminar() {
      var c = gRef.current, o = leer(), k = c.lado, best = o[k] || 0, nuevo = c.pts > best;
      if (nuevo) o[k] = c.pts;
      o.partidas = (o.partidas || 0) + 1; guardar(o);
      if (c.pts > 0) try { UI.xp(Math.min(15, Math.round(c.pts / 2))); } catch (e) {}
      UI.sound(nuevo ? 'complete' : 'correct');
      set(Object.assign({}, c, { fase: 'fin', nuevo: nuevo, flash: null }));
    }
    function tocar(sq) {
      var c = gRef.current; if (c.fase !== 'jugando') return;
      if (sq === c.obj) { UI.sound('move'); set(Object.assign({}, c, { pts: c.pts + 1, obj: azar(c.obj), flash: { sq: sq, ok: true, t: Date.now() } })); }
      else { UI.sound('wrong'); set(Object.assign({}, c, { fallos: c.fallos + 1, flash: { sq: sq, ok: false, t: Date.now() } })); }
    }
    // tablero SVG propio (más rápido que el del motor y sin piezas)
    var cas = [];
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
      var f = g.lado === 'w' ? x : 7 - x, r = g.lado === 'w' ? 8 - y : y + 1, sq = F[f] + r, claro = (f + r) % 2 === 1;
      var fl = g.flash && g.flash.sq === sq ? (g.flash.ok ? ' ok' : ' ko') : '';
      cas.push(h('rect', { key: sq, x: x * 100, y: y * 100, width: 100, height: 100, className: (claro ? 'sq-l' : 'sq-d') + ' co-sq' + fl, 'data-sq': sq }));
      if (g.conCoords || g.fase === 'fin') {
        if (y === 7) cas.push(h('text', { key: 't' + sq, x: x * 100 + 92, y: 792, textAnchor: 'end', className: 'co-lbl' }, F[f]));
        if (x === 0) cas.push(h('text', { key: 'n' + sq, x: 6, y: y * 100 + 22, className: 'co-lbl' }, r));
      }
    }
    function clic(e) {
      var el = e.target.closest && e.target.closest('[data-sq]'); if (el) tocar(el.getAttribute('data-sq'));
    }
    var ladoTxt = { w: 'Blancas abajo', b: 'Negras abajo', r: 'Al azar' };
    var pct = g.fase === 'jugando' ? resta / DUR : 0;
    return h('div', { className: 'page-retos co-page' },
      h('div', { className: 'co-top' },
        h('div', null, h('h1', null, 'Coordenadas'),
          h('p', { className: 'muted' }, 'Toca la casilla que se pide. Tienes ' + DUR + ' segundos. Leer el tablero rápido es la base para seguir partidas, libros y lecciones.'))),
      h('div', { className: 'nv-stage co-stage' },
        h('div', { className: 'co-board-w' },
          h('div', { className: 'co-board' + (g.fase === 'jugando' ? ' activo' : '') },
            h('svg', { viewBox: '0 0 800 800', className: 'co-svg', onPointerDown: clic, role: 'grid', 'aria-label': 'Tablero de coordenadas' }, cas),
            g.fase === 'jugando' ? h('div', { className: 'co-obj', 'aria-live': 'polite' }, g.obj)
              : h('div', { className: 'co-play' }, h('button', { className: 'btn btn-primary btn-big', onClick: empezar },
                  h('span', null, g.fase === 'fin' ? g.pts + ' aciertos · Otra vez' : 'Empezar (' + DUR + ' s)')))),
          h('div', { className: 'co-timer', 'aria-hidden': 'true' }, h('i', { style: { transform: 'scaleX(' + pct + ')' } }))),
        h('div', { className: 'nv-side' },
          g.fase === 'jugando'
            ? h('div', { className: 'card nv-box co-marcador' },
                h('div', { className: 'co-nums' },
                  h('span', null, h('b', null, g.pts), h('small', null, 'aciertos')),
                  h('span', null, h('b', null, resta), h('small', null, 'segundos')),
                  h('span', null, h('b', null, g.fallos), h('small', null, 'fallos'))),
                h('p', { className: 'muted small' }, 'Busca la ', h('b', null, g.obj), '. ', g.lado === 'w' ? 'Las blancas están abajo.' : 'Las negras están abajo: la columna «a» queda a la derecha.'))
            : h('div', { className: 'card nv-box' },
                g.fase === 'fin'
                  ? h(R.Fragment, null,
                      h('b', { className: 'co-res' }, g.pts, h('small', null, ' aciertos')),
                      h('p', { className: 'muted small' }, (g.nuevo ? '¡Nuevo récord! ' : 'Récord: ' + (rec[g.lado] || g.pts) + '. ') + (g.fallos ? g.fallos + (g.fallos === 1 ? ' fallo.' : ' fallos.') : 'Sin fallos.') + (g.pts ? ' +' + Math.min(15, Math.round(g.pts / 2)) + ' XP.' : '')))
                  : h('p', { className: 'muted small' }, 'Elige qué color quieres abajo y pulsa empezar. Consejo: piensa primero en la columna (letra) y luego en la fila (número).'),
                h('div', { className: 'seg co-seg', role: 'radiogroup', 'aria-label': 'Color abajo' },
                  ['w', 'b', 'r'].map(function (k) { return h('button', { key: k, role: 'radio', 'aria-checked': g.ladoSel === k, className: g.ladoSel === k ? 'on' : '', onClick: function () { set(Object.assign({}, g, { ladoSel: k })); } }, ladoTxt[k]); })),
                h('label', { className: 'co-check' }, h('input', { type: 'checkbox', checked: g.conCoords, onChange: function (e) { set(Object.assign({}, g, { conCoords: e.target.checked })); } }), ' Mostrar letras y números (modo práctica)'),
                h('button', { className: 'btn btn-primary btn-big', onClick: empezar }, h('span', null, g.fase === 'fin' ? 'Otra vez' : 'Empezar')),
                h('div', { className: 'co-recs' },
                  h('span', null, h('small', null, 'Récord con blancas'), h('b', null, rec.w || 0)),
                  h('span', null, h('small', null, 'Récord con negras'), h('b', null, rec.b || 0)))))));
  }
  PAGES.coordenadas = Coordenadas;
})();
