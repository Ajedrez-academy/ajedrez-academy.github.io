/* Ajedrez Academy · Online (#online)
   1) Tus partidas de Lichess y Chess.com (datos públicos, solo con el nombre de usuario) y análisis con el motor de la app.
   2) Jugar en Lichess desde la app con la API «Board» de Lichess (OAuth con PKCE: la app nunca ve tu contraseña).
   Chess.com no ofrece una API para jugar desde otras webs, por eso con Chess.com solo hay historial. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var KC = 'aa-cuentas', KT = 'aa-lichess-token', KV = 'aa-lichess-pkce';
  var LI = 'https://lichess.org', CLIENT = 'ajedrez-academy';
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var EN2ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
  function ic(n) { return window.AA_ICONO ? window.AA_ICONO(n) : ''; }
  function leer(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function es(san) { return san.replace(/^([KQRBN])/, function (a, d) { return EN2ES[d]; }).replace(/=([QRBN])/, function (a, d) { return '=' + EN2ES[d]; }); }
  function fecha(ms) { var d = new Date(ms); return d.getDate() + ' ' + MES[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); }
  var RITMO = { ultraBullet: 'Ultrabala', bullet: 'Bala', blitz: 'Blitz', rapid: 'Rápida', classical: 'Clásica', correspondence: 'Por correspondencia', daily: 'Diaria' };

  /* ---------- Jugadas: SAN → UCI con las reglas de la app ---------- */
  function aUci(sans, fen) {
    var ch = new window.AA_UI.Chess(fen || undefined), out = [];
    for (var i = 0; i < sans.length; i++) { var t = sans[i]; if (!t) continue; var m = null; try { m = ch.parse(t); } catch (e) {} if (m == null) break; out.push(ch.uci(m)); ch.make(m); }
    return out;
  }
  function sansDePgn(pgn) {
    var cuerpo = pgn.replace(/\[[^\]]*\]\s*/g, '').replace(/\{[^}]*\}/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/\$\d+/g, ' ');
    return cuerpo.replace(/\d+\.(\.\.)?/g, ' ').replace(/1-0|0-1|1\/2-1\/2|\*/g, ' ').trim().split(/\s+/).filter(Boolean);
  }
  function tag(pgn, k) { var m = new RegExp('\\[' + k + ' "([^"]*)"\\]').exec(pgn); return m ? m[1] : ''; }

  /* ---------- Descargar partidas ---------- */
  function lichessPartidas(user, n) {
    return fetch(LI + '/api/games/user/' + encodeURIComponent(user) + '?max=' + n + '&opening=true&accuracy=true&moves=true', { headers: { Accept: 'application/x-ndjson' } })
      .then(function (r) { if (r.status === 404) throw new Error('No existe ese usuario en Lichess.'); if (!r.ok) throw new Error('Lichess no respondió (' + r.status + ').'); return r.text(); })
      .then(function (t) {
        var yo = user.toLowerCase();
        return t.split('\n').filter(Boolean).map(function (l) { return JSON.parse(l); }).filter(function (g) { return g.variant === 'standard' || g.variant === 'fromPosition'; }).map(function (g) {
          var w = g.players.white || {}, b = g.players.black || {}, wn = (w.user && w.user.name) || (w.aiLevel ? 'Stockfish ' + w.aiLevel : 'Anónimo'), bn = (b.user && b.user.name) || (b.aiLevel ? 'Stockfish ' + b.aiLevel : 'Anónimo');
          var color = (w.user && w.user.id === yo) ? 'w' : 'b';
          var res = g.winner ? (g.winner === (color === 'w' ? 'white' : 'black') ? 'win' : 'loss') : (/draw|stalemate/.test(g.status) || g.status === 'outoftime' && !g.winner ? 'draw' : (g.status === 'started' ? 'live' : 'draw'));
          var mio = color === 'w' ? w : b, suyo = color === 'w' ? b : w;
          return { fuente: 'lichess', id: g.id, url: LI + '/' + g.id + (color === 'b' ? '/black' : ''), color: color, rival: color === 'w' ? bn : wn, rivalElo: suyo.rating, miElo: mio.rating, dif: mio.ratingDiff,
            res: res, ritmo: RITMO[g.speed] || g.speed, t: g.lastMoveAt || g.createdAt, apertura: g.opening ? g.opening.name : '', jugadas: (g.moves || '').split(' ').filter(Boolean), fen: g.initialFen || null,
            precision: mio.analysis ? mio.analysis.accuracy : null, blancas: wn, negras: bn, resultado: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2' };
        });
      });
  }
  function chesscomPartidas(user, n) {
    var u = user.toLowerCase();
    return fetch('https://api.chess.com/pub/player/' + encodeURIComponent(u) + '/games/archives')
      .then(function (r) { if (r.status === 404) throw new Error('No existe ese usuario en Chess.com.'); if (!r.ok) throw new Error('Chess.com no respondió (' + r.status + ').'); return r.json(); })
      .then(function (a) {
        var arch = (a.archives || []).slice(-3).reverse(), out = [];
        var sig = function (i) {
          if (i >= arch.length || out.length >= n) return Promise.resolve(out.slice(0, n));
          return fetch(arch[i]).then(function (r) { return r.json(); }).then(function (d) { out = out.concat((d.games || []).slice().reverse()); return sig(i + 1); });
        };
        return sig(0);
      })
      .then(function (gs) {
        return gs.filter(function (g) { return g.rules === 'chess' && g.pgn; }).map(function (g) {
          var color = g.white.username.toLowerCase() === u ? 'w' : 'b', mio = color === 'w' ? g.white : g.black, suyo = color === 'w' ? g.black : g.white;
          var r = mio.result, res = r === 'win' ? 'win' : /agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(r) ? 'draw' : 'loss';
          var eco = tag(g.pgn, 'ECOUrl').split('/').pop().replace(/-/g, ' ').replace(/\.\.\./g, '…');
          var fen = tag(g.pgn, 'SetUp') === '1' ? tag(g.pgn, 'FEN') : null;
          return { fuente: 'chesscom', id: g.uuid || g.url, url: g.url, color: color, rival: suyo.username, rivalElo: suyo.rating, miElo: mio.rating, dif: null, res: res,
            ritmo: RITMO[g.time_class] || g.time_class, t: (g.end_time || 0) * 1000, apertura: eco, jugadas: sansDePgn(g.pgn), fen: fen,
            precision: g.accuracies ? g.accuracies[color === 'w' ? 'white' : 'black'] : null, blancas: g.white.username, negras: g.black.username, resultado: tag(g.pgn, 'Result') };
        });
      });
  }

  /* ---------- Analizar con el motor de la app (revisión temporal) ---------- */
  function analizar(p) {
    var UI = window.AA_UI, ucis = p.ucis || aUci(p.jugadas, p.fen);
    if (!ucis.length) { if (window.AA_TOAST) window.AA_TOAST('Esta partida no tiene jugadas para analizar.'); return; }
    var id = 'on' + Date.now().toString(36), startFen = p.fen || UI.START;
    UI.update(function (a) {
      a.games = [{ id: id, t: Date.now(), pgn: '', ucis: ucis, startFen: startFen, white: p.blancas, black: p.negras, result: p.resultado || '*', userColor: p.color, tmp: true }]
        .concat((a.games || []).filter(function (g) { return !g.tmp; })).slice(0, 40);
    });
    UI.go('revision-' + id);
  }

  /* ---------- OAuth con Lichess (PKCE) ---------- */
  function b64url(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function aleatorio(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a.buffer); }
  function volverA() { return location.origin + location.pathname; }
  function conectarLichess() {
    var verif = aleatorio(48), estado = aleatorio(12);
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(verif)).then(function (h) {
      sessionStorage.setItem(KV, JSON.stringify({ v: verif, s: estado }));
      location.href = LI + '/oauth?' + new URLSearchParams({ response_type: 'code', client_id: CLIENT, redirect_uri: volverA(), code_challenge_method: 'S256', code_challenge: b64url(h), scope: 'board:play challenge:write', state: estado }).toString();
    });
  }
  // Al volver de Lichess: ?code=…&state=…
  (function recogerCodigo() {
    var q = new URLSearchParams(location.search), code = q.get('code'), st = q.get('state');
    if (!code) { if (q.get('error')) { history.replaceState(null, '', volverA() + '#jugar'); setTimeout(function () { if (window.AA_TOAST) window.AA_TOAST('No se conectó la cuenta de Lichess.'); }, 1500); } return; }
    var pk = {}; try { pk = JSON.parse(sessionStorage.getItem(KV)) || {}; } catch (e) {}
    history.replaceState(null, '', volverA() + '#jugar');
    if (!pk.v || pk.s !== st) return;
    sessionStorage.removeItem(KV);
    fetch(LI + '/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: code, code_verifier: pk.v, redirect_uri: volverA(), client_id: CLIENT }).toString() })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.access_token) { guardar(KT, { t: d.access_token, exp: Date.now() + (d.expires_in || 3e7) * 1000 }); window.dispatchEvent(new Event('aa-lichess')); } })
      .catch(function () {});
  })();
  function token() { var t = leer(KT, null); return t && t.t && (!t.exp || t.exp > Date.now()) ? t.t : null; }
  function api(path, opts) { opts = opts || {}; opts.headers = Object.assign({ Authorization: 'Bearer ' + token() }, opts.headers || {}); return fetch(LI + path, opts); }
  function form(o) { return { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(o).toString() }; }
  // Lee un flujo NDJSON y llama a cb con cada objeto
  function flujo(path, cb, señal, opts) {
    return api(path, Object.assign({ signal: señal }, opts || {})).then(function (r) {
      if (!r.ok) throw new Error('Lichess: ' + r.status);
      var rd = r.body.getReader(), dec = new TextDecoder(), buf = '';
      function leerTrozo() { return rd.read().then(function (x) { if (x.done) return; buf += dec.decode(x.value, { stream: true }); var ls = buf.split('\n'); buf = ls.pop(); ls.forEach(function (l) { if (l.trim()) try { cb(JSON.parse(l)); } catch (e) {} }); return leerTrozo(); }); }
      return leerTrozo();
    });
  }

  function Historial() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var cuentas = leer(KC, {});
    var s1 = R.useState(cuentas.ultima || (cuentas.lichess ? 'lichess' : cuentas.chesscom ? 'chesscom' : 'lichess')), fuente = s1[0], setFuente = s1[1];
    var s2 = R.useState(cuentas[fuente] || ''), nombre = s2[0], setNombre = s2[1];
    var s3 = R.useState({ estado: 'nada', lista: [], error: '' }), d = s3[0], setD = s3[1];
    var s4 = R.useState('todas'), filtro = s4[0], setFiltro = s4[1];
    function cargar(f, n) {
      f = f || fuente; n = (n || nombre).trim(); if (!n) return;
      var c = leer(KC, {}); c[f] = n; c.ultima = f; guardar(KC, c);
      setD({ estado: 'cargando', lista: [], error: '' });
      (f === 'lichess' ? lichessPartidas(n, 30) : chesscomPartidas(n, 30))
        .then(function (l) { setD({ estado: 'ok', lista: l, error: '' }); })
        .catch(function (e) { setD({ estado: 'error', lista: [], error: e.message || 'No se pudo cargar.' }); });
    }
    R.useEffect(function () { if (nombre) cargar(fuente, nombre); }, []);
    var lista = d.lista.filter(function (p) { return filtro === 'todas' || p.res === filtro; });
    var tot = { win: 0, draw: 0, loss: 0 }; d.lista.forEach(function (p) { if (tot[p.res] != null) tot[p.res]++; });
    var n = d.lista.length || 1;
    var cambiar = function (f) { setFuente(f); var c = leer(KC, {}); setNombre(c[f] || ''); setD({ estado: 'nada', lista: [], error: '' }); if (c[f]) setTimeout(function () { cargar(f, c[f]); }, 0); };
    return h('div', { className: 'on-hist' },
      h('form', { className: 'card on-cuenta', onSubmit: function (e) { e.preventDefault(); cargar(); } },
        h('div', { className: 'on-fuentes' },
          ['lichess', 'chesscom'].map(function (f) { return h('button', { key: f, type: 'button', className: 'on-fuente f-' + f + (fuente === f ? ' on' : ''), onClick: function () { cambiar(f); } }, h('i', { className: 'on-logo' }, f === 'lichess' ? 'li' : 'c'), f === 'lichess' ? 'Lichess' : 'Chess.com'); })),
        h('label', { className: 'on-user' }, h('span', { dangerouslySetInnerHTML: { __html: ic('peon') } }),
          h('input', { value: nombre, onChange: function (e) { setNombre(e.target.value); }, placeholder: 'Tu nombre de usuario en ' + (fuente === 'lichess' ? 'Lichess' : 'Chess.com'), 'aria-label': 'Nombre de usuario', autoComplete: 'off', spellCheck: false })),
        h('button', { type: 'submit', className: 'btn btn-primary', disabled: !nombre.trim() || d.estado === 'cargando' }, h('span', null, d.estado === 'cargando' ? 'Cargando…' : 'Ver mis partidas')),
        h('p', { className: 'muted small on-nota' }, 'Solo leemos tus partidas públicas: no hace falta contraseña.')),
      d.estado === 'error' ? h('p', { className: 'on-error', role: 'alert' }, d.error) : null,
      d.estado === 'cargando' ? h('div', { className: 'on-cargando' }, [0, 1, 2, 3].map(function (k) { return h('div', { key: k, className: 'card on-fila on-esqueleto' }); })) : null,
      d.estado === 'ok' && d.lista.length ? h('div', { className: 'card on-resumen' },
        h('div', { className: 'on-barra', 'aria-label': tot.win + ' victorias, ' + tot.draw + ' tablas y ' + tot.loss + ' derrotas' },
          h('i', { className: 'w', style: { width: (tot.win / n * 100) + '%' } }), h('i', { className: 'd', style: { width: (tot.draw / n * 100) + '%' } }), h('i', { className: 'l', style: { width: (tot.loss / n * 100) + '%' } })),
        h('div', { className: 'on-cifras' },
          [['todas', d.lista.length, 'partidas'], ['win', tot.win, 'victorias'], ['draw', tot.draw, 'tablas'], ['loss', tot.loss, 'derrotas']].map(function (x) {
            return h('button', { key: x[0], type: 'button', className: 'on-cifra c-' + x[0] + (filtro === x[0] ? ' on' : ''), onClick: function () { setFiltro(x[0]); } }, h('b', null, x[1]), h('small', null, x[2]));
          }))) : null,
      d.estado === 'ok' && !d.lista.length ? h('p', { className: 'muted' }, 'No hay partidas recientes de ajedrez clásico en esta cuenta.') : null,
      h('div', { className: 'on-lista' }, lista.map(function (p, i) {
        var txt = p.res === 'win' ? 'Victoria' : p.res === 'loss' ? 'Derrota' : p.res === 'live' ? 'En juego' : 'Tablas';
        return h('div', { key: p.id, className: 'card on-fila r-' + p.res, style: { animationDelay: Math.min(i, 12) * 0.03 + 's' } },
          h('span', { className: 'on-res' }, txt),
          h('div', { className: 'on-info' },
            h('b', null, h('i', { className: 'on-ficha ' + (p.color === 'w' ? 'b' : 'n'), title: p.color === 'w' ? 'Jugaste con blancas' : 'Jugaste con negras' }), 'contra ', p.rival, p.rivalElo ? h('small', null, ' (' + p.rivalElo + ')') : null),
            h('small', null, [p.ritmo, p.apertura, Math.ceil(p.jugadas.length / 2) + ' jugadas', fecha(p.t)].filter(Boolean).join(' · '))),
          p.precision != null ? h('span', { className: 'on-prec', title: 'Tu precisión' }, h('b', null, Math.round(p.precision) + '%'), h('small', null, 'precisión')) : null,
          h('div', { className: 'on-acc' },
            h('button', { type: 'button', className: 'btn btn-primary', onClick: function () { analizar(p); } }, h('span', null, 'Analizar')),
            h('a', { className: 'btn btn-ghost on-ext', href: p.url, target: '_blank', rel: 'noopener', 'aria-label': 'Abrir en ' + (p.fuente === 'lichess' ? 'Lichess' : 'Chess.com') }, h('span', { dangerouslySetInnerHTML: { __html: ic('presiona') } }))));
      })));
  }

  /* ---------- Jugar: tarjeta Online (Lichess) y accesos ---------- */
  var KP = 'aa-li-partida', KR = 'aa-li-ritmo', KRA = 'aa-li-puntua';
  function abrirPartida(id, color) { try { sessionStorage.setItem(KP, JSON.stringify({ id: id, color: color })); } catch (e) {} location.hash = 'lichess-partida'; window.scrollTo(0, 0); }
  var RITMOS = [
    ['Bala', 'rayo', [[1, 0], [2, 1]]],
    ['Blitz', 'rayo', [[3, 0], [3, 2], [5, 0], [5, 3]]],
    ['Rápida', 'reloj', [[10, 0], [10, 5], [15, 10]]],
    ['Clásica', 'reloj', [[30, 0], [30, 20]]]
  ];
  function tipoDe(r) { for (var k = 0; k < RITMOS.length; k++) for (var m = 0; m < RITMOS[k][2].length; m++) if (RITMOS[k][2][m][0] === r[0] && RITMOS[k][2][m][1] === r[1]) return RITMOS[k]; return RITMOS[2]; }
  var KVI = 'aa-jugar-vista';
  function vistaActual() { try { return sessionStorage.getItem(KVI) || 'online'; } catch (e) { return 'online'; } }
  function vista(v) {
    try { sessionStorage.setItem(KVI, v); } catch (e) {}
    var ps = document.querySelector('.play-setup');
    if (ps) { ps.classList.toggle('vista-bots', v === 'bots'); var t = ps.querySelector(':scope > .jo-tabs'); if (t) { t.dataset.v = v; t.querySelectorAll('[data-v]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.v === v)); }); } }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function irA(sel) { var t = document.querySelector(sel); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  function JugarOnline() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var s1 = R.useState(token()), tk = s1[0], setTk = s1[1];
    var s2 = R.useState(null), yo = s2[0], setYo = s2[1];
    var s3 = R.useState([]), enCurso = s3[0], setEnCurso = s3[1];
    var s4 = R.useState(false), busca = s4[0], setBusca = s4[1];
    var s5 = R.useState(''), aviso = s5[0], setAviso = s5[1];
    var s6 = R.useState(leer(KR, [3, 2])), ritmo = s6[0], setRitmo = s6[1];
    var s7 = R.useState(false), menu = s7[0], setMenu = s7[1];
    var s8 = R.useState(false), ajustes = s8[0], setAjustes = s8[1];
    var s9 = R.useState(!!leer(KRA, false)), puntua = s9[0], setPuntua = s9[1];
    var s10 = R.useState(false), amigoAbierto = s10[0], setAmigoAbierto = s10[1];
    var s11 = R.useState(''), amigo = s11[0], setAmigo = s11[1];
    var s12 = R.useState(null), fuera = s12[0], setFuera = s12[1]; // partida que Lichess no deja jugar aquí
    var buscaRef = R.useRef(null);
    R.useEffect(function () { function f() { setTk(token()); } window.addEventListener('aa-lichess', f); return function () { window.removeEventListener('aa-lichess', f); }; }, []);
    R.useEffect(function () {
      if (!tk) return;
      api('/api/account').then(function (r) { if (r.status === 401) { localStorage.removeItem(KT); setTk(null); throw 0; } return r.json(); }).then(setYo).catch(function () {});
      api('/api/account/playing').then(function (r) { return r.ok ? r.json() : { nowPlaying: [] }; }).then(function (d) { setEnCurso((d.nowPlaying || []).filter(function (g) { return g.variant && g.variant.key === 'standard'; })); }).catch(function () {});
      var ctl = new AbortController();
      flujo('/api/stream/event', function (ev) {
        if (ev.type === 'gameStart' && ev.game) {
          if (buscaRef.current) { buscaRef.current.abort(); buscaRef.current = null; }
          var gid = ev.game.gameId || ev.game.id;
          if (!ev.game.compat || ev.game.compat.board) abrirPartida(gid, ev.game.color === 'black' ? 'b' : 'w');
          else { setBusca(false); setFuera({ id: gid, rival: ev.game.opponent ? ev.game.opponent.username : '' }); } // no se puede jugar aquí: se ofrece abrirla en Lichess
        }
      }, ctl.signal).catch(function () {});
      return function () { ctl.abort(); if (buscaRef.current) buscaRef.current.abort(); };
    }, [tk]);
    function elegir(r) { setRitmo(r); guardar(KR, r); setMenu(false); }
    // Lichess solo deja jugar con la API de tablero a ritmo rápido o más lento (bala y blitz solo en su web o apps autorizadas)
    function enApp(r) { return r[0] * 60 + r[1] * 40 >= 480; }
    function enLichess() {
      // abre la búsqueda en lichess.org con el ritmo elegido; al terminar, la partida aparece en «Tus partidas»
      window.open(LI + '/#pool/' + ritmo[0] + '+' + ritmo[1], '_blank', 'noopener');
      setAviso('Abrimos lichess.org con ' + ritmo[0] + '+' + ritmo[1] + '. Al terminar, analiza la partida aquí en «Tus partidas».');
    }
    function empezar() {
      if (!tk && enApp(ritmo)) { conectarLichess(); return; }
      if (!enApp(ritmo)) { enLichess(); return; }
      setAviso(''); setFuera(null); setBusca(true);
      var ctl = new AbortController(); buscaRef.current = ctl;
      api('/api/board/seek', Object.assign({ signal: ctl.signal }, form({ rated: String(puntua), time: String(ritmo[0]), increment: String(ritmo[1]), variant: 'standard' })))
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error(t || String(r.status)); });
          var rd = r.body.getReader(); var seguir = function () { return rd.read().then(function (x) { if (!x.done) return seguir(); }); }; return seguir();
        })
        .catch(function (e) {
          if (e && e.name === 'AbortError') return;
          setBusca(false);
          var t = e.message || '';
          setAviso(/too many games/i.test(t) ? 'Ya tienes demasiadas partidas en curso en Lichess. Termina alguna y vuelve a intentarlo.' : /must also play/i.test(t) ? 'Lichess te pide jugar también algunas partidas con el otro color.' : 'Lichess no aceptó la búsqueda. Inténtalo de nuevo en unos segundos.');
        });
    }
    function cancelar() { if (buscaRef.current) buscaRef.current.abort(); buscaRef.current = null; setBusca(false); }
    function retar(e) {
      e.preventDefault(); var u = amigo.trim(); if (!u) return; setAviso('');
      if (!tk) { conectarLichess(); return; }
      // con amigos Lichess permite blitz aquí; la bala no, así que el reto se hace como mínimo a 3+0
      var rr = ritmo[0] < 3 ? [3, ritmo[1] ? 2 : 0] : ritmo;
      api('/api/challenge/' + encodeURIComponent(u), form({ rated: String(puntua), 'clock.limit': String(rr[0] * 60), 'clock.increment': String(rr[1]), color: 'random', variant: 'standard' }))
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); })
        .then(function () { setAviso('Reto enviado a ' + u + ' (' + rr[0] + '+' + rr[1] + (rr !== ritmo ? ', la bala no se puede jugar fuera de lichess.org' : '') + '). La partida empieza aquí en cuanto lo acepte.'); setAmigo(''); setAmigoAbierto(false); })
        .catch(function (er) { setAviso('No se pudo retar a ' + u + ': ' + (er.message || er)); });
    }
    var tipo = tipoDe(ritmo);
    var sub = tk ? (yo ? 'Lichess · ' + yo.username + (yo.perfs && yo.perfs[{ Bala: 'bullet', Blitz: 'blitz', Rápida: 'rapid', Clásica: 'classical' }[tipo[0]]] ? ' · ' + yo.perfs[{ Bala: 'bullet', Blitz: 'blitz', Rápida: 'rapid', Clásica: 'classical' }[tipo[0]]].rating : '') : 'Lichess · conectando…') : 'Partidas contra personas reales en Lichess';
    var online = h('section', { className: 'jo-online' + (busca ? ' buscando' : '') },
      h('div', { className: 'jo-cab' },
        h('div', null, h('h2', null, 'Online'), h('p', null, sub)),
        tk ? h('button', { type: 'button', className: 'jo-cuenta', title: 'Desconectar Lichess', onClick: function () { localStorage.removeItem(KT); setTk(null); setYo(null); } }, yo ? yo.username.charAt(0).toUpperCase() : 'li') : h('span', { className: 'jo-li', 'aria-hidden': 'true' }, 'li')),
      enCurso.length && !busca ? h('div', { className: 'jo-curso' }, enCurso.slice(0, 3).map(function (g) {
        return h('button', { key: g.gameId, type: 'button', className: g.isMyTurn ? 'turno' : '', onClick: function () { abrirPartida(g.gameId, g.color === 'black' ? 'b' : 'w'); } }, h('i'), 'Seguir contra ' + (g.opponent ? g.opponent.username : '…'), g.isMyTurn ? h('small', null, 'te toca') : null);
      })) : null,
      busca ? h('div', { className: 'jo-buscando' }, h('span', { className: 'jo-pulso', 'aria-hidden': 'true' }), h('div', null, h('b', null, 'Buscando rival'), h('small', null, ritmo[0] + '+' + ritmo[1] + ' · ' + tipo[0] + (puntua ? ' · con puntuación' : ''))))
        : h('div', { className: 'jo-fila' },
          h('button', { type: 'button', className: 'jo-ajustes' + (ajustes ? ' on' : ''), 'aria-label': 'Ajustes de la partida', 'aria-expanded': ajustes, onClick: function () { setAjustes(!ajustes); setMenu(false); } }, h('span', { dangerouslySetInnerHTML: { __html: ic('ajustes') || '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.5"/><circle cx="9.5" cy="17" r="2.5"/></svg>' } })),
          h('button', { type: 'button', className: 'jo-ritmo', 'aria-haspopup': 'listbox', 'aria-expanded': menu, onClick: function () { setMenu(!menu); setAjustes(false); } },
            h('span', { className: 'jo-ritmo-ic', dangerouslySetInnerHTML: { __html: ic(tipo[1]) } }), h('b', null, ritmo[0] + ' + ' + ritmo[1]), h('span', { className: 'jo-flecha' + (menu ? ' arriba' : ''), 'aria-hidden': 'true' }))),
      menu && !busca ? h('div', { className: 'jo-menu', role: 'listbox', 'aria-label': 'Ritmo' }, RITMOS.map(function (g) {
        return h('div', { key: g[0], className: 'jo-grupo' }, h('small', null, h('span', { dangerouslySetInnerHTML: { __html: ic(g[1]) } }), g[0]),
          h('div', null, g[2].map(function (r) { var on = r[0] === ritmo[0] && r[1] === ritmo[1]; return h('button', { key: r.join('+'), type: 'button', role: 'option', 'aria-selected': on, className: (on ? 'on' : '') + (enApp(r) ? '' : ' ext'), title: enApp(r) ? 'Se juega aquí' : 'Se juega en lichess.org', onClick: function () { elegir(r); } }, r[0] + '+' + r[1]); })));
      })) : null,
      ajustes && !busca ? h('div', { className: 'jo-menu jo-aj' },
        h('label', { className: 'jo-sw' }, h('span', null, h('b', null, 'Con puntuación'), h('small', null, 'La partida cuenta para tu Elo de Lichess')),
          h('input', { type: 'checkbox', checked: puntua, onChange: function (e) { setPuntua(e.target.checked); guardar(KRA, e.target.checked); } }), h('i', { 'aria-hidden': 'true' })),
        tk ? h('button', { type: 'button', className: 'jo-desc', onClick: function () { localStorage.removeItem(KT); setTk(null); setYo(null); setAjustes(false); } }, 'Desconectar Lichess') : null) : null,
      busca ? h('button', { type: 'button', className: 'jo-empezar cancelar', onClick: cancelar }, 'Cancelar')
        : h('button', { type: 'button', className: 'jo-empezar' + (enApp(ritmo) ? '' : ' fuera'), onClick: empezar },
            enApp(ritmo) ? (tk ? 'Empezar' : 'Conectar con Lichess y empezar') : h(R.Fragment, null, 'Empezar en lichess.org', h('span', { dangerouslySetInnerHTML: { __html: ic('presiona') } }))),
      !busca && !enApp(ritmo) ? h('p', { className: 'jo-nota' }, 'Lichess solo permite bala y blitz en su web o en apps que autoriza (como Take Take Take). Se abre lichess.org con este ritmo; al terminar, analiza la partida aquí. Desde 10+0 se juega dentro de la academia.') : null,
      fuera ? h('div', { className: 'jo-fuera' }, h('div', null, h('b', null, '¡Tu partida ha empezado!'), h('small', null, 'Lichess no deja jugar este ritmo aquí: ábrela en lichess.org' + (fuera.rival ? ' contra ' + fuera.rival : '') + '.')),
        h('a', { className: 'jo-abrir', href: LI + '/' + fuera.id, target: '_blank', rel: 'noopener', onClick: function () { setFuera(null); } }, 'Abrir partida')) : null,
      aviso ? h('p', { className: 'jo-aviso', role: 'status' }, aviso) : null);
    var tile = function (cls, titulo, subt, arte, onClick, extra) {
      return h('div', { className: 'jo-tile ' + cls }, h('button', { type: 'button', className: 'jo-tile-btn', onClick: onClick }, h('b', null, titulo), subt ? h('small', null, subt) : null, h('div', { className: 'jo-arte', 'aria-hidden': 'true', dangerouslySetInnerHTML: { __html: arte } })), extra || null);
    };
    var A = {
      amigos: '<div class="jo-av a1">' + (yo ? yo.username.charAt(0).toUpperCase() : 'Tú').slice(0, 2) + '</div><div class="jo-vs">' + ic('espadas') + '</div><div class="jo-av a2">?</div>',
      bots: '<div class="jo-tab">' + Array.from({ length: 16 }, function (_, k) { return '<i class="' + (((k >> 2) + k) % 2 ? 'o' : 'c') + '"></i>'; }).join('') + '</div><div class="jo-bot">' + (window.AA_PERSONAJE ? window.AA_PERSONAJE(2) : '') + '</div>',
      mias: '<div class="jo-hojas"><span class="h1">' + ic('libro') + '</span><span class="h2"><b>84%</b><small>precisión</small></span></div>'
    };
    return h('div', { className: 'jo' },
      online,
      h('div', { className: 'jo-grid' },
        tile('t-amigos', 'Desafiar a amigos', amigoAbierto ? 'Ritmo ' + ritmo[0] + '+' + ritmo[1] : 'En Lichess, con su usuario', A.amigos, function () { if (!tk) { conectarLichess(); return; } setAmigoAbierto(!amigoAbierto); },
          amigoAbierto ? h('form', { className: 'jo-amigo', onSubmit: retar }, h('input', { autoFocus: true, value: amigo, onChange: function (e) { setAmigo(e.target.value); }, placeholder: 'Usuario de Lichess', 'aria-label': 'Usuario de Lichess a retar', autoComplete: 'off', spellCheck: false }), h('button', { type: 'submit', disabled: !amigo.trim() }, 'Retar')) : null),
        tile('t-mias', 'Tus partidas', 'Lichess y Chess.com, analizadas', A.mias, function () { irA('#mis-partidas-online'); })));
  }

  function Partida(props) {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var s1 = R.useState({ moves: [], wtime: 0, btime: 0, status: 'started', winner: null, white: null, black: null, fen0: null, at: Date.now(), drawOffer: null }), g = s1[0], setG = s1[1];
    var s2 = R.useState(0), tic = s2[0], setTic = s2[1];
    var s3 = R.useState(''), err = s3[0], setErr = s3[1];
    R.useEffect(function () {
      var ctl = new AbortController();
      flujo('/api/board/game/stream/' + props.id, function (ev) {
        if (ev.type === 'gameFull') setG(function (x) { return Object.assign({}, x, { white: ev.white, black: ev.black, fen0: ev.initialFen === 'startpos' ? null : ev.initialFen, moves: ev.state.moves ? ev.state.moves.split(' ') : [], wtime: ev.state.wtime, btime: ev.state.btime, status: ev.state.status, winner: ev.state.winner || null, at: Date.now() }); });
        else if (ev.type === 'gameState') setG(function (x) { return Object.assign({}, x, { moves: ev.moves ? ev.moves.split(' ') : [], wtime: ev.wtime, btime: ev.btime, status: ev.status, winner: ev.winner || null, at: Date.now(), drawOffer: ev.wdraw ? 'w' : ev.bdraw ? 'b' : null }); });
      }, ctl.signal).catch(function (e) { if (e.name !== 'AbortError') setErr('Se perdió la conexión con Lichess.'); });
      var t = setInterval(function () { setTic(function (n) { return n + 1; }); }, 250);
      return function () { ctl.abort(); clearInterval(t); };
    }, [props.id]);
    var ch = new UI.Chess(g.fen0 || undefined), sans = [];
    g.moves.forEach(function (u) { var m = ch.parse(u); if (m != null) { sans.push(es(ch.san(m))); ch.make(m); } });
    var turno = ch.turn ? 'b' : 'w', mio = turno === props.color, fin = g.status !== 'started' && g.status !== 'created';
    var reloj = function (c) { var t = c === 'w' ? g.wtime : g.btime; if (!fin && turno === c && g.moves.length >= 2) t -= Date.now() - g.at; t = Math.max(0, t || 0); var m = Math.floor(t / 60000), s = Math.floor(t / 1000) % 60; return m + ':' + String(s).padStart(2, '0'); };
    function mover(u) {
      if (!mio || fin) return false;
      api('/api/board/game/' + props.id + '/move/' + u, { method: 'POST' }).then(function (r) { if (!r.ok) r.json().then(function (j) { setErr(j.error || 'Jugada rechazada.'); }); else setErr(''); });
      return true;
    }
    function accion(a) { api('/api/board/game/' + props.id + '/' + a, { method: 'POST' }); }
    var jug = function (c) { var p = c === 'w' ? g.white : g.black; return p ? (p.name || (p.aiLevel ? 'Stockfish nivel ' + p.aiLevel : 'Anónimo')) + (p.rating ? ' (' + p.rating + ')' : '') : '…'; };
    var arriba = props.color === 'w' ? 'b' : 'w';
    var resTxt = !fin ? '' : g.winner ? (g.winner === (props.color === 'w' ? 'white' : 'black') ? '¡Has ganado!' : 'Has perdido') : g.status === 'aborted' ? 'Partida anulada' : 'Tablas';
    function analizarEsta() {
      analizar({ ucis: g.moves.slice(), jugadas: [], fen: g.fen0, color: props.color, blancas: jug('w'), negras: jug('b'), resultado: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2' });
    }
    return h('div', { className: 'on-partida' },
      h('div', { className: 'on-tab' },
        h('div', { className: 'on-jug' + (turno === arriba && !fin ? ' turno' : '') }, h('i', { className: 'on-ficha ' + (arriba === 'w' ? 'b' : 'n') }), h('b', null, jug(arriba)), h('span', { className: 'on-reloj' }, reloj(arriba))),
        h('div', { className: 'on-board' }, h(UI.Board, { fen: ch.fen(), orientation: props.color, interactive: mio && !fin, allowColor: props.color, onMove: mover, lastMove: g.moves[g.moves.length - 1] })),
        h('div', { className: 'on-jug' + (turno === props.color && !fin ? ' turno' : '') }, h('i', { className: 'on-ficha ' + (props.color === 'w' ? 'b' : 'n') }), h('b', null, jug(props.color) + ' · tú'), h('span', { className: 'on-reloj' }, reloj(props.color)))),
      h('div', { className: 'on-lado' },
        h('div', { className: 'card on-estado' + (fin ? ' fin' : '') }, h('b', null, fin ? resTxt : mio ? 'Tu turno' : 'Turno del rival'),
          h('small', { className: 'muted' }, fin ? 'Partida terminada en Lichess.' : g.drawOffer && g.drawOffer !== props.color ? 'Tu rival ofrece tablas.' : 'Las jugadas se envían a Lichess al instante.')),
        err ? h('p', { className: 'on-error', role: 'alert' }, err) : null,
        h('div', { className: 'card on-jugadas' }, sans.length ? sans.map(function (s, i) { return h('span', { key: i }, (i % 2 === 0 ? (i / 2 + 1) + '. ' : '') + s); }) : h('small', { className: 'muted' }, 'Aún no hay jugadas.')),
        fin ? h('div', { className: 'on-acciones' },
          h('button', { type: 'button', className: 'btn btn-primary', onClick: analizarEsta }, h('span', null, 'Analizar esta partida')),
          h('button', { type: 'button', className: 'btn', onClick: props.salir }, h('span', null, 'Volver a Jugar')))
          : h('div', { className: 'on-acciones' },
            g.drawOffer && g.drawOffer !== props.color ? h('button', { type: 'button', className: 'btn btn-primary', onClick: function () { accion('draw/yes'); } }, h('span', null, 'Aceptar tablas')) : h('button', { type: 'button', className: 'btn', onClick: function () { accion('draw/yes'); } }, h('span', null, 'Ofrecer tablas')),
            g.moves.length < 2 ? h('button', { type: 'button', className: 'btn', onClick: function () { accion('abort'); } }, h('span', null, 'Anular'))
              : h('button', { type: 'button', className: 'btn btn-resign', onClick: function () { if (confirm('¿Rendirte en esta partida de Lichess?')) accion('resign'); } }, h('span', null, 'Rendirse'))),
        h('a', { className: 'muted small on-verli', href: LI + '/' + props.id, target: '_blank', rel: 'noopener' }, 'Ver la partida en lichess.org')));
  }

  /* ---------- Rutas ---------- */
  function PartidaPagina() {
    var R = window.AA_UI.React, h = R.createElement, d = null;
    try { d = JSON.parse(sessionStorage.getItem(KP)); } catch (e) {}
    var volver = function () { try { sessionStorage.removeItem(KP); } catch (e) {} location.hash = 'jugar'; window.scrollTo(0, 0); };
    if (!d || !token()) { setTimeout(volver, 0); return null; }
    return h('div', { className: 'page-retos on-page' }, h('button', { type: 'button', className: 'li-volver', onClick: volver }, h('span', { dangerouslySetInnerHTML: { __html: ic('volver') } }), 'Jugar'),
      h(Partida, { id: d.id, color: d.color, salir: volver }));
  }
  PAGES['lichess-partida'] = PartidaPagina;
  function aJugar() { setTimeout(function () { location.replace('#jugar'); }, 0); return null; }
  PAGES.online = aJugar; PAGES['online-jugar'] = aJugar;

  /* ---------- Montaje en Jugar: Lichess arriba, bots en medio, tus partidas abajo ---------- */
  var montados = [];
  function montar(cont, antes, cls, Comp) {
    var U = window.AA_UI; if (!U || !U.createRoot) return;
    var el = cont.querySelector(':scope > .' + cls);
    if (el) return;
    el = document.createElement('div'); el.className = cls; cont.insertBefore(el, antes);
    var root = U.createRoot(el); root.render(U.React.createElement(Comp)); montados.push({ el: el, root: root });
  }
  function Partidas() {
    var R = window.AA_UI.React, h = R.createElement;
    return h('section', { className: 'on-mias', id: 'mis-partidas-online' },
      h('div', { className: 'on-mias-tit' }, h('h2', null, 'Tus partidas de Lichess y Chess.com'), h('p', { className: 'muted' }, 'Escribe tu usuario y analiza cualquier partida con el entrenador de la academia.')),
      h(Historial));
  }
  var pend = false;
  new MutationObserver(function () {
    if (pend) return; pend = true;
    requestAnimationFrame(function () {
      pend = false;
      montados = montados.filter(function (m) { if (document.contains(m.el)) return true; try { m.root.unmount(); } catch (e) {} return false; });
      var ps = document.querySelector('.play-setup');
      if (ps) {
        ps.classList.toggle('li-on', true);
        var esBots = vistaActual() === 'bots';
        if (ps.classList.contains('vista-bots') !== esBots) ps.classList.toggle('vista-bots', esBots);
        var head = ps.querySelector(':scope > .tc-head');
        // pestañas: Online (Lichess, amigos, tus partidas) · Contra los bots
        var tabs = ps.querySelector(':scope > .jo-tabs');
        if (!tabs) {
          tabs = document.createElement('div'); tabs.className = 'jo-tabs'; tabs.setAttribute('role', 'tablist');
          tabs.innerHTML = '<button type="button" role="tab" data-v="online">Online</button><button type="button" role="tab" data-v="bots">Contra los bots</button><i class="jo-tabs-ind" aria-hidden="true"></i>';
          tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) vista(b.dataset.v); });
          ps.insertBefore(tabs, ps.firstChild);
        }
        tabs.querySelectorAll('[data-v]').forEach(function (b) { var on = b.dataset.v === (esBots ? 'bots' : 'online'); if (b.getAttribute('aria-selected') !== String(on)) b.setAttribute('aria-selected', String(on)); });
        if (tabs.dataset.v !== (esBots ? 'bots' : 'online')) tabs.dataset.v = esBots ? 'bots' : 'online';
        montar(ps, head, 'li-montaje', JugarOnline);
        montar(ps, null, 'on-montaje', Partidas);
      }
      var lib = document.querySelector('.library');
      if (lib && !lib.querySelector(':scope > .on-acceso')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'on-acceso';
        b.innerHTML = '<span class="on-logos"><i class="on-logo" style="background:#2a2d35">li</i><i class="on-logo" style="background:#6b9f3a">c</i></span><span><b>Tus partidas de Lichess y Chess.com</b><small>Están en Jugar: escribe tu usuario y analízalas con el entrenador.</small></span>' + ic('presiona');
        b.addEventListener('click', function () { location.hash = 'jugar'; setTimeout(function () { var t = document.getElementById('mis-partidas-online'); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, 600); });
        lib.insertBefore(b, lib.querySelector(':scope > h2.h-sub'));
      }
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
