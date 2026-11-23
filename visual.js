/* Ajedrez Academy · más visual en Táctica, Finales y Análisis.
   Cada elemento muestra algo útil: tu rango y lo que falta para el siguiente, tu racha,
   el progreso por familias de finales y quién va mejor en Análisis. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function store() { try { return JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) { return {}; } }
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* Ráfaga de estrellas (al resolver) */
  function rafaga(el, n, cols) {
    if (!el || reduce.matches) return;
    var r = el.getBoundingClientRect(), c = document.createElement('div'); c.className = 'vs-rafaga';
    c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + r.height / 2) + 'px';
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'), a = (i / n) * Math.PI * 2 + Math.random() * .4, d = r.width * (.28 + Math.random() * .25);
      s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d + 'px');
      s.style.setProperty('--s', (.6 + Math.random() * .8).toFixed(2)); s.style.color = cols[i % cols.length]; s.style.animationDelay = (Math.random() * .08) + 's';
      s.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21.1l1.6-7L2 9.3l7.1-.7z" fill="currentColor"/></svg>';
      c.appendChild(s);
    }
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 1300);
  }
  window.AA_RAFAGA = rafaga;

  /* ================= TÁCTICA: tarjeta de nivel ================= */
  var RANGOS = [[0, 'Novato'], [600, 'Principiante'], [900, 'Aficionado'], [1200, 'Jugador de club'], [1500, 'Jugador fuerte'], [1800, 'Experto'], [2100, 'Maestro'], [2400, 'Gran maestro']];
  function rango(r) {
    var i = 0; while (i < RANGOS.length - 1 && r >= RANGOS[i + 1][0]) i++;
    var a = RANGOS[i][0], b = RANGOS[i + 1] ? RANGOS[i + 1][0] : a + 300;
    return { n: RANGOS[i][1], sig: RANGOS[i + 1] ? RANGOS[i + 1][1] : null, falta: Math.max(0, b - r), p: Math.max(0, Math.min(1, (r - a) / (b - a))), i: i };
  }
  var FLAMA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 5 5.6 5 10.2A5 5 0 0 1 12 17a5 5 0 0 1-5-4.8c0-2 .9-3.4 2-4.6.2 1.6 1 2.6 2.2 2.9C10.8 8 11.2 5 12 2z" transform="translate(0 3)" fill="currentColor"/></svg>';
  var tac = { r: null, racha: null, anim: 0 };
  function contar(el, de, a) {
    cancelAnimationFrame(tac.anim);
    if (reduce.matches || de === null) { el.textContent = a; return; }
    var t0 = performance.now(), dur = 700;
    (function paso(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(de + (a - de) * e); if (k < 1) tac.anim = requestAnimationFrame(paso); })(t0);
  }
  function tactica() {
    var head = document.querySelector('.tac-head'); if (!head) { tac.r = null; tac.racha = null; return; }
    var pill = head.querySelector('.rating-pill'), b = pill && pill.querySelector('b'); if (!b) return;
    var r = parseInt(b.textContent, 10); if (isNaN(r)) return;
    var pz = store().puzzle || {}, racha = pz.streak || 0;
    var card = head.querySelector('.vs-nivel');
    if (!card) {
      card = document.createElement('div'); card.className = 'vs-nivel';
      card.innerHTML = '<div class="vs-anillo"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="vs-an-f"/><circle cx="40" cy="40" r="34" class="vs-an-p"/></svg><b class="vs-num"></b><i class="vs-delta"></i></div>' +
        '<div class="vs-nv-tx"><small>Tu nivel en táctica</small><b class="vs-rango"></b><span class="vs-falta"></span>' +
        '<div class="vs-llamas" aria-label="Racha de aciertos">' + [0, 1, 2, 3, 4].map(function () { return '<i>' + FLAMA + '</i>'; }).join('') + '<em class="vs-racha-n"></em></div></div>';
      pill.insertAdjacentElement('afterend', card);
      head.classList.add('vs-on');
    }
    // número, anillo y rango
    if (r !== tac.r) {
      var R = rango(r), num = card.querySelector('.vs-num');
      contar(num, tac.r, r);
      var circ = 2 * Math.PI * 34, an = card.querySelector('.vs-an-p');
      an.style.strokeDasharray = circ; an.style.strokeDashoffset = circ * (1 - R.p);
      card.querySelector('.vs-rango').textContent = R.n;
      card.querySelector('.vs-falta').textContent = R.sig ? 'Te faltan ' + R.falta + ' puntos para ' + R.sig : 'Rango máximo';
      card.dataset.rango = R.i;
      if (tac.r !== null) {
        var d = r - tac.r, dl = card.querySelector('.vs-delta');
        dl.textContent = (d > 0 ? '+' : '−') + Math.abs(d); dl.className = 'vs-delta ' + (d > 0 ? 'up' : 'down');
        void dl.offsetWidth; dl.classList.add('ver');
        if (d > 0) { rafaga(document.querySelector('.stage-b .cb') || card, 14, ['#ffcf3f', '#2bb45c', '#2fa8ff', '#ff9600']); card.classList.remove('vs-sube'); void card.offsetWidth; card.classList.add('vs-sube'); }
        else { card.classList.remove('vs-baja'); void card.offsetWidth; card.classList.add('vs-baja'); }
      }
      tac.r = r;
    }
    // llamas de la racha
    if (racha !== tac.racha) {
      var ll = card.querySelectorAll('.vs-llamas > i'), on = Math.min(5, racha);
      ll.forEach(function (f, i) {
        var era = f.classList.contains('on'), es = i < on;
        f.classList.toggle('on', es);
        if (es && !era && tac.racha !== null) { f.classList.remove('nueva'); void f.offsetWidth; f.classList.add('nueva'); }
      });
      var rn = card.querySelector('.vs-racha-n');
      rn.textContent = racha >= 2 ? 'racha de ' + racha + (pz.best > racha ? ' · récord ' + pz.best : racha >= 2 && pz.best === racha ? ' · ¡récord!' : '') : (pz.best ? 'récord de racha: ' + pz.best : 'acierta seguidos para encender la racha');
      if (tac.racha !== null && tac.racha >= 2 && racha === 0) { card.classList.remove('vs-apaga'); void card.offsetWidth; card.classList.add('vs-apaga'); }
      tac.racha = racha;
    }
  }

  /* ================= FINALES: familias, medallas y objetivo ================= */
  var FAM = {
    mates: { n: 'Mates básicos', corto: 'Mates', ic: '♛', c: '#8b5cf6', ids: ['kqk', 'kq-k-borde', 'krk', 'krrk'] },
    peones: { n: 'Peones', ic: '♟', c: '#2bb45c', ids: ['kpk', 'cuadrado', 'rey-activo'] },
    torres: { n: 'Torres', ic: '♜', c: '#2fa8ff', ids: ['lucena', 'philidor', 'peon-torre'] },
    estudios: { n: 'Estudios', ic: '★', c: '#ff9600', ids: ['saavedra', 'reti'] }
  };
  var OBJ = { win: ['Dar mate', '♚'], promote: ['Coronar', '♛'], draw: ['Hacer tablas', '½'] };
  function famDe(id) { for (var k in FAM) if (FAM[k].ids.indexOf(id) >= 0) return k; return null; }
  function finPorTitulo() { var m = {}; ((window.AA_UI && window.AA_UI.endgames) || []).forEach(function (f) { m[f.title.trim()] = f; }); return m; }
  var finFirma = '';
  function finales() {
    var drills = document.querySelector('.main .drills'); if (!drills || !window.AA_UI) { finFirma = ''; return; }
    var page = drills.parentElement, F = finPorTitulo(), hechos = store().endgames || {};
    var cuenta = {}, total = 0, dom = 0; Object.keys(FAM).forEach(function (k) { cuenta[k] = { t: 0, d: 0 }; });
    drills.querySelectorAll('.drill').forEach(function (c) {
      var f = F[((c.querySelector('.drill-txt > b') || {}).textContent || '').trim()]; if (!f) return;
      var k = famDe(f.id), ok = !!hechos[f.id]; total++; if (ok) dom++;
      if (k) { cuenta[k].t++; if (ok) cuenta[k].d++; }
      c.dataset.fam = k || ''; if (k) c.style.setProperty('--fc', FAM[k].c);
      var tx = c.querySelector('.drill-txt');
      if (k && tx && !tx.querySelector('.vs-fam')) tx.insertAdjacentHTML('afterbegin', '<span class="vs-fam"><i>' + FAM[k].ic + '</i>' + (FAM[k].corto || FAM[k].n) + '</span>');
      var med = c.querySelector('.vs-medalla');
      if (ok && !med) c.insertAdjacentHTML('beforeend', '<span class="vs-medalla" title="Final dominado" aria-label="Final dominado"><svg viewBox="0 0 40 48"><path d="M10 0h8l4 12-6 4zM30 0h-8l-4 12 6 4z" fill="#e0453b"/><circle cx="20" cy="30" r="15" fill="#ffcf3f" stroke="#d99a00" stroke-width="3"/><path d="M13.5 30.5l4.5 4.5 8.5-9" fill="none" stroke="#8a5a00" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>');
      if (!ok && med) med.remove();
    });
    if (!total) return;
    page.classList.add('vs-fin-on');
    var firma = dom + '/' + total + JSON.stringify(cuenta);
    var hero = page.querySelector(':scope > .vs-fin-hero');
    if (hero && firma === finFirma) return; finFirma = firma;
    if (!hero) {
      hero = document.createElement('section'); hero.className = 'vs-fin-hero';
      hero.addEventListener('click', function (e) {
        var t = e.target.closest('[data-f]'); if (!t) return;
        var c = document.querySelector('.drills .drill[data-fam="' + t.dataset.f + '"]'); if (!c) return;
        c.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
        document.querySelectorAll('.drills .drill[data-fam="' + t.dataset.f + '"]').forEach(function (x) { x.classList.remove('vs-resalta'); void x.offsetWidth; x.classList.add('vs-resalta'); });
      });
      page.insertBefore(hero, page.firstChild);
    }
    var circ = 2 * Math.PI * 40, p = dom / total, sub = (page.querySelector(':scope > p.muted') || {}).textContent || '';
    hero.innerHTML = '<div class="vs-fh-top"><div><h1>Finales</h1><p>' + sub + '</p></div>' +
      '<div class="vs-fh-anillo" aria-label="' + dom + ' de ' + total + ' finales dominados"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" class="f"/><circle cx="48" cy="48" r="40" class="p" style="stroke-dasharray:' + circ + ';stroke-dashoffset:' + circ * (1 - p) + '"/></svg><b>' + dom + '<small>/' + total + '</small></b><span>dominados</span></div></div>' +
      '<div class="vs-fh-fams">' + Object.keys(FAM).map(function (k) {
        var f = FAM[k], c = cuenta[k];
        return '<button type="button" class="vs-fh-fam' + (c.t && c.d === c.t ? ' completa' : '') + '" data-f="' + k + '" style="--fc:' + f.c + '"><i>' + f.ic + '</i><span><b>' + f.n + '</b><small>' + c.d + ' de ' + c.t + '</small></span><em><u style="width:' + (c.t ? Math.round(c.d / c.t * 100) : 0) + '%"></u></em></button>';
      }).join('') + '</div>';
  }
  var finJuego = { id: null, ok: null };
  function finalEnJuego() {
    var m = location.hash.match(/^#final-(.+)$/), pg = document.querySelector('.playgame'); if (!m || !pg) { finJuego.id = null; return; }
    var id = m[1], f = ((window.AA_UI && window.AA_UI.endgames) || []).filter(function (x) { return x.id === id; })[0]; if (!f) return;
    var k = famDe(id), t = pg.querySelector('.drill-title');
    if (t && !t.classList.contains('vs-obj')) {
      t.classList.add('vs-obj'); if (k) t.style.setProperty('--fc', FAM[k].c);
      t.insertAdjacentHTML('afterbegin', '<i class="vs-obj-ic" aria-hidden="true">' + (OBJ[f.goal] || OBJ.win)[1] + '</i>');
    }
    var ok = !!(store().endgames || {})[id];
    if (finJuego.id !== id) { finJuego.id = id; finJuego.ok = ok; return; }
    if (ok && !finJuego.ok) { rafaga(pg.querySelector('.cb') || pg, 18, ['#ffcf3f', '#2bb45c', '#8b5cf6', '#2fa8ff']); if (t) { t.classList.remove('vs-logrado'); void t.offsetWidth; t.classList.add('vs-logrado'); } }
    finJuego.ok = ok;
  }

  /* ================= ANÁLISIS: probabilidad y razones con icono ================= */
  function probBlancas(t) {
    t = (t || '').trim().replace('−', '-').replace(',', '.');
    var m = t.match(/^([+-]?)(?:M|#)(\d+)/); if (m) return m[1] === '-' ? 0 : 100;
    var v = parseFloat(t); if (isNaN(v)) return null;
    return Math.round(50 + 50 * (2 / (1 + Math.exp(-0.368 * v)) - 1));
  }
  var ICONOS = [
    [/material|peón de más|pieza de más|calidad/i, 'material', '<path d="M12 3v18M6 21h12M4 7h16M4 7l-2.5 6a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>'],
    [/rey|enroque|seguridad/i, 'rey', '<path d="M12 2v4M10 4h4M7 21h10M8 21l1-8h6l1 8M8 13c-2-1.4-2.6-4-.2-5h8.4c2.4 1 1.8 3.6-.2 5"/>'],
    [/peones|peón|estructura/i, 'peones', '<circle cx="12" cy="7" r="3"/><path d="M9 12h6M8 21h8M9 21c0-4 1-7 3-9 2 2 3 5 3 9"/>'],
    [/alfil|torre|columna|diagonal/i, 'lineas', '<path d="M4 20L20 4M4 4h4M4 4v4M20 20h-4M20 20v-4"/>'],
    [/activ|casillas|movilidad|desarroll|centro/i, 'actividad', '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>']
  ];
  function analisis() {
    if (!/^#analisis/.test(location.hash)) return;
    var lc = document.querySelector('.lines-card');
    if (lc) {
      var first = lc.querySelector('.eng-line > b'), p = first ? probBlancas(first.textContent) : null;
      lc.querySelectorAll('.eng-line').forEach(function (l, i) { l.classList.toggle('vs-mejor', i === 0); });
      var bar = lc.querySelector('.vs-prob');
      if (p !== null) {
        if (!bar) { bar = document.createElement('div'); bar.className = 'vs-prob'; bar.innerHTML = '<span class="w"></span><i><u></u></i><span class="n"></span>'; var h = lc.querySelector('.card-head'); h.insertAdjacentElement('afterend', bar); }
        var u = bar.querySelector('u'); if (u.style.width !== p + '%') u.style.width = p + '%';
        var tw = 'Blancas ' + p + '%', tn = (100 - p) + '% Negras';
        if (bar.querySelector('.w').textContent !== tw) { bar.querySelector('.w').textContent = tw; bar.querySelector('.n').textContent = tn; }
        bar.classList.toggle('lado-n', p < 50);
        bar.title = 'Probabilidad de ganar según el motor';
      }
    }
    document.querySelectorAll('.main ul.reasons > li').forEach(function (li) {
      if (li.querySelector('.vs-r-ic')) return;
      var t = li.textContent, ic = ICONOS.filter(function (x) { return x[0].test(t); })[0] || ICONOS[4];
      var dot = li.querySelector('.dot'), lado = dot && dot.classList.contains('w') ? 'w' : 'n';
      li.classList.add('vs-razon');
      li.insertAdjacentHTML('afterbegin', '<i class="vs-r-ic ' + lado + '" title="' + ic[1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic[2] + '</svg></i>');
    });
  }

  /* ================= TÁCTICA: pista por niveles y la idea del problema ================= */
  var TEMAS = {
    'mate en 1': ['♚', 'Mate en 1', 'Hay un jaque mate inmediato. Revisa todos los jaques posibles.'],
    'mate en 2': ['♚', 'Mate en 2', 'Una jugada fuerza la respuesta y la siguiente da mate. Empieza por los jaques.'],
    'mate en 3': ['♚', 'Mate en 3', 'Una secuencia forzada de jaques y amenazas termina en mate.'],
    'mate del pasillo': ['▭', 'Mate del pasillo', 'El rey está encerrado por sus propios peones en la última fila: una torre o la dama en esa fila da mate.'],
    'ataque doble': ['⑂', 'Ataque doble', 'Una pieza ataca dos objetivos a la vez y el rival solo puede salvar uno.'],
    'jaque doble': ['⑂', 'Jaque doble', 'Dos piezas dan jaque a la vez: el rey tiene que moverse y no puede tapar ni capturar las dos.'],
    'clavada': ['📌', 'Clavada', 'Una pieza no puede moverse sin dejar expuesta otra más valiosa (o al rey) detrás.'],
    'enfilada': ['➶', 'Enfilada', 'Atacas una pieza valiosa que, al apartarse, deja otra detrás sin defensa.'],
    'descubierta': ['↯', 'Ataque descubierto', 'Al mover una pieza, otra que estaba detrás ataca de repente.'],
    'sacrificio': ['✦', 'Sacrificio', 'Entregas material para conseguir algo mayor: el mate o más material.'],
    'desviación': ['↪', 'Desviación', 'Obligas a una pieza defensora a abandonar la casilla o la pieza que protegía.'],
    'atracción': ['⤓', 'Atracción', 'Atraes al rey o a una pieza a una casilla donde sufre un golpe.'],
    'intermedia': ['⏸', 'Jugada intermedia', 'Antes de la jugada que el rival espera, metes otra con una amenaza más fuerte.'],
    'despeje': ['⇥', 'Despeje', 'Apartas una pieza propia para abrir una línea o liberar una casilla.'],
    'interferencia': ['⊣', 'Interferencia', 'Pones una pieza entre la defensora y lo que defiende.'],
    'rayos X': ['⟿', 'Rayos X', 'Una pieza actúa a través de otra sobre la casilla de detrás.'],
    'pieza atrapada': ['⛓', 'Pieza atrapada', 'Una pieza rival no tiene casillas a donde huir: atácala y gánala.'],
    'jugada tranquila': ['…', 'Jugada tranquila', 'Sin jaque ni captura, una jugada silenciosa crea una amenaza que no se puede parar.'],
    'mate de la coz': ['♞', 'Mate de la coz', 'El caballo da mate a un rey rodeado de sus propias piezas, que le quitan todas las casillas.'],
    'coronación': ['♛', 'Coronación', 'Un peón llega a la última fila y se convierte en dama: a veces vale la pena sacrificar para abrirle paso.'],
    'jaque': ['+', 'Jaque con idea', 'Un jaque que obliga al rival y te deja ganar algo en la jugada siguiente.'],
    'final': ['♔', 'Técnica de final', 'Rey activo, peones pasados y precisión: cada tiempo cuenta.'],
    'material': ['⚖', 'Ganar material', 'Busca piezas sin defensa o mal defendidas y captúralas.']
  };
  var pzCache = { fen: null, p: null }, pzMiss = {}, pistaDada = null;
  function problemaActual() {
    var t = window.AA_TABLERO; if (!t || !t.el || !t.el.current || !document.contains(t.el.current)) return pzCache.p;
    var fen = t.fen.split(' ').slice(0, 4).join(' ');
    if (pzCache.fen === fen || pzMiss[fen]) return pzCache.p;
    var P = (window.AA_UI && window.AA_UI.puzzles) || [], hallado = null;
    for (var i = 0; i < P.length && !hallado; i++) {
      var z = P[i]; if (!z.last) continue;
      try { var ch = new window.AA_UI.Chess(z.fen), m = ch.parse(z.last); if (m == null) continue; ch.make(m); if (ch.fen().split(' ').slice(0, 4).join(' ') === fen) hallado = z; } catch (e) {}
    }
    if (hallado) { pzCache.fen = fen; pzCache.p = hallado; } else pzMiss[fen] = 1;
    return pzCache.p;
  }
  function temaPrincipal(p) {
    var ts = (p && p.themes) || []; var t = ts.filter(function (x) { return x !== 'material' && TEMAS[x]; })[0] || ts.filter(function (x) { return TEMAS[x]; })[0];
    return t ? TEMAS[t].concat([t]) : null;
  }
  function tarjetaIdea(L, temas, titulo) {
    var box = L.querySelector(':scope > .vs-idea');
    if (!temas.length) { if (box) box.remove(); return; }
    var html = '<small>' + titulo + '</small>' + temas.map(function (t) { return '<div class="vs-idea-t"><i>' + t[0] + '</i><span><b>' + t[1] + '</b>' + t[2] + '</span></div>'; }).join('');
    if (!box) { box = document.createElement('div'); box.className = 'vs-idea'; var tu = L.querySelector('.tutor'); if (tu) tu.insertAdjacentElement('afterend', box); else L.appendChild(box); }
    if (box.innerHTML !== html) box.innerHTML = html;
  }
  function tacticaIdea() {
    var head = document.querySelector('.tac-head'); if (!head) { pistaDada = null; return; }
    var L = head.closest('.stage-l') || head.parentElement; if (!L) return;
    var lbar = document.querySelector('.lbar'), fin = lbar && /lbar-(ok|bad|warn|info|shown)/.test(lbar.className) && !/lbar-idle/.test(lbar.className);
    var p = problemaActual();
    // primer toque de «Pista»: la idea; el segundo, la pista normal de la app
    var btn = Array.prototype.find.call(document.querySelectorAll('.main button'), function (x) { return /^\s*pista\s*$/i.test(x.textContent); });
    if (btn && !btn.dataset.vs) {
      btn.dataset.vs = '1';
      btn.addEventListener('click', function (e) {
        var pz = problemaActual(), tp = temaPrincipal(pz), clave = pzCache.fen;
        if (tp && pistaDada !== clave) {
          e.preventDefault(); e.stopPropagation(); pistaDada = clave;
          var tit = /^mate en/.test(tp[3]) ? 'revisa primero todos los jaques' : 'busca ' + (/^(jaque|ataque|sacrificio|despeje)/.test(tp[3]) ? 'un ' : /^(clavada|enfilada|desviación|atracción|interferencia|pieza|jugada|técnica)/.test(tp[3]) ? 'una ' : '') + tp[1].toLowerCase();
          tarjetaIdea(L, [[tp[0], 'Pista: ' + tit, tp[2] + ' Si necesitas más ayuda, vuelve a pulsar «Pista».']], 'Pista');
          if (window.AA_UI) window.AA_UI.sound('hint');
          var bx = L.querySelector('.vs-idea'); if (bx && bx.scrollIntoView) bx.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
        }
      }, true);
    }
    if (fin && p) {
      var ts = (p.themes || []).filter(function (x) { return TEMAS[x]; });
      if (ts.length > 1) ts = ts.filter(function (x) { return x !== 'material'; });
      tarjetaIdea(L, ts.slice(0, 2).map(function (x) { return TEMAS[x]; }), 'La idea de este problema');
    } else if (!fin && pistaDada !== pzCache.fen) {
      var box = L.querySelector(':scope > .vs-idea'); if (box) box.remove();
    }
  }

  /* ================= Bucle ================= */
  var pend = false;
  function tick() { pend = false; try { tactica(); tacticaIdea(); finales(); finalEnJuego(); analisis(); } catch (e) { if (window.console) console.warn('visual', e); } }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
