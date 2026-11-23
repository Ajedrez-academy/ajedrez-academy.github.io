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
    Object.keys(dia).forEach(function (d) { if (dia[d] && dia[d].ok) set[d] = (set[d] || 0) + 1; });
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
  var pend = false;
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(function () { pend = false; montar(); }); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
