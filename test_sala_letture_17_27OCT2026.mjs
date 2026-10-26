// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · 1.8: frecuentes, modificadores e novedad dal bordo a leva (27-oct)
// Il vetro di 🖐 QUARTA `4766419` (21-ott) rifatto sopra main (🎛 BKP: `EL GIRO V32 FRECUENTES LEVA VERDE MA INERTE`), più l'attesa di /salud all'avvio.
// Gira _letturaBordeOGas e _saludAttendi VERI in vm. node test_sala_letture_17_27OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const mondo = (risp, lancia = false) => { const L = { fetch: [], gas: [] };
    const ctx = { JSON, Object, String, Promise, setTimeout, clearTimeout, AbortController, encodeURIComponent, BORDE_SALA: { URL: 'https://b', T: 'tok' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala', _salaVer: () => 'v',
      fetch: async (u, o) => { L.fetch.push({ u, b: JSON.parse(o.body) }); if (lancia) throw new Error('rete'); return { json: async () => risp }; },
      gasGet: async (a, p) => { L.gas.push([a, p]); return { ok: true, via: 'gas', ids: ['g'] }; } };
    vm.createContext(ctx); vm.runInContext('async ' + fnVin(SRC, '_letturaBordeOGas'), ctx); return { ctx, L }; };
  const go = (w, leva, action) => vm.runInContext('_letturaBordeOGas(' + leva + ', ' + JSON.stringify(action) + ', { codigo: "C1", nombre: "Ruth" }, { codigo: "C1" })', w.ctx);
  { const w = mondo({ ok: true, borde: true, ids: ['p1', 'p2'] }); const r = await go(w, true, 'getFrecuentes');
    t('A · leva accesa, bordo timbrato ⇒ la risposta del bordo, ZERO GAS', r.ids.join() === 'p1,p2' && w.L.gas.length === 0 && /\/pedido-staff\/BKS\?t=tok$/.test(w.L.fetch[0].u) && w.L.fetch[0].b.action === 'getFrecuentes', w.L); }
  { const w = mondo({ ok: false, need: 'gas' }); await go(w, true, 'getModificadores');
    t('B · leva accesa, il bordo non timbra ⇒ gasGet come ieri (non gasPost: nel GAS stanno in doGet)', w.L.gas.length === 1 && w.L.gas[0][0] === 'getModificadores', w.L); }
  { const w = mondo(null, true); await go(w, true, 'getFrecuentes');
    t('C · leva accesa, rete morta ⇒ gasGet, nessun errore in faccia', w.L.gas.length === 1, w.L); }
  { const w = mondo({ ok: true, borde: true }); await go(w, false, 'getFrecuentes');
    t('D · leva spenta ⇒ non si bussa al bordo, gasGet come ieri', w.L.fetch.length === 0 && w.L.gas.length === 1, w.L); }
  t('E · getModificadores e getFrecuentes passano da _letturaBordeOGas, e aspettano /salud se la leva non è ancora nota',
    /await _saludAttendi\(MODS2_BORDE_ON \? 0 : 1500\);[^\n]*\n\s*const r = await _letturaBordeOGas\(MODS2_BORDE_ON, 'getModificadores'/.test(SRC) &&
    /_saludAttendi\(FRECUENTES_BORDE_ON \? 0 : 1500\)\.then\(function \(\) \{ return _letturaBordeOGas\(FRECUENTES_BORDE_ON, 'getFrecuentes'/.test(SRC) &&
    !/gasGet\('getFrecuentes'/.test(SRC) && !/gasGet\('getModificadores'/.test(SRC));
  t('F · novedadEntendida a leva va da staffPost', /\(NOVEDAD_BORDE_ON \? staffPost\('novedadEntendida', _bN\) : gasPost\('novedadEntendida', _bN\)\)/.test(SRC));
  t('G · le tre leve si leggono da /salud', ['frecuentes_borde_on', 'mods2_borde_on', 'novedad_borde_on'].every((k) => SRC.includes("cercaK(j, '" + k + "')")));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['si crede a una risposta senza timbro', '      if (j && j.borde === true) return j;\n    } catch (e) { /* rete o timeout: la via di sempre */ }', '      if (j) return j;\n    } catch (e) { /* rete o timeout: la via di sempre */ }'],
    ['la leva non si guarda', '  if (levaOn && BORDE_SALA && BORDE_SALA.URL) {', '  if (BORDE_SALA && BORDE_SALA.URL) {'],
    ['niente attesa di /salud per i frecuentes', '_saludAttendi(FRECUENTES_BORDE_ON ? 0 : 1500).then(function () { return ', 'Promise.resolve().then(function () { return '],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
