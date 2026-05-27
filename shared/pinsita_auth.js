/* ════════════════════════════════════════════════════════════════════
 *  *  PINSITA · AUTH-RUOLI · modulo frontend condiviso  ·  v1.4
 *  Una sola copia in /shared/ · incluso da ogni hub di locale + Portal.
 *
 *  v1.1 · la lista utenti arriva dal GAS (azione lista_usuarios),
 *         non da un CSV. Una sola fonte, un solo canale.
 *         Il codice locale (rsc/cdl) e' quello del foglio: nessuna traduzione.
 *
 *  *  v1.3 (27-may-2026) · aggiunta API PinsitaAuth.initOnPortal()
 *         Login PIN inline sul Portal nuovo (AUTH-1-bis).
 *         Scope-aware: scope='cdl'/'rsc' carica utenti del locale + corporate;
 *         scope vuoto (Operacion/Estrategia) carica solo corporate.
 *         Riusa overlay/tastiera/set_pin/ayuda esistenti.
 *
 *  v1.4 (27-may-2026 tarde) · fix bfcache nel Portal.
 *         Bug X: dopo login + navigate a card, ritorno con VOLVER non
 *         iniettava il chip Salir (initOnPortal non rieseguito dalla bfcache).
 *         Bug Y: ritorno da bfcache mostrava overlay PIN residuo sopra il Portal.
 *         Fix: listener 'pageshow' in initOnPortal — chiude overlay e inietta chip.
 *
 *  Cosa fa:
 *   - Schermata login (lista nome + foto/iniziali + PIN 4 cifre)
 *   - Verifica via GAS doPost · niente PIN in chiaro (SHA-256 + salt)
 *   - Primo accesso / reset PIN: l'utente sceglie e riconferma il PIN
 *   - Sessione 8h in localStorage (durata turno · NORMA_DISENO §3)
 *   - Gating: nasconde le card che il ruolo non puo' aprire (§4)
 *
 *  Uso in un hub (es. rsc/index.html), prima di </body>:
 *   <script src="../shared/pinsita_auth.js"></script>
 *   <script>PinsitaAuth.init({ local:'rsc', accent:'#D4A030' });</script>
 *
 *  Gating · ogni card protetta porta  data-roles="JL,GO"
 *  (codici cargo separati da virgola). Card senza l'attributo = visibile a tutti.
 * ════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbz6NAdw-rstmwwCzsFiNSTfdbEpnDJhuuw0sRNTr0V-KB2LkYRv4k9Ktv2wEXOKaJPj/exec';
  var SESSION_KEY = 'pinsita_session';
  var SESSION_HORAS = 8;                       // durata turno
  var ROL_NOMBRE = {                            // etichette ruolo per la UI
    OP:'Operador', JL:'Jefe de Local', GO:'Gerente Operaciones',
    JB:'Jefe de Bodega', CC:'Chef Cocina Central',
    GC:'Gerente Comercial', GG:'Gerencia General'
  };

  // Logo PINSA · stesso JPEG dell'hub di locale (coerenza visiva)
  var LOGO_PINSA = 'data:image/png;base64,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';

  // ── STATO INTERNO ─────────────────────────────────────────────────
  var CFG = { local:'cdl', accent:'#C4622D' };
  var USERS = [];          // [{nombre, cargo, foto}]
  var seleccion = null;    // utente scelto nella lista
  var pinBuffer = '';      // cifre PIN digitate
  var modo = 'login';      // 'login' | 'set_pin'
  var pinTmp = '';         // primo PIN durante set_pin (per la conferma)
  
  // ── v1.2 · STATO PORTALE ──────────────────────────────────────────
  // Quando true, init e' stato chiamato come initOnPortal:
  // - leerSesion() NON scarta sessioni di altri locali
  // - confirmarPin() / manejarSetPin() al successo non chiamano aplicarGating()
  //   ma navigano alla card cliccata (cardPendiente.href) se autorizzato
  var modoPortal = false;
  var cardPendiente = null;   // {href, roles[], scope} card cliccata in attesa di login

  // ════════════════════════════════════════════════════════════════
  //  API PUBBLICA
  // ════════════════════════════════════════════════════════════════
  var PinsitaAuth = {
    init: function (opts) {
      CFG.local  = (opts && opts.local)  || 'cdl';
      CFG.accent = (opts && opts.accent) || '#C4622D';
      var ses = leerSesion();
      if (ses) { aplicarGating(ses.role); return; }   // sessione valida → entra
      construirOverlay();
      var ov = document.getElementById('pa-overlay');
      if (ov) ov.style.setProperty('--pa-accent', CFG.accent);
      var lg = ov && ov.querySelector('.pa-logo');
      if (lg) lg.style.backgroundImage = "url('" + LOGO_PINSA + "')";
      mostrarOverlay();
      cargarUsuarios();
    },
    // ── v1.2 · API per il Portal ─────────────────────────────────
    // Setup: NON apre overlay subito. Intercetta i click sulle card e
    // mostra overlay solo se sessione assente. Mostra badge utente se attiva.
    initOnPortal: function (opts) {
      CFG.accent = (opts && opts.accent) || '#C4622D';
      modoPortal = true;
      // costruisci overlay (nascosto) per poterlo aprire al primo click
      construirOverlay();
      var ov = document.getElementById('pa-overlay');
      if (ov) ov.style.setProperty('--pa-accent', CFG.accent);
      var lg = ov && ov.querySelector('.pa-logo');
      if (lg) lg.style.backgroundImage = "url('" + LOGO_PINSA + "')";

      // intercetta click su tutte le card con data-roles
      var cards = document.querySelectorAll('a.card[data-roles]');
      for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', onPortalCardClick);
      }

      // badge utente in header se sessione attiva
      var ses = leerSesion();
      if (ses) inyectarBarraUsuarioPortal(ses);

      // v1.4 · fix bfcache: al ritorno da una card (VOLVER → history.back)
      // il browser ripristina la pagina dalla bfcache senza rieseguire initOnPortal.
      // Conseguenza: overlay residuo aperto e/o chip non iniettato.
      // pageshow scatta SIA al primo load SIA al restore dalla bfcache.
      window.addEventListener('pageshow', function () {
        if (!modoPortal) return;
        cerrarOverlayPortal();         // idempotente: chiude overlay se presente
        var s = leerSesion();
        if (s) inyectarBarraUsuarioPortal(s);  // ha guard interno anti-duplica
      });
    },
    logout: function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      location.reload();
    },
    sesion: function () { return leerSesion(); }
  };

  // ════════════════════════════════════════════════════════════════
  //  v1.2 · LOGICA PORTALE · click sulle card
  // ════════════════════════════════════════════════════════════════
  function onPortalCardClick(ev) {
    var card = ev.currentTarget;
    var rolesAttr = card.getAttribute('data-roles') || '';
    var scopeAttr = card.getAttribute('data-local-scope') || '';
    var href      = card.getAttribute('href') || '';
    var roles     = rolesAttr.split(',').map(function (r) { return r.trim().toUpperCase(); });

    var ses = leerSesion();

    // ─── Caso 1: sessione attiva ───
    if (ses) {
      if (!rolPermitido(roles, ses.role) || !localPermitido(scopeAttr, ses.local)) {
        ev.preventDefault();
        toast('No autorizado para esta area');
        return;
      }
      // autorizzato → click naturale procede al href
      return;
    }

    // ─── Caso 2: sessione assente → overlay login ───
    ev.preventDefault();
    cardPendiente = { href: href, roles: roles, scope: scopeAttr };

    // Scope-aware: usa scope della card o '*' se vuoto (corporate-only)
    CFG.local = scopeAttr || '*';
    mostrarOverlay();
    // reset stato per overlay fresh
    seleccion = null; pinBuffer = ''; pinTmp = ''; modo = 'login';
    var stepL = document.getElementById('pa-step-lista');
    var stepP = document.getElementById('pa-step-pin');
    if (stepL) stepL.style.display = 'block';
    if (stepP) stepP.style.display = 'none';
    mostrarHelp(false);
    cargarUsuarios();
  }

  function rolPermitido(roles, sessionRole) {
    if (!roles || !roles.length || (roles.length === 1 && !roles[0])) return true;
    return roles.indexOf(String(sessionRole || '').toUpperCase()) !== -1;
  }

  function localPermitido(scopeAttr, sessionLocal) {
    if (!scopeAttr) return true;                          // card senza scope = qualsiasi local autorizzato
    if (sessionLocal === '*') return true;                // utente corporate entra ovunque
    return String(sessionLocal || '').toLowerCase() === scopeAttr.toLowerCase();
  }

  function inyectarBarraUsuarioPortal(ses) {
    var hr = document.querySelector('header .hright');
    if (!hr || document.getElementById('pa-userchip')) return;
    var chip = document.createElement('div');
    chip.id = 'pa-userchip';
    chip.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:5px 10px;border:1px solid var(--b2);' +
      'border-radius:16px;font-size:11px;color:var(--t2);cursor:default';
    var localTxt = (ses.local && ses.local !== '*') ? ' · ' + esc(ses.local) : '';
    chip.innerHTML =
      '<span style="color:var(--t1);font-weight:600">' + esc(ses.user) + '</span>' +
      '<span>· ' + esc(ROL_NOMBRE[ses.role] || ses.role) + localTxt + '</span>' +
      '<button id="pa-logout" title="Cerrar sesion" style="background:rgba(192,57,43,0.15);' +
      'border:1px solid rgba(192,57,43,0.4);color:#E07070;font-size:10px;font-weight:700;' +
      'padding:3px 8px;border-radius:12px;cursor:pointer">Salir</button>';
    hr.insertBefore(chip, hr.firstChild);
    document.getElementById('pa-logout').onclick = function () { PinsitaAuth.logout(); };
  }

  function cerrarOverlayPortal() {
    ocultarOverlay();
    cardPendiente = null;
    seleccion = null; pinBuffer = ''; pinTmp = ''; modo = 'login';
  }

  function finalizarLoginPortal(res) {
    // salva sessione con local detectato (CFG.local riflette quello chiesto a lista_usuarios)
    guardarSesion(seleccion.nombre, res.cargo, res.turno, CFG.local);

    var ses = leerSesion();
    var cd = cardPendiente;
    cardPendiente = null;

    if (!cd) {
      ocultarOverlay();
      inyectarBarraUsuarioPortal(ses);
      return;
    }

    // verifica autorizzazione card cliccata
    if (!rolPermitido(cd.roles, ses.role) || !localPermitido(cd.scope, ses.local)) {
      ocultarOverlay();
      inyectarBarraUsuarioPortal(ses);
      toast('No autorizado para esta area');
      return;
    }

    // autorizzato → naviga
    window.location.href = cd.href;
  }

  // ════════════════════════════════════════════════════════════════
  //  SESSIONE
  // ════════════════════════════════════════════════════════════════
  function leerSesion() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      // v1.3: nel Portal accettiamo qualsiasi local valido (cdl, rsc, *, ...)
      // negli hub locali, accettiamo sessione del locale O sessione corporate (*)
      if (!modoPortal && s.local !== '*' && s.local !== CFG.local) return null;
      if (!s.expiresAt || s.expiresAt < Date.now()) {   // scaduta
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch (e) { return null; }
  }

  function guardarSesion(user, role, turno, localOverride) {
    var s = {
      user: user, role: role,
      local: localOverride || CFG.local,
      turno: turno || '', expiresAt: Date.now() + SESSION_HORAS * 3600 * 1000
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  // ════════════════════════════════════════════════════════════════
  //  GATING — nasconde le card non permesse al ruolo
  // ════════════════════════════════════════════════════════════════
  function aplicarGating(role) {
    var cards = document.querySelectorAll('[data-roles]');
    for (var i = 0; i < cards.length; i++) {
      var permitidos = (cards[i].getAttribute('data-roles') || '')
        .split(',').map(function (x) { return x.trim().toUpperCase(); });
      if (permitidos.indexOf((role || '').toUpperCase()) === -1) {
        cards[i].style.display = 'none';
      }
    }
    // se un blocco (.grid) resta senza card visibili, nasconde anche l'intestazione
    var grids = document.querySelectorAll('.grid');
    for (var g = 0; g < grids.length; g++) {
      var vis = grids[g].querySelectorAll('.card');
      var algunaVisible = false;
      for (var c = 0; c < vis.length; c++) {
        if (vis[c].style.display !== 'none') { algunaVisible = true; break; }
      }
      if (!algunaVisible) {
        grids[g].style.display = 'none';
        var prev = grids[g].previousElementSibling;   // la riga .sl che la precede
        if (prev && prev.classList.contains('sl')) prev.style.display = 'none';
      }
    }
    inyectarBarraUsuario(role);
  }

  function inyectarBarraUsuario(role) {
    var ses = leerSesion();
    if (!ses) return;
    var hr = document.querySelector('header .hright');
    if (!hr || document.getElementById('pa-userchip')) return;
    var chip = document.createElement('div');
    chip.id = 'pa-userchip';
    chip.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:5px 10px;border:1px solid var(--b2);' +
      'border-radius:16px;font-size:11px;color:var(--t2);cursor:default';
    chip.innerHTML =
      '<span style="color:var(--t1);font-weight:600">' + esc(ses.user) + '</span>' +
      '<span>· ' + esc(ROL_NOMBRE[ses.role] || ses.role) + '</span>' +
      '<button id="pa-logout" title="Cerrar sesión" style="background:rgba(192,57,43,0.15);' +
      'border:1px solid rgba(192,57,43,0.4);color:#E07070;font-size:10px;font-weight:700;' +
      'padding:3px 8px;border-radius:12px;cursor:pointer">Salir</button>';
    hr.insertBefore(chip, hr.firstChild);
    document.getElementById('pa-logout').onclick = function () { PinsitaAuth.logout(); };
  }

  // ════════════════════════════════════════════════════════════════
  //  CHIAMATA AL GAS
  //  Content-Type text/plain → niente preflight CORS su Apps Script.
  //  Il body resta JSON, il GAS lo legge con JSON.parse(e.postData.contents).
  // ════════════════════════════════════════════════════════════════
  function llamarGAS(payload) {
    return fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  // ════════════════════════════════════════════════════════════════
  //  CARICAMENTO LISTA UTENTI (dal GAS · azione lista_usuarios)
  // ════════════════════════════════════════════════════════════════
  function cargarUsuarios() {
    llamarGAS({ accion: 'lista_usuarios', local: CFG.local })
      .then(function (res) {
        USERS = (res && res.ok && res.usuarios) ? res.usuarios : [];
        renderListaUsuarios();
      })
      .catch(function () { USERS = []; renderListaUsuarios(); });
  }

  // ════════════════════════════════════════════════════════════════
  //  UI · OVERLAY DI LOGIN
  // ════════════════════════════════════════════════════════════════
  function construirOverlay() {
    if (document.getElementById('pa-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'pa-overlay';
    ov.innerHTML = ESTILO + MARKUP;
    document.body.appendChild(ov);
    // v1.3: pa-toast come figlio diretto di body (fuori da overlay nascosto)
    if (!document.getElementById('pa-toast')) {
      var tst = document.createElement('div');
      tst.id = 'pa-toast';
      document.body.appendChild(tst);
    }
    construirTeclado();
    document.getElementById('pa-back').onclick = volverALista;
    // v1.2 · close button (visibile solo in modoPortal)
    var bc = document.getElementById('pa-close-portal');
    if (bc) bc.onclick = cerrarOverlayPortal;
    // v1.2 · ESC chiude overlay solo se modoPortal (negli hub non c'e' uscita)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modoPortal) {
        var ov = document.getElementById('pa-overlay');
        if (ov && ov.style.display !== 'none') cerrarOverlayPortal();
      }
    });
    // FAB Ayuda: apre/chiude il panel help
    document.getElementById('pa-help-fab').onclick = function () {
      document.getElementById('pa-help-overlay').classList.add('on');
    };
    document.getElementById('pa-help-close').onclick = function () {
      document.getElementById('pa-help-overlay').classList.remove('on');
    };
    document.getElementById('pa-help-overlay').onclick = function (e) {
      if (e.target === this) this.classList.remove('on');
    };
  }
  // mostra/nasconde il FAB Ayuda (solo nella schermata PIN)
  function mostrarHelp(on) {
    var w = document.getElementById('pa-help-wrap');
    if (w) w.classList.toggle('on', !!on);
    if (!on) {
      var o = document.getElementById('pa-help-overlay');
      if (o) o.classList.remove('on');
    }
  }
  function mostrarOverlay() {
    document.getElementById('pa-overlay').style.display = 'flex';
    // v1.2 · mostra "close" solo se modoPortal
    var bc = document.getElementById('pa-close-portal');
    if (bc) bc.style.display = modoPortal ? 'inline-block' : 'none';
  }
  function ocultarOverlay() {
    var ov = document.getElementById('pa-overlay');
    if (ov) ov.style.display = 'none';
  }

  function renderListaUsuarios() {
    var cont = document.getElementById('pa-lista');
    if (!cont) return;
    if (!USERS.length) {
      // fallback: nessuna lista → l'utente scrive il proprio nome.
      // Il GAS normalizza (minuscole, accenti, spazi): l'utente puo' scrivere naturale.
      cont.innerHTML =
        '<div style="font-size:11.5px;color:var(--t3,#6A6460);margin-bottom:8px;line-height:1.45">' +
        'Escribe tu <b style="color:var(--t2,#A8A29C)">nombre y apellido</b>, ' +
        'como aparece en tu registro.</div>' +
        '<input id="pa-nombre-input" placeholder="Ej: Jorge Pérez" autocomplete="off" ' +
        'autocapitalize="words" spellcheck="false" ' +
        'style="width:100%;padding:13px 14px;background:var(--card2);border:1px solid var(--b2);' +
        'border-radius:8px;color:var(--t1);font-size:14px;font-family:inherit">';
      var btn = document.createElement('button');
      btn.textContent = 'Continuar';
      btn.className = 'pa-cta';
      btn.onclick = function () {
        var v = document.getElementById('pa-nombre-input').value.trim();
        if (!v) { toast('Escribe tu nombre'); return; }
        seleccion = { nombre: v, cargo: '', foto: '', tiene_pin: null };
        irAPin();
      };
      cont.appendChild(btn);
      return;
    }
    cont.innerHTML = '';
    USERS.forEach(function (u) {
      var row = document.createElement('button');
      row.className = 'pa-user';
      row.innerHTML = avatarHTML(u) +
        '<span class="pa-user-txt"><span class="pa-user-n">' + esc(u.nombre) + '</span>' +
        '<span class="pa-user-c">' + esc(ROL_NOMBRE[u.cargo] || u.cargo) + '</span></span>';
      row.onclick = function () { seleccion = u; irAPin(); };
      cont.appendChild(row);
    });
  }

  function avatarHTML(u) {
    if (u.foto) {
      return '<span class="pa-avatar" style="background-image:url(\'' +
        esc(u.foto) + '\');background-size:cover;background-position:center"></span>';
    }
    // fallback: iniziali su cerchio colorato (deterrente sociale piu' debole ma valido)
    var ini = u.nombre.split(/\s+/).map(function (w) { return w[0] || ''; })
      .join('').slice(0, 2).toUpperCase();
    var col = colorDe(u.nombre);
    return '<span class="pa-avatar" style="background:' + col +
      ';color:#fff;display:flex;align-items:center;justify-content:center;' +
      'font-weight:700;font-size:14px">' + esc(ini) + '</span>';
  }

  function colorDe(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffff;
    var pal = ['#4A90D9', '#3DAA6E', '#C24B8A', '#8A9E4A', '#7B84E0', '#D4860A'];
    return pal[Math.abs(h) % pal.length];
  }

  // ── PASSAGGIO ALLA SCHERMATA PIN ──────────────────────────────────
  function irAPin() {
    pinBuffer = ''; pinTmp = '';
    document.getElementById('pa-step-lista').style.display = 'none';
    document.getElementById('pa-step-pin').style.display = 'flex';
    document.getElementById('pa-pin-user').textContent = seleccion.nombre;
    // se l'utente NON ha ancora un PIN → va dritto a "Crea tu PIN" (niente
    // schermata "Ingresa tu PIN" sprecata). tiene_pin arriva da lista_usuarios.
    if (seleccion.tiene_pin === false) {
      modo = 'set_pin';
      setPinPaso('Crea tu PIN', 'Elige 4 dígitos que puedas recordar.', 'Paso 1 de 2');
    } else {
      modo = 'login';
      setPinPaso('Ingresa tu PIN', '', '');
    }
    pintarPin();
    mostrarHelp(true);
  }
  function volverALista() {
    document.getElementById('pa-step-pin').style.display = 'none';
    document.getElementById('pa-step-lista').style.display = 'block';
    seleccion = null; pinBuffer = '';
    mostrarHelp(false);
  }
  // aggiorna titolo + sottotitolo esplicativo + indicatore di passo
  function setPinPaso(titulo, sub, paso) {
    document.getElementById('pa-pin-titulo').textContent = titulo;
    document.getElementById('pa-pin-sub').textContent = sub || '';
    document.getElementById('pa-pin-paso').textContent = paso || '';
  }

  // ── TASTIERINO PIN ────────────────────────────────────────────────
  function construirTeclado() {
    var tk = document.getElementById('pa-teclado');
    var defs = ['1','2','3','4','5','6','7','8','9','','0','del'];
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.className = 'pa-key';
      if (d === '') { b.className += ' pa-key-empty'; b.disabled = true; }
      else if (d === 'del') { b.innerHTML = '⌫'; b.onclick = pinDel; }
      else { b.textContent = d; b.onclick = function () { pinAdd(d); }; }
      tk.appendChild(b);
    });
  }
  function pinAdd(d) {
    if (pinBuffer.length >= 4) return;
    pinBuffer += d;
    pintarPin();
    if (pinBuffer.length === 4) setTimeout(confirmarPin, 120);
  }
  function pinDel() { pinBuffer = pinBuffer.slice(0, -1); pintarPin(); }
  function pintarPin() {
    var dots = document.querySelectorAll('#pa-dots .pa-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('on', i < pinBuffer.length);
    }
  }

  // ── CONFERMA / LOGIN ──────────────────────────────────────────────
  function confirmarPin() {
    if (modo === 'set_pin') return manejarSetPin();
    bloquear(true);
    llamarGAS({
      accion: 'login', local: CFG.local, nombre: seleccion.nombre,
      pin: pinBuffer, dispositivo: navigator.userAgent.slice(0, 60)
    }).then(function (res) {
      bloquear(false);
      if (res && res.ok && res.primer_acceso) {     // primo accesso o reset
        modo = 'set_pin'; pinBuffer = ''; pinTmp = '';
        setPinPaso('Crea tu PIN', 'Elige 4 dígitos que puedas recordar.', 'Paso 1 de 2');
        pintarPin();
        toast('Elige un PIN de 4 dígitos');
        return;
      }
      if (res && res.ok) {                          // login riuscito
        // v1.2: branching modoPortal vs hub locale
        if (modoPortal) {
          finalizarLoginPortal(res);
        } else {
          guardarSesion(seleccion.nombre, res.cargo, res.turno);
          ocultarOverlay();
          aplicarGating(res.cargo);
        }
        return;
      }
      // errori
      pinBuffer = ''; pintarPin();
      if (res && res.error === 'pin_errado') toast('PIN incorrecto');
      else if (res && res.error === 'inactivo') toast('Usuario inactivo');
      else if (res && res.error === 'no_existe') toast('Usuario no encontrado');
      else toast('No se pudo iniciar sesión');
    }).catch(function () {
      bloquear(false); pinBuffer = ''; pintarPin();
      toast('Sin conexión · reintenta');
    });
  }

  // due passi: digita PIN nuovo, poi lo riconferma
  function manejarSetPin() {
    if (!pinTmp) {                       // primo inserimento
      pinTmp = pinBuffer; pinBuffer = '';
      setPinPaso('Confirma tu PIN', 'Vuelve a digitar los mismos 4 dígitos.', 'Paso 2 de 2');
      pintarPin();
      return;
    }
    if (pinBuffer !== pinTmp) {           // conferma errata
      pinTmp = ''; pinBuffer = '';
      setPinPaso('Crea tu PIN', 'Elige 4 dígitos que puedas recordar.', 'Paso 1 de 2');
      pintarPin();
      toast('No coinciden · empecemos de nuevo');
      return;
    }
    bloquear(true);
    var pinElegido = pinBuffer;          // memorizza prima di azzerare
    modo = 'login';                       // esce dalla modalita' set_pin subito
    pinBuffer = ''; pinTmp = '';
    llamarGAS({
      accion: 'set_pin', local: CFG.local,
      nombre: seleccion.nombre, pin_nuevo: pinElegido
    }).then(function (res) {
      bloquear(false);
      if (res && res.ok) {
        // set_pin e' anche login: branching modoPortal vs hub locale
        if (modoPortal) {
          finalizarLoginPortal(res);
        } else {
          guardarSesion(seleccion.nombre, res.cargo, res.turno);
          ocultarOverlay();
          aplicarGating(res.cargo);
        }
        return;
      }
      // PIN rifiutato dal GAS → ricomincia la creazione
      setPinPaso('Crea tu PIN', 'Elige 4 dígitos que puedas recordar.', 'Paso 1 de 2'); pintarPin();
      toast('PIN no válido · usa 4 dígitos');
    }).catch(function () {
      bloquear(false); pintarPin();
      toast('Sin conexión · reintenta');
    });
  }

  // ── UTILITY UI ────────────────────────────────────────────────────
  function bloquear(on) {
    var o = document.getElementById('pa-overlay');
    if (o) o.classList.toggle('pa-busy', !!on);
  }
  function toast(msg) {
    var t = document.getElementById('pa-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._tmr);
    t._tmr = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  MARKUP + STILE  (accent iniettato a runtime via --pa-accent)
  // ════════════════════════════════════════════════════════════════
  var ESTILO = '<style>' +
    '#pa-overlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;' +
      'justify-content:center;background:#0F0F0F;font-family:inherit}' +
    '#pa-overlay.pa-busy{pointer-events:none;opacity:.7}' +
    '.pa-box{width:100%;max-width:380px;padding:32px 26px;display:flex;flex-direction:column;align-items:center;position:relative}' +
    '#pa-close-portal{position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.06);' +
      'border:1px solid var(--b2,#2C2C2C);color:var(--t2,#A8A29C);font-size:13px;padding:4px 10px;' +
      'border-radius:8px;cursor:pointer;line-height:1;display:none}' +
    '#pa-close-portal:hover{border-color:var(--pa-accent);color:var(--pa-accent)}' +
    '.pa-logo{width:175px;height:43px;background-repeat:no-repeat;'+
      'background-position:center;background-size:contain}' +
    '.pa-sub{font-size:12px;color:var(--t3,#6A6460);margin:4px 0 24px}' +
    '.pa-h{font-size:13px;font-weight:600;color:var(--t2,#A8A29C);align-self:flex-start;margin-bottom:10px}' +
    '#pa-lista{width:100%;display:flex;flex-direction:column;gap:8px;max-height:46vh;overflow-y:auto}' +
    '.pa-user{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;cursor:pointer;' +
      'background:var(--card,#1A1A1A);border:1px solid var(--b,#242424);border-radius:10px;text-align:left;' +
      'transition:border-color .15s,transform .15s}' +
    '.pa-user:hover{border-color:var(--pa-accent);transform:translateY(-1px)}' +
    '.pa-avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:#333}' +
    '.pa-user-txt{display:flex;flex-direction:column;gap:1px}' +
    '.pa-user-n{font-size:14px;font-weight:600;color:var(--t1,#F2EDE6)}' +
    '.pa-user-c{font-size:11px;color:var(--t3,#6A6460)}' +
    '#pa-step-pin{width:100%;display:none;flex-direction:column;align-items:center}' +
    '#pa-back{align-self:flex-start;background:transparent;border:1px solid var(--b2,#2C2C2C);' +
      'color:var(--t2,#A8A29C);font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer;margin-bottom:14px}' +
    '#pa-back:hover{border-color:var(--pa-accent);color:var(--pa-accent)}' +
    '#pa-pin-titulo{font-size:15px;font-weight:600;color:var(--t1,#F2EDE6)}' +
    '#pa-pin-user{font-size:12px;color:var(--pa-accent);margin:3px 0 6px;font-weight:600}' +
    '#pa-pin-sub{font-size:12px;color:var(--t2,#A8A29C);margin-bottom:10px;text-align:center;max-width:240px;line-height:1.45}' +
    '#pa-pin-paso{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--pa-accent);margin-bottom:18px;font-weight:800;padding:4px 12px;border:1px solid var(--pa-accent);border-radius:12px}' +
    '#pa-pin-paso:empty{display:none}' +
    '#pa-dots{display:flex;gap:14px;margin-bottom:24px}' +
    '.pa-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--b2,#2C2C2C);transition:all .15s}' +
    '.pa-dot.on{background:var(--pa-accent);border-color:var(--pa-accent)}' +
    '#pa-teclado{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:260px}' +
    '.pa-key{height:56px;font-size:20px;font-weight:600;color:var(--t1,#F2EDE6);cursor:pointer;' +
      'background:var(--card,#1A1A1A);border:1px solid var(--b,#242424);border-radius:10px;transition:all .12s}' +
    '.pa-key:hover{border-color:var(--pa-accent)}' +
    '.pa-key:active{transform:scale(.95);background:var(--card2,#141414)}' +
    '.pa-key-empty{background:transparent;border:none;cursor:default}' +
    '.pa-cta{width:100%;margin-top:14px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;' +
      'background:var(--pa-accent);border:none;border-radius:8px;color:#fff}' +
    '#pa-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);' +
      'background:#C0392B;color:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:8px;' +
      'opacity:0;transition:all .25s;pointer-events:none;z-index:9100}' +
    '#pa-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}' +
    // ── FAB AYUDA · brand PINSA (sempre arancio, NORMA §11) ──────────
    '@keyframes paHaloPulse{0%{transform:scale(1);opacity:.55}70%{transform:scale(1.6);opacity:0}100%{transform:scale(1.6);opacity:0}}' +
    '@keyframes paBulbGlow{0%,100%{filter:drop-shadow(0 0 2px rgba(255,220,150,.4))}50%{filter:drop-shadow(0 0 6px rgba(255,220,150,.9))}}' +
    '@keyframes paSparkleSpin{0%,100%{transform:rotate(0deg) scale(1);opacity:.9}50%{transform:rotate(180deg) scale(1.15);opacity:1}}' +
    '#pa-help-wrap{position:fixed;bottom:22px;right:22px;width:64px;height:64px;z-index:9200;display:none}' +
    '#pa-help-wrap.on{display:block}' +
    '#pa-help-wrap .pa-help-halo{position:absolute;inset:0;border-radius:50%;pointer-events:none;' +
      'background:radial-gradient(circle,rgba(196,98,29,.55) 0%,rgba(196,98,29,0) 65%);animation:paHaloPulse 2.4s ease-out infinite}' +
    '#pa-help-wrap .pa-help-halo.delayed{animation-delay:1.2s}' +
    '#pa-help-fab{position:relative;z-index:2;width:64px;height:64px;border-radius:50%;cursor:pointer;padding:0;' +
      'background:radial-gradient(circle at 30% 25%,#E07030 0%,#C4621D 55%,#9A4C11 100%);' +
      'border:1.5px solid rgba(255,220,180,.25);color:#FFF4E6;' +
      'box-shadow:0 8px 22px rgba(0,0,0,.5),0 3px 8px rgba(196,98,29,.55),inset 0 2px 0 rgba(255,255,255,.18),inset 0 -3px 6px rgba(0,0,0,.25);' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .18s ease-out}' +
    '#pa-help-fab:hover{transform:scale(1.08)}' +
    '#pa-help-fab:active{transform:scale(.96);transition:transform .08s}' +
    '#pa-help-fab svg{animation:paBulbGlow 2.6s ease-in-out infinite;margin-top:-2px}' +
    '#pa-help-fab .pa-help-sparkle{animation:paSparkleSpin 3.2s ease-in-out infinite;transform-origin:center}' +
    '#pa-help-fab .pa-help-label{font-size:9px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;' +
      'color:#FFE9D1;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,.4)}' +
    '#pa-help-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9300;' +
      'align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
    '#pa-help-overlay.on{display:flex}' +
    '.pa-help-card{background:#1A1A1A;border:1px solid rgba(196,98,29,.3);border-radius:12px;width:100%;max-width:480px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
    '.pa-help-head{padding:14px 18px;border-bottom:1px solid rgba(196,98,29,.2);display:flex;' +
      'justify-content:space-between;align-items:center;' +
      'background:linear-gradient(135deg,rgba(196,98,29,.14) 0%,rgba(160,79,20,.06) 100%)}' +
    '.pa-help-head-t{font-size:15px;font-weight:700;color:#F2EDE6}' +
    '#pa-help-close{background:rgba(192,57,43,.15);border:1px solid rgba(192,57,43,.4);color:#E07070;' +
      'font-size:12px;font-weight:600;padding:6px 14px;border-radius:16px;cursor:pointer}' +
    '.pa-help-body{padding:16px 18px}' +
    '.pa-help-blk{border-left:3px solid;padding:10px 12px;border-radius:4px;margin-bottom:10px}' +
    '.pa-help-blk:last-child{margin-bottom:0}' +
    '.pa-help-rapido{background:rgba(74,144,217,.12);border-color:#6BA8E5}' +
    '.pa-help-pasos{background:rgba(61,170,110,.10);border-color:#52C882}' +
    '.pa-help-cuidado{background:rgba(212,134,10,.12);border-color:#D4860A}' +
    '.pa-help-tag{font-size:9px;font-weight:700;letter-spacing:1.5px;margin-bottom:6px;color:#A8A29C}' +
    '.pa-help-txt{font-size:12.5px;color:#F2EDE6;line-height:1.5}' +
    '.pa-help-paso{font-size:12.5px;color:#F2EDE6;line-height:1.5;margin-bottom:5px}' +
    '.pa-help-paso:last-child{margin-bottom:0}' +
    '.pa-help-paso b{color:#52C882}' +
    '</style>';

  // ── FAB AYUDA · brand PINSA (NORMA_BOTON_AYUDA v2.0) ──────────────
  // Adattato: vive dentro l'overlay di login (z-index sopra), niente tab.
  var HELP_FAB =
    '<div id="pa-help-wrap">' +
      '<div class="pa-help-halo"></div>' +
      '<div class="pa-help-halo delayed"></div>' +
      '<button id="pa-help-fab" aria-label="Ayuda contextual">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<g opacity="0.7"><path d="M12 1.2v1.8M12 21v1.8M3 12H1.2M22.8 12H21M4.8 4.8 3.6 3.6M20.4 3.6 19.2 4.8" stroke="#FFE9D1" stroke-width="1.1" stroke-linecap="round"/></g>' +
          '<path d="M12 3.2c-3.3 0-6 2.7-6 6 0 2.2 1.15 4.1 2.85 5.24V16a1 1 0 0 0 1 1h4.3a1 1 0 0 0 1-1v-1.56C16.85 13.3 18 11.4 18 9.2c0-3.3-2.7-6-6-6Z" fill="#FFF7E6" stroke="#FFF4E6" stroke-width="0.9" stroke-linejoin="round"/>' +
          '<path d="M10 7.8c.9-.6 1.8-.6 2.7 0M10.5 9.2h3M12 10.5v4" stroke="#D47012" stroke-width="1.2" stroke-linecap="round" fill="none"/>' +
          '<path d="M10 18h4M10.6 20h2.8" stroke="#FFF4E6" stroke-width="1.4" stroke-linecap="round"/>' +
          '<g class="pa-help-sparkle"><path d="M19.8 3.4l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z" fill="#FFD89A" fill-opacity="0.95"/></g>' +
        '</svg>' +
        '<span class="pa-help-label">Ayuda</span>' +
      '</button>' +
    '</div>';

  var HELP_PANEL =
    '<div id="pa-help-overlay">' +
      '<div class="pa-help-card">' +
        '<div class="pa-help-head">' +
          '<div class="pa-help-head-t">¿Cómo creo mi PIN?</div>' +
          '<button id="pa-help-close" aria-label="Cerrar ayuda">✕ Cerrar</button>' +
        '</div>' +
        '<div class="pa-help-body">' +
          '<div class="pa-help-blk pa-help-rapido">' +
            '<div class="pa-help-tag">⚡ LO RÁPIDO</div>' +
            '<div class="pa-help-txt">Tu PIN son 4 números que eliges tú. Nadie más los ve — ni tu jefe.</div>' +
          '</div>' +
          '<div class="pa-help-blk pa-help-pasos">' +
            '<div class="pa-help-tag">📋 LOS 3 PASOS</div>' +
            '<div class="pa-help-paso"><b>1.</b> Elige 4 números fáciles de recordar para ti.</div>' +
            '<div class="pa-help-paso"><b>2.</b> Digítalos una vez (Paso 1 de 2).</div>' +
            '<div class="pa-help-paso"><b>3.</b> Vuelve a digitarlos igual para confirmar (Paso 2 de 2).</div>' +
          '</div>' +
          '<div class="pa-help-blk pa-help-cuidado">' +
            '<div class="pa-help-tag">⚠️ CUIDADO CON ESTO</div>' +
            '<div class="pa-help-txt">No uses 1234 ni tu fecha de nacimiento — son fáciles de adivinar. ' +
            'Si olvidaste tu PIN, pídele a tu Jefe de Local que lo reinicie: no se puede recuperar, solo crear uno nuevo.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var MARKUP =
    '<div class="pa-box">' +
      '<button id="pa-close-portal" aria-label="Cancelar login" title="Cancelar y volver al Portal">✕</button>' +
      '<div class="pa-logo"></div>' +
      '<div class="pa-sub">Sistema Operativo · Acceso</div>' +
      '<div id="pa-step-lista" style="width:100%">' +
        '<div class="pa-h">¿Quién eres?</div>' +
        '<div id="pa-lista"></div>' +
      '</div>' +
      '<div id="pa-step-pin">' +
        '<button id="pa-back">← Cambiar</button>' +
        '<div id="pa-pin-titulo">Ingresa tu PIN</div>' +
        '<div id="pa-pin-user"></div>' +
        '<div id="pa-pin-sub"></div>' +
        '<div id="pa-pin-paso"></div>' +
        '<div id="pa-dots">' +
          '<span class="pa-dot"></span><span class="pa-dot"></span>' +
          '<span class="pa-dot"></span><span class="pa-dot"></span>' +
        '</div>' +
        '<div id="pa-teclado"></div>' +
      '</div>' +
    '</div>' +
    HELP_FAB + HELP_PANEL;


  global.PinsitaAuth = PinsitaAuth;

})(window);
