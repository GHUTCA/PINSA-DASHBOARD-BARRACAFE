// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · AUT-0728 ②: «Mesas abiertas de ayer» nell'app del JL (22-ott)
// Richiesta: 🎛 `V32 LE QUATTRO REGOLE DEL MESSAGGIO DI ALBERTO` · forma di 🎛 BKP `BKP V32 AUT-0728 LA FACCIA DELLE MESAS DI IERI`.
// Gira `giroAyer` e `_ayerHtml` VERI in vm con `cajaPost1` finto. node test_app_jl_mesas_ayer_0728_22OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const iA = SRC.indexOf('const AYER = '); if (iA < 0) throw new Error('AYER');
  const F = SRC.slice(iA, SRC.indexOf('\n', iA) + 1) + 'async ' + fnVin(SRC, 'giroAyer') + fnVin(SRC, '_ayerHtml');
  async function giro(risposte, { lancia = null } = {}) {
    const L = { chiamate: [], pinte: 0 }; let ora = 1e12; let k = 0;
    const ctx = { DEMO: false, STATE: { pin: '1234' }, TAB: 0, JSON, String, Array,
      Date: class extends Date { static now() { return ora; } },
      esc: (s) => String(s == null ? '' : s), fmt: (n) => '$' + Math.round(n),
      pintaTab: () => { L.pinte++; },
      cajaPost1: async (p) => { L.chiamate.push(p); if (lancia) throw new Error(lancia); return JSON.parse(JSON.stringify(risposte[Math.min(k++, risposte.length - 1)])); } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    ctx.avanza = (ms) => { ora += ms; };
    await vm.runInContext('giroAyer()', ctx);
    return { ctx, L, html: () => vm.runInContext('_ayerHtml()', ctx) };
  }
  const OK = { ok: true, borde: true, dia: '2026-10-21', fuente: 'pg', n: 2, monto: 33190,
    mesas: [{ mesa: '47', meseros: ['Wilbert'], consumo: 30000, n_pedidos: 2 }, { mesa: '12', meseros: [], consumo: 3190, n_pedidos: 1 }] };
  { const x = await giro([OK]);
    t('A · la richiesta: verbo mesas_ayer col PIN del JL', x.L.chiamate[0].verbo === 'mesas_ayer' && x.L.chiamate[0].pin_jl === '1234', x.L.chiamate);
    const h = x.html();
    t('B · due mesas di ieri ⇒ card rossa col numero, il monto, mesa · consumo · mesero', /card rossa/.test(h) && />2</.test(h) && /\$33190/.test(h) && /Mesa 47 · \$30000/.test(h) && /Wilbert/.test(h) && /sin mesero/.test(h), h);
    t('B2 · e dice perché: le propinas di ieri non escono', /las propinas de ayer no salen/.test(h), h);
    t('B3 · ridisegna la scheda se Sala/Turno è davanti', x.L.pinte === 1); }
  { const x = await giro([{ ok: false, need: 'gas', motivo: 'apagado' }]);
    t('C · leva del bordo spenta ⇒ nessuna card (la strada di oggi)', x.html() === '', x.html()); }
  { const x = await giro([{ ok: false, error: 'verbo_sconosciuto' }]);
    t('C2 · il bordo vivo senza il verbo (400 verbo_sconosciuto) ⇒ come leva spenta, nessuna card né ámbar', x.html() === '', x.html()); }
  { const x = await giro([{ ok: false, borde: true, error: 'pg_no_responde' }]);
    const h = x.html();
    t('D · PG non risponde ⇒ riga ámbar che lo dice, MAI «nessuna mesa»', /card ambra/.test(h) && /la base no responde/.test(h) && !/card rossa/.test(h), h); }
  { const x = await giro([OK], { lancia: 'timeout' });
    t('E · rete ⇒ ámbar «sin respuesta»', /sin respuesta/.test(x.html()), x.html()); }
  { const x = await giro([Object.assign({}, OK, { mesas: [], n: 0, monto: 0 })]);
    t('F · zero mesas ⇒ nessuna card', x.html() === '', x.html()); }
  { const x = await giro([{ ok: true, mesas: [{ mesa: '1' }] }]);
    t('G · un ok SENZA borde:true non si crede (resta «non so»)', !/card rossa/.test(x.html()) && /card ambra/.test(x.html()), x.html()); }
  { const x = await giro([OK, Object.assign({}, OK, { mesas: [], n: 0 })]);
    await vm.runInContext('giroAyer()', x.ctx);
    t('H · entro 10 min non richiede', x.L.chiamate.length === 1, x.L.chiamate.length);
    x.ctx.avanza(601000); await vm.runInContext('giroAyer()', x.ctx);
    t('H2 · dopo 10 min richiede, e una mesa saldata sparisce', x.L.chiamate.length === 2 && x.html() === '', x.html()); }
  { const x = await giro([{ ok: false, borde: true, error: 'pg_no_responde' }, OK]);
    x.ctx.avanza(121000); await vm.runInContext('giroAyer()', x.ctx);
    t('I · dopo un errore riprova a 2 min, non a 10', x.L.chiamate.length === 2 && /card rossa/.test(x.html()), x.L.chiamate.length); }
  t('J · la card sta in testa a Sala e a Turno', /function vSala\(\) \{\n  const t = STATE\.turno;\n  let h = _ayerHtml\(\);/.test(SRC) && /function vTurno\(\) \{\n  const t = STATE\.turno, tt = t && t\.turno;\n  let h = _ayerHtml\(\);/.test(SRC));
  t('K · si legge all avvio', /giroProds\(\); giroAyer\(\);/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['need:gas letto come lista vuota', "    else if (r && (r.need === 'gas' || /^verbo_(sconosciuto|desconocido)$/.test(String(r.error || '')))) { AYER.r = null; AYER.err = ''; }\n", ''],
    ['verbo_sconosciuto letto come errore', "r.need === 'gas' || /^verbo_(sconosciuto|desconocido)$/.test(String(r.error || ''))", "r.need === 'gas'"],
    ['errore letto come nessuna mesa', "  if (AYER.err) return '<div class=\"card ambra\">", "  if (false) return '<div class=\"card ambra\">"],
    ['ok senza borde creduto', "r.ok === true && r.borde === true && Array.isArray(r.mesas)", "r.ok === true && Array.isArray(r.mesas)"],
    ['nessun tetto di frequenza', "  if (AYER.ts && (Date.now() - AYER.ts) < (AYER.err ? 120000 : 600000)) return;\n", ''],
    ['non in testa alla Sala', "  let h = _ayerHtml();   // [22-ott · AUT-0728 ②] le mesas aperte di ieri, prima di tutto", "  let h = '';"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
