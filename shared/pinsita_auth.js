/* ════════════════════════════════════════════════════════════════════
 *  *  PINSITA · AUTH-RUOLI · modulo frontend condiviso  ·  v1.7
 *  Una sola copia in /shared/ · incluso da ogni hub di locale + Portal.
 *
 *  v1.1 · la lista utenti arriva dal GAS (azione lista_usuarios),
 *         non da un CSV. Una sola fonte, un solo canale.
 *         Il codice locale (rsc/cdl) e' quello del foglio: nessuna traduzione.
 *
 *  *  v1.3 (27-may-2026) · aggiunta API PinsitaAuth.initOnPortal()
 *         Login PIN inline sul Portal nuovo (AUTH-1-bis).
 *         Scope-aware: scope='cdl'/'rsc' carica utenti del locale + corporate;
 *         scope vuoto (Operaciofunction finalizarLogn/Estrategia) carica solo corporate.
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

  // Logo ATALAYA · SVG inline (torre+civetta) · la puerta de la torre es de la torre (v1.7, 05-jul)
  var LOGO_ATALAYA = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20372%2090%22%3E%3Cg%20transform%3D%22translate(44%2C50)%20scale(0.82)%22%3E%3Cpath%20d%3D%22M%20-23%2031%20L%20-7%20-20%20L%207%20-20%20L%2023%2031%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%223.3%22%20stroke-linejoin%3D%22round%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20-8.5%20-20%20L%20-8.5%20-26.5%20L%20-3.4%20-26.5%20L%20-3.4%20-21%20M%203.4%20-21%20L%203.4%20-26.5%20L%208.5%20-26.5%20L%208.5%20-20%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%223.3%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20-12.5%201%20Q%20-7%20-3.8%20-1.6%201%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%201.6%201%20Q%207%20-3.8%2012.5%201%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%22-7%22%20cy%3D%226%22%20r%3D%224.2%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%222.1%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%226%22%20r%3D%224.2%22%20fill%3D%22none%22%20stroke%3D%22%23D9923F%22%20stroke-width%3D%222.1%22%2F%3E%3Ccircle%20cx%3D%22-7%22%20cy%3D%226%22%20r%3D%221.9%22%20fill%3D%22%23F3DDC0%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%226%22%20r%3D%221.9%22%20fill%3D%22%23F3DDC0%22%2F%3E%3Ccircle%20cx%3D%22-6.2%22%20cy%3D%225%22%20r%3D%220.6%22%20fill%3D%22%23FFFFFF%22%2F%3E%3Ccircle%20cx%3D%227.8%22%20cy%3D%225%22%20r%3D%220.6%22%20fill%3D%22%23FFFFFF%22%2F%3E%3Cpath%20d%3D%22M%200%209%20L%20-2%2013%20L%202%2013%20Z%22%20fill%3D%22%23D9923F%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%2288%22%20y%3D%2251%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%2231%22%20font-weight%3D%22500%22%20letter-spacing%3D%227.5%22%20fill%3D%22%23F2F0ED%22%3EATALAYA%3C%2Ftext%3E%3Ctext%20x%3D%2290%22%20y%3D%2272%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%2210.5%22%20letter-spacing%3D%225.2%22%20fill%3D%22%237A7570%22%3ESIEMPRE%20ALERTA%3C%2Ftext%3E%3C%2Fsvg%3E';

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
      if (lg) lg.style.backgroundImage = "url('" + LOGO_ATALAYA + "')";
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
      if (lg) lg.style.backgroundImage = "url('" + LOGO_ATALAYA + "')";

      // intercetta click su tutte le card con data-roles
      var cards = document.querySelectorAll('a.card[data-roles]');
      for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', onPortalCardClick);
      }

      // badge utente in header se sessione attiva
      var ses = leerSesion();
      if (ses) inyectarBarraUsuarioPortal(ses);

      // v1.4 · fix bfcache al ritorno da una card (VOLVER → history.back)
      // v1.6 · fix bfcache anche su forward dopo logout: rimuovi chip residuo
      //        se sessione assente (DOM ripristinato ha il chip del precedente login).
      // pageshow scatta SIA al primo load SIA al restore dalla bfcache.
      window.addEventListener('pageshow', function () {
        if (!modoPortal) return;
        cerrarOverlayPortal();
        var s = leerSesion();
        var chip = document.getElementById('pa-userchip');
        if (s) {
          if (!chip) inyectarBarraUsuarioPortal(s);
        } else if (chip) {
          chip.remove();
        }
      });
    },
    logout: function (redirectUrl) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      if (redirectUrl) location.href = redirectUrl;
      else location.reload();
    },
    // ── v1.6 · API per pagine shell (no gating, no overlay) ──────
    // Inietta SOLO il chip operatore + bottone Salir se sessione attiva.
    // Non blocca l'ingresso (vetrina pubblica come bcentral_operaciones).
    // Idempotente (guard #pa-userchip in inyectarBarraUsuarioPortal).
    // Robusta a bfcache via listener pageshow.
    // opts.redirectAfterLogout: dove andare dopo Salir (default 'portal.html').
    //   Per file in sottocartelle passare path relativo: '../portal.html'.
    inyectarSalirSolo: function (opts) {
      var redirectUrl = (opts && opts.redirectAfterLogout) || 'portal.html';
      function inject(e) {
        var s = leerSesion();
        var chip = document.getElementById('pa-userchip');
        if (s) {
          if (!chip) inyectarBarraUsuarioPortal(s);
          var btn = document.getElementById('pa-logout');
          if (btn) btn.onclick = function () { PinsitaAuth.logout(redirectUrl); };
        } else if (e && e.persisted) {
          location.href = redirectUrl;  // bfcache restore senza sessione: torna a porta ufficiale
        } else if (chip) {
          chip.remove();  // bfcache: rimuovi chip residuo dopo logout+forward
        }
      }
      inject();
      window.addEventListener('pageshow', inject);
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
    // v1.5 · usa res.local dal GAS (verita' autorevole) invece di CFG.local
    // CFG.local riflette il scope della card cliccata, non il local reale dell'utente.
    // Utenti corporate (local='*') venivano salvati col scope della card → gating sbagliato.
    guardarSesion(seleccion.nombre, res.cargo, res.turno, res.local || CFG.local);

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
    // FIX dígitos perdidos (7-jul): el tecleo dispara al APOYAR el dedo
    // (pointerdown), como un teclado físico — no al soltar (click), que el
    // browser puede retrasar/comerse en taps rápidos. preventDefault corta el
    // click-fantasma posterior (no doble dígito). Fallback: click (browsers viejos).
    function bindKey(b, fn) {
      if (window.PointerEvent) {
        b.onpointerdown = function (e) { e.preventDefault(); fn(); };
      } else {
        b.onclick = fn;
      }
    }
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.className = 'pa-key';
      if (d === '') { b.className += ' pa-key-empty'; b.disabled = true; }
      else if (d === 'del') { b.innerHTML = '⌫'; bindKey(b, pinDel); }
      else { b.textContent = d; bindKey(b, function () { pinAdd(d); }); }
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
      'background:var(--card,#1A1A1A);border:1px solid var(--b,#242424);border-radius:10px;transition:all .12s;' +
      // FIX dígitos perdidos (7-jul): sin touch-action el browser retiene el 2º tap
      // rápido (gesto doble-tap-zoom) y se lo COME — típico con dígitos repetidos.
      'touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}' +
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
