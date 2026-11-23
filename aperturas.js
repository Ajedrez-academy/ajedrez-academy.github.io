/* Ajedrez Academy · aprender aperturas: explicación ordenada, casillas señaladas en el tablero
   e «Ideas de esta línea» que se van completando. También mejora el mapa de secciones del curso. */
(function () {
  'use strict';
  var SQ = /\b([a-h][1-8])\b/g;
  function ico(n) { return window.AA_ICONO ? window.AA_ICONO(n) : ''; }

  /* ---------- Entender la explicación de cada jugada ---------- */
  // Cada regla convierte una frase en una idea con icono y, si nombra casillas, las marca en el tablero.
  var REGLAS = [
    { re: /pasa a controlar (\d+) casillas \(antes (\d+)\)/i, f: function (m) { return { k: 'actividad', ic: 'rayo', t: 'Más activa: de ' + m[2] + ' a ' + m[1] + ' casillas', idea: 'Piezas activas' }; } },
    { re: /una pieza activa vale más que una pasiva/i, f: null },
    { re: /aumenta el control del centro\s*\(([^)]+)\)/i, f: function (m) { return { k: 'centro', ic: 'centro', t: 'Centro: ' + m[1].replace(/,\s*/g, ' · '), sq: m[1], idea: 'Control del centro' }; } },
    { re: /que es donde se decide la movilidad de todas las piezas/i, f: null },
    { re: /apunta a ([a-h][1-8])/i, f: function (m) { return { k: 'objetivo', ic: 'diana', t: 'Apunta a ' + m[1], sq: m[1], idea: 'Presión sobre ' + m[1] }; } },
    { re: /una casilla junto al rey que solo defiende el propio rey|un blanco clásico de ataque/i, f: null },
    { re: /clava (?:el|la) ([a-zá-ú]+) de ([a-h][1-8])/i, f: function (m) { return { k: 'clava', ic: 'clava', t: 'Clava ' + m[1] + ' de ' + m[2], sq: m[2], idea: 'Clavadas' }; } },
    { re: /presiona (?:el|la|los) ([a-zá-ú]+) de ([a-h][1-8](?:,\s*[a-h][1-8])*)/i, f: function (m) { return { k: 'objetivo', ic: 'presiona', t: 'Presiona ' + m[2].replace(/,\s*/g, ' · '), sq: m[2], idea: 'Presión' }; } },
    { re: /defiende (?:el|la) ([a-zá-ú]+) de ([a-h][1-8])/i, f: function (m) { return { k: 'defiende', ic: 'escudo', t: 'Defiende ' + m[2], sq: m[2], idea: 'Defensa' }; } },
    { re: /diagonal larga y abierta/i, f: function () { return { k: 'linea', ic: 'diagonal', t: 'Diagonal abierta', idea: 'Diagonales abiertas' }; } },
    { re: /enroca (corto|largo)/i, f: function (m) { return { k: 'rey', ic: 'rey', t: 'Enroque ' + m[1] + ': rey a salvo', idea: 'Enroque' }; } },
    { re: /con el rey a salvo|el rey se pone a salvo y la torre entra en juego/i, f: null },
    { re: /desarrolla una pieza/i, f: function () { return { k: 'desarrollo', ic: 'caballo', t: 'Desarrollo', idea: 'Desarrollo rápido' }; } },
    { re: /ocupa el centro/i, f: function () { return { k: 'centro', ic: 'centro', t: 'Ocupa el centro', idea: 'Control del centro' }; } },
    { re: /vigila el centro/i, f: function () { return { k: 'centro', ic: 'centro', t: 'Vigila el centro', idea: 'Control del centro' }; } },
    { re: /captura/i, f: function () { return { k: 'captura', ic: 'captura', t: 'Captura', idea: 'Cambios' }; } }
  ];
  function analizar(txt) {
    // «3... Ac5 — El alfil va a c5, …. Tras c3, el plan sigue con Cf6: …»
    var plan = null, mPlan = txt.match(/Tras ([^,]+), el plan sigue con ([^:]+):/);
    if (mPlan) { plan = 'Después de ' + mPlan[1].trim() + ' viene ' + mPlan[2].trim(); txt = txt.slice(0, mPlan.index); }
    var frases = txt.split(/(?<=[.!])\s+|:\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var principal = '', chips = [], resto = [], vistos = {};
    frases.forEach(function (f, i) {
      // la frase principal: «El alfil va a c5, desarrolla una pieza» (sin la cola repetitiva)
      var usada = false;
      REGLAS.forEach(function (r) {
        var m = f.match(r.re); if (!m) return; usada = true;
        if (!r.f) return; var c = r.f(m); if (vistos[c.t]) return; vistos[c.t] = 1; chips.push(c);
      });
      if (i === 0) principal = f.replace(/,\s*(desarrolla una pieza|ocupa el centro|vigila el centro)/i, '').replace(/\.$/, '');
      else if (!usada) resto.push(f);
    });
    if (!principal) principal = frases[0] || txt;
    if (chips.some(function (c) { return c.sq && c.k === 'centro'; })) chips = chips.filter(function (c) { return c.sq || c.k !== 'centro'; });
    return { principal: principal, chips: chips, resto: resto, plan: plan };
  }

  /* ---------- Casillas en el tablero ---------- */
  function orientacion(cb) {
    var t = cb.querySelector('.coord text'); // la primera letra de columnas
    var a = Array.prototype.find.call(cb.querySelectorAll('.coord text'), function (x) { return /^[a-h]$/.test(x.textContent); });
    return a && a.textContent === 'h' ? 'b' : 'w';
  }
  function marcar(cb, chips) {
    if (!cb) return;
    var capa = cb.querySelector(':scope > .ap-capa');
    if (!capa) { capa = document.createElement('div'); capa.className = 'ap-capa'; capa.setAttribute('aria-hidden', 'true'); cb.appendChild(capa); }
    var or = orientacion(cb), html = '', hechas = {};
    chips.forEach(function (c) {
      if (!c.sq) return;
      (c.sq.match(SQ) || []).forEach(function (s) {
        if (hechas[s]) return; hechas[s] = 1;
        var f = s.charCodeAt(0) - 97, r = +s[1] - 1, x = or === 'w' ? f : 7 - f, y = or === 'w' ? 7 - r : r;
        html += '<i class="ap-m ap-' + c.k + '" style="left:' + x * 12.5 + '%;top:' + y * 12.5 + '%"></i>';
      });
    });
    if (capa.innerHTML !== html) capa.innerHTML = html;
  }

  /* ---------- Pantalla de aprender ---------- */
  var QK = 'aa-ap-adivina', resp = {};
  function quiz() { try { return localStorage.getItem(QK) === '1'; } catch (e) { return false; } }
  var ses = { ruta: '', ideas: { yo: {}, el: {} }, orden: { yo: [], el: [] }, ult: '' };
  function aprender() {
    if (!/^#(aprender|entrenar-linea)-/.test(location.hash)) { ses.ruta = ''; return; }
    var runner = document.querySelector('.runner'), tutor = runner && runner.querySelector('.stage-l .tutor'), bub = tutor && tutor.querySelector('.bubble');
    if (!bub) return;
    runner.classList.add('ap-on');
    if (ses.ruta !== location.hash) { ses = { ruta: location.hash, ideas: { yo: {}, el: {} }, orden: { yo: [], el: [] }, ult: '' }; }
    var mov = bub.querySelector('b'), movTxt = mov ? mov.textContent.trim() : '';
    var crudo = bub.textContent.replace((bub.querySelector('.bubble-name') || {}).textContent || '', '').replace(movTxt, '').replace(/^\s*—\s*/, '').trim();
    var firma = movTxt + '|' + crudo;
    var card = tutor.querySelector(':scope > .ap-idea');
    var mini = runner.querySelector('.mini-moves'), nMov = mini ? mini.children.length : 0;

    if (firma === ses.ult && card) { pintarIdeas(runner); return; }
    ses.ult = firma;
    var cb = runner.querySelector('.stage-b .cb');
    if (!movTxt || /—/.test(bub.textContent) === false) {
      // mensajes sin jugada (instrucciones, «¡Bien!», etc.): se muestran tal cual
      tutor.classList.remove('ap-con-idea'); if (card) card.remove(); marcar(cb, []); pintarIdeas(runner); return;
    }
    var a = analizar(crudo);
    var negras = /\.\.\./.test(movTxt), yoBlancas = orientacion(cb) === 'w', quien = (negras !== yoBlancas) ? 'yo' : 'el';
    if (!card) { card = document.createElement('div'); card.className = 'ap-idea'; card.setAttribute('aria-live', 'polite'); tutor.appendChild(card); }
    tutor.classList.add('ap-con-idea');
    var PRIO = { objetivo: 1, clava: 1, rey: 2, captura: 3, defiende: 4, centro: 5, linea: 6, desarrollo: 7, actividad: 8 };
    var buena = a.chips.slice().sort(function (x, y) { return (PRIO[x.k] || 9) - (PRIO[y.k] || 9); })[0];
    var pregunta = quiz() && quien === 'yo' && buena;
    if (pregunta && !resp[firma]) {
      var POOL = ['Apunta a f7', 'Apunta a f2', 'Centro: d4', 'Centro: d5', 'Defiende e4', 'Defiende e5', 'Enroque corto: rey a salvo', 'Diagonal abierta', 'Captura', 'Clava caballo de f6', 'Presiona e5'];
      var malas = POOL.filter(function (t) { return t !== buena.t && !a.chips.some(function (c) { return c.t === t; }); });
      malas.sort(function () { return Math.random() - .5; });
      var ops = [buena.t, malas[0], malas[1]].sort(function () { return Math.random() - .5; });
      card.innerHTML = '<div class="ap-mov"><b>' + movTxt + '</b><span>¿Para qué sirve esta jugada?</span></div>' +
        '<div class="ap-ops">' + ops.map(function (o) { return '<button type="button" class="ap-op" data-o="' + o.replace(/"/g, '&quot;') + '">' + o + '</button>'; }).join('') + '</div>' + interruptor();
      card.querySelectorAll('.ap-op').forEach(function (b) {
        b.addEventListener('click', function () {
          var ok = b.dataset.o === buena.t; resp[firma] = ok ? 'ok' : 'ko';
          if (window.AA_UI) window.AA_UI.sound(ok ? 'correct' : 'wrong');
          ses.ult = ''; tick();
        });
      });
      marcar(cb, []); pintarIdeas(runner); conectar(card); return;
    }
    a.chips.forEach(function (c) { if (c.idea && !ses.ideas[quien][c.idea]) { ses.ideas[quien][c.idea] = c.ic; ses.orden[quien].push(c.idea); } });
    var res = resp[firma];
    card.innerHTML = (res ? '<p class="ap-res ' + res + '">' + (res === 'ok' ? '¡Bien visto!' : 'Casi. La idea era: ' + buena.t) + '</p>' : '') +
      '<div class="ap-mov"><b>' + movTxt + '</b><span>' + a.principal + '.</span></div>' +
      (a.chips.length ? '<div class="ap-chips">' + a.chips.map(function (c, i) { return '<span class="ap-chip ap-' + c.k + '" style="--d:' + (i * 0.05) + 's"><i>' + ico(c.ic) + '</i>' + c.t + '</span>'; }).join('') + '</div>' : '') +
      (a.resto.length ? '<p class="ap-resto">' + a.resto.join(' ') + '</p>' : '') +
      (a.plan ? '<p class="ap-plan"><i>' + ico('presiona') + '</i>' + a.plan + '</p>' : '') + interruptor();
    conectar(card);
    marcar(cb, a.chips);
    pintarIdeas(runner);
  }
  function interruptor() {
    return '<label class="ap-sw"><input type="checkbox"' + (quiz() ? ' checked' : '') + '> Adivina la idea antes de verla</label>';
  }
  function conectar(card) {
    var i = card.querySelector('.ap-sw input'); if (!i) return;
    i.addEventListener('change', function () { try { localStorage.setItem(QK, i.checked ? '1' : '0'); } catch (e) {} ses.ult = ''; tick(); });
  }
  function pintarIdeas(runner) {
    var L = runner.querySelector('.stage-l'); if (!L) return;
    var box = L.querySelector(':scope > .ap-ideas');
    // solo en «Mira»: en las fases guiadas (con ayuda, de memoria) el cuadro no se actualiza y estorba
    var fase = runner.querySelector('.phase-pills .on'), mira = !fase || /^\s*1/.test(fase.textContent);
    if (!mira || (!ses.orden.yo.length && !ses.orden.el.length)) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.className = 'ap-ideas'; L.appendChild(box); }
    var grupo = function (q, tit) { return ses.orden[q].length ? '<small>' + tit + '</small><div class="ap-g-' + q + '">' + ses.orden[q].map(function (k) { return '<span><i>' + ico(ses.ideas[q][k]) + '</i>' + k + '</span>'; }).join('') + '</div>' : ''; };
    var html = grupo('yo', 'Tus ideas en esta línea') + grupo('el', 'Lo que busca el rival');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  /* ---------- Mapa de secciones del curso ---------- */
  var TIPOS = { 'k-teoría': ['libro', 'Teoría'], 'k-planes': ['diana', 'Planes y golpes'], 'k-castigo': ['espadas', 'Castiga sus errores'], 'k-trampas': ['aviso', 'Trampas'] };
  function curso() {
    var secs = document.querySelectorAll('.main .sections > .sec'); if (!secs.length) return;
    secs.forEach(function (s) {
      if (s.dataset.ap) return; s.dataset.ap = '1';
      var k = (s.className.match(/k-[^\s]+/) || [])[0] || '', t = TIPOS[k];
      var small = s.querySelector('.sec-t small');
      var tipo = small ? small.textContent.split('·')[0].trim() : '';
      if (!t) { t = /castig/i.test(tipo) ? TIPOS['k-castigo'] : /plan|golpe/i.test(tipo) ? TIPOS['k-planes'] : /trampa/i.test(tipo) ? TIPOS['k-trampas'] : TIPOS['k-teoría']; }
      s.classList.add('ap-sec', 'ap-t-' + (/castig/i.test(t[1]) ? 'castigo' : /plan/i.test(t[1]) ? 'planes' : /trampa/i.test(t[1]) ? 'trampas' : 'teoria'));
      var n = s.querySelector('.sec-n'); if (n && !n.querySelector('.ap-tipo')) n.insertAdjacentHTML('beforeend', '<i class="ap-tipo" aria-hidden="true">' + ico(t[0]) + '</i>');
    });
  }

  var pend = false;
  function tick() { pend = false; try { aprender(); curso(); } catch (e) { if (window.console) console.warn('aperturas', e); } }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
