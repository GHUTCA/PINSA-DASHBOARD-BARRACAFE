/* ════════════════════════════════════════════════════════════════════
 *  PINSITA · AUTH-RUOLI · modulo frontend condiviso  ·  v1.0
 *  Una sola copia in /shared/ · incluso da ogni hub di locale.
 *
 *  Cosa fa:
 *   - Mostra una schermata di login (nome + foto/iniziali + PIN 4 cifre)
 *   - Verifica via GAS doPost (auth_pinsita) · niente PIN in chiaro
 *   - Gestisce primo accesso / reset PIN (l'utente sceglie il suo PIN)
 *   - Apre sessione 8h in localStorage (durata turno · NORMA_DISENO §3)
 *   - Gating: nasconde le card che il ruolo non puo' aprire (§4)
 *
 *  Come si usa in un hub (es. rsc/index.html):
 *   1. <script src="../shared/locales_config.js"></script>  (gia' presente di norma)
 *   2. <script src="../shared/pinsita_auth.js"></script>
 *   3. In fondo, dopo il resto:  PinsitaAuth.init({ local:'rsc', accent:'#D4A030' });
 *
 *  Gating · ogni card che va protetta porta  data-roles="JL,GO"
 *  (lista codici cargo separati da virgola). Card senza l'attributo = visibile a tutti.
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
  // CSV anagrafica utenti — tab "usuarios" di CTRL_OBJETIVOS pubblicato.
  // Serve SOLO a popolare la lista nomi+foto (dati non sensibili).
  // La verifica del PIN passa sempre dal GAS. Compilare al deploy:
  var USUARIOS_CSV = '';   // <-- URL CSV pub del tab "usuarios" (gid). Se '' → lista da GAS-less fallback.

  // ── STATO INTERNO ─────────────────────────────────────────────────
  var CFG = { local:'cdl', accent:'#C4622D' };
  var USERS = [];          // [{nombre, cargo, foto}]
  var seleccion = null;    // utente scelto nella lista
  var pinBuffer = '';      // cifre PIN digitate
  var modo = 'login';      // 'login' | 'set_pin'
  var pinTmp = '';         // primo PIN durante set_pin (per la conferma)

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
      cargarUsuarios();
      mostrarOverlay();
    },
    logout: function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      location.reload();
    },
    sesion: function () { return leerSesion(); }
  };

  // ════════════════════════════════════════════════════════════════
  //  SESSIONE
  // ════════════════════════════════════════════════════════════════
  function leerSesion() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.local !== CFG.local) return null;     // sessione di altro locale
      if (!s.expiresAt || s.expiresAt < Date.now()) {   // scaduta
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch (e) { return null; }
  }

  function guardarSesion(user, role, turno) {
    var s = {
      user: user, role: role, local: CFG.local,
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
    // se un blocco (.grid) resta senza card visibili, nasconde anche la sua intestazione
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
  //  CARICAMENTO LISTA UTENTI
  // ════════════════════════════════════════════════════════════════
  function cargarUsuarios() {
    if (!USUARIOS_CSV) { renderListaUsuarios(); return; }   // niente CSV → lista vuota, si scrive il nome
    fetch(USUARIOS_CSV + (USUARIOS_CSV.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(),
          { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (txt) {
        if (!txt || txt.indexOf('<!DOCTYPE') !== -1) { renderListaUsuarios(); return; }
        USERS = parseUsuarios(txt);
        renderListaUsuarios();
      })
      .catch(function () { renderListaUsuarios(); });
  }

  // tab "usuarios": local | nombre | cargo | foto_url | pin_hash | ...
  function parseUsuarios(txt) {
    var lines = txt.split('\n'), out = [];
    if (!lines.length) return out;
    var hdr = splitCSV(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
    var iL = hdr.indexOf('local'), iN = hdr.indexOf('nombre'),
        iC = hdr.indexOf('cargo'), iF = hdr.indexOf('foto_url'),
        iE = hdr.indexOf('estado');
    for (var i = 1; i < lines.length; i++) {
      var c = splitCSV(lines[i]);
      var loc = (c[iL] || '').trim().toLowerCase();
      var nom = (c[iN] || '').trim();
      if (!nom) continue;
      if (loc !== CFG.local.toLowerCase()) continue;
      if (iE !== -1 && (c[iE] || '').trim().toUpperCase() !== 'ACTIVO') continue;
      out.push({
        nombre: nom,
        cargo:  (iC !== -1 ? (c[iC] || '') : '').trim() || 'OP',
        foto:   (iF !== -1 ? (c[iF] || '') : '').trim()
      });
    }
    out.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    return out;
  }

  function splitCSV(line) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim().replace(/^"|"$/g, ''); });
  }

  // ════════════════════════════════════════════════════════════════
  //  CHIAMATA AL GAS
  //  Nota: Content-Type text/plain → niente preflight CORS su Apps Script.
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
  //  UI · OVERLAY DI LOGIN
  // ════════════════════════════════════════════════════════════════
  function construirOverlay() {
    if (document.getElementById('pa-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'pa-overlay';
    ov.innerHTML = ESTILO + MARKUP;
    document.body.appendChild(ov);
    construirTeclado();
    document.getElementById('pa-back').onclick = volverALista;
  }

  function mostrarOverlay() {
    document.getElementById('pa-overlay').style.display = 'flex';
  }
  function ocultarOverlay() {
    var ov = document.getElementById('pa-overlay');
    if (ov) ov.style.display = 'none';
  }

  function renderListaUsuarios() {
    var cont = document.getElementById('pa-lista');
    if (!cont) return;
    if (!USERS.length) {
      // fallback: nessuna lista → l'utente scrive il proprio nome
      cont.innerHTML =
        '<input id="pa-nombre-input" placeholder="Escribe tu nombre" ' +
        'style="width:100%;padding:13px 14px;background:var(--card2);border:1px solid var(--b2);' +
        'border-radius:8px;color:var(--t1);font-size:14px;font-family:inherit">';
      var btn = document.createElement('button');
      btn.textContent = 'Continuar';
      btn.className = 'pa-cta';
      btn.onclick = function () {
        var v = document.getElementById('pa-nombre-input').value.trim();
        if (!v) { toast('Escribe tu nombre'); return; }
        seleccion = { nombre: v, cargo: '', foto: '' };
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
    pinBuffer = ''; pinTmp = ''; modo = 'login';
    document.getElementById('pa-step-lista').style.display = 'none';
    document.getElementById('pa-step-pin').style.display = 'block';
    document.getElementById('pa-pin-user').textContent = seleccion.nombre;
    setPinTitulo('Ingresa tu PIN');
    pintarPin();
  }
  function volverALista() {
    document.getElementById('pa-step-pin').style.display = 'none';
    document.getElementById('pa-step-lista').style.display = 'block';
    seleccion = null; pinBuffer = '';
  }
  function setPinTitulo(t) { document.getElementById('pa-pin-titulo').textContent = t; }

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
        setPinTitulo(res.motivo === 'reset' ? 'Crea un PIN nuevo' : 'Crea tu PIN');
        pintarPin();
        toast('Elige un PIN de 4 dígitos');
        return;
      }
      if (res && res.ok) {                          // login riuscito
        guardarSesion(seleccion.nombre, res.cargo, res.turno);
        ocultarOverlay();
        aplicarGating(res.cargo);
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
      setPinTitulo('Repite el PIN');
      pintarPin();
      return;
    }
    if (pinBuffer !== pinTmp) {           // conferma errata
      pinTmp = ''; pinBuffer = '';
      setPinTitulo('Crea tu PIN');
      pintarPin();
      toast('Los PIN no coinciden, intenta de nuevo');
      return;
    }
    bloquear(true);
    llamarGAS({
      accion: 'set_pin', local: CFG.local,
      nombre: seleccion.nombre, pin_nuevo: pinBuffer
    }).then(function (res) {
      bloquear(false);
      if (res && res.ok) {
        // PIN creato → fa subito login con quel PIN
        var pinDef = pinBuffer;
        modo = 'login'; pinBuffer = '';
        llamarGAS({
          accion: 'login', local: CFG.local, nombre: seleccion.nombre,
          pin: pinDef, dispositivo: navigator.userAgent.slice(0, 60)
        }).then(function (r2) {
          if (r2 && r2.ok && !r2.primer_acceso) {
            guardarSesion(seleccion.nombre, r2.cargo, r2.turno);
            ocultarOverlay();
            aplicarGating(r2.cargo);
          } else {
            toast('PIN creado · vuelve a ingresar');
            volverALista();
          }
        }).catch(function () { toast('PIN creado · vuelve a ingresar'); volverALista(); });
        return;
      }
      pinTmp = ''; pinBuffer = ''; setPinTitulo('Crea tu PIN'); pintarPin();
      toast('PIN no válido · usa 4 dígitos');
    }).catch(function () {
      bloquear(false); pinTmp = ''; pinBuffer = ''; pintarPin();
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
    '.pa-box{width:100%;max-width:380px;padding:32px 26px;display:flex;flex-direction:column;align-items:center}' +
    '.pa-brand{font-size:22px;font-weight:800;letter-spacing:-.5px;color:var(--t1,#F2EDE6)}' +
    '.pa-brand b{color:var(--pa-accent)}' +
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
    '#pa-pin-user{font-size:12px;color:var(--pa-accent);margin:3px 0 20px;font-weight:600}' +
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
    '</style>';

  var MARKUP =
    '<div class="pa-box">' +
      '<div class="pa-brand">PINSA<b>.</b></div>' +
      '<div class="pa-sub">Sistema Operativo · Acceso</div>' +
      '<div id="pa-step-lista" style="width:100%">' +
        '<div class="pa-h">¿Quién eres?</div>' +
        '<div id="pa-lista"></div>' +
      '</div>' +
      '<div id="pa-step-pin">' +
        '<button id="pa-back">← Cambiar</button>' +
        '<div id="pa-pin-titulo">Ingresa tu PIN</div>' +
        '<div id="pa-pin-user"></div>' +
        '<div id="pa-dots">' +
          '<span class="pa-dot"></span><span class="pa-dot"></span>' +
          '<span class="pa-dot"></span><span class="pa-dot"></span>' +
        '</div>' +
        '<div id="pa-teclado"></div>' +
      '</div>' +
    '</div>' +
    '<div id="pa-toast"></div>';

  // accent iniettato come variabile CSS sull'overlay
  var _origInit = PinsitaAuth.init;
  PinsitaAuth.init = function (opts) {
    _origInit(opts);
    var ov = document.getElementById('pa-overlay');
    if (ov) ov.style.setProperty('--pa-accent', CFG.accent);
  };

  global.PinsitaAuth = PinsitaAuth;

})(window);
