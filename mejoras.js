/* Ajedrez Academy · mejoras de navegación y uso (rondas de mejora de noviembre 2026).
   - Móvil: barra inferior de 5 pestañas (Aprender, Táctica, Jugar, Aperturas, Más) y hoja «Más».
   - Inicio: índice de tomos fijo para saltar por el camino.
   - El botón de apoyo pasa a la hoja «Más» en el móvil (no tapa botones del tablero). */
(function () {
  'use strict';
  var MQ = window.matchMedia('(max-width: 760px)');
  var svg = function (d) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    more: svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    king: svg('<path d="M12 3v4M10 5h4M7 21h10M8 21l1-9h6l1 9M8.5 12c-2-1.5-2.5-4 0-5h7c2.5 1 2 3.5 0 5"/>'),
    crown: svg('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>'),
    graph: svg('<path d="M3 17l5-5 4 4 8-9M3 21h18"/>'),
    scale: svg('<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'),
    chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    trophy: svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
    grid: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
    gear: svg('<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.4"/><circle cx="10" cy="12" r="2.4"/><circle cx="18" cy="18" r="2.4"/>'),
    cup: svg('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    install: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>')
  };
  var MAS = [
    { r: 'finales', l: 'Finales', i: 'king', c: 'purple' },
    { r: 'partidas', l: 'Partidas', i: 'crown', c: 'teal' },
    { r: 'analisis', l: 'Análisis', i: 'graph', c: 'pink' },
    { r: 'evaluar', l: 'Evaluar', i: 'scale', c: 'teal' },
    { r: 'memoria', l: 'Memoria', i: 'eye', c: 'purple' },
    { r: 'clasificacion', l: 'Clasificación', i: 'trophy', c: 'orange' },
    { r: 'progreso', l: 'Progreso', i: 'chart', c: 'orange' },
    { r: 'entrenadores', l: 'Entrenadores', i: 'users', c: 'blue' },
    { r: 'nivel', l: 'Prueba de nivel', i: 'target', c: 'green' },
    { r: 'coordenadas', l: 'Coordenadas', i: 'grid', c: 'teal' },
    { r: '@ajustes', l: 'Ajustes', i: 'gear', c: 'gray' },
    { r: '@buscar', l: 'Buscar', i: 'search', c: 'blue' },
    { r: '@apoyo', l: 'Apoyar', i: 'cup', c: 'red' },
    { r: '@instalar', l: 'Instalar la app', i: 'install', c: 'green' }
  ];
  var EN_MAS = MAS.map(function (m) { return m.r; });

  function ir(r) {
    cerrarMas();
    if (r === '@ajustes') { if (window.AA_GOTO) window.AA_GOTO('Ajustes'); return; }
    if (r === '@buscar') { if (window.AA_BUSCAR) window.AA_BUSCAR(); return; }
    if (r === '@instalar') { instalar(); return; }
    if (r === '@apoyo') { window.open('https://ko-fi.com/cleygonzalez', '_blank', 'noopener'); return; }
    if (window.AA_UI && window.AA_UI.go && !/^(memoria|clasificacion|nivel|coordenadas|problema-del-dia)$/.test(r)) { try { window.AA_UI.go(r); } catch (e) { location.hash = r; } }
    else location.hash = r;
    window.scrollTo(0, 0);
  }
  window.AA_IR = ir;

  /* ---------- Instalar como app (PWA) ---------- */
  var aviso = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); aviso = e; document.documentElement.classList.add('aa-instalable'); });
  window.addEventListener('appinstalled', function () { aviso = null; document.documentElement.classList.remove('aa-instalable'); });
  function instalar() { if (!aviso) return; aviso.prompt(); aviso.userChoice.finally(function () { aviso = null; document.documentElement.classList.remove('aa-instalable'); }); }

  /* ---------- Hoja «Más» ---------- */
  var hoja = null, ultimoFoco = null;
  function crearHoja() {
    hoja = document.createElement('div');
    hoja.className = 'aa-mas-hoja';
    hoja.setAttribute('role', 'dialog'); hoja.setAttribute('aria-modal', 'true'); hoja.setAttribute('aria-label', 'Más secciones');
    hoja.innerHTML = '<div class="aa-mas-fondo" data-cerrar></div><div class="aa-mas-panel"><div class="aa-mas-asa" aria-hidden="true"></div>' +
      '<div class="aa-mas-tit"><b>Más secciones</b><button type="button" class="aa-mas-x" data-cerrar aria-label="Cerrar">×</button></div>' +
      '<div class="aa-mas-grid">' + MAS.map(function (m) {
        return '<button type="button" class="aa-mas-it c-' + m.c + '" data-r="' + m.r + '"><span class="aa-mas-ic">' + IC[m.i] + '</span><span>' + m.l + '</span></button>';
      }).join('') + '</div></div>';
    hoja.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { cerrarMas(); return; }
      var b = e.target.closest('[data-r]'); if (b) ir(b.dataset.r);
    });
    hoja.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarMas();
      if (e.key === 'Tab') { var f = hoja.querySelectorAll('button'); var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    document.body.appendChild(hoja);
  }
  function abrirMas() {
    if (!hoja) crearHoja();
    var h = location.hash.slice(1);
    hoja.querySelectorAll('[data-r]').forEach(function (b) { b.classList.toggle('on', b.dataset.r === h); });
    ultimoFoco = document.activeElement;
    hoja.classList.add('abierta'); document.documentElement.classList.add('aa-mas-on');
    setTimeout(function () { var b = hoja.querySelector('.aa-mas-it'); if (b) b.focus(); }, 30);
  }
  function cerrarMas() {
    if (!hoja || !hoja.classList.contains('abierta')) return;
    hoja.classList.remove('abierta'); document.documentElement.classList.remove('aa-mas-on');
    if (ultimoFoco && ultimoFoco.focus) try { ultimoFoco.focus(); } catch (e) {}
  }

  function asegurarMas() {
    var ul = document.querySelector('.rail ul');
    if (!ul || ul.querySelector('.aa-mas-li')) return;
    var li = document.createElement('li'); li.className = 'aa-mas-li';
    li.innerHTML = '<button type="button" class="nav c-gray aa-mas-btn" aria-haspopup="dialog"><span class="nav-ico">' + IC.more + '</span><span class="nav-lbl">Más</span></button>';
    li.firstChild.addEventListener('click', function (e) { e.stopPropagation(); abrirMas(); });
    ul.appendChild(li);
    marcar();
  }
  function marcar() {
    var b = document.querySelector('.aa-mas-btn'); if (!b) return;
    var h = location.hash.slice(1) || 'inicio';
    var on = EN_MAS.indexOf(h) >= 0 || document.documentElement.classList.contains('aa-settings');
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }
  window.addEventListener('hashchange', function () { marcar(); cerrarMas(); });

  /* ---------- Índice de tomos en Inicio ---------- */
  function indiceTomos() {
    var col = document.querySelector('.home .path-col');
    if (!col) return;
    var units = col.querySelectorAll(':scope > .unit');
    if (units.length < 2) return;
    var idx = col.querySelector(':scope > .aa-tomos');
    var dato = function (u) {
      var h = u.querySelector('.unit-banner h2'), c = u.querySelector('.unit-banner .ub-count');
      return { n: h ? h.textContent.trim() : '', c: c ? c.textContent.trim() : '' };
    };
    var firma = Array.prototype.map.call(units, function (u) { var d = dato(u); return d.n + d.c; }).join('|');
    if (idx && idx.dataset.firma === firma) return;
    if (!idx) {
      idx = document.createElement('nav'); idx.className = 'aa-tomos'; idx.setAttribute('aria-label', 'Tomos');
      idx.addEventListener('click', function (e) {
        var b = e.target.closest('[data-u]'); if (!b) return;
        var u = document.querySelectorAll('.home .path-col > .unit')[+b.dataset.u];
        if (u) { var y = u.getBoundingClientRect().top + window.scrollY - (MQ.matches ? 120 : 70); window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
      });
      var ref = col.querySelector(':scope > .unit');
      col.insertBefore(idx, ref);
    }
    idx.dataset.firma = firma;
    idx.innerHTML = Array.prototype.map.call(units, function (u, i) {
      var d = dato(u);
      var nombre = d.n || ('Tomo ' + (i + 1));
      if (nombre.length > 16 && nombre.indexOf(' y ') > 0) nombre = nombre.split(' y ')[0];
      var prog = (d.c.match(/(\d+)\s*\/\s*(\d+)/) || []);
      var pct = prog[2] ? Math.round(100 * prog[1] / prog[2]) : 0;
      var color = (u.className.match(/c-(\w+)/) || [])[1] || 'green';
      return '<button type="button" class="aa-tomo c-' + color + '" data-u="' + i + '" title="' + nombre + (prog[2] ? ' · ' + prog[1] + ' de ' + prog[2] + ' lecciones' : '') + '">' +
        '<i style="--p:' + pct + '%"></i><span>' + nombre + '</span>' + (prog[2] ? '<small>' + prog[1] + '/' + prog[2] + '</small>' : '') + '</button>';
    }).join('');
    // marca el tomo visible
    vigilarTomos();
  }
  var io = null;
  function vigilarTomos() {
    if (!('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    var units = document.querySelectorAll('.home .path-col > .unit');
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = Array.prototype.indexOf.call(units, e.target);
        document.querySelectorAll('.aa-tomo').forEach(function (b) { b.classList.toggle('on', +b.dataset.u === i); });
        var on = document.querySelector('.aa-tomo.on'); if (on && on.scrollIntoView && on.parentElement.scrollWidth > on.parentElement.clientWidth) on.parentElement.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    units.forEach(function (u) { io.observe(u); });
  }

  /* ---------- Buscador global (Ctrl+K o «/») ---------- */
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var TOMOS = ['Rudimentos', 'Táctica', 'Estrategia', 'Finales', 'Maestría', 'Mi Sistema', 'Tomo 7'];
  var SECC = [
    ['inicio', 'Aprender', 'El camino de lecciones'], ['tactica', 'Táctica', 'Problemas adaptativos y contrarreloj'], ['jugar', 'Jugar contra un bot', 'Seis niveles con entrenador'],
    ['aperturas', 'Aperturas', 'Cursos y repertorio'], ['finales', 'Finales', 'Practica contra el motor'], ['partidas', 'Partidas', 'Partidas históricas comentadas'],
    ['analisis', 'Análisis', 'Analiza una posición con Stockfish'], ['evaluar', 'Evaluar posiciones', '¿Quién está mejor?'], ['memoria', 'Memoria relámpago', 'Recuerda y coloca las piezas'],
    ['clasificacion', 'Clasificación', 'Liga semanal'], ['progreso', 'Progreso', 'Tus estadísticas y logros'], ['entrenadores', 'Entrenadores', 'Conoce a los personajes'],
    ['nivel', 'Prueba de nivel', 'Juega y estimamos tu Elo'], ['coordenadas', 'Coordenadas', 'Entrena a leer el tablero en 30 segundos'], ['@ajustes', 'Ajustes', 'Tablero, piezas, sonido y tema']
  ];
  var indice = null;
  function crearIndice() {
    var U = window.AA_UI || {}, out = [];
    SECC.forEach(function (s) { out.push({ g: 'Secciones', r: s[0], t: s[1], d: s[2] }); });
    try { (U.lessons || []).forEach(function (l) { out.push({ g: 'Lecciones', r: 'leccion-' + l.id, t: l.title, d: (TOMOS[l.tomo - 1] ? TOMOS[l.tomo - 1] + ' · ' : '') + (l.blurb || '') }); }); } catch (e) {}
    try { (U.openings || []).forEach(function (o) { out.push({ g: 'Aperturas', r: 'curso-' + o.id, t: o.name, d: (o.side === 'b' ? 'Con negras · ' : 'Con blancas · ') + (o.first || '') }); }); } catch (e) {}
    try { (U.endgames || []).forEach(function (f) { out.push({ g: 'Finales', r: 'final-' + f.id, t: f.title, d: f.blurb || '' }); }); } catch (e) {}
    try { (U.games || []).forEach(function (p) { out.push({ g: 'Partidas', r: 'partida-' + p.id, t: p.title, d: p.white + ' – ' + p.black + (p.year ? ' · ' + p.year : '') }); }); } catch (e) {}
    out.forEach(function (x) { x.k = norm(x.t + ' ' + x.d + ' ' + x.g); x.kt = norm(x.t); });
    return out;
  }
  var pal = null, sel = 0, res = [];
  function crearPaleta() {
    pal = document.createElement('div'); pal.className = 'aa-pal';
    pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Buscar');
    pal.innerHTML = '<div class="aa-pal-fondo" data-cerrar></div><div class="aa-pal-caja">' +
      '<label class="aa-pal-in">' + IC.search + '<input type="search" placeholder="Busca una lección, apertura, final o partida…" aria-label="Buscar" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="aa-pal-lista"><kbd>Esc</kbd></label>' +
      '<ul id="aa-pal-lista" class="aa-pal-lista" role="listbox"></ul><p class="aa-pal-pie"><span><kbd>↑</kbd><kbd>↓</kbd> moverte</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> buscar desde cualquier pantalla</span></p></div>';
    var inp = pal.querySelector('input');
    inp.addEventListener('input', function () { sel = 0; pintar(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); marcarSel(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); marcarSel(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (res[sel]) abrirRes(res[sel]); }
      else if (e.key === 'Escape') { e.preventDefault(); cerrarPaleta(); }
    });
    pal.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { cerrarPaleta(); return; }
      var li = e.target.closest('[data-i]'); if (li) abrirRes(res[+li.dataset.i]);
    });
    document.body.appendChild(pal);
  }
  function pintar(q) {
    if (!indice) indice = crearIndice();
    var nq = norm(q).trim(), ws = nq.split(/\s+/).filter(Boolean);
    if (!ws.length) res = indice.filter(function (x) { return x.g === 'Secciones'; });
    else {
      res = indice.map(function (x) {
        if (!ws.every(function (w) { return x.k.indexOf(w) >= 0; })) return null;
        var s = (x.kt.indexOf(nq) === 0 ? 0 : x.kt.indexOf(nq) > 0 ? 1 : 2) * 10 + (x.g === 'Secciones' ? 0 : 1);
        return { x: x, s: s };
      }).filter(Boolean).sort(function (a, b) { return a.s - b.s; }).slice(0, 40).map(function (o) { return o.x; });
    }
    var ul = pal.querySelector('.aa-pal-lista'), g = '', h = '';
    if (!res.length) h = '<li class="aa-pal-vacio">Nada con «' + q.replace(/[<&"]/g, '') + '». Prueba con «mate», «siciliana» o «Morphy».</li>';
    res.forEach(function (x, i) {
      if (x.g !== g) { g = x.g; h += '<li class="aa-pal-g" role="presentation">' + g + '</li>'; }
      var bloq = '';
      if (x.g === 'Lecciones' && window.AA_UI && window.AA_UI.canOpen) {
        var c = window.AA_UI.canOpen(x.r.slice(8));
        if (c && c.ok === false) bloq = '<i class="aa-pal-lock" title="' + esc(c.why || 'Bloqueada') + '">🔒 bloqueada</i>';
      }
      h += '<li role="option" id="aa-pal-' + i + '" data-i="' + i + '"><b>' + esc(x.t) + bloq + '</b><small>' + esc(x.d).slice(0, 90) + '</small></li>';
    });
    ul.innerHTML = h; marcarSel();
  }
  function esc(s) { return String(s).replace(/[<&>"]/g, function (c) { return { '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function marcarSel() {
    pal.querySelectorAll('[data-i]').forEach(function (li) { var on = +li.dataset.i === sel; li.classList.toggle('on', on); li.setAttribute('aria-selected', on); if (on) li.scrollIntoView({ block: 'nearest' }); });
    pal.querySelector('input').setAttribute('aria-activedescendant', 'aa-pal-' + sel);
  }
  function abrirRes(x) { cerrarPaleta(); ir(x.r); }
  function abrirPaleta() {
    cerrarMas();
    if (!pal) crearPaleta();
    ultimoFoco = document.activeElement;
    pal.classList.add('abierta'); document.documentElement.classList.add('aa-mas-on');
    var inp = pal.querySelector('input'); inp.value = ''; sel = 0; pintar('');
    inp.focus();
  }
  function cerrarPaleta() {
    if (!pal || !pal.classList.contains('abierta')) return;
    pal.classList.remove('abierta'); document.documentElement.classList.remove('aa-mas-on');
    if (ultimoFoco && ultimoFoco.focus) try { ultimoFoco.focus(); } catch (e) {}
  }
  window.AA_BUSCAR = abrirPaleta;
  document.addEventListener('keydown', function (e) {
    var t = e.target, escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pal && pal.classList.contains('abierta') ? cerrarPaleta() : abrirPaleta(); }
    else if (e.key === '/' && !escribiendo && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); abrirPaleta(); }
  });
  function asegurarBuscar() {
    var rail = document.querySelector('.rail'), ul = rail && rail.querySelector('ul');
    if (!ul || rail.querySelector('.aa-buscar')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'aa-buscar';
    b.innerHTML = IC.search + '<span>Buscar</span><kbd>Ctrl K</kbd>';
    b.setAttribute('aria-label', 'Buscar lecciones, aperturas, finales y partidas (Ctrl+K)');
    b.addEventListener('click', abrirPaleta);
    rail.insertBefore(b, ul);
    var ins = document.createElement('button'); ins.type = 'button'; ins.className = 'aa-instalar';
    ins.innerHTML = IC.install + '<span>Instalar la app</span>';
    ins.addEventListener('click', instalar);
    rail.appendChild(ins);
  }

  /* ---------- Atajos de teclado: «?» ayuda · g + letra para ir a una sección ---------- */
  var IRA = { i: 'inicio', t: 'tactica', j: 'jugar', a: 'aperturas', f: 'finales', p: 'partidas', n: 'analisis', e: 'evaluar', m: 'memoria', c: 'clasificacion', r: 'progreso', d: 'problema-del-dia', o: 'coordenadas' };
  var NOMBRES = { i: 'Aprender', t: 'Táctica', j: 'Jugar', a: 'Aperturas', f: 'Finales', p: 'Partidas', n: 'Análisis', e: 'Evaluar', m: 'Memoria', c: 'Clasificación', r: 'Progreso', d: 'Problema del día', o: 'Coordenadas' };
  var gPend = 0, ayuda = null;
  function abrirAyuda() {
    if (!ayuda) {
      ayuda = document.createElement('div'); ayuda.className = 'aa-pal aa-atajos'; ayuda.setAttribute('role', 'dialog'); ayuda.setAttribute('aria-modal', 'true'); ayuda.setAttribute('aria-label', 'Atajos de teclado');
      ayuda.innerHTML = '<div class="aa-pal-fondo" data-cerrar></div><div class="aa-pal-caja" tabindex="-1"><h2>Atajos de teclado</h2><dl>' +
        '<dt><kbd>Ctrl</kbd> + <kbd>K</kbd> o <kbd>/</kbd></dt><dd>Buscar lecciones, aperturas, finales y partidas</dd>' +
        '<dt><kbd>?</kbd></dt><dd>Mostrar esta ayuda</dd>' +
        Object.keys(IRA).map(function (k) { return '<dt><kbd>g</kbd> <kbd>' + k + '</kbd></dt><dd>Ir a ' + NOMBRES[k] + '</dd>'; }).join('') +
        '<dt><kbd>e</kbd><kbd>4</kbd>, <kbd>C</kbd><kbd>f</kbd><kbd>3</kbd>…</dt><dd>En un tablero: escribe la jugada y se hace sola (Enter si hay dudas)</dd>' +
        '<dt><kbd>Esc</kbd></dt><dd>Cerrar ventanas</dd></dl></div>';
      ayuda.addEventListener('click', function (e) { if (e.target.closest('[data-cerrar]')) cerrarAyuda(); });
      ayuda.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarAyuda(); });
      document.body.appendChild(ayuda);
    }
    ultimoFoco = document.activeElement;
    ayuda.classList.add('abierta'); document.documentElement.classList.add('aa-mas-on'); ayuda.querySelector('.aa-pal-caja').focus();
  }
  function cerrarAyuda() { if (!ayuda || !ayuda.classList.contains('abierta')) return; ayuda.classList.remove('abierta'); document.documentElement.classList.remove('aa-mas-on'); if (ultimoFoco && ultimoFoco.focus) try { ultimoFoco.focus(); } catch (e) {} }
  document.addEventListener('keydown', function (e) {
    var t = e.target, escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (escribiendo || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.aa-pal.abierta, .aa-mas-hoja.abierta')) return;
    if (e.key === '?') { e.preventDefault(); abrirAyuda(); return; }
    if (e.key === 'g') { gPend = Date.now(); return; }
    if (gPend && Date.now() - gPend < 1200 && IRA[e.key]) { e.preventDefault(); gPend = 0; ir(IRA[e.key]); return; }
    gPend = 0;
  });

  /* ---------- Aviso de conexión ---------- */
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'aa-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('ver'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('ver'); }, 3800);
  }
  window.AA_TOAST = toast;
  window.addEventListener('offline', function () { toast('Sin conexión: puedes seguir con lecciones, táctica y partidas guardadas.'); });
  window.addEventListener('online', function () { toast('Conexión recuperada.'); });

  /* ---------- Botón de apoyo: en el móvil vive en «Más» ---------- */
  function apoyo() {
    var h = document.querySelector('[data-apoyo="kofi"]');
    if (h) h.classList.toggle('aa-oculto-movil', MQ.matches);
  }

  var pend = false;
  function tick() {
    pend = false;
    asegurarMas(); asegurarBuscar(); indiceTomos(); apoyo();
  }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true });
  if (MQ.addEventListener) MQ.addEventListener('change', apoyo);
})();
