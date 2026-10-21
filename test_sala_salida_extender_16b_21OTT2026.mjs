// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.6b · salidaMesero ed extenderFranja da staffPost con gesto_uid (21-ott)
// Contratto: ⚙️ `ARQ V32 DUE RAMI PER IL 23 39AE6CF FAF2F32`. Gira `_gestoUid`, `_salirProsegui` (solo la salida) e `seguirEnSala` VERI in vm.
// node test_sala_salida_extender_16b_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = fnVin(SRC, '_gestoUid') + fnVin(SRC, '_salirProsegui') + 'async ' + fnVin(SRC, 'seguirEnSala');
  function mondo(risp) {
    const L = { staff: [], gas: [], entrada: [], fatti: [], toasts: [] };
    const banner = { classList: { add: () => {} } };
    const ctx = { STATE: { codigo: 'C1', nombre: 'Ray' }, deviceToken: '', CFG: { SK: {} }, Math, Date, String, JSON,
      staffPost: async (a, b) => { L.staff.push([a, b]); return risp; }, gasPost: async (a, b) => { L.gas.push([a, b]); return risp; },
      showEntrada: (s) => L.entrada.push(s), bordeHecho: (g, d) => L.fatti.push([g, d]), toast: (k, s) => L.toasts.push(s), refrescar: () => {},
      confirm: () => false, localStorage: { removeItem: () => {} }, $: () => banner, setTimeout, mostrarLogin: () => {}, showEntradaFin: () => {} };
    vm.createContext(ctx); vm.runInContext(F, ctx); return { ctx, L };
  }
  const uidOk = (u) => typeof u === 'string' && u.length <= 80 && /^[A-Za-z0-9:_.\-]+$/.test(u);
  { const { ctx, L } = mondo({ ok: true, filas: 2, no_vencidas: 0, celdas_dobles: 0, borde: true }); try { vm.runInContext('_salirProsegui(true)', ctx); } catch (e) {} await new Promise((r) => setTimeout(r, 5));
    t('A · Salgo a fin turno ⇒ staffPost(salidaMesero) con codigo, nombre e gesto_uid valido; ZERO gasPost di salida', L.staff.length === 1 && L.staff[0][0] === 'salidaMesero' && L.staff[0][1].codigo === 'C1' && uidOk(L.staff[0][1].gesto_uid) && !L.gas.some((g) => g[0] === 'salidaMesero'), L); }
  { const { ctx, L } = mondo({ ok: true, filas: 0, no_vencidas: 1, celdas_dobles: 0, borde: true }); try { vm.runInContext('_salirProsegui(true)', ctx); } catch (e) {} await new Promise((r) => setTimeout(r, 5));
    t('B · risposta del bordo con la forma del GAS: filas 0 e franja viva ⇒ «Tu turno queda ABIERTO», come ieri', L.entrada.some((s) => /queda ABIERTO/.test(s || '')) && L.fatti.some((f) => f[0] === 'salida_sin_fossile'), L); }
  { const { ctx, L } = mondo({ ok: true, filas: 1 }); try { vm.runInContext('_salirProsegui(false)', ctx); } catch (e) {}
    t('C · Salgo NON a fin turno ⇒ nessuna salida', L.staff.length === 0 && L.gas.length === 0, L); }
  { const { ctx, L } = mondo({ ok: true, nombre: 'Ray', filas: 1, hasta: 'x', borde: true }); await vm.runInContext('seguirEnSala(null)', ctx);
    t('D · Sigo en sala ⇒ staffPost(extenderFranja) con gesto_uid, «sigues en sala 1 hora más»', L.staff[0][0] === 'extenderFranja' && uidOk(L.staff[0][1].gesto_uid) && L.gas.length === 0 && /1 hora más/.test(L.toasts[0]), L); }
  { const { ctx, L } = mondo({ ok: false, error: 'franja_no_encontrada' }); await vm.runInContext('seguirEnSala(null)', ctx);
    t('E · rifiuto ⇒ «No pude extender — reintenta», come ieri', /No pude extender/.test(L.toasts[0]), L.toasts); }
  { const { ctx } = mondo({}); const a = vm.runInContext("_gestoUid('sal')", ctx), b = vm.runInContext("_gestoUid('sal')", ctx);
    t('F · un uid per tocco: due tocchi, due chiavi diverse, entrambe valide per il bordo', a !== b && uidOk(a) && uidOk(b), [a, b]); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['salida ancora al GAS', "staffPost('salidaMesero', { codigo: STATE.codigo, nombre: STATE.nombre, gesto_uid: _gestoUid('sal') })", "gasPost('salidaMesero', { codigo: STATE.codigo, nombre: STATE.nombre })"],
    ['extender senza gesto_uid', "staffPost('extenderFranja', { codigo: STATE.codigo, nombre: STATE.nombre, gesto_uid: _gestoUid('ext') })", "staffPost('extenderFranja', { codigo: STATE.codigo, nombre: STATE.nombre })"],
    ['uid fisso', "function _gestoUid(pref) { return pref + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }", "function _gestoUid(pref) { return pref + '-1'; }"],
    ['uid con caratteri rifiutati', "return pref + '-' + Date.now()", "return pref + ' · ' + Date.now()"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
