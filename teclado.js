/* Ajedrez Academy · Mover escribiendo la jugada en cualquier tablero activo.
   Acepta notación española (Cf3, Axb5, Dd1, Tfe1, O-O), inglesa (Nf3, Bxb5) y de coordenadas (e2e4).
   La jugada se hace sola cuando no hay duda; si la hay, Enter elige la primera sugerencia. */
(function () {
  'use strict';
  var EN2ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
  var buf = '', burbuja = null, tOcultar = 0;

  function tablero() {
    var t = window.AA_TABLERO;
    if (!t || !t.el || !t.el.current || !document.contains(t.el.current)) return null;
    return t;
  }
  function es(san) { return san.replace(/^([KQRBN])/, function (a, d) { return EN2ES[d]; }).replace(/=([QRBN])/, function (a, d) { return '=' + EN2ES[d]; }); }
  function limpia(s) { return s.replace(/[+#x:=!?\s-]/g, '').replace(/0/g, 'O'); }
  function candidatos(t) {
    var UI = window.AA_UI, ch = new UI.Chess(t.fen), out = [];
    ch.legal().forEach(function (m) {
      var uci = ch.uci(m), san = ch.san(m);
      out.push({ uci: uci, san: san, es: es(san), k: [limpia(t.es ? es(san) : san), uci] });
    });
    return out;
  }
  function buscar(t, b) {
    var c = candidatos(t), q = limpia(b);
    if (!q) return { exactos: [], pref: [] };
    var exac = c.filter(function (x) { return x.k.indexOf(q) >= 0; });
    var pref = c.filter(function (x) { return x.k.some(function (k) { return k.indexOf(q) === 0; }); });
    if (!exac.length && !pref.length) { // sin distinguir mayúsculas (p. ej. «cf3»)
      var ql = q.toLowerCase();
      exac = c.filter(function (x) { return x.k.some(function (k) { return k.toLowerCase() === ql; }); });
      pref = c.filter(function (x) { return x.k.some(function (k) { return k.toLowerCase().indexOf(ql) === 0; }); });
    }
    return { exactos: exac, pref: pref };
  }
  function pintar(t, r, aviso) {
    if (!burbuja) {
      burbuja = document.createElement('div'); burbuja.className = 'aa-tecla'; burbuja.setAttribute('role', 'status'); burbuja.setAttribute('aria-live', 'polite');
      document.body.appendChild(burbuja);
    }
    var b = t.el.current.getBoundingClientRect();
    burbuja.style.left = (b.left + b.width / 2) + 'px';
    var abajo = b.bottom + 64 < innerHeight;
    burbuja.style.top = (abajo ? b.bottom + 10 : b.bottom - 14) + 'px';
    burbuja.classList.toggle('abajo', abajo);
    var nota = function (x) { return t.es ? x.es : x.san; };
    var sug = r ? r.pref.slice(0, 5).map(function (x, i) { return '<span class="' + (i === 0 ? 'on' : '') + '">' + nota(x) + '</span>'; }).join('') : '';
    burbuja.innerHTML = '<b>' + (buf || '…') + '</b>' + (aviso ? '<em>' + aviso + '</em>' : sug ? '<span class="aa-tecla-s">' + sug + '</span>' : '<em>Escribe la jugada: ' + (t.es ? 'e4, Cf3, O-O' : 'e4, Nf3, O-O') + '</em>');
    burbuja.classList.add('ver');
    clearTimeout(tOcultar);
    tOcultar = setTimeout(function () { burbuja.classList.remove('ver'); buf = ''; }, buf ? 6000 : 2500);
  }
  function jugar(t, x) {
    buf = '';
    var ok = t.mover(x.uci.slice(0, 2), x.uci.slice(2, 4));
    if (burbuja) burbuja.classList.remove('ver');
    if (ok === false && window.AA_TOAST) window.AA_TOAST('No se pudo hacer ' + (t.es ? x.es : x.san) + ' ahora.');
  }
  document.addEventListener('keydown', function (e) {
    var t = tablero(); if (!t) { buf = ''; return; }
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.aa-pal.abierta, .aa-mas-hoja.abierta, [role=dialog][aria-modal=true]:not(.aa-pal):not(.aa-mas-hoja)')) return;
    var k = e.key;
    if (k === 'Escape' && buf) { buf = ''; e.preventDefault(); e.stopPropagation(); if (burbuja) burbuja.classList.remove('ver'); return; }
    if (k === 'Backspace' && buf) { buf = buf.slice(0, -1); e.preventDefault(); e.stopPropagation(); pintar(t, buscar(t, buf)); return; }
    if (k === 'Enter' && buf) {
      e.preventDefault(); e.stopPropagation();
      var r = buscar(t, buf), x = r.exactos[0] || (r.pref.length === 1 ? r.pref[0] : null);
      if (x) jugar(t, x); else { pintar(t, r, 'No hay ninguna jugada «' + buf + '» aquí'); if (window.AA_UI) window.AA_UI.sound('wrong'); }
      return;
    }
    if (k.length !== 1 || !/[a-hA-Z0-9xX=+#\-]/.test(k)) return;
    if (!buf && !/[a-hKQRBNCADTOo0]/.test(k)) return; // empieza por pieza, columna o enroque
    e.preventDefault(); e.stopPropagation();
    buf += k;
    var r2 = buscar(t, buf);
    if (!r2.pref.length && !r2.exactos.length) { pintar(t, r2, 'Ninguna jugada empieza así'); return; }
    // se juega sola si solo hay una jugada que encaje del todo y ninguna más larga empieza igual
    if (r2.exactos.length === 1 && r2.pref.length === 1) { jugar(t, r2.exactos[0]); return; }
    pintar(t, r2);
  }, true);
})();
