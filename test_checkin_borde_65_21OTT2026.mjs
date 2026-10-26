// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 6.5 · AUT-0719 · il check-in del telefono battezzato dal bordo (21-ott)
// Gira `checkInConToken` + `_checkInDalBorde` VERI di sala.html e anfitriona.html in vm, bordo e GAS finti.
// node test_checkin_borde_65_21OTT2026.mjs [dir] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const DIR = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SALA0 = fs.readFileSync(path.join(DIR, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
const ANF0 = fs.readFileSync(path.join(DIR, 'anfitriona.html'), 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SALA, ANF, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  function mondo(SRC, quale, { on = true, vista = '1', borde, lancia = false, gas = { ok: true, codigo: 'GAS9', nombre: 'Ray' }, salud } = {}) {
    const L = { fetch: [], gas: [], toasts: [], entro: 0 }; const mem = { sala_checkinb: vista, anf_checkinb: vista };
    const ctx = { CHECKIN_BORDE_ON: on, SALUD_LEVE_P: Promise.resolve(), AUTH_EPOCH: 0, deviceToken: 'dev-1', STATE: {}, CFG: { LOCAL: 'BKS', SK: { COD: 'c', NOM: 'n', LOC: 'l', TOK: 't' } },
      BORDE_SALA: { URL: 'https://b', T: 'tok' }, JSON, String, Promise, setTimeout, clearTimeout, AbortController, encodeURIComponent,
      localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } },
      fetch: async (u, o) => { L.fetch.push({ u, h: o && o.headers, b: o && o.body ? JSON.parse(o.body) : null });
        if (/\/salud$/.test(u)) return { json: async () => salud || { flags: { checkin_borde_on: on ? '1' : '0' } } };
        if (lancia) throw new Error('rete'); return { json: async () => borde }; },
      gasPost: async (a, b) => { L.gas.push([a, b]); return gas; }, toast: (k, s) => L.toasts.push(s),
      entrarSala: () => { L.entro++; }, entrarMapa: () => { L.entro++; }, showEntrada: () => {} };
    vm.createContext(ctx);
    vm.runInContext('async ' + fnVin(SRC, '_checkInDalBorde') + (quale === 'anf' ? 'async ' + fnVin(SRC, '_anfCheckinLeva') : '') + 'async ' + fnVin(SRC, 'checkInConToken'), ctx);
    return { ctx, L, mem };
  }
  const OK = { ok: true, codigo: '4786', nombre: 'Ray', session_tok: 'st-1', fecha_op: '2026-10-21' };
  for (const [quale, SRC] of [['sala', SALA], ['anf', ANF]]) {
    { const { ctx, L } = mondo(SRC, quale, { borde: OK }); const r = await vm.runInContext('checkInConToken()', ctx);
      t(quale + ' A · leva accesa, device battezzato ⇒ codigo dal bordo in STATE.codigo, ZERO GAS', r === true && ctx.STATE.codigo === '4786' && ctx.STATE.nombre === 'Ray' && L.gas.length === 0 && L.entro === 1 &&
        L.fetch.some((f) => /\/deviceCheckin\/BKS$/.test(f.u) && f.b.device_token === 'dev-1' && f.h['X-Borde-Token'] === 'tok'), L); }
    for (const [n, b] of [['need:gas (leva del bordo spenta)', { ok: false, need: 'gas', error: 'apagado' }], ['ok senza codigo (prima di ARQ)', { ok: true, nombre: 'Ray', session_tok: 'x' }], ['otro_local', { ok: false, need: 'gas', error: 'otro_local' }]]) {
      const { ctx, L } = mondo(SRC, quale, { borde: b }); const r = await vm.runInContext('checkInConToken()', ctx);
      if (quale === 'sala') t('sala B · ' + n + ' ⇒ [26-ott · 6.5] a leva accesa MAI il GAS: torna false (la tastiera del codice)', r === false && L.gas.length === 0 && !ctx.STATE.codigo, { r, L });
      else t(quale + ' B · ' + n + ' ⇒ salaCheckIn del GAS, codigo del GAS', L.gas[0] && L.gas[0][0] === 'salaCheckIn' && ctx.STATE.codigo === 'GAS9', L);
    }
    { const { ctx, L } = mondo(SRC, quale, { lancia: true }); const r = await vm.runInContext('checkInConToken()', ctx);
      if (quale === 'sala') t('sala C · rete morta ⇒ [26-ott · 6.5] MAI il GAS: la tastiera del codice', r === false && L.gas.length === 0, { r, L });
      else t(quale + ' C · rete morta ⇒ GAS', L.gas.length === 1 && ctx.STATE.codigo === 'GAS9', L); }
    { const { ctx, L, mem } = mondo(SRC, quale, { borde: { ok: false, error: 'device_revocado' } }); const r = await vm.runInContext('checkInConToken()', ctx);
      t(quale + ' D · device_revocado dal bordo ⇒ definitivo: via il token, niente GAS, nessun codigo', r === false && L.gas.length === 0 && !ctx.STATE.codigo && !('t' in mem) && ctx.deviceToken === '', { r, gas: L.gas, mem }); }
    { const { ctx, L } = mondo(SRC, quale, { on: false, vista: '0', borde: OK }); await vm.runInContext('checkInConToken()', ctx);
      t(quale + ' E · leva spenta ⇒ GAS come ieri, NESSUNA chiamata al bordo', L.gas.length === 1 && L.fetch.length === 0 && ctx.STATE.codigo === 'GAS9', L); }
  }
  // sala: l'attesa di /salud solo se il telefono ha già visto la leva
  t('sala F · si aspetta /salud (max 1,2 s) solo con sala_checkinb = 1', /if \(SALUD_LEVE_P && _cbVista === '1'\) \{ try \{ await Promise\.race\(\[SALUD_LEVE_P, new Promise\(function \(ok\) \{ setTimeout\(ok, 1200\); \}\)\]\); \} catch \(e\) \{\} \}/.test(fnVin(SALA, 'checkInConToken')));
  t('sala G · la lettura di /salud è la promessa SALUD_LEVE_P e ricorda la leva', /SALUD_LEVE_P = fetch\(BORDE_SALA\.URL \+ '\/salud'/.test(SALA) && /localStorage\.setItem\('sala_checkinb', CHECKIN_BORDE_ON \? '1' : '0'\)/.test(SALA) && /const _ck = cercaK\(j, 'checkin_borde_on'\); if \(_ck != null && QS\.get\('chkb'\) !== '0'\) CHECKIN_BORDE_ON = String\(_ck\) === '1';/.test(SALA));
  t('sala N · [26-ott · 6.5] la leva nasce ACCESA nel vetro (la chiave assente non la spegne), ?chkb=0 la spegne', /var CHECKIN_BORDE_ON = \(function \(\) \{ try \{ return QS\.get\('chkb'\) !== '0'; \}/.test(SALA));
  { const { ctx, L } = mondo(ANF, 'anf', { vista: '1', borde: OK, salud: { flags: { checkin_borde_on: '0' } } }); await vm.runInContext('checkInConToken()', ctx);
    t('anf H · ricordata accesa ma /salud dice spenta ⇒ GAS, e la memoria si aggiorna a 0', L.gas.length === 1 && !L.fetch.some((f) => /deviceCheckin/.test(f.u)), L); }
  t('anf I · anfSaludLeva ricorda checkin_borde_on', /localStorage\.setItem\('anf_checkinb', \(j && j\.flags && String\(j\.flags\.checkin_borde_on\) === '1'\) \? '1' : '0'\)/.test(ANF));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['s', 'ok senza codigo creduto', "    if (j && j.ok === true && j.codigo) return j;", "    if (j && j.ok === true) return j;"],
    ['a', 'ok senza codigo creduto (anf)', "    if (j && j.ok === true && j.codigo) return j;", "    if (j && j.ok === true) return j;"],
    ['s', 'revocato ripiega sul GAS', "    if (j && j.ok === false && j.error === 'device_revocado') return j;", ''],
    ['s', 'leva ignorata', 'const rB = CHECKIN_BORDE_ON ? await _checkInDalBorde() : null;', 'const rB = await _checkInDalBorde();'],
    ['a', 'anf: la leva non si guarda', "const rB = (_cbVista === '1' && await _anfCheckinLeva()) ? await _checkInDalBorde() : null;", 'const rB = await _checkInDalBorde();'],
    ['s', 'senza bordo torna al GAS', "    if (!rB && CHECKIN_BORDE_ON) { try { _pennaConta('chk:sin_gas'); } catch (e) {} return false; }\n", ''],
    ['s', 'nasce spenta (il buco del 25)', "var CHECKIN_BORDE_ON = (function () { try { return QS.get('chkb') !== '0'; } catch (e) { return true; } })();", 'var CHECKIN_BORDE_ON = false;'],
    ['s', 'attesa anche a leva spenta', "if (SALUD_LEVE_P && _cbVista === '1') {", 'if (SALUD_LEVE_P) {'],
  ];
  let m = 0; for (const [dove, n, a, b] of M) { const S = dove === 's' ? SALA0 : ANF0; if (!S.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; }
    let r; try { r = dove === 's' ? await banco(S.replace(a, b), ANF0, true) : await banco(SALA0, S.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(SALA0, ANF0, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
