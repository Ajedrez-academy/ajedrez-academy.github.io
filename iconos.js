/* Ajedrez Academy · iconos propios (sustituyen a los emojis).
   Trazo redondeado de 24 px como los del menú; heredan el color del texto (currentColor).
   Uso: AA_ICONO('diana')  →  '<svg …>…</svg>'   ·   AA_ICONO_URL('diana') para CSS (mask-image). */
(function () {
  'use strict';
  var F = 'fill="currentColor" stroke="none"';
  var P = {
    // piezas
    rey: '<path d="M12 2.5v4.5M9.8 4.7h4.4"/><path d="M7.2 20.5h9.6M8.2 20.5l.9-6.4h5.8l.9 6.4"/><path d="M9.1 14.1C6.4 12.8 5.6 9 8.6 8h6.8c3 1 2.2 4.8-.5 6.1"/>',
    dama: '<path d="M5 9.5l2.2 6.6h9.6L19 9.5l-4.2 3.2L12 6l-2.8 6.7z"/><circle cx="5" cy="8.2" r="1.4"/><circle cx="12" cy="4.6" r="1.4"/><circle cx="19" cy="8.2" r="1.4"/><path d="M7 20.5h10M7.2 16.1l-.6 4.4M16.8 16.1l.6 4.4"/>',
    torre: '<path d="M6.5 3.5h2.6v2.6h1.6V3.5h2.6v2.6h1.6V3.5h2.6v4.4l-2 1.8v6.6l2 1.9v2.3h-11v-2.3l2-1.9V9.7l-2-1.8z"/>',
    alfil: '<circle cx="12" cy="3.6" r="1.4"/><path d="M12 5.6c-3.2 2.8-4.4 5.9-2.4 9h4.8c2-3.1.8-6.2-2.4-9z"/><path d="M13.4 8.4l-2.6 2.8M9.4 14.6l-.9 5.9M14.6 14.6l.9 5.9M7.5 20.5h9"/>',
    caballo: '<path d="M7.5 20.5h10M9 20.5c0-3.6 1.2-5.7 3.4-7.6-2.1.3-4.1-.4-5.2-2.2l2.2-3.6 2-.8.9-2.3 2.1 2.6c2.8.8 4.6 3.6 4.6 7.2v6.7"/><circle cx="11.2" cy="8.4" r=".9" ' + F + '/>',
    peon: '<circle cx="12" cy="6.6" r="2.9"/><path d="M9.6 10.6h4.8M10.3 10.6c0 3-1.8 5.1-2.8 7.9h9c-1-2.8-2.8-4.9-2.8-7.9M6.5 20.5h11"/>',
    // ideas de aperturas
    centro: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 3.5v17M3.5 12h17"/><circle cx="12" cy="12" r="2.4" ' + F + '/>',
    diana: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" ' + F + '/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    clava: '<path d="M9 3h6l-1.2 6.2 3.2 3.3H7l3.2-3.3z"/><path d="M12 12.5V21"/>',
    presiona: '<path d="M4.5 19.5L17 7"/><path d="M9.5 6.5h8v8"/>',
    escudo: '<path d="M12 3l7.5 2.8v6c0 4.6-3.2 7.7-7.5 9.2-4.3-1.5-7.5-4.6-7.5-9.2v-6z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>',
    diagonal: '<path d="M5 19L18 6"/><circle cx="5" cy="19" r="1.8" ' + F + '/><path d="M12 6h6v6"/>',
    rayo: '<path d="M13 2.5L4.5 14h6.8l-1.1 7.5L19.5 10h-6.9z"/>',
    captura: '<path d="M6 6l12 12M18 6L6 18"/>',
    libro: '<path d="M3.5 5.2c0-1 .8-1.7 1.8-1.7H11v16.7H5.3c-1 0-1.8.8-1.8 1.8zM20.5 5.2c0-1-.8-1.7-1.8-1.7H13v16.7h5.7c1 0 1.8.8 1.8 1.8z"/>',
    espadas: '<path d="M4 4l9.5 9.5M4 4h4.2M4 4v4.2M20 4l-9.5 9.5M20 4h-4.2M20 4v4.2M6.5 14.5l3 3M17.5 14.5l-3 3M4.8 19.2l2.4-2.4M19.2 19.2l-2.4-2.4"/>',
    aviso: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.6"/><circle cx="12" cy="17.3" r=".9" ' + F + '/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    candado: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.2" ' + F + '/>',
    llama: '<path d="M12 21.5c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.3-5.4 3.7-7.6.3 1.9 1.2 3 2.5 3.4-.3-3.4.9-6.5 3.1-8.6.6 3.5 5.7 5.9 5.7 12.3 0 3.6-2.6 6.7-8.5 6.7z" ' + F + '/>',
    check: '<path d="M5 12.6l4.6 4.6L19 7.4"/>',
    trofeo: '<path d="M7.2 3.5h9.6v5.2a4.8 4.8 0 0 1-9.6 0z"/><path d="M7.2 5.6H4.3v1.2a3 3 0 0 0 2.9 3M16.8 5.6h2.9v1.2a3 3 0 0 1-2.9 3M12 13.5v3.6M8.3 20.5h7.4M9.6 17.1h4.8"/>',
    tablas: '<circle cx="12" cy="12" r="8.5"/><path d="M8 10h8M8 14h8"/>',
    dado: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.7" cy="8.7" r="1.3" ' + F + '/><circle cx="15.3" cy="15.3" r="1.3" ' + F + '/><circle cx="15.3" cy="8.7" r="1.3" ' + F + '/><circle cx="8.7" cy="15.3" r="1.3" ' + F + '/><circle cx="12" cy="12" r="1.3" ' + F + '/>',
    taza: '<path d="M4 9h12v4.8A5.2 5.2 0 0 1 10.8 19H9.2A5.2 5.2 0 0 1 4 13.8z"/><path d="M16 10.2h1.4a2.6 2.6 0 0 1 0 5.2H16M8 3.5v2.8M12 3.5v2.8"/>',
    reloj: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.2l2.8 1.8M9.8 2.5h4.4"/>',
    corazon: '<path d="M12 20.3s-7.6-4.6-7.6-10.4A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.6 2.6c0 5.8-7.6 10.4-7.6 10.4z" ' + F + '/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" ' + F + '/>',
    volver: '<path d="M9 14.5L4 9.5 9 4.5"/><path d="M4 9.5h10.5a5 5 0 0 1 0 10H12"/>',
    // temas tácticos
    pasillo: '<rect x="3.5" y="4" width="17" height="5.5" rx="1.2"/><circle cx="7.5" cy="14.5" r="1.6"/><circle cx="12" cy="14.5" r="1.6"/><circle cx="16.5" cy="14.5" r="1.6"/><path d="M5.5 19.5h13"/>',
    tenedor: '<path d="M12 21v-8.5M12 12.5L6.2 5.5M12 12.5l5.8-7"/><circle cx="6" cy="4.8" r="2"/><circle cx="18" cy="4.8" r="2"/>',
    enfilada: '<path d="M3 12h17M16 8l4 4-4 4"/><circle cx="8" cy="12" r="2.3" ' + F + '/><circle cx="13" cy="12" r="1.6"/>',
    descubierta: '<path d="M3 12h6M15 12h6M17.5 8.5L21 12l-3.5 3.5"/><path d="M12 4.5v4M12 15.5v4"/><circle cx="12" cy="12" r="1.6" ' + F + '/>',
    regalo: '<rect x="4" y="9" width="16" height="11.5" rx="1.6"/><path d="M12 9v11.5M4 13.5h16"/><path d="M12 9c-1.6-3.6-5.6-4-5.6-1.6S12 9 12 9zm0 0c1.6-3.6 5.6-4 5.6-1.6S12 9 12 9z"/>',
    desvia: '<path d="M5 19.5c0-8 5-12.5 12.5-12.5"/><path d="M13.5 3l4 4-4 4"/>',
    iman: '<path d="M6 3.5v8.2a6 6 0 0 0 12 0V3.5h-4v8.2a2 2 0 0 1-4 0V3.5z"/><path d="M6 7.5h4M14 7.5h4"/>',
    pausa: '<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>',
    despeja: '<path d="M4 6.5v11"/><path d="M8 12h12M16 8l4 4-4 4"/>',
    interfiere: '<path d="M3 12h6.5M14.5 12H21"/><rect x="9.5" y="6.5" width="5" height="11" rx="1.4"/>',
    rayosx: '<path d="M3 12h18M17 8.5l4 3.5-4 3.5"/><circle cx="9" cy="12" r="2.8"/>',
    jaula: '<rect x="4" y="4" width="16" height="16" rx="2.4"/><path d="M9.3 4v16M14.7 4v16"/><circle cx="12" cy="12" r="1.5" ' + F + '/>',
    pluma: '<path d="M20 4C11 4 6.5 9.5 6.5 17.5L4 20"/><path d="M6.5 17.5c6.5 0 12-4.2 13.5-13.5M10 14h5"/>',
    balanza: '<path d="M12 3.5v17M7.5 20.5h9M5 7h14M5 7l-2.8 6.5a2.8 2.8 0 0 0 5.6 0zM19 7l-2.8 6.5a2.8 2.8 0 0 0 5.6 0z"/>',
    corona: '<path d="M3.5 8l4.2 4.8L12 5.5l4.3 7.3L20.5 8l-2 11h-13z"/><path d="M6 21h12"/>',
    jaque: '<path d="M12 5v14M5 12h14"/>'
  };
  function svg(n, cls) {
    var d = P[n]; if (!d) return '';
    return '<svg class="aa-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>';
  }
  window.AA_ICONO = svg;
  window.AA_ICONO_URL = function (n) {
    var s = svg(n).replace(/currentColor/g, '#000').replace('class="aa-ic"', 'xmlns="http://www.w3.org/2000/svg"');
    return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  };
  function color(n, c) { var u = svg(n).replace(/currentColor/g, c).replace('class="aa-ic"', 'xmlns="http://www.w3.org/2000/svg"'); return 'url("data:image/svg+xml,' + encodeURIComponent(u) + '")'; }
  var COLOR = { 'rey-n': ['rey', '#1f2229'], 'rey-b': ['rey', '#ffffff'], 'check-b': ['check', '#ffffff'], 'check-v': ['check', '#1d8a44'] };
  // Variables CSS con cada icono, para usarlos en CSS con mask-image: var(--ic-diana) …
  var css = ':root{' + Object.keys(P).map(function (k) { return '--ic-' + k + ':' + window.AA_ICONO_URL(k) + ';'; }).join('') + Object.keys(COLOR).map(function (k) { return '--icc-' + k + ':' + color(COLOR[k][0], COLOR[k][1]) + ';'; }).join('') + '}' +
    '.aa-ic{display:inline-block;vertical-align:-.15em;flex:none}' +
    '.ap-chip i .aa-ic,.ap-ideas i .aa-ic,.ap-tipo .aa-ic,.vs-idea-t>i .aa-ic,.vs-fh-fam>i .aa-ic,.vs-fam i .aa-ic,.vs-obj-ic .aa-ic,.pd-ico .aa-ic,.pd-d i .aa-ic{width:62%;height:62%}' +
    '.ap-plan i .aa-ic{width:1em;height:1em}.vx-lib-deco .aa-ic{margin-right:.12em}.aa-pal-lock .aa-ic{width:.95em;height:.95em}' +
    '.hearts svg,.rush-lives svg{width:1.05em;height:1.05em;vertical-align:-.15em}' +
    '.risky-note::before{content:"";display:inline-block;width:1.1em;height:1.1em;margin-right:6px;vertical-align:-.2em;background:currentColor;-webkit-mask:var(--ic-aviso) center/contain no-repeat;mask:var(--ic-aviso) center/contain no-repeat}';
  var st = document.createElement('style'); st.id = 'aa-iconos'; st.textContent = css; (document.head || document.documentElement).appendChild(st);
})();
