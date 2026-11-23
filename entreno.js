/* Ajedrez Academy · mejoras de uso en Táctica, Finales y Análisis.
   - Finales: progreso de finales dominados, aviso si la teoría está bloqueada y consejo propio de cada final.
   - Análisis: evaluaciones coloreadas por bando y botón «Pegar» para cargar una partida copiada. */
(function () {
  'use strict';
  function iso(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function store() { try { return JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) { return {}; } }
  function toast(m) { if (window.AA_TOAST) window.AA_TOAST(m); }

  /* ---------------- FINALES ---------------- */
  function finPorTitulo() { var m = {}; ((window.AA_UI && window.AA_UI.endgames) || []).forEach(function (f) { m[f.title.trim()] = f; }); return m; }
  function finales() {
    var drills = document.querySelector('.main .drills'); if (!drills || !window.AA_UI) return;
    var F = finPorTitulo(), hechos = store().endgames || {}, total = 0, dom = 0;
    drills.querySelectorAll('.drill').forEach(function (c) {
      var t = (c.querySelector('.drill-txt > b') || {}).textContent, f = F[(t || '').trim()]; if (!f) return;
      total++; var ok = !!hechos[f.id]; if (ok) dom++;
      c.classList.toggle('ex-dom', ok);
      // teoría bloqueada: avisa en vez de llevar a una pantalla de «Lección bloqueada»
      var btns = c.querySelectorAll('.row-actions button'), teo = btns.length > 1 ? btns[btns.length - 1] : null;
      if (teo && f.lesson && window.AA_UI.canOpen && !teo.dataset.ex) {
        var co = window.AA_UI.canOpen(f.lesson);
        if (co && co.ok === false) {
          teo.dataset.ex = '1'; teo.classList.add('ex-lock'); teo.title = 'La teoría de este final se desbloquea al avanzar en el camino';
          teo.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toast('La teoría de este final se desbloquea al avanzar en el camino de lecciones. Puedes practicarlo ya.'); }, true);
        } else teo.dataset.ex = '0';
      }
    });
    if (!total) return;
    var head = drills.parentElement.querySelector(':scope > .ex-fin-prog');
    if (!head) { head = document.createElement('div'); head.className = 'ex-fin-prog'; drills.parentElement.insertBefore(head, drills); }
    var html = '<span><b>' + dom + '</b> de ' + total + ' finales dominados</span><i><em style="width:' + Math.round(dom / total * 100) + '%"></em></i>';
    if (head.dataset.k !== html) { head.dataset.k = html; head.innerHTML = html; }
  }
  var GENERICO = 'Tu turno. Desarrolla tus piezas y controla el centro.';
  function finalEnJuego() {
    if (!/^#final-/.test(location.hash)) return;
    var pg = document.querySelector('.playgame'); if (!pg) return;
    var tit = (pg.querySelector('.drill-title b') || {}).textContent, f = finPorTitulo()[(tit || '').trim()];
    var p = pg.querySelector('.coach-txt > p');
    if (p && f && p.textContent.trim() === GENERICO) p.textContent = f.blurb;
    var rival = pg.querySelector('.pg-player:first-child > b');
    if (rival && rival.textContent !== 'El motor defiende') rival.textContent = 'El motor defiende';
  }

  /* ---------------- ANÁLISIS ---------------- */
  function analisis() {
    if (!/^#analisis/.test(location.hash)) return;
    document.querySelectorAll('.lines-card .eng-line > b').forEach(function (b) {
      var t = b.textContent.trim(), neg = /^[-−]/.test(t), cls = /^[+]?0\.0$/.test(t) ? 'ex-ig' : neg ? 'ex-n' : 'ex-b';
      if (!b.classList.contains(cls)) { b.classList.remove('ex-ig', 'ex-n', 'ex-b'); b.classList.add(cls); }
    });
    var fin = document.querySelector('.main .fen-in'); if (!fin || fin.querySelector('.ex-pegar') || !navigator.clipboard || !navigator.clipboard.readText) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-ghost ex-pegar'; btn.innerHTML = '<span>Pegar</span>';
    btn.title = 'Pega la partida o el FEN que hayas copiado';
    btn.addEventListener('click', function () {
      navigator.clipboard.readText().then(function (txt) {
        txt = (txt || '').trim(); if (!txt) { toast('No hay nada copiado.'); return; }
        var inp = fin.querySelector('input'), set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        set.call(inp, txt); inp.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () { var c = Array.prototype.find.call(fin.querySelectorAll('button'), function (x) { return /Cargar/i.test(x.textContent); }); if (c && !c.disabled) c.click(); }, 60);
      }, function () { toast('Tu navegador no deja leer lo copiado: pégalo en la caja con Ctrl+V.'); });
    });
    fin.insertBefore(btn, fin.querySelector('button'));
  }

  var pend = false;
  function tick() { pend = false; try { finales(); finalEnJuego(); analisis(); } catch (e) { if (window.console) console.warn('entreno', e); } }
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(tick); } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
