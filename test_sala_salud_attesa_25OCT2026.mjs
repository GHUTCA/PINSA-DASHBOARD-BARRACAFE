// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · clockIn e salida non vanno più a Google prima di /salud (25-oct)
// Richiesta 🎛 `V32 IL METRO DEL 24 CHI VA ANCORA A GOOGLE`: clockIn 95 e salidaMesero 10 dirette al GAS a leva accesa.
// Causa letta nel codice: la PORTA 1 chiama _verificaDetras al caricamento, prima che /salud risponda ⇒ la leva vale ancora `false`.
// Gira _saludAttendi · _clockInDetras · _salirProsegui VERI in vm. node test_sala_salud_attesa_25OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = (SRC.includes('function _saludAttendi(') ? 'async ' + fnVin(SRC, '_saludAttendi') : '') + 'async ' + fnVin(SRC, '_clockInDetras') + fnVin(SRC, '_gestoUid') + fnVin(SRC, '_salirProsegui');
  // salud: 'tarda' = risponde dopo 30 ms e accende le leve · 'muta' = non risponde mai · null = nessuna promessa
  const mondo = (salud, { ci = false, sal = false } = {}) => { const L = { staff: [], gas: [] };
    const ctx = { Date, Math, Promise, setTimeout: (f, ms) => setTimeout(f, Math.min(ms, 60)),   // l'orologio corto: 2,5 s diventano 60 ms
      STATE: { codigo: 'C1', nombre: 'Ray' }, _CLOCKIN_UID: null,
      staffPost: async (a, b) => { L.staff.push(a); L.body = b; return { ok: true, borde: true, filas: 1 }; },
      gasPost: async (a, b) => { L.gas.push(a); return { ok: true, filas: 1 }; },
      showEntrada: () => {}, toast: () => {}, _salirFin: () => {}, localStorage: { removeItem: () => {}, getItem: () => null, setItem: () => {} },
      deviceToken: '', CFG: { SK: {} }, String, JSON, bordeHecho: () => {}, refrescar: () => {}, confirm: () => false, $: () => ({ classList: { add: () => {} } }), mostrarLogin: () => {}, showEntradaFin: () => {} };   // il mondo del banco 16b: la sessione si svuota davvero
    vm.createContext(ctx);
    vm.runInContext('var CLOCKIN_VETRO_ON = ' + ci + '; var SALIDA_BORDE_V = ' + sal + '; var SALUD_LEVE_P = null;\n' + F, ctx);
    if (salud === 'tarda') ctx.SALUD_LEVE_P = new Promise((r) => setTimeout(() => { vm.runInContext('CLOCKIN_VETRO_ON = true; SALIDA_BORDE_V = true;', ctx); r(); }, 30));
    if (salud === 'muta') ctx.SALUD_LEVE_P = new Promise(() => {});
    return { ctx, L }; };
  { const w = mondo('tarda'); await vm.runInContext('_clockInDetras()', w.ctx);
    t('A · caricamento: /salud arriva dopo, con la leva accesa ⇒ il clockIn va al BORDO, non al GAS', w.L.staff.join() === 'clockIn' && w.L.gas.length === 0, w.L); }
  { const w = mondo('muta'); await vm.runInContext('_clockInDetras()', w.ctx);
    t('B · /salud muta ⇒ dopo l attesa, il GAS come ieri (mai bloccato)', w.L.gas.join() === 'clockIn' && w.L.staff.length === 0, w.L); }
  { const w = mondo('muta', { ci: true }); await vm.runInContext('_clockInDetras()', w.ctx);
    t('C · leva già letta accesa ⇒ al bordo senza aspettare', w.L.staff.join() === 'clockIn', w.L); }
  { const w = mondo(null); await vm.runInContext('_clockInDetras()', w.ctx);
    t('D · nessuna lettura di /salud in corso ⇒ si decide subito (leva spenta: GAS come ieri)', w.L.gas.join() === 'clockIn', w.L); }
  { const w = mondo('tarda'); try { vm.runInContext('_salirProsegui(true)', w.ctx); } catch (e) {} await pausa(120);
    t('E · salida subito dopo il caricamento: aspetta /salud ⇒ al BORDO', w.L.staff.join() === 'salidaMesero' && w.L.gas.length === 0 && w.L.body && w.L.body.codigo === 'C1' && w.L.body.nombre === 'Ray', w.L); }   // e col codigo di PRIMA dello svuotamento
  { const w = mondo('muta'); try { vm.runInContext('_salirProsegui(true)', w.ctx); } catch (e) {} await pausa(150);
    t('F · salida con /salud muta ⇒ il GAS come ieri', w.L.gas.join() === 'salidaMesero' && w.L.staff.length === 0, w.L); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il clockIn non aspetta', "  await _saludAttendi(CLOCKIN_VETRO_ON ? 0 : 2500);\n", ''],
    ['la salida non aspetta', "_saludAttendi(SALIDA_BORDE_V ? 0 : 1500).then(", 'Promise.resolve().then('],
    ['la salida legge la sessione dopo l attesa', "codigo: _salCod, nombre: _salNom, gesto_uid", "codigo: STATE.codigo, nombre: STATE.nombre, gesto_uid"],
    ['l attesa non ha tetto', "try { await Promise.race([SALUD_LEVE_P, new Promise(function (ok) { setTimeout(ok, ms); })]); } catch (e) {}", "try { await SALUD_LEVE_P; } catch (e) {}"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await Promise.race([banco(ORIG.split(a).join(b), true), pausa(3000).then(() => ({ ko: 1 }))]); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1; setTimeout(() => process.exit(), 50);
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
