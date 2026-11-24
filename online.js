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
    if (!code) { if (q.get('error')) { history.replaceState(null, '', volverA() + '#online-jugar'); setTimeout(function () { if (window.AA_TOAST) window.AA_TOAST('No se conectó la cuenta de Lichess.'); }, 1500); } return; }
    var pk = {}; try { pk = JSON.parse(sessionStorage.getItem(KV)) || {}; } catch (e) {}
    history.replaceState(null, '', volverA() + '#online-jugar');
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

  /* ================= Página ================= */
  function Online() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var pest = R.useState(/jugar/.test(location.hash) ? 'jugar' : 'historial'), tab = pest[0], setTab = pest[1];
    return h('div', { className: 'page-retos on-page' },
      h('div', { className: 'on-top' },
        h('div', null, h('h1', null, 'Online'), h('p', { className: 'muted' }, 'Tus partidas de Lichess y Chess.com, analizadas con el motor de la academia. Y partidas en Lichess sin salir de aquí.')),
        h('div', { className: 'seg on-tabs', role: 'tablist' },
          h('button', { role: 'tab', 'aria-selected': tab === 'historial', className: tab === 'historial' ? 'on' : '', onClick: function () { setTab('historial'); } }, 'Mis partidas'),
          h('button', { role: 'tab', 'aria-selected': tab === 'jugar', className: tab === 'jugar' ? 'on' : '', onClick: function () { setTab('jugar'); } }, 'Jugar en Lichess'))),
      tab === 'historial' ? h(Historial) : h(Jugar));
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

  /* ---------- Jugar en Lichess ---------- */
  function Jugar() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var s1 = R.useState(token()), tk = s1[0], setTk = s1[1];
    var s2 = R.useState(null), yo = s2[0], setYo = s2[1];
    var s3 = R.useState(null), partida = s3[0], setPartida = s3[1];
    var s4 = R.useState(''), busca = s4[0], setBusca = s4[1];
    var s5 = R.useState(''), aviso = s5[0], setAviso = s5[1];
    var buscaRef = R.useRef(null), evRef = R.useRef(null);
    R.useEffect(function () { function f() { setTk(token()); } window.addEventListener('aa-lichess', f); return function () { window.removeEventListener('aa-lichess', f); }; }, []);
    R.useEffect(function () {
      if (!tk) return;
      api('/api/account').then(function (r) { if (r.status === 401) { localStorage.removeItem(KT); setTk(null); throw 0; } return r.json(); }).then(setYo).catch(function () {});
      // escucha el inicio de partidas (también las que ya estaban en marcha)
      var ctl = new AbortController(); evRef.current = ctl;
      flujo('/api/stream/event', function (ev) {
        if (ev.type === 'gameStart' && ev.game && (ev.game.compat ? ev.game.compat.board : true)) { setBusca(''); if (buscaRef.current) { buscaRef.current.abort(); buscaRef.current = null; } setPartida({ id: ev.game.gameId || ev.game.id, color: ev.game.color === 'black' ? 'b' : 'w' }); }
      }, ctl.signal).catch(function () {});
      return function () { ctl.abort(); };
    }, [tk]);
    if (!tk) return h('div', { className: 'card on-conectar' },
      h('div', { className: 'on-li-logo', 'aria-hidden': 'true' }, 'li'),
      h('h2', null, 'Juega en Lichess desde la academia'),
      h('p', { className: 'muted' }, 'Conecta tu cuenta de Lichess: te llevamos a lichess.org para que des permiso y vuelves aquí. Nunca vemos tu contraseña y puedes quitar el permiso cuando quieras desde Lichess.'),
      h('ul', { className: 'on-puntos' }, h('li', null, 'Partidas rápidas y clásicas contra rivales reales'), h('li', null, 'Partidas contra el Stockfish de Lichess (niveles 1 a 8)'), h('li', null, 'Al terminar, analízalas con el entrenador de la academia')),
      h('button', { type: 'button', className: 'btn btn-primary btn-big', onClick: conectarLichess }, h('span', null, 'Conectar con Lichess')),
      h('p', { className: 'muted small' }, 'Lichess solo permite jugar así a ritmo rápido o más lento (sin bala ni blitz). Chess.com no ofrece esta opción.'));
    if (partida) return h(Partida, { id: partida.id, color: partida.color, yo: yo, salir: function () { setPartida(null); } });
    function buscar(min, inc) {
      setAviso(''); setBusca(min + '+' + inc);
      var ctl = new AbortController(); buscaRef.current = ctl;
      api('/api/board/seek', Object.assign({ signal: ctl.signal }, form({ rated: 'false', time: String(min), increment: String(inc), variant: 'standard' })))
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
          // la búsqueda sigue viva mientras la conexión esté abierta: se lee hasta que Lichess la cierre
          var rd = r.body.getReader(); buscaRef.lector = rd;
          var seguir = function () { return rd.read().then(function (x) { if (!x.done) return seguir(); }); };
          return seguir();
        })
        .catch(function (e) { if (e && e.name !== 'AbortError') { setBusca(''); setAviso('Lichess no aceptó la búsqueda. ' + (e.message || '').slice(0, 120)); } });
    }
    function cancelar() { if (buscaRef.current) buscaRef.current.abort(); buscaRef.current = null; setBusca(''); }
    function contraIA(nivel) {
      setAviso('');
      api('/api/challenge/ai', form({ level: String(nivel), 'clock.limit': '600', 'clock.increment': '5', color: 'random', variant: 'standard' }))
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); })
        .then(function (g) { setPartida({ id: g.id, color: g.player === 'black' || (g.color === 'black') ? 'b' : 'w', ia: true }); })
        .catch(function (e) { setAviso('No se pudo crear la partida: ' + (e.message || e)); });
    }
    return h('div', { className: 'on-jugar' },
      h('div', { className: 'card on-yo' },
        h('div', { className: 'on-li-logo pequeno', 'aria-hidden': 'true' }, 'li'),
        h('div', null, h('small', null, 'Conectado a Lichess'), h('b', null, yo ? yo.username : '…'), yo && yo.perfs && yo.perfs.rapid ? h('small', null, 'Rápidas: ' + yo.perfs.rapid.rating) : null),
        h('button', { type: 'button', className: 'btn btn-ghost', onClick: function () { localStorage.removeItem(KT); setTk(null); setYo(null); } }, h('span', null, 'Desconectar'))),
      h('h3', { className: 'h-sub' }, 'Buscar rival'),
      busca ? h('div', { className: 'card on-buscando' }, h('span', { className: 'on-radar', 'aria-hidden': 'true' }), h('div', null, h('b', null, 'Buscando rival · ' + busca), h('small', { className: 'muted' }, 'Lichess te emparejará con alguien de nivel parecido.')), h('button', { type: 'button', className: 'btn', onClick: cancelar }, h('span', null, 'Cancelar')))
        : h('div', { className: 'on-ritmos' }, [[10, 0, 'Rápida'], [10, 5, 'Rápida'], [15, 10, 'Rápida'], [30, 0, 'Clásica']].map(function (x) {
          return h('button', { key: x[0] + '+' + x[1], type: 'button', className: 'card on-ritmo', onClick: function () { buscar(x[0], x[1]); } }, h('b', null, x[0] + '+' + x[1]), h('small', null, x[2]));
        })),
      h('h3', { className: 'h-sub' }, 'Contra el Stockfish de Lichess'),
      h('div', { className: 'on-niveles' }, [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return h('button', { key: n, type: 'button', className: 'on-nivel', onClick: function () { contraIA(n); } }, h('b', null, n), h('small', null, n <= 2 ? 'fácil' : n <= 5 ? 'medio' : 'difícil')); })),
      aviso ? h('p', { className: 'on-error', role: 'alert' }, aviso) : null);
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
          h('button', { type: 'button', className: 'btn', onClick: props.salir }, h('span', null, 'Otra partida')))
          : h('div', { className: 'on-acciones' },
            g.drawOffer && g.drawOffer !== props.color ? h('button', { type: 'button', className: 'btn btn-primary', onClick: function () { accion('draw/yes'); } }, h('span', null, 'Aceptar tablas')) : h('button', { type: 'button', className: 'btn', onClick: function () { accion('draw/yes'); } }, h('span', null, 'Ofrecer tablas')),
            g.moves.length < 2 ? h('button', { type: 'button', className: 'btn', onClick: function () { accion('abort'); } }, h('span', null, 'Anular'))
              : h('button', { type: 'button', className: 'btn btn-resign', onClick: function () { if (confirm('¿Rendirte en esta partida de Lichess?')) accion('resign'); } }, h('span', null, 'Rendirse'))),
        h('a', { className: 'muted small on-verli', href: LI + '/' + props.id, target: '_blank', rel: 'noopener' }, 'Ver la partida en lichess.org')));
  }

  PAGES.online = Online;
  PAGES['online-jugar'] = Online;

  /* ---------- Accesos desde Partidas y Jugar ---------- */
  function acceso(cont, antes, ruta, titulo, sub) {
    if (!cont || cont.querySelector(':scope > .on-acceso')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'on-acceso';
    b.innerHTML = '<span class="on-logos"><i class="on-logo f-lichess" style="background:#2a2d35">li</i><i class="on-logo" style="background:#6b9f3a">c</i></span><span><b>' + titulo + '</b><small>' + sub + '</small></span>' + ic('presiona');
    b.addEventListener('click', function () { location.hash = ruta; window.scrollTo(0, 0); });
    cont.insertBefore(b, antes || null);
  }
  var pend = false;
  new MutationObserver(function () {
    if (pend) return; pend = true;
    requestAnimationFrame(function () {
      pend = false;
      var lib = document.querySelector('.library');
      if (lib) { var h2 = lib.querySelector(':scope > h2.h-sub'); acceso(lib, h2, 'online', 'Tus partidas de Lichess y Chess.com', 'Escribe tu usuario y analiza tus partidas con el entrenador.'); }
      var ps = document.querySelector('.play-setup');
      if (ps) acceso(ps, null, 'online-jugar', 'Jugar en Lichess', 'Rivales reales o el Stockfish de Lichess, desde aquí.');
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
