// BANCO · AUT-0566 · il VETRO di FAM e colación chiede il perché (sala.html) · TERZA PENNA · 04-ott-2026
// Estrae le funzioni vere (`_dtMotOk`, `_dtMotBox`, `_dtHay`, `_dtFalta`) e le esegue con le dipendenze finte.
// Criteri: leva SPENTA = il vetro di ieri · leva ACCESA: FAM/colación senza motivo (8 lettere) non partono, il campo
// compare e dice «Escribe el motivo» · gli altri tipi non cambiano · i due siti d'invio portano `motivo` ·
// le PORTE VECCHIE (solo ?desc2=0) sono dichiarate, non lasciate rifiutare mute.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i))); };
const fn = (nome) => { const i = SRC.indexOf('function ' + nome + '('); const j = SRC.indexOf('\n}\n', i) + 3;
  if (i < 0 || j < i) throw new Error('non estraggo ' + nome); return SRC.slice(i, j); };
const blocco = ['_dtMotOk', '_dtMotBox', '_dtHay', '_dtFalta'].map(fn).join('\n');
function mondo(leva, dt, extra) {
  const ctx = Object.assign({ FAMCOL_MOTIVO_ON: leva, _dt: dt, JL: false, DTO_MAX_PCT: 30,
    esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), fmtPrice: (n) => '$' + n,
    _dtMot: () => null, _dtMin: () => 0 }, extra || {});
  vm.createContext(ctx); vm.runInContext(blocco + '\n;this.API = { _dtMotOk, _dtMotBox, _dtHay, _dtFalta };', ctx); return ctx; }
const FAM = (x) => Object.assign({ tipo: 'fam', fam: 'Ale', col: '', mtx: '', pin: '9999' }, x || {});
const COL = (x) => Object.assign({ tipo: 'coln', fam: '', col: 'Pedro', mtx: '', pin: '2222' }, x || {});

// ── leva SPENTA = ieri
for (const dt of [FAM(), COL()]) { const m = mondo(false, dt);
  t('spenta: ' + dt.tipo + ' senza motivo è PRONTA (come ieri)', m.API._dtHay() === true);
  t('spenta: nessun campo motivo', m.API._dtMotBox() === ''); }

// ── leva ACCESA
for (const [nome, mk, falta] of [['FAM', FAM, 'Que teclee su código'], ['colación', COL, 'Escribe el PIN del JL']]) {
  const senza = mondo(true, mk()), corto = mondo(true, mk({ mtx: 'turno' })), spazi = mondo(true, mk({ mtx: '          ' })),
    ok8 = mondo(true, mk({ mtx: 'Comida del turno' }));
  t(nome + ' accesa: senza motivo NON è pronta', senza.API._dtHay() === false);
  t(nome + ' accesa: la riga del bottone dice «Escribe el motivo»', senza.API._dtFalta() === 'Escribe el motivo', senza.API._dtFalta());
  t(nome + ' accesa: 5 lettere non bastano', corto.API._dtHay() === false);
  t(nome + ' accesa: soli spazi non bastano', spazi.API._dtHay() === false);
  t(nome + ' accesa: motivo di 8+ lettere ⇒ pronta', ok8.API._dtHay() === true);
  t(nome + ' accesa: col motivo la riga torna a chiedere la firma/codice', ok8.API._dtFalta() === falta, ok8.API._dtFalta());
  t(nome + ' accesa: il campo compare, maxlength 80, con l\'oninput giusto', /<textarea[^>]*id="dtMt"[^>]*maxlength="80"[^>]*_dtEscribe\(\\'mtx\\'/.test(senza.API._dtMotBox()) || /_dtEscribe\(\\?'mtx\\?'/.test(senza.API._dtMotBox()), senza.API._dtMotBox());
  t(nome + ' accesa: il testo già scritto resta nel campo (escapato)', mondo(true, mk({ mtx: 'a<b motivo largo' })).API._dtMotBox().includes('a&lt;b motivo largo'));
}
// senza la persona scelta resta «¿Quién?» prima del motivo
t('FAM senza persona: prima «¿Quién es?»', mondo(true, FAM({ fam: '' })).API._dtFalta() === '¿Quién es?');
t('colación senza persona: prima «¿Para quién es?»', mondo(true, COL({ col: '' })).API._dtFalta() === '¿Para quién es?');
// gli altri tipi non cambiano
t('«otro» non è toccato dalla leva', mondo(true, { tipo: 'otro', cob: 0, txt: '' }, { _dtMin: () => 1 }).API._dtHay() === false);
t('«franq» resta pronta', mondo(true, { tipo: 'franq' }).API._dtHay() === true);

// ── CONDIZIONE DI 🎛 CONTROLLER: FAM/colación non ripiegano mai sul libro (gasPost) · col buco di EL GIRO chiuso
{ const fnA = (nome) => { const i = SRC.indexOf((nome === '_scontoVia' || nome === '_famcolRefresca' ? 'async function ' : 'function ') + nome + '('); const j = SRC.indexOf('\n}\n', i) + 3; if (i < 0) throw new Error(nome); return SRC.slice(i, j); };
  const code = ['_scontoVia', '_famcolFresca', '_famcolRefresca', '_esFamColn'].map(fnA).join('\n') + '\nconst FAMCOL_FRESCA_MS = 30000;';
  const J = (v) => ({ ok: true, json: async () => ({ ok: true, datos: { flags: { fam_coln_motivo_on: v } } }) });
  // stato: { on: null|true|false, ts: 'ora'|'vecchio'|0 }, salud: '1'|'0'|'assente'|'giu'
  const run = async (st, action, body, bordo, salud, dto = true) => {
    const chiamate = [], fetchate = [];
    const ctx = { FAMCOL_MOTIVO_ON: st.on, FAMCOL_SALUD_TS: st.ts === 'ora' ? Date.now() : st.ts === 'vecchio' ? Date.now() - 120000 : 0,
      DTO_BORDE_ON: dto, chiamate, BORDE_SALA: { URL: 'http://bordo' }, AbortController, setTimeout, clearTimeout, Date,
      _pagoAlBorde: async () => bordo, gasPost: async () => { chiamate.push('gasPost'); return { ok: true, via: 'libro' }; },
      fetch: async (u) => { fetchate.push(u); if (salud === 'giu') throw new Error('rete'); if (salud === 'err503json') return { ok: true, json: async () => ({ ok: false, error: 'unavailable' }) };
        if (salud === 'http503') return { ok: false, status: 503, json: async () => ({ ok: true, datos: { flags: { fam_coln_motivo_on: '0' } } }) };
        return salud === 'assente' ? { ok: true, json: async () => ({ ok: true }) } : J(salud); } };
    vm.createContext(ctx); vm.runInContext(code + '\n;this.API = { _scontoVia, _esFamColn };', ctx);
    const r = await ctx.API._scontoVia(action, body, 1000); return { r, chiamate, fetchate, stato: ctx.FAMCOL_MOTIVO_ON };
  };
  const FAMB = { fam: 1, pin_fam: '9999', medio: 'fam' }, COLB = { para: 'Pedro', pin_jl: '2222' };
  const fermo = (o) => o.chiamate.length === 0 && o.r && o.r.ok === false && o.r.error === 'sin_bordo' && o.r.definitivo === true && !!o.r.mensaje;
  let o;
  // leva accesa e nota (fresca): si ferma senza nemmeno rileggere /salud
  o = await run({ on: true, ts: 'ora' }, 'registrarPago', FAMB, null, '1');
  t('FAM, bordo non la prende, leva accesa e nota: FERMA, zero gasPost, senza rileggere /salud', fermo(o) && o.fetchate.length === 0, o);
  o = await run({ on: true, ts: 'ora' }, 'registrarColacion', COLB, null, '1');
  t('colación, idem', fermo(o), o);
  o = await run({ on: true, ts: 'ora' }, 'registrarPago', FAMB, null, '1', false);
  t('FAM con ?dtoborde=0, leva accesa: ferma', fermo(o), o);
  // 🔴 IL BUCO: il telefono non sa (null) — /salud non è mai arrivata
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, 'giu');
  t('BUCO 1 · stato ignoto (/salud mai arrivata) e /salud muta al gesto: FERMA, zero gasPost', fermo(o) && o.fetchate.length === 1, o);
  o = await run({ on: null, ts: 0 }, 'registrarColacion', COLB, null, 'giu');
  t('BUCO 1 · idem per la colación', fermo(o), o);
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, '1');
  t('BUCO 1b · stato ignoto, /salud risponde: accesa ⇒ ferma, e il telefono ora lo sa', fermo(o) && o.stato === true, o);
  // 🔴 IL BUCO: telefono aperto PRIMA dell'accensione (ricorda «spenta» ma vecchia) e il bordo è giù
  o = await run({ on: false, ts: 'vecchio' }, 'registrarPago', FAMB, null, 'giu');
  t('BUCO 2 · ricorda «spenta» da 2 minuti, bordo giù: FERMA, zero gasPost', fermo(o) && o.fetchate.length === 1, o);
  o = await run({ on: false, ts: 'vecchio' }, 'registrarPago', FAMB, null, '1');
  t('BUCO 2b · ricorda «spenta» ma /salud ora dice accesa: FERMA e lo impara', fermo(o) && o.stato === true, o);
  // il ripiego «come ieri» resta quando lo dice una risposta VERA e fresca
  o = await run({ on: false, ts: 'ora' }, 'registrarPago', FAMB, null, '0');
  t('leva spenta e nota (fresca): ripiega sul libro come ieri, senza rileggere', o.chiamate.length === 1 && o.r.via === 'libro' && o.fetchate.length === 0, o);
  o = await run({ on: false, ts: 'vecchio' }, 'registrarPago', FAMB, null, '0');
  t('spenta ma vecchia: rilegge /salud, dice «spenta» ⇒ ripiega come ieri', o.chiamate.length === 1 && o.fetchate.length === 1, o);
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, 'assente');
  // 🔴 RESIDUO TROVATO DA EL GIRO: un /salud che risponde un errore NON è una risposta «spenta»
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, 'err503json');
  t('RESIDUO · /salud risponde un JSON di errore {ok:false} (senza il campo): NON vale «spenta» ⇒ FERMA, zero gasPost', fermo(o) && o.stato === null, o);
  o = await run({ on: false, ts: 'vecchio' }, 'registrarPago', FAMB, null, 'err503json');
  t('RESIDUO · idem a stato vecchio: ferma e non rinfresca il tempo', fermo(o), o);
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, 'http503');
  t('RESIDUO · HTTP non ok (503) anche con un corpo che dice «0»: NON vale ⇒ FERMA', fermo(o) && o.stato === null, o);
  o = await run({ on: null, ts: 0 }, 'registrarColacion', COLB, null, 'err503json');
  t('RESIDUO · idem per la colación', fermo(o), o);
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, null, 'assente');
  t('/salud di un bordo VECCHIO (senza il campo) = «spenta» detta da una risposta vera ⇒ ripiega come ieri', o.chiamate.length === 1 && o.stato === false, o);
  // ciò che il bordo decide passa com'è
  o = await run({ on: true, ts: 'ora' }, 'registrarPago', FAMB, { ok: true, borde: true }, '1');
  t('FAM accettata dal bordo: risposta del bordo, zero libro, zero /salud', o.chiamate.length === 0 && o.r.ok === true && o.fetchate.length === 0, o);
  o = await run({ on: null, ts: 0 }, 'registrarPago', FAMB, { ok: false, borde: true, definitivo: true, error: 'motivo_requerido' }, 'giu');
  t('un NO definitivo del bordo passa com\'è, anche a stato ignoto', o.r.error === 'motivo_requerido' && o.chiamate.length === 0, o);
  // gli altri gesti non cambiano
  for (const [nome, act, b] of [['sconto (dto)', 'registrarPago', { medio: 'efectivo', monto_manual: 1, pin_jl: '2222' }],
      ['sin_pago', 'registrarPago', { sin_pago: 1, fam: 1, pin_fam: '1' }], ['pago normale', 'registrarPago', { medio: 'efectivo' }]]) {
    o = await run({ on: null, ts: 0 }, act, b, null, 'giu');
    t(nome + ': con stato ignoto e /salud muta ripiega COME IERI (non è FAM né colación)', o.chiamate.length === 1 && o.fetchate.length === 0, o); }
  // _esFamColn: ora guarda solo la FORMA del payload, mai la leva
  const E = (b, a) => { const c = { FAMCOL_MOTIVO_ON: null }; vm.createContext(c); vm.runInContext(fnA('_esFamColn') + '\n;this.f = _esFamColn;', c); return c.f(a || 'registrarPago', b); };
  t('_esFamColn riconosce la forma a prescindere dalla leva', E(FAMB) === true && E(COLB, 'registrarColacion') === true && E({ pin_fam: '1' }) === true);
  t('_esFamColn non riconosce un pago normale né sin_pago', E({ medio: 'efectivo' }) === false && E({ sin_pago: 1, fam: 1 }) === false); }

// ── cablaggio sul sorgente
t('leva letta da /salud (cercaK fam_coln_motivo_on)', /FAMCOL_MOTIVO_ON = String\(cercaK\(j, 'fam_coln_motivo_on'\)\) === '1'/.test(SRC));
t('la leva nasce IGNOTA (null), non «spenta»: /salud non ha ancora risposto', /var FAMCOL_MOTIVO_ON = null;/.test(SRC) && /var FAMCOL_SALUD_TS = 0;/.test(SRC));
t('il caricamento di /salud segna anche QUANDO ha risposto', /FAMCOL_MOTIVO_ON = String\(cercaK\(j, 'fam_coln_motivo_on'\)\) === '1'; FAMCOL_SALUD_TS = Date\.now\(\);/.test(SRC));
t('colación (pannello nuovo) invia motivo', /pago_uid: uid,\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('FAM (pannello nuovo) invia para E motivo', /para: String\(d\.fam \|\| ''\)\.slice\(0, 60\),\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('un motivo_requerido dal bordo accende il campo (telefono caricato prima)', (SRC.match(/error === 'motivo_requerido'\) FAMCOL_MOTIVO_ON = true/g) || []).length === 2);
t('le due PORTE VECCHIE dichiarano invece di rifiutare mute', (SRC.match(/Esta pantalla vieja no pide el motivo/g) || []).length === 2);
t('il campo motivo si azzera al cambio di tipo', /_dt\.txt = ''; _dt\.mtx = '';/.test(SRC));
t('sin_bordo ha il suo messaggio in FAM e colación', (SRC.match(/sin_bordo: 'Sin conexión con el bordo/g) || []).length === 1 && /error === 'sin_bordo'\) \? 'Sin conexión con el bordo/.test(SRC));
t('versione bumpata 3.217.5', /id="ver">sala v3\.217\.5/.test(SRC));
// MUTAZIONE: senza _dtMotOk in _dtHay la FAM senza motivo diventerebbe pronta a leva accesa
const mutB = blocco.replace("return !!_dt.fam && _dtMotOk();", 'return !!_dt.fam;');
t('MUTAZIONE: tolto _dtMotOk da _dtHay il blocco cambia', mutB !== blocco);
{ const c = { FAMCOL_MOTIVO_ON: true, _dt: FAM(), JL: false, DTO_MAX_PCT: 30, esc: String, fmtPrice: String, _dtMot: () => null, _dtMin: () => 0 }; vm.createContext(c);
  vm.runInContext(mutB + '\n;this.hay = _dtHay();', c); t('MUTAZIONE: la FAM senza motivo diventerebbe pronta (il caso A sarebbe rosso)', c.hay === true); }
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
