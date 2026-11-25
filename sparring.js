/* Aperturas vivas:
   1) «Juega la apertura» (#juega-<familia>): un rival te plantea las variantes del curso. Si se sale de la teoría
      o te sales tú, el motor juzga cada jugada y explica por qué. Al final, resumen con lo que has aprendido.
   2) Fallo explicado: cuando fallas una jugada en el curso, el repaso o las tarjetas, el motor dice si tu jugada
      también vale, si es una imprecisión o un error, y qué haría el rival. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var EN2ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
  function es(san) { return (san || '').replace(/^([KQRBN])/, function (a, d) { return EN2ES[d]; }).replace(/=([QRBN])/, function (a, d) { return '=' + EN2ES[d]; }); }
  function ic(n) { return window.AA_ICONO ? window.AA_ICONO(n) : ''; }
  function UI() { return window.AA_UI; }
  function nro(ply) { return Math.floor(ply / 2) + 1 + (ply % 2 ? '...' : '.'); }
  function pawns(cp) { if (Math.abs(cp) >= 90000) return cp > 0 ? 'mate' : '-mate'; var v = cp / 100; return (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ','); }
  function sanDe(fen, uci) { try { var c = new (UI().Chess)(fen), m = c.parse(uci); return m === null ? uci : c.san(m); } catch (e) { return uci; } }
  function tras(fen, uci) { var c = new (UI().Chess)(fen), m = c.parse(uci); if (m === null) return null; c.make(m); return c.fen(); }
  function explica(fen, uci) { try { return UI().explain(fen, uci) || ''; } catch (e) { return ''; } }
  function buscar(fen, ms) { return UI().engine({ type: 'search', fen: fen, timeMs: ms || 700, multi: 1 }).then(function (r) { return (r && r.lines && r.lines[0]) || null; }); }
  // pérdida de la jugada (en centipeones, desde el bando que juega). Devuelve también la mejor jugada y la respuesta del rival.
  function juzgar(fen, uci, side) {
    var after = tras(fen, uci); if (!after) return Promise.resolve(null);
    var sg = side === 'w' ? 1 : -1;
    return Promise.all([buscar(fen, 800), buscar(after, 800)]).then(function (r) {
      var antes = r[0], despues = r[1]; if (!antes || !despues) return null;
      var perdida = Math.max(0, (antes.score - despues.score) * sg);
      return { perdida: perdida, evalTras: despues.score * sg, mejor: antes.move, mejorSan: antes.san, resp: despues.move, respSan: despues.san, after: after };
    }).catch(function () { return null; });
  }
  function nivelDe(p) { return p <= 35 ? 'buena' : p <= 110 ? 'imprecision' : 'error'; }

  /* ---------- líneas de cada familia, en UCI ---------- */
  var cacheArbol = {};
  function arbol(fam) {
    if (cacheArbol[fam]) return cacheArbol[fam];
    var C = UI().Chess, out = [];
    (UI().lines || []).forEach(function (l) {
      if (l.family !== fam) return;
      var c = new C(), u = [];
      var sans = l.moves.split(' ');
      for (var i = 0; i < sans.length; i++) { var m = c.parse(sans[i]); if (m === null) break; u.push(c.uci(m)); c.make(m); }
      out.push({ ucis: u, kind: l.kind, name: l.name, peso: l.kind === 'teoría' ? 3 : l.kind === 'plan' ? 2 : 1 });
    });
    return (cacheArbol[fam] = out);
  }
  function prefijo(a, b) { if (a.length > b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function siguientes(fam, ucis) {
    var m = {};
    arbol(fam).forEach(function (l) {
      if (l.ucis.length <= ucis.length || !prefijo(ucis, l.ucis)) return;
      var u = l.ucis[ucis.length]; m[u] = m[u] || { uci: u, peso: 0, kinds: {}, name: l.name }; m[u].peso += l.peso; m[u].kinds[l.kind] = 1;
      if (l.kind === 'teoría') m[u].name = l.name;
    });
    return Object.keys(m).map(function (k) { return m[k]; });
  }
  function sortear(ops) { var t = ops.reduce(function (a, o) { return a + o.peso; }, 0), r = Math.random() * t; for (var i = 0; i < ops.length; i++) { r -= ops[i].peso; if (r <= 0) return ops[i]; } return ops[0]; }

  /* ---------- registro (mejor puntuación por apertura) ---------- */
  var KR = 'aa-sparring';
  function registro() { try { return JSON.parse(localStorage.getItem(KR) || '{}') || {}; } catch (e) { return {}; } }
  function guardar(fam, pts) { try { var r = registro(), x = r[fam] || { best: 0, n: 0 }; x.n++; x.best = Math.max(x.best, pts); r[fam] = x; localStorage.setItem(KR, JSON.stringify(r)); } catch (e) {} }

  var NIVELES = [{ k: 1, t: 'Suave', d: '~800' }, { k: 2, t: 'Medio', d: '~1100' }, { k: 3, t: 'Firme', d: '~1400' }, { k: 4, t: 'Duro', d: '~1700' }];
  var FUERA_MAX = 7; // jugadas tuyas fuera de la teoría antes de terminar

  /* ---------- página «Juega la apertura» ---------- */
  function Sparring(props) {
    var U = UI(), R = U.React, h = R.createElement, fam = props.fam;
    var op = (U.openings || []).filter(function (o) { return o.id === fam; })[0];
    var side = op ? op.side : 'w';
    var S = R.useState;
    var st = S({ fase: 'prep', nivel: +(localStorage.getItem('aa-sparring-nivel') || 2), ayuda: true }), g = st[0], setG = st[1];
    var ref = R.useRef(g); ref.current = g;
    function set(p) { var n = Object.assign({}, ref.current, p); ref.current = n; setG(n); }

    function empezar() {
      try { localStorage.setItem('aa-sparring-nivel', String(ref.current.nivel)); } catch (e) {}
      var c = new U.Chess();
      set({ fase: 'juego', fen: c.fen(), ucis: [], sans: [], log: [], pts: 0, combo: 0, mejorCombo: 0, enLibro: true, fuera: 0, pensando: false, aviso: null, pista: null, deshacer: null, finEval: null, rivalErr: false });
      if (side === 'b') setTimeout(turnoRival, 500);
    }
    function añadir(entrada, extra) {
      var c = ref.current; set(Object.assign({ log: c.log.concat([entrada]) }, extra || {}));
    }
    function jugar(uci, quien, extra) {
      var c = ref.current, ch = new U.Chess(c.fen), m = ch.parse(uci); if (m === null) return false;
      var san = ch.san(m); ch.make(m);
      U.sound(ch.inCheck() ? 'check' : 'move');
      set(Object.assign({ fen: ch.fen(), ucis: c.ucis.concat([uci]), sans: c.sans.concat([san]), last: uci, pista: null }, extra || {}));
      return san;
    }
    function terminado(fen) { var ch = new U.Chess(fen); return ch.legal().length === 0; }
    function turnoRival() {
      var c = ref.current; if (c.fase !== 'juego') return;
      if (terminado(c.fen)) { cerrar(); return; }
      var ops = c.enLibro ? siguientes(fam, c.ucis) : [];
      if (ops.length) {
        var o = sortear(ops), antes = c.fen, ply = c.ucis.length;
        var trampa = !o.kinds['teoría'] && !o.kinds.plan; // sólo aparece en «castiga sus errores»
        setTimeout(function () {
          var san = jugar(o.uci, 'rival');
          añadir({ ply: ply, san: san, quien: 'rival', tipo: trampa ? 'trampa' : 'libro', nota: trampa ? 'Se sale de la teoría con un error típico. ¿Cómo lo castigas?' : explica(antes, o.uci), linea: o.name }, { rivalErr: trampa });
        }, 420);
        return;
      }
      set({ pensando: true, enLibro: false });
      var antes = c.fen, ply = c.ucis.length;
      U.engine({ type: 'bot', fen: c.fen, level: c.nivel }).then(function (r) {
        var cur = ref.current; if (cur.fase !== 'juego' || cur.fen !== antes) return;
        var san = jugar(r.move, 'rival', { pensando: false });
        añadir({ ply: ply, san: san, quien: 'rival', tipo: 'bot', nota: explica(antes, r.move) });
      }).catch(function () { set({ pensando: false }); });
    }
    function miJugada(uci) {
      var c = ref.current; if (c.fase !== 'juego' || c.pensando) return;
      var antes = c.fen, ply = c.ucis.length, ucisAntes = c.ucis;
      var ops = c.enLibro ? siguientes(fam, c.ucis) : [];
      var libro = ops.filter(function (o) { return o.uci === uci; })[0];
      if (libro) {
        var san = jugar(uci, 'yo');
        var combo = c.combo + 1, pts = c.pts + 10 + Math.min(10, combo * 2);
        añadir({ ply: ply, san: san, quien: 'yo', tipo: 'teoria', nota: explica(antes, uci), linea: libro.name }, { combo: combo, mejorCombo: Math.max(c.mejorCombo, combo), pts: pts, aviso: { tipo: 'teoria', txt: 'Teoría' + (combo > 1 ? ' · racha x' + combo : '') }, rivalErr: false });
        setTimeout(turnoRival, 350);
        return;
      }
      // fuera de la teoría: el motor juzga
      var teoria = ops.filter(function (o) { return o.kinds['teoría'] || o.kinds.plan; })[0] || ops[0];
      var san2 = jugar(uci, 'yo', { pensando: true, enLibro: false });
      juzgar(antes, uci, side).then(function (j) {
        var cur = ref.current; if (cur.fase !== 'juego') return;
        var tipo = j ? nivelDe(j.perdida) : 'buena';
        if (cur.rivalErr && j && j.perdida <= 35) tipo = 'castigo';
        var gana = tipo === 'castigo' ? 25 : tipo === 'buena' ? 6 : tipo === 'imprecision' ? 2 : 0;
        var combo = tipo === 'buena' || tipo === 'castigo' ? cur.combo + 1 : 0;
        var nota;
        if (!j) nota = 'Sin análisis disponible ahora mismo.';
        else if (tipo === 'castigo') nota = '¡Bien visto! Aprovechas el error del rival. ' + explica(antes, uci);
        else if (tipo === 'buena') nota = (teoria ? 'No es la jugada del curso, pero es buena (' + pawns(j.evalTras) + '). ' : 'Buena jugada (' + pawns(j.evalTras) + '). ') + explica(antes, uci);
        else nota = (tipo === 'error' ? 'Error: ' : 'Imprecisión: ') + 'tras ' + es(san2) + ' el rival puede jugar ' + es(j.respSan) + '. ' + explica(j.after, j.resp) + ' Mejor era ' + es(j.mejorSan) + ': ' + explica(antes, j.mejor);
        if (teoria && j && tipo !== 'buena' && tipo !== 'castigo') nota += ' (La teoría sigue con ' + es(sanDe(antes, teoria.uci)) + '.)';
        var fuera = cur.fuera + 1;
        añadir({ ply: ply, san: san2, quien: 'yo', tipo: tipo, nota: nota, mejor: j && j.mejor, antes: antes }, {
          pensando: false, combo: combo, mejorCombo: Math.max(cur.mejorCombo, combo), pts: cur.pts + gana, fuera: fuera, rivalErr: false,
          aviso: { tipo: tipo, txt: tipo === 'castigo' ? '¡Castigado!' : tipo === 'buena' ? 'Buena jugada propia' : tipo === 'imprecision' ? 'Imprecisión' : 'Error' },
          deshacer: tipo === 'error' ? { fen: antes, ucis: ucisAntes, sans: cur.sans.slice(0, ply), log: cur.log.slice(), enLibro: c.enLibro, combo: c.combo } : null
        });
        if (tipo === 'error' && cur.ayuda) return; // espera a que decida: deshacer o seguir
        if (fuera >= FUERA_MAX) { cerrar(); return; }
        setTimeout(turnoRival, 300);
      });
    }
    function deshacer() {
      var c = ref.current, d = c.deshacer; if (!d) return;
      set({ fen: d.fen, ucis: d.ucis, sans: d.sans, log: d.log.concat([{ ply: d.ucis.length, quien: 'yo', tipo: 'nota', nota: 'Deshecha. Prueba otra jugada.' }]), deshacer: null, aviso: null, last: d.ucis[d.ucis.length - 1], fuera: Math.max(0, c.fuera - 1), enLibro: d.enLibro, pts: Math.max(0, c.pts - 3) });
    }
    function seguir() { var c = ref.current; set({ deshacer: null }); if (c.fuera >= FUERA_MAX) cerrar(); else setTimeout(turnoRival, 200); }
    function pedirPista() {
      var c = ref.current, ops = c.enLibro ? siguientes(fam, c.ucis).filter(function (o) { return o.kinds['teoría'] || o.kinds.plan; }) : [];
      if (ops.length) { var o = ops.sort(function (a, b) { return b.peso - a.peso; })[0]; set({ pista: { uci: o.uci, txt: es(sanDe(c.fen, o.uci)) + ': ' + explica(c.fen, o.uci) }, pts: Math.max(0, c.pts - 5), combo: 0 }); return; }
      set({ pensando: true });
      buscar(c.fen, 900).then(function (b) { var cur = ref.current; if (!b) { set({ pensando: false }); return; } set({ pensando: false, pista: { uci: b.move, txt: es(b.san) + ': ' + explica(cur.fen, b.move) }, pts: Math.max(0, cur.pts - 5), combo: 0 }); });
    }
    function cerrar() {
      var c = ref.current; if (c.fase === 'fin') return;
      set({ fase: 'fin', pensando: false });
      buscar(c.fen, 1200).then(function (b) { var cur = ref.current; set({ finEval: b ? b.score * (side === 'w' ? 1 : -1) : 0 }); });
      guardar(fam, c.pts); try { U.xp(Math.max(5, Math.round(c.pts / 6))); } catch (e) {}
      U.sound('complete');
    }

    // ---- vistas ----
    var nombre = op ? op.name : fam;
    var cab = h('div', { className: 'sp-cab' },
      h('button', { className: 'hero-back', 'aria-label': 'Volver al curso', onClick: function () { U.go('curso-' + fam); } }, h('span', { dangerouslySetInnerHTML: { __html: ic('volver') || '&#8249;' } })),
      h('div', null, h('h1', null, 'Juega la apertura'), h('p', { className: 'muted' }, nombre + ' · con ' + (side === 'w' ? 'blancas' : 'negras'))));

    if (g.fase === 'prep') {
      var rec = registro()[fam];
      return h('div', { className: 'sp' }, cab,
        h('div', { className: 'sp-prep' },
          h('div', { className: 'sp-prep-tx' },
            h('ol', { className: 'sp-pasos' },
              h('li', null, h('b', null, 'El rival te plantea las variantes del curso.'), ' A veces la principal, a veces otra, y a veces comete un error típico que debes castigar.'),
              h('li', null, h('b', null, 'Cuando alguien se sale de la teoría, decides tú.'), ' El motor juzga cada jugada y te explica por qué es buena o mala.'),
              h('li', null, h('b', null, 'Suma puntos y rachas.'), ' Teoría, buenas jugadas propias y castigos dan puntos; las pistas cuestan.')),
            h('div', { className: 'sp-op' }, h('span', null, 'Fuerza del rival fuera del libro'),
              h('div', { className: 'sp-niv' }, NIVELES.map(function (n) { return h('button', { key: n.k, className: g.nivel === n.k ? 'on' : '', onClick: function () { set({ nivel: n.k }); } }, h('b', null, n.t), h('small', null, n.d)); }))),
            h('label', { className: 'sp-chk' }, h('input', { type: 'checkbox', checked: g.ayuda, onChange: function (e) { set({ ayuda: e.target.checked }); } }), ' Si cometo un error, dejarme deshacerlo'),
            h('button', { className: 'btn btn-primary btn-big sp-go', onClick: empezar }, h('span', null, 'Empezar')),
            rec ? h('p', { className: 'small muted' }, 'Tu mejor marca: ' + rec.best + ' puntos en ' + rec.n + (rec.n === 1 ? ' partida' : ' partidas') + '.') : null),
          h('div', { className: 'sp-prep-b' }, h(U.Board, { fen: new U.Chess().fen(), orientation: side, interactive: false }))));
    }

    var tuTurno = g.fase === 'juego' && !g.pensando && !g.deshacer && ((g.ucis.length % 2 === 0) === (side === 'w'));
    var flechas = [];
    if (g.pista) flechas.push({ from: g.pista.uci.slice(0, 2), to: g.pista.uci.slice(2, 4), color: 'g' });
    var ult = g.log[g.log.length - 1];
    if (g.deshacer && ult && ult.mejor) flechas.push({ from: ult.mejor.slice(0, 2), to: ult.mejor.slice(2, 4), color: 'g' });

    var feed = h('div', { className: 'sp-feed' }, g.log.slice().reverse().slice(0, 8).map(function (e, i) {
      return h('div', { key: g.log.length - i, className: 'sp-it t-' + e.tipo + (e.quien === 'rival' ? ' rival' : '') },
        e.san ? h('b', null, nro(e.ply) + ' ' + es(e.san)) : null,
        h('span', { className: 'sp-tag' }, ({ teoria: 'Teoría', libro: 'Teoría del rival', trampa: 'Error típico', bot: 'Rival', buena: 'Buena', imprecision: 'Imprecisión', error: 'Error', castigo: 'Castigo', nota: '' })[e.tipo]),
        e.nota ? h('p', null, e.nota) : null);
    }));

    if (g.fase === 'fin') {
      var mias = g.log.filter(function (e) { return e.quien === 'yo' && e.tipo !== 'nota'; });
      var n = function (t) { return mias.filter(function (e) { return e.tipo === t; }).length; };
      var planes = (U.plans && U.plans[fam] && U.plans[fam][side]) || [];
      var ev = g.finEval;
      return h('div', { className: 'sp' }, cab,
        h('div', { className: 'sp-fin' },
          h('div', { className: 'sp-fin-l' },
            h('div', { className: 'sp-pts' }, h('b', null, g.pts), h('span', null, 'puntos')),
            h('div', { className: 'sp-cifras' },
              h('div', null, h('b', null, n('teoria')), h('small', null, 'de teoría')),
              h('div', null, h('b', null, n('buena') + n('castigo')), h('small', null, 'buenas propias')),
              h('div', null, h('b', null, n('imprecision')), h('small', null, 'imprecisiones')),
              h('div', null, h('b', null, n('error')), h('small', null, 'errores')),
              h('div', null, h('b', null, 'x' + g.mejorCombo), h('small', null, 'mejor racha'))),
            h('div', { className: 'sp-eval' }, h('span', null, 'Posición final'),
              ev === null || ev === undefined ? h('i', null, 'calculando…') : h('b', { className: ev > 60 ? 'bien' : ev < -60 ? 'mal' : '' }, pawns(ev) + (ev > 60 ? ' · estás mejor' : ev < -60 ? ' · estás peor' : ' · igualado'))),
            planes.length ? h('div', { className: 'line-idea k-teoría' }, h('b', null, '¿Y ahora qué? Planes para ' + (side === 'w' ? 'blancas' : 'negras')), h('ul', null, planes.slice(0, 3).map(function (t, i) { return h('li', { key: i }, t); }))) : null,
            h('div', { className: 'sp-bts' },
              h('button', { className: 'btn btn-primary btn-big', onClick: empezar }, h('span', null, 'Otra partida')),
              h('button', { className: 'btn btn-ghost', onClick: function () { U.go('curso-' + fam); } }, h('span', null, 'Volver al curso')))),
          h('div', { className: 'sp-fin-r' }, h(U.Board, { fen: g.fen, orientation: side, interactive: false, lastMove: g.last }), h('p', { className: 'small muted sp-jug' }, g.sans.map(function (s, i) { return (i % 2 === 0 ? (i / 2 + 1) + '.' : '') + es(s); }).join(' ')))),
        h('h2', { className: 'h-sub' }, 'Repaso de la partida'), h('div', { className: 'sp-feed largo' }, g.log.map(function (e, i) {
          return h('div', { key: i, className: 'sp-it t-' + e.tipo + (e.quien === 'rival' ? ' rival' : '') }, e.san ? h('b', null, nro(e.ply) + ' ' + es(e.san)) : null, h('span', { className: 'sp-tag' }, ({ teoria: 'Teoría', libro: 'Teoría del rival', trampa: 'Error típico', bot: 'Rival', buena: 'Buena', imprecision: 'Imprecisión', error: 'Error', castigo: 'Castigo', nota: '' })[e.tipo]), e.nota ? h('p', null, e.nota) : null);
        })));
    }

    var estado = g.pensando ? 'Pensando…' : g.deshacer ? 'Has cometido un error. ¿Lo deshaces?' : tuTurno ? (g.rivalErr ? 'El rival se ha equivocado. Encuentra el castigo.' : g.enLibro ? 'Tu jugada. Sigue la teoría si la recuerdas.' : 'Fuera de la teoría: piensa un plan.') : 'Juega el rival…';
    return h('div', { className: 'sp' }, cab,
      h('div', { className: 'sp-juego' },
        h('div', { className: 'sp-b' + (g.aviso ? ' pulso-' + g.aviso.tipo : '') }, h(U.Board, { fen: g.fen, orientation: side, interactive: tuTurno, allowColor: side, onMove: miJugada, lastMove: g.last, arrows: flechas }),
          g.aviso ? h('div', { key: g.log.length, className: 'sp-aviso a-' + g.aviso.tipo }, g.aviso.txt) : null),
        h('div', { className: 'sp-lado' },
          h('div', { className: 'sp-marcador' },
            h('div', { className: 'sp-pts chico' }, h('b', null, g.pts), h('span', null, 'puntos')),
            h('div', { className: 'sp-racha' + (g.combo > 1 ? ' on' : '') }, h('b', null, 'x' + g.combo), h('span', null, 'racha')),
            h('div', { className: 'sp-libro' + (g.enLibro ? ' on' : '') }, h('span', null, g.enLibro ? 'En teoría' : 'Fuera de teoría ' + g.fuera + '/' + FUERA_MAX))),
          h('p', { className: 'sp-estado' }, estado),
          g.pista ? h('div', { className: 'sp-pista', 'data-uci': g.pista.uci }, h('b', null, 'Pista'), h('p', null, g.pista.txt)) : null,
          g.deshacer ? h('div', { className: 'sp-bts' }, h('button', { className: 'btn btn-primary', onClick: deshacer }, h('span', null, 'Deshacer y probar otra')), h('button', { className: 'btn btn-ghost', onClick: seguir }, h('span', null, 'Seguir así'))) :
            h('div', { className: 'sp-bts' }, h('button', { className: 'btn btn-ghost', disabled: !tuTurno, onClick: pedirPista }, h('span', null, 'Pista (−5)')), h('button', { className: 'btn btn-ghost', onClick: cerrar }, h('span', null, 'Terminar'))),
          feed)));
  }

  /* ---------- registrar las páginas (las aperturas pueden tardar en estar listas) ---------- */
  function registrar() {
    var U = UI(); if (!U || !U.openings || !U.openings.length || !U.React) return false;
    U.openings.forEach(function (o) { PAGES['juega-' + o.id] = function () { return U.React.createElement(Sparring, { fam: o.id, key: o.id }); }; });
    if (/^#juega-/.test(location.hash)) window.dispatchEvent(new HashChangeEvent('hashchange'));
    return true;
  }
  if (!registrar()) { var t = setInterval(function () { if (registrar()) clearInterval(t); }, 150); setTimeout(function () { clearInterval(t); }, 20000); }

  /* ---------- acceso desde el curso y la ficha de la apertura ---------- */
  function famActual() { var m = /^#(curso|apertura)-(.+)$/.exec(location.hash); return m ? { donde: m[1], fam: m[2] } : null; }
  function acceso() {
    var a = famActual(); if (!a) return;
    var sitio = a.donde === 'curso' ? document.querySelector('.course .course-top') : document.querySelector('.course-cta');
    if (!sitio) return;
    var cont = a.donde === 'curso' ? sitio : sitio.parentElement;
    var ya = cont.querySelector('.sp-cta');
    if (ya && ya.dataset.fam === a.fam) return;
    if (ya) ya.remove();
    var rec = registro()[a.fam];
    var b = document.createElement('button'); b.type = 'button'; b.className = 'card sp-cta'; b.dataset.fam = a.fam;
    b.innerHTML = '<span class="sp-cta-ic" aria-hidden="true">' + (ic('espadas') || ic('jugar') || '') + '</span><span><b>Juega la apertura</b><small>Un rival te plantea sus variantes y el motor te explica cada decisión' + (rec ? ' · récord ' + rec.best : '') + '</small></span>';
    b.addEventListener('click', function () { UI().go('juega-' + a.fam); });
    if (a.donde === 'curso') sitio.insertBefore(b, sitio.children[1] || null); else sitio.insertAdjacentElement('afterend', b);
  }

  /* ---------- fallo explicado en el curso, el repaso y las tarjetas ---------- */
  var falloN = 0;
  window.AA_OPFALLO = function (fen, uci, ok, side) {
    var n = ++falloN;
    var runner = document.querySelector('.runner .stage-l'); if (!runner) return;
    var caja = runner.querySelector('.sp-fallo');
    if (!caja) { caja = document.createElement('div'); caja.className = 'sp-fallo'; }
    if (caja.parentElement !== runner) {
      // justo después del bloque del entrenador (el hijo directo que contiene su mensaje)
      var hijos = [].slice.call(runner.children), tras = null;
      for (var k = 0; k < hijos.length; k++) if (/No es la jugada|Esa no es|No\. Era/.test(hijos[k].innerText || '')) { tras = hijos[k]; break; }
      if (tras && tras.nextSibling) runner.insertBefore(caja, tras.nextSibling); else runner.appendChild(caja);
    }
    caja.className = 'sp-fallo cargando'; caja.dataset.fen = fen;
    caja.innerHTML = '<b>Tu jugada: ' + es(sanDe(fen, uci)) + '</b><p>El motor la está mirando…</p>';
    var okSan = es(sanDe(fen, ok));
    Promise.all([juzgar(fen, uci, side), juzgar(fen, ok, side)]).then(function (r) {
      if (n !== falloN || !document.contains(caja)) return;
      var j = r[0], jo = r[1]; if (!j) { caja.remove(); return; }
      var dif = jo ? Math.max(0, jo.evalTras - j.evalTras) : j.perdida;
      var tipo = dif <= 35 ? 'buena' : dif <= 110 ? 'imprecision' : 'error';
      var mi = es(sanDe(fen, uci));
      var tx = tipo === 'buena'
        ? '<b>' + mi + ' también es buena</b><p>El motor la valora casi igual (' + pawns(j.evalTras) + ' contra ' + pawns(jo ? jo.evalTras : j.evalTras) + '). En este curso seguimos con <b>' + okSan + '</b> porque es el repertorio que estás aprendiendo: ' + explica(fen, ok) + '</p>'
        : '<b>' + mi + (tipo === 'error' ? ' es un error' : ' es una imprecisión') + '</b><p>Tras ' + mi + ', el rival responde <b>' + es(j.respSan) + '</b>. ' + explica(j.after, j.resp) + ' (' + pawns(j.evalTras) + ')</p><p>La jugada de la línea, <b>' + okSan + '</b>: ' + explica(fen, ok) + '</p>';
      caja.className = 'sp-fallo t-' + tipo; caja.innerHTML = tx;
    });
  };
  function limpiarFallo() {
    var caja = document.querySelector('.sp-fallo'); if (!caja) return;
    var stage = caja.closest('.stage-l');
    var t = stage ? stage.innerText : '';
    if (!stage || !/No es la jugada|Esa no es|No\. Era|Jugada distinta/.test(t)) caja.remove();
  }

  var pend = false;
  new MutationObserver(function () {
    if (pend) return; pend = true;
    requestAnimationFrame(function () { pend = false; try { acceso(); limpiarFallo(); } catch (e) { if (window.console) console.warn('sparring', e); } });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
