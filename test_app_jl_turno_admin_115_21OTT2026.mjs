// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.15 vetro · giroTurno da /turno/admin e cerrarT da /turno/apertura (21-ott)
// Contratto: ⚙️ `ARQ V32 PEZZO 1.15 TURNO AL BORDO ACB32CE PER IL BANCO`. Gira giroTurno, cerrarT e i due helper VERI di app_jl.html in vm.
// node test_app_jl_turno_admin_115_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const riga = (p) => { const i = SRC.indexOf(p); if (i < 0) throw new Error(p); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };
  const F = riga('const LOC_PG = ') + riga('const _ERR_APERTURA = ') + ['_turnoAdminPorBordo', 'giroTurno', '_cierrePorBordo', 'cerrarT'].map((n) => 'async ' + fnVin(SRC, n)).join('');
  function mondo({ status = 200, body, lancia = false, gas = { ok: true, turno: 'G123' } } = {}) {
    const L = { fetch: [], gas: [], toasts: [], reload: 0, rimosso: 0 };
    const ctx = { DEMO: false, STATE: { pin: '4321', user: 'Eduardo', ts: {} }, CFG: { BORDE: 'https://b', T: 'tok', LOCAL: 'BKS' }, JSON, String, Math, setTimeout, clearTimeout, AbortController, encodeURIComponent,
      fetch: async (u, o) => { L.fetch.push({ u, h: o.headers, b: JSON.parse(o.body) }); if (lancia) throw new Error('rete'); return { status, ok: status < 400, json: async () => body }; },
      gasGet: async (a) => { L.gas.push(a); return gas; }, gasPost: async (a) => { L.gas.push(a); return gas; },
      salva: () => {}, pintaTesta: () => {}, pintaTab: () => {}, toast: (k, s) => L.toasts.push([k, s]), confirm: () => true, _uidGesto: () => 'g-1',
      sessionStorage: { removeItem: () => { L.rimosso++; } }, location: { reload: () => { L.reload++; } } };
    vm.createContext(ctx); vm.runInContext(F, ctx); return { ctx, L };
  }
  const ADM = { ok: true, local: 'BKS', fecha_op: '2026-10-22', turno: '4786', plazas: ['Aurora A'], asignaciones: [{ plaza: 'Aurora A', mesero: 'Ray' }], grupos: [], ts: 1, fuente: 'borde' };
  // giroTurno
  { const { ctx, L } = mondo({ body: ADM }); await vm.runInContext('giroTurno()', ctx);
    t('A · turno del bordo ⇒ STATE.turno dal bordo, zero Google, PIN in body e token in header', ctx.STATE.turno.turno === '4786' && L.gas.length === 0 && /\/turno\/admin\/BKS$/.test(L.fetch[0].u) && L.fetch[0].b.pin_jl === '4321' && L.fetch[0].h['x-borde-token'] === 'tok', L); }
  for (const [n, o] of [['gate_spento', { body: { ok: true, scritto: false, motivo: 'gate_spento' } }], ['404', { status: 404, body: { ok: false } }], ['403', { status: 403, body: { ok: false, error: 'token_invalid' } }]]) {
    const { ctx, L } = mondo(o); await vm.runInContext('giroTurno()', ctx);
    t('B · ' + n + ' ⇒ getTurnoAdmin del GAS, come ieri', L.gas[0] === 'getTurnoAdmin' && ctx.STATE.turno.turno === 'G123', L);
  }
  { const { ctx, L } = mondo({ lancia: true }); ctx.STATE.turno = { turno: 'VECCHIO' }; await vm.runInContext('giroTurno()', ctx);
    t('C · rete morta ⇒ resta il turno in memoria, niente Google', ctx.STATE.turno.turno === 'VECCHIO' && L.gas.length === 0, L); }
  { const { ctx, L } = mondo({ body: { ok: false, error: 'pin_jl_invalido' } }); await vm.runInContext('giroTurno()', ctx);
    t('D · PIN rifiutato dal bordo ⇒ come pin_invalid del GAS: via il PIN e ricarica', L.rimosso === 1 && L.reload === 1 && L.gas.length === 0, L); }
  { const { ctx, L } = mondo({ body: { ok: true, turno: 'X' } }); ctx.STATE.turno = { turno: 'VECCHIO' }; await vm.runInContext('giroTurno()', ctx);
    t('E · risposta senza fuente:borde ⇒ non si crede (niente sostituzione, niente Google)', ctx.STATE.turno.turno === 'VECCHIO' && L.gas.length === 0, L); }
  // cerrarT
  { const { ctx, L } = mondo({ body: { ok: true, accion: 'cerrar', cerrado: true, ya_cerrado: false } }); await vm.runInContext('cerrarT()', ctx);
    t('F · cerrar al bordo ⇒ «Turno cerrado», body {accion:cerrar, uid_gesto, nombre, pin_jl}, zero Google', L.gas.filter((g) => g === 'cerrarTurno').length === 0 && L.toasts[0][1] === 'Turno cerrado' &&
      L.fetch[0].b.accion === 'cerrar' && L.fetch[0].b.uid_gesto === 'g-1' && L.fetch[0].b.nombre === 'Eduardo' && /\/turno\/apertura\/BKS$/.test(L.fetch[0].u), L); }
  { const { ctx, L } = mondo({ body: { ok: true, accion: 'cerrar', cerrado: true, ya_cerrado: true } }); await vm.runInContext('cerrarT()', ctx);
    t('F2 · già chiuso ⇒ lo dice', /ya estaba/.test(L.toasts[0][1]), L.toasts); }
  { const { ctx, L } = mondo({ body: { ok: true, scritto: false, motivo: 'gate_spento', causa: 'turno_no_abierto_en_borde' } }); await vm.runInContext('cerrarT()', ctx);
    t('G · turno del GAS (gate_spento) ⇒ cerrarTurno del GAS, come ieri', L.gas.includes('cerrarTurno'), L); }
  { const { ctx, L } = mondo({ lancia: true }); await vm.runInContext('cerrarT()', ctx);
    t('H · timeout ⇒ «puede que SÍ se haya cerrado», NIENTE GAS (non si chiude due volte da due porte)', !L.gas.includes('cerrarTurno') && /puede que el turno SÍ se haya cerrado/.test(L.toasts[0][1]), L); }
  { const { ctx, L } = mondo({ body: { ok: false, error: 'pin_jl_bloqueado', faltan_s: 300 } }); await vm.runInContext('cerrarT()', ctx);
    t('I · PIN bloccato ⇒ lo dice coi minuti, niente GAS', !L.gas.includes('cerrarTurno') && /espera 5 min/.test(L.toasts[0][1]), L); }
  { const { ctx, L } = mondo({ status: 500, body: { ok: false } }); await vm.runInContext('cerrarT()', ctx);
    t('J · 5xx senza errore leggibile ⇒ dubbio, niente GAS', !L.gas.includes('cerrarTurno') && /puede que/.test(L.toasts[0][1]), L); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['timeout della lettura va al GAS', "  } catch (e) { clearTimeout(to); return { usado: true, ok: false }; }\n  if (r.status === 404 || r.status === 403) return { usado: false };\n  if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };\n  if (j && j.ok === false && /^pin", "  } catch (e) { clearTimeout(to); return { usado: false }; }\n  if (r.status === 404 || r.status === 403) return { usado: false };\n  if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };\n  if (j && j.ok === false && /^pin"],
    ['si crede a una risposta senza fuente', "if (j && j.ok === true && j.fuente === 'borde') return { usado: true, ok: true, r: j };", "if (j && j.ok === true) return { usado: true, ok: true, r: j };"],
    ['il timeout del cerrar ripiega sul GAS', "  } catch (e) { clearTimeout(to); return { usado: true, ok: false, dudoso: true }; }\n  if (r.status === 404 || r.status === 403) return { usado: false };\n  if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };\n  if (j && j.ok === false && j.error) return { usado: true, ok: false, err: _ERR_APERTURA[j.error] || j.error, bloqueado: /^pin(_jl)?_bloqueado/.test(String(j.error)) ? (j.faltan_s || 0) : 0 };\n  if (!r.ok || !j || j.ok !== true || j.cerrado !== true)", "  } catch (e) { clearTimeout(to); return { usado: false }; }\n  if (r.status === 404 || r.status === 403) return { usado: false };\n  if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };\n  if (j && j.ok === false && j.error) return { usado: true, ok: false, err: _ERR_APERTURA[j.error] || j.error, bloqueado: /^pin(_jl)?_bloqueado/.test(String(j.error)) ? (j.faltan_s || 0) : 0 };\n  if (!r.ok || !j || j.ok !== true || j.cerrado !== true)"],
    ['cerrar senza accion', "body: JSON.stringify({ accion: 'cerrar', uid_gesto: uid,", "body: JSON.stringify({ uid_gesto: uid,"],
    ['PIN rifiutato ignorato', "if (j && j.ok === false && /^pin(_jl)?_(invalid|invalido|requerido)$/.test(String(j.error || ''))) return { usado: true, ok: false, pinMal: true };", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
