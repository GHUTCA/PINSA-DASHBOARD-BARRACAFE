// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · un corte per mesero per turno, non si riapre (26-oct)
// Decisione di Alberto (🎛 V33 `V33 UN CORTE SOLO PER TURNO`), guardando il telefono di Arianna: «Ya cerraste tu turno» con sotto «Contaste mal — cerrar de nuevo».
// Gira _cieDelTurno · _cieOkRecente · _cieYaCerraste · _ciePaso1 · _ciePaso4 VERE in vm. node test_sala_corte_unico_26OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const QC = fs.readFileSync(new URL('./que_cambio.html', import.meta.url), 'utf8');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const H = 3600000;
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const mondo = ({ unico = true, entrada = null, ok: okMark = null } = {}) => { let h = ''; const now = Date.now(); const ls = {};
    if (entrada != null) ls.sala_entrada_ts = String(entrada);
    if (okMark) ls['sala_corte_ok_K'] = JSON.stringify(okMark);
    const ctx = { Date, Math, JSON, Number, String, CIE: {}, STATE: { nombre: 'Arianna' }, CIE_GUARDIA_ON: true, CIE_OK_MS: 15 * 60000, CORTE_UNICO_ON: unico, esc: String, fmtPrice: (n) => '$' + n,
      _cieRender: (x) => { h = x; }, _cieOkKey: () => 'sala_corte_ok_K', localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } } };
    vm.createContext(ctx);
    vm.runInContext(fnVin(SRC, '_cieDelTurno') + fnVin(SRC, '_cieOkRecente') + fnVin(SRC, '_cieYaCerraste') + fnVin(SRC, '_ciePaso1') + fnVin(SRC, '_ciePaso4'), ctx);
    return { ctx, html: () => h, now }; };
  const now = Date.now();
  { const w = mondo(); vm.runInContext('_cieYaCerraste({ ts: Date.now(), id: "CM-1", nombre: "Arianna" })', w.ctx); const h = w.html();
    t('A · «Ya cerraste»: solo «Listo — me voy», niente «cerrar de nuevo», e il testo ES', /Listo — me voy/.test(h) && !/cerrar de nuevo/.test(h) && /Tu corte ya está cerrado\. Si hay un error, avísale al JL\./.test(h), h); }
  { const w = mondo({ unico: false }); vm.runInContext('_cieYaCerraste({ ts: Date.now(), id: "CM-1" })', w.ctx);
    t('B · leva spenta ⇒ come ieri, col «Contaste mal — cerrar de nuevo»', /Contaste mal — cerrar de nuevo/.test(w.html())); }
  const dati = (ya) => ({ mesero: 'Arianna', n_abiertas: 1, monto_abierto: 5000, mesas_abiertas: [{ mesa: '31', consumo: 5000, pasa_a: 'Isa' }], ya_cerrado: ya });
  { const w = mondo({ entrada: now - 3 * H }); w.ctx.CIE.data = dati({ id: 'CM-1', ts: now - H, declarado: 42000 }); vm.runInContext('var CORTE_JL_ON = false, CORTE_TRAS_BORDE_ON = false, FINTURNO_BLOQUEO_ON = true; _ciePaso1();', w.ctx); const h = w.html();
    t('C · MI CORTE con un corte nato dopo l ingresso ⇒ il corte fatto ($42000) e «Listo — me voy», nessun bottone di cierre né di mesas', /Tu corte ya está cerrado/.test(h) && /\$42000/.test(h) && /Listo — me voy/.test(h) && !/_ciePasar|_cieVoyACobrar|_ciePaso2/.test(h), h); }
  { const w = mondo({ entrada: now - H }); w.ctx.CIE.data = dati({ id: 'CM-AM', ts: now - 5 * H, declarado: 30000 }); vm.runInContext('var CORTE_JL_ON = false, CORTE_TRAS_BORDE_ON = false, FINTURNO_BLOQUEO_ON = true; _ciePaso1();', w.ctx); const h = w.html();
    t('D · doppio turno: il corte AM è PRIMA dell ingresso PM ⇒ il PM può chiudere (il bottone c è)', !/Tu corte ya está cerrado/.test(h) && /_ciePasar|_cieVoyACobrar/.test(h), h); }
  { const w = mondo({ entrada: null }); w.ctx.CIE.data = dati({ id: 'CM-1', ts: now - 5 * 60000, declarado: 1 }); vm.runInContext('var CORTE_JL_ON = false, CORTE_TRAS_BORDE_ON = false, FINTURNO_BLOQUEO_ON = true; _ciePaso1();', w.ctx);
    t('E · sessione senza ora d ingresso, corte di 5 min fa ⇒ chiuso (la finestra di 15 min di ieri)', /Tu corte ya está cerrado/.test(w.html())); }
  { const w = mondo({ entrada: null }); w.ctx.CIE.data = dati({ id: 'CM-1', ts: now - 2 * H, declarado: 1 }); vm.runInContext('var CORTE_JL_ON = false, CORTE_TRAS_BORDE_ON = false, FINTURNO_BLOQUEO_ON = true; _ciePaso1();', w.ctx);
    t('F · sessione senza ora d ingresso, corte di 2 ore fa ⇒ non si blocca (il bordo decide)', !/Tu corte ya está cerrado/.test(w.html())); }
  { const w = mondo({ entrada: now - 3 * H, ok: { ts: now - 2 * H, id: 'CM-1' } });
    t('G · il segno del sì di questo telefono vale per TUTTO il turno, non 15 minuti', !!vm.runInContext('_cieOkRecente()', w.ctx)); }
  { const w = mondo({ unico: false, entrada: now - 3 * H, ok: { ts: now - 2 * H, id: 'CM-1' } });
    t('H · leva spenta ⇒ la finestra di 15 minuti di ieri', !vm.runInContext('_cieOkRecente()', w.ctx)); }
  { const w = mondo(); vm.runInContext('_ciePaso4({ mesero: "Arianna", id: "CM-1", por_medio: {}, diferencia: 0 })', w.ctx); const h = w.html();
    t('I · riepilogo del corte: «Si hay un error, avísale al JL», non «vuelve a cerrar»', /Si hay un error, avísale al JL/.test(h) && !/vuelve a cerrar/.test(h), h); }
  t('J · l ora d ingresso si scrive ai due login e si toglie all uscita', (SRC.match(/localStorage\.setItem\('sala_entrada_ts', String\(Date\.now\(\)\)\)/g) || []).length === 2 && /'sala_foto_v1', 'sala_entrada_ts'\]\.forEach\(/.test(SRC));
  t('K · /salud la può solo spegnere', /if \(String\(cercaK\(j, 'corte_unico_on'\)\) === '0'\) CORTE_UNICO_ON = false;/.test(SRC));
  t('L · «Qué cambió» ha la riga', /Un corte por turno/.test(QC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il link resta', "    (CORTE_UNICO_ON ? '<div class=\"cie-nota\">Tu corte ya está cerrado.", "    (false ? '<div class=\"cie-nota\">Tu corte ya está cerrado."],
    ['MI CORTE riapre', "  if (CORTE_UNICO_ON && d.ya_cerrado && _cieDelTurno(d.ya_cerrado)) {", "  if (false) {"],
    ['il turno ignora l ingresso', "  return e > 0 ? Number(o.ts) >= e : (Date.now() - Number(o.ts) < CIE_OK_MS);", "  return true;"],
    ['il sì scade a 15 min', "if (o && o.ts && CORTE_UNICO_ON) return _cieDelTurno(o) ? o : null; ", ''],
    ['il riepilogo invita a rifare', "(CORTE_UNICO_ON ? 'Quedó firmado a tu nombre. Si hay un error, avísale al JL.'", "(false ? ''"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
