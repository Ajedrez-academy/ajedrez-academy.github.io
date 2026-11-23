/* Ajedrez Academy · «Tu actividad» en Progreso: calendario de las últimas 18 semanas,
   racha récord y días activos (lecciones, táctica, partidas y problema del día). */
(function () {
  'use strict';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function datos() {
    var s = {}, dia = {};
    try { s = JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) {}
    try { dia = JSON.parse(localStorage.getItem('aa-diario')) || {}; } catch (e) {}
    var set = {};
    (s.days || []).forEach(function (d) { set[d] = (set[d] || 0) + 2; });
    try { var H = JSON.parse(localStorage.getItem('aa-historial')) || {}; Object.keys(H).forEach(function (d) { if (!set[d]) set[d] = 2; }); } catch (e) {}
    Object.keys(dia).forEach(function (d) { if (dia[d] && dia[d].ok && !dia[d].tarde) set[d] = (set[d] || 0) + 1; });
    return set;
  }
  function pintar(sec) {
    var act = datos(), SEM = 18, hoy = new Date(); hoy.setHours(12);
    var ini = new Date(hoy); ini.setDate(ini.getDate() - ((hoy.getDay() + 6) % 7) - (SEM - 1) * 7);
    var celdas = '', meses = '', total = 0, mejor = 0, cur = 0, mesPrev = -1;
    for (var w = 0; w < SEM; w++) {
      var col = '';
      for (var d = 0; d < 7; d++) {
        var f = new Date(ini); f.setDate(ini.getDate() + w * 7 + d);
        var k = iso(f), v = act[k] || 0, fut = f > hoy;
        if (d === 0 && f.getMonth() !== mesPrev) { meses += '<span style="grid-column:' + (w + 1) + '">' + MESES[f.getMonth()] + '</span>'; mesPrev = f.getMonth(); }
        if (!fut) { if (v) { total++; cur++; mejor = Math.max(mejor, cur); } else if (k !== iso(hoy)) cur = 0; }
        col += '<i class="ac-c' + (fut ? ' fut' : v >= 3 ? ' n3' : v >= 2 ? ' n2' : v ? ' n1' : '') + (k === iso(hoy) ? ' hoy' : '') + '" title="' + f.getDate() + ' ' + MESES[f.getMonth()] + (v ? ' · activo' : '') + '"></i>';
      }
      celdas += '<span class="ac-w">' + col + '</span>';
    }
    var semana = 0; for (var i = 0; i < 7; i++) { var x = new Date(hoy); x.setDate(hoy.getDate() - i); if (act[iso(x)]) semana++; }
    sec.innerHTML = '<div class="ac-head"><h2>Tu actividad</h2><div class="ac-nums">' +
      '<span><b>' + semana + '/7</b><small>esta semana</small></span><span><b>' + total + '</b><small>días activos</small></span><span><b>' + mejor + '</b><small>racha récord</small></span></div></div>' +
      '<div class="ac-scroll"><div class="ac-meses" style="grid-template-columns:repeat(' + SEM + ',1fr)">' + meses + '</div>' +
      '<div class="ac-grid"><span class="ac-dias"><i>L</i><i></i><i>X</i><i></i><i>V</i><i></i><i>D</i></span>' + celdas + '</div></div>' +
      (total ? '<p class="muted small ac-pie">Cada casilla es un día. Más intensa cuando además resolviste el problema del día.</p>'
             : '<p class="muted small ac-pie">Aún no hay actividad. Empieza con el <a href="#problema-del-dia">problema del día</a>: lleva un minuto.</p>');
  }
  function montar() {
    var pg = document.querySelector('.progress'); if (!pg) return;
    var sec = pg.querySelector(':scope > .aa-actividad');
    var firma = JSON.stringify(datos()).length + ':' + iso(new Date());
    if (sec && sec.dataset.f === firma) return;
    if (!sec) {
      sec = document.createElement('section'); sec.className = 'card aa-actividad';
      var tiles = pg.querySelectorAll(':scope > .stat-tiles'), ref = tiles.length ? tiles[tiles.length - 1].nextSibling : pg.children[1];
      pg.insertBefore(sec, ref);
    }
    sec.dataset.f = firma; pintar(sec);
  }
  /* ---------- Tu evolución: foto diaria de tu nivel de táctica, XP y lecciones ---------- */
  var HK = 'aa-historial', ultFoto = 0;
  function foto() {
    if (Date.now() - ultFoto < 4000) return; ultFoto = Date.now();
    var s; try { s = JSON.parse(localStorage.getItem('chess-academy/v1')); } catch (e) {}
    if (!s || !s.puzzle) return;
    var l = 0; Object.keys(s.lessons || {}).forEach(function (k) { if (s.lessons[k] && s.lessons[k].done) l++; });
    var hoy = iso(new Date()), H = {};
    try { H = JSON.parse(localStorage.getItem(HK)) || {}; } catch (e) {}
    var v = { t: s.puzzle.rating, x: s.xp || 0, l: l }, ant = H[hoy];
    if (ant && ant.t === v.t && ant.x === v.x && ant.l === v.l) return;
    if (!ant && !s.puzzle.solved && !s.xp) return; // aún no ha hecho nada
    H[hoy] = v;
    var ks = Object.keys(H).sort(); while (ks.length > 400) delete H[ks.shift()];
    try { localStorage.setItem(HK, JSON.stringify(H)); } catch (e) {}
  }
  function grafica(sec) {
    var H = {}; try { H = JSON.parse(localStorage.getItem(HK)) || {}; } catch (e) {}
    var ks = Object.keys(H).sort().slice(-90), pts = ks.map(function (k) { return { k: k, v: H[k].t }; });
    if (pts.length < 2) {
      sec.innerHTML = '<div class="ac-head"><h2>Tu evolución</h2></div><p class="muted small ac-pie">Aquí verás cómo sube tu nivel de táctica día a día. Resuelve problemas hoy y vuelve mañana para ver la primera línea.</p>';
      return;
    }
    var W = Math.max(280, Math.min(760, (sec.clientWidth || 680) - 40)), Hh = W < 500 ? 150 : 180, P = 28, min = Math.min.apply(null, pts.map(function (p) { return p.v; })), max = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    if (max - min < 100) { var m = (max + min) / 2; min = m - 50; max = m + 50; }
    var X = function (i) { return P + i * (W - 2 * P) / (pts.length - 1); }, Y = function (v) { return Hh - P - (v - min) * (Hh - 2 * P) / (max - min); };
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
    var area = d + ' L' + X(pts.length - 1) + ' ' + (Hh - P) + ' L' + P + ' ' + (Hh - P) + ' Z';
    var ini = pts[0].v, fin = pts[pts.length - 1].v, dif = fin - ini, l0 = H[ks[0]].l, l1 = H[ks[ks.length - 1]].l;
    var f = function (k) { var a = k.split('-'); return +a[2] + '/' + +a[1]; };
    sec.innerHTML = '<div class="ac-head"><h2>Tu evolución</h2><div class="ac-nums">' +
      '<span><b>' + fin + '</b><small>táctica hoy</small></span>' +
      '<span><b class="' + (dif >= 0 ? 'ev-up' : 'ev-down') + '">' + (dif >= 0 ? '+' : '') + dif + '</b><small>desde el ' + f(ks[0]) + '</small></span>' +
      '<span><b>+' + Math.max(0, l1 - l0) + '</b><small>lecciones</small></span></div></div>' +
      '<svg class="ev-svg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Nivel de táctica: de ' + ini + ' a ' + fin + '">' +
      '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + Y(max) + '" y2="' + Y(max) + '" class="ev-grid"/><line x1="' + P + '" x2="' + (W - P) + '" y1="' + Y(min) + '" y2="' + Y(min) + '" class="ev-grid"/>' +
      '<text x="' + (W - P) + '" y="' + (Y(max) - 6) + '" text-anchor="end" class="ev-t">' + Math.round(max) + '</text><text x="' + (W - P) + '" y="' + (Y(min) - 6) + '" text-anchor="end" class="ev-t">' + Math.round(min) + '</text>' +
      '<path d="' + area + '" class="ev-area"/><path d="' + d + '" class="ev-line"/>' +
      pts.map(function (p, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3) + '" class="ev-dot"><title>' + f(p.k) + ': ' + p.v + '</title></circle>'; }).join('') +
      '<text x="' + P + '" y="' + (Hh - 6) + '" class="ev-t">' + f(ks[0]) + '</text><text x="' + (W - P) + '" y="' + (Hh - 6) + '" text-anchor="end" class="ev-t">' + f(ks[ks.length - 1]) + '</text></svg>';
  }
  function montarEvo() {
    var act = document.querySelector('.progress > .aa-actividad'); if (!act) return;
    var sec = act.parentElement.querySelector(':scope > .aa-evolucion');
    var firma = (localStorage.getItem(HK) || '').length + iso(new Date());
    if (sec && sec.dataset.f === firma) return;
    if (!sec) { sec = document.createElement('section'); sec.className = 'card aa-actividad aa-evolucion'; act.parentElement.insertBefore(sec, act.nextSibling); }
    sec.dataset.f = firma; grafica(sec);
  }

  var pend = false;
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(function () { pend = false; foto(); montar(); montarEvo(); }); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
