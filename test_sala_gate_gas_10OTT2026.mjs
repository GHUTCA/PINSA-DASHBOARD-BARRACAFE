// BANCO · «El turno se cerró» a un codigo appena aperto (V28 `CONSOLA 8086 TURNO SE CERRO`) · TERZA PENNA · 10-ott-2026
// Il bordo risponde 403 codigo_invalid finche il battito del GAS non ha pubblicato il digesto del codigo NUOVO (1-3 min dopo abrirTurno). Tre conferme di fila = fuori.
// Criteri: ① un codigo_invalid del BORDO non e definitivo: si chiede al GAS (l'autorita del codigo) ② se il GAS lo riconosce, il mesero RESTA dentro
//          ③ se anche il GAS dice codigo_invalid, il giro dei 3 strike e quello di sempre ④ un timeout del GAS non e un logout ⑤ il bordo che risponde bene non cambia
//          ⑥ un codigo_invalid del bordo NON conta come fallo di rete (non apre il lockout di 90 s) ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

function mondo(SRC, { bordo, gas }) {
  const log = { gas: 0, pennaDice: [] };
  const BORDE_SALA = { ON: true, URL: 'http://b', T: 't', fallos: 0, fallosTs: 0, MAX_EDAD_MS: 600000, MAX_EDAD_BORDE_MS: 600000 };
  const ctx = { BORDE_SALA, CFG: { LOCAL: 'BKS' }, STATE: { gasCaidoHasta: 0, salaTodos: null }, BORDE_FALLBACK_ON: true, BANNER_EDAD_BORDE_ON: false,
    AbortController, setTimeout, clearTimeout, Date, JSON, Math, Object, String, Number, Error, encodeURIComponent,
    _pennaDice: (x) => log.pennaDice.push(x), _slugSalaJS: (n) => String(n).toLowerCase().trim(), _fallbackUltimaVista: () => null,
    fetch: async () => { if (bordo === 'red') throw new Error('rete'); return { ok: bordo.http !== 403, json: async () => bordo.body }; },
    gasGet: async () => { log.gas++; if (gas === 'timeout') throw new Error('timeout'); return gas; } };
  vm.createContext(ctx);
  vm.runInContext(fnDe(SRC, 'leerSala', true) + '\nthis.leer = leerSala;', ctx);
  return { ctx, log, BORDE_SALA };
}
const INVALID = { http: 403, body: { ok: false, error: 'codigo_invalid', t_ms: 300 } };
const SALA_BORDO = { http: 200, body: { ok: true, datos: { datos: { ok: true, ts_datos: Date.now() - 5000, meseros: { wilbert: { ok: true, nombre: 'wilbert', plazas: [], mesas: [] } } } } } };

async function banco(SRC) {
  const k0 = ko;
  { const m = mondo(SRC, { bordo: INVALID, gas: { ok: true, nombre: 'wilbert', mesas: [], plazas: [] } });
    const r = await m.ctx.leer('8086', 'wilbert');
    t('① + ② il bordo dice codigo_invalid (digesto di ieri) ma il GAS riconosce il codigo: il mesero RESTA dentro (ok:true)', r && r.ok === true && m.log.gas === 1, [r, m.log]);
    t('⑥ un codigo_invalid del bordo NON e un fallo di rete: nessun fallo contato, nessun lockout', m.BORDE_SALA.fallos === 0 && m.BORDE_SALA.fallosTs === 0, m.BORDE_SALA);
    t('⑥ bis il motivo si dichiara (leer:bordo-codigo-invalid→gas) e non come rete', m.log.pennaDice.includes('leer:bordo-codigo-invalid→gas') && !m.log.pennaDice.includes('leer:bordo-red'), m.log.pennaDice); }
  { const m = mondo(SRC, { bordo: INVALID, gas: { ok: false, error: 'codigo_invalid' } });
    const r = await m.ctx.leer('0000', 'wilbert');
    t('③ anche il GAS dice codigo_invalid (codigo davvero sbagliato/vecchio): torna codigo_invalid, il giro dei 3 strike e quello di sempre', r && r.ok === false && r.error === 'codigo_invalid', r); }
  { const m = mondo(SRC, { bordo: INVALID, gas: { ok: false, error: 'no_turno_abierto' } });
    const r = await m.ctx.leer('8086', 'wilbert');
    t('③ bis il GAS dice no_turno_abierto: lo si propaga tale e quale', r && r.error === 'no_turno_abierto', r); }
  { const m = mondo(SRC, { bordo: INVALID, gas: 'timeout' });
    let err = null; try { await m.ctx.leer('8086', 'wilbert'); } catch (e) { err = e; }
    t('④ il GAS non risponde (timeout): NON e un logout — la funzione lancia (transitorio, il chiamante mostra il banner e riprova)', err && err.message === 'timeout', err && err.message); }
  { const m = mondo(SRC, { bordo: SALA_BORDO, gas: { ok: true, mia: 'gas' } });
    const r = await m.ctx.leer('8086', 'wilbert');
    t('⑤ il bordo che risponde bene: si usa il bordo, il GAS non si chiama (come ieri)', r && r.ok === true && m.log.gas === 0, [r, m.log.gas]); }
  { const m = mondo(SRC, { bordo: 'red', gas: { ok: true, nombre: 'wilbert', mesas: [] } });
    const r = await m.ctx.leer('8086', 'wilbert');
    t('⑤ bis rete morta verso il bordo: cade sul GAS e conta il fallo come sempre', r && r.ok === true && m.BORDE_SALA.fallos === 1, [r, m.BORDE_SALA.fallos]); }
  return ko - k0;
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; await banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('il bordo e di nuovo l autorita (torna il return)', "{ _pennaDice('leer:bordo-codigo-invalid→gas'); throw { _bordoCodigoInvalid: true }; }", "return { ok: false, error: 'codigo_invalid' };");
await mut('il codigo_invalid del bordo conta come fallo di rete', "if (e && e._bordoCodigoInvalid) { /* non e' un fallo di rete: il GAS decide (sotto) */ }", "if (false) { }");
await mut('il motivo non si dichiara', "_pennaDice('leer:bordo-codigo-invalid→gas'); throw", "throw");
await mut('un errore del GAS diventa logout', "const rG = await gasGet('getSalaMesero', { codigo: codigo, nombre: nombre });", "let rG; try { rG = await gasGet('getSalaMesero', { codigo: codigo, nombre: nombre }); } catch (e0) { return { ok: false, error: 'codigo_invalid' }; }");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
