/**
 * ═══════════════════════════════════════════════════════════════════════
 * PINSITA · REGISTRO CENTRALE DEI LOCALES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * SINGLE SOURCE OF TRUTH per tutto il sistema multi-local.
 *
 * Ogni file in /shared/ legge da qui per sapere:
 *   - URL del GAS bound per il locale
 *   - TOKEN 2PACX del CSV pubblico
 *   - Nome display, codici, branding
 *
 * Per aggiungere un nuovo locale:
 *   1. Aggiungere una entry a LOCALES
 *   2. Aggiungere il path prefisso in PATH_TO_LOCAL
 *   3. Pubblicare il foglio CONTROL_<LOCAL> e mettere il TOKEN
 *   4. Deployare i bound GAS e mettere gli URL
 *   5. Mettere attivo: true
 *
 * Pattern: PATTERN-MULTI-LOCAL-PRE-CABLATO (Nottambulo, 15-MAY-2026)
 * Pattern: PATTERN-HELPER-SINGLE-POINT-OF-TRUTH
 * Pattern: PATTERN-FAIL-SAFE-PLACEHOLDER (placeholder vuoti = skip silenzioso)
 *
 * Architettura: Strategia 1 path-based · sistema.pinsita.cl/<local>/...
 * Blindatura Y2: PATH_TO_LOCAL forza il locale dal pathname URL
 *
 * Versione: 1.0 · 15-MAY-2026 PM
 * ═══════════════════════════════════════════════════════════════════════
 */

const LOCALES = {

  // ────────────────────────────────────────────────────────────────
  // CANDELARIA · LIVE dal 2026-01
  // ────────────────────────────────────────────────────────────────
  cdl: {
    id:           'cdl',
    nome:         'Candelaria',
    nome_short:   'Candelaria',
    codice_4:     'CAND',
    path_prefix:  '/cdl/',
    attivo:       true,

    // GAS endpoints
    gas_standalone_url:  'https://script.google.com/macros/s/AKfycbx3LDa92dBW_g9q0xHhDlk_Q0_CLqTCnJejUYT71-_0HU-__oi36cHEMWRyhw9gn5HA/exec',
    gas_bound_control:   'https://script.google.com/macros/s/AKfycbyPiDPas-b0AAOaY4U1Fmq-ix-rfrb71GlK8IJi6szPiBvbm4fRWyJHGwcKoiy7dqoV9g/exec',
    gas_bound_barra_cafe:     '', // TODO Sessione 2 storica · da estrarre se serve
    gas_bound_barra_jugos:    '',
    gas_bound_barra_alimen:   '',
    gas_bound_barra_helados:  '',

    // CSV publish token (CONTROL_CANDELARIA_2026)
    csv_token: '2PACX-1vQBpTFb7zww_hk_f9tstZLBbY9VP08mnPaEzQbrDFZ7faDSU9RoShxt5c5Y79NwsFgLD3nvfkUm_da-',

    // CSV publish tokens specifici BARRA (sezioni hanno spreadsheet propri)
    csv_token_barra_cafe:     '2PACX-1vTQQP46B2-aan5TsMxqXpl_GJ3h3lNpcpd4fa-h_NGRE49pQKMBa7zkJ6sJTKOhx0lOZo1ALqJrVl8R',
    csv_token_barra_jugos:    '2PACX-1vRgfxyaHuTXg2q9ozPN-SjmqRWKU5hk4MJ2vynH7qY2ek7mWKRxFbE3J05Wp1Wn24OlwVqkMCmP9B2v',
    csv_token_barra_alimen:   '2PACX-1vQHwGrTFlMFwFsk-RlHDYbNWQPDGIvg2TofLV0vJxAru1qrZnVT8Okk9dISgB2lzLKpJW2QUx61dMyX',
    csv_token_barra_helados:  '2PACX-1vQc0tyemN3uQzvq0jZXRP99uPaLNEtjRQs2UB1YBWdJ6ZDhVOSrjAXPt0E-yh09_5Mav9kUXTgejK_O',

    // Branding (per ora identico, ma pre-cablato per differenze future)
    accent_color: '#C4622D',
  },

  // ────────────────────────────────────────────────────────────────
  // RIESCO · LIVE target 2026-05-25
  // ────────────────────────────────────────────────────────────────
  rsc: {
    id:           'rsc',
    nome:         'Riesco',
    nome_short:   'Riesco',
    codice_4:     'RIES',
    path_prefix:  '/rsc/',
    attivo:       true,

    // GAS endpoints (Sessione 2 + 3 del 15-MAY-2026 PM)
    // Standalone: stesso URL Candelaria (V3.15 multi-local, payload contiene chiave rsc)
    gas_standalone_url:  'https://script.google.com/macros/s/AKfycbx3LDa92dBW_g9q0xHhDlk_Q0_CLqTCnJejUYT71-_0HU-__oi36cHEMWRyhw9gn5HA/exec',
    gas_bound_control:        'https://script.google.com/macros/s/AKfycbzPnXz0WOXEiV1qtCrE1xKM2imfr2Ac3tzwrB5ysp9trqPNcLwUePnop70R-_0bsF-A/exec',
    gas_bound_barra_cafe:     'https://script.google.com/macros/s/AKfycbyZKaDnECLB35onoHQlknXi1oNYexQL54MamNjhBHCaQTXwgWP3glgEpZjEOGB_EZhE/exec',
    gas_bound_barra_jugos:    'https://script.google.com/macros/s/AKfycbyHSO7lJDgjG9aIkc3ffHTED1hhUpzKNdMzwikGVG9gSE3MHQGAJIXnZZ47ZZZXxwPy3w/exec',
    gas_bound_barra_alimen:   'https://script.google.com/macros/s/AKfycbyv_FH79umXp6mmcJMrRgtg8ipR8iWlBTxz1FmnKcsDDMKcYKb0zP5MvugFn3Yf4KGCbA/exec',
    gas_bound_barra_helados:  'https://script.google.com/macros/s/AKfycbxLXrZFDcJCpikTtjekruVSRGzswptybxzOUdSk55z8GwI0yzqemiHW6Gls-FxHJwj1bQ/exec',

    // CSV publish token (CONTROL_RIESCO_2026)
    csv_token: '2PACX-1vSenW0lq5mM3wYh56n-dmf2raU0LO06Y-rQ3g6YBuBTP5lRcTElG3HWQBLE7PVRuPYUAvbs2OlyQUZx',

    // CSV publish tokens specifici BARRA · TODO da pubblicare i 4 spreadsheet sezione Riesco
    csv_token_barra_cafe:     '', // TODO pubblicare CONTROL_BARRA_CAFE_RIESCO
    csv_token_barra_jugos:    '', // TODO pubblicare CONTROL_BARRA_JUGOS_RIESCO
    csv_token_barra_alimen:   '', // TODO pubblicare CONTROL_BARRA_ALIMEN_RIESCO
    csv_token_barra_helados:  '', // TODO pubblicare CONTROL_BARRA_HELADOS_RIESCO

    accent_color: '#C4622D',
  },

  // ────────────────────────────────────────────────────────────────
  // MUT · PRE-CABLATO · placeholder fail-safe
  // Quando si attiva: compilare tutti i campi vuoti, flag attivo:true
  // ────────────────────────────────────────────────────────────────
  mut: {
    id:           'mut',
    nome:         'Mut',
    nome_short:   'Mut',
    codice_4:     'MUT_',
    path_prefix:  '/mut/',
    attivo:       false,  // fail-safe: skip silenzioso finché non attivato

    gas_standalone_url:       '',
    gas_bound_control:        '',
    gas_bound_barra_cafe:     '',
    gas_bound_barra_jugos:    '',
    gas_bound_barra_alimen:   '',
    gas_bound_barra_helados:  '',

    csv_token:                '',
    csv_token_barra_cafe:     '',
    csv_token_barra_jugos:    '',
    csv_token_barra_alimen:   '',
    csv_token_barra_helados:  '',

    accent_color: '#C4622D',
  },

};

// ═══════════════════════════════════════════════════════════════════════
// HELPERS · API pubblica (usata dai file shared/ e dai landing /<local>/)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Mappa path prefisso → locale id (per BLINDATURA Y2 path-based)
 * Se l'utente è sotto /cdl/ o /rsc/ o /mut/, IL LOCALE È FORZATO
 * ignorando qualsiasi param URL ?local=.
 */
const PATH_TO_LOCAL = {
  '/cdl/': 'cdl',
  '/rsc/': 'rsc',
  '/mut/': 'mut',
};

/**
 * Ritorna l'id del locale corrente.
 *
 * BLINDATURA Y2: se siamo dentro un path locale, ignora il param URL.
 * Altrimenti (file shared/) legge ?local= o ritorna il fallback.
 *
 * @param {string} fallback - locale di default se nulla è specificato
 * @returns {string} - id locale (es. 'cdl', 'rsc', 'mut')
 */
function getCurrentLocal(fallback = 'cdl') {
  // Step 1 · forzatura da path (PRIORITÀ MASSIMA · sicurezza)
  const path = location.pathname;
  for (const [prefix, localId] of Object.entries(PATH_TO_LOCAL)) {
    if (path.indexOf(prefix) !== -1) return localId;
  }

  // Step 2 · param URL (usato dai file shared/ chiamati dai landing)
  const params = new URLSearchParams(location.search);
  const fromParam = params.get('local');
  if (fromParam && LOCALES[fromParam]) return fromParam;

  // Step 3 · fallback
  return fallback;
}

/**
 * Ritorna la config completa del locale corrente.
 * Se il locale richiesto non esiste o non è attivo, ritorna il fallback (fail-safe).
 *
 * @param {string} fallback - locale di default
 * @returns {object|null} - config locale o null se nemmeno il fallback è disponibile
 */
function getLocalConfig(fallback = 'cdl') {
  const id = getCurrentLocal(fallback);
  const cfg = LOCALES[id];

  // Fail-safe: locale inesistente o non attivo (placeholder Mut)
  if (!cfg || !cfg.attivo) {
    console.warn('[locales_config] Locale "' + id + '" non disponibile, fallback su ' + fallback);
    return LOCALES[fallback] || null;
  }

  return cfg;
}

/**
 * Helper per il branding del topbar.
 * Ritorna il nome del locale per visualizzazione.
 */
function getLocalDisplayName(localId) {
  return (LOCALES[localId] && LOCALES[localId].nome) || 'PINSITA';
}

/**
 * Helper per costruire link verso file shared/ da un landing locale.
 * Aggiunge automaticamente ?local=<id> al link.
 *
 * Esempio:
 *   linkShared('dashboard_barra_cafe.html')  // dentro /cdl/index.html
 *   → "/shared/dashboard_barra_cafe.html?local=cdl"
 */
function linkShared(filename, localId) {
  const id = localId || getCurrentLocal();
  return '/shared/' + filename + '?local=' + id;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════
// In <script src=""> tradizionale: tutto diventa globale su window.

if (typeof window !== 'undefined') {
  window.LOCALES = LOCALES;
  window.PATH_TO_LOCAL = PATH_TO_LOCAL;
  window.getCurrentLocal = getCurrentLocal;
  window.getLocalConfig = getLocalConfig;
  window.getLocalDisplayName = getLocalDisplayName;
  window.linkShared = linkShared;
}

feat(arch): registro centrale LOCALES + blindatura path-based · v1.0
