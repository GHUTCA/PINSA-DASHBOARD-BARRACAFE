// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il vetro per conto, fetta 1: la vista (29-ott)
// Reperto: `TERZA V32 DATE CONTO E 6.5B` · contratto di 🎛 BKP `BKP FATTO CONTO SOPRA 3D89AB8: 8BF0161` (conto_id per pedido + datos.conti).
// Gira `_porContoOn`, `_contiDeMesa`, `_contoTesta` VERI di sala.html in vm, e il pezzo di `renderMesaSheet` che sceglie fra gruppi e scheda di oggi.
// node test_sala_por_conto_29OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ORIG = fs.readFileSync(path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const P = (uuid, conto, hace, extra) => Object.assign({ uuid, mesa: '12', hace_s: hace, total: 1000 }, conto === undefined ? {} : { conto_id: conto }, extra || {});
const CONTI = [{ id: 'C-B', mesa: '12', nato: '2026-10-29T21:10:00Z', origen: 'qr', aperto_da: null, total: 8000, pagado: 0, resta: 8000, vivi: 1 },
               { id: 'C-A', mesa: '12', nato: '2026-10-29T20:00:00Z', origen: 'mesa', aperto_da: 'mesero:Wilbert', total: 12000, pagado: 5000, resta: 7000, vivi: 2 }];

async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const i0 = SRC.indexOf('const PORCONTO_QS = ');
  const F = SRC.slice(i0, SRC.indexOf('\n', i0) + 1) + fnVin(SRC, '_porContoOn') + fnVin(SRC, '_contiDeMesa') + fnVin(SRC, '_contoTesta');
  function mondo({ srv = true, qs = '' } = {}) {
    const ctx = { QS: { get: (k) => (k === 'porconto' ? qs : null) }, PORCONTO_SRV: srv, String, Number, Object, Array, Date, isNaN, Infinity,
      esc: (s) => String(s).replace(/</g, '&lt;'), fmtPrice: (n) => '$' + n };
    vm.createContext(ctx); vm.runInContext(F, ctx); return ctx;
  }
  const M = (pend, mios, limpiar) => ({ mesa: '12', pend: pend || [], mios: mios || [], limpiar: limpiar || [] });
  const R = (conti) => ({ conti: conti === undefined ? CONTI : conti });
  { const c = mondo(); const g = c._contiDeMesa(M([P('u1', 'C-A', 300)], [P('u2', 'C-B', 60)], [P('u3', 'C-A', 900)]), R());
    t('A · due conti, tutto torna ⇒ due gruppi, il più vecchio primo (C-A nato 20:00)', g && g.length === 2 && g[0].id === 'C-A' && g[1].id === 'C-B', g);
    t('A2 · i pedidos stanno nel loro conto, ognuno col suo mestiere (pend/mio/lib)', g && g[0].cards.map((x) => x.p.uuid + ':' + x.t).join() === 'u1:pend,u3:lib' && g[1].cards.map((x) => x.p.uuid + ':' + x.t).join() === 'u2:mio', g);
    const h0 = c._contoTesta(g[0], 0, 2), h1 = c._contoTesta(g[1], 1, 2);
    t('A3 · testata: «Cuenta 1 de 2», chi l\'ha aperta senza prefisso, total/pagado/falta', /Cuenta 1 de 2/.test(h0) && /la abrió Wilbert/.test(h0) && /Total <b class="tab">\$12000/.test(h0) && /pagado <b class="tab">\$5000/.test(h0) && /falta <b class="tab">\$7000/.test(h0), h0);
    t('A4 · conto del QR senza pagato: «pidió desde el QR», niente «falta»', /Cuenta 2 de 2/.test(h1) && /pidió desde el QR/.test(h1) && !/falta/.test(h1) && !/pagado/.test(h1), h1); }
  { const c = mondo(); t('B · un conto solo ⇒ la scheda di oggi (null)', c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-A', 2)]), R()) === null); }
  { const c = mondo(); t('C · un pedido senza conto_id ⇒ la scheda di oggi (un gruppo sbagliato è peggio di nessuno)', c._contiDeMesa(M([P('u1', 'C-A', 1), P('u9', undefined, 2)], [P('u2', 'C-B', 3)]), R()) === null); }
  { const c = mondo(); t('C2 · conto_id vuoto ⇒ idem', c._contiDeMesa(M([P('u1', 'C-A', 1), P('u9', '', 2)], [P('u2', 'C-B', 3)]), R()) === null); }
  { const c = mondo(); t('C3 · pedido con conto_id null e un elenco sporco con id "null" ⇒ niente gruppo (la guardia sul pedido, non sull\'elenco)', c._contiDeMesa(M([P('u1', 'C-A', 1), P('u9', null, 2)], [P('u2', 'C-B', 3)]), R(CONTI.concat([{ id: 'null', nato: 1 }]))) === null); }
  { const c = mondo(); t('D · un conto che non è nell\'elenco ⇒ la scheda di oggi', c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-Z', 3)]), R()) === null); }
  { const c = mondo(); t('E · vista senza `conti` (GAS, foto, leva del bordo spenta) ⇒ la scheda di oggi', c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-B', 3)]), {}) === null); }
  { const c = mondo({ srv: false }); t('F · leva spenta ⇒ la scheda di oggi', c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-B', 3)]), R()) === null); }
  { const c = mondo({ srv: false, qs: '1' }); t('F2 · ?porconto=1 accende sul telefono (la prova di QUARTA sulla 998)', !!c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-B', 3)]), R())); }
  { const c = mondo({ srv: true, qs: '0' }); t('F3 · ?porconto=0 spegne anche a leva accesa', c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-B', 3)]), R()) === null); }
  { const c = mondo(); t('G · mesa vuota ⇒ null', c._contiDeMesa(M(), R()) === null); }
  { const c = mondo(); const g = c._contiDeMesa(M([P('u1', 'C-A', 1)], [P('u2', 'C-B', 3)]), R([{ id: 'C-A', nato: 'boh' }, { id: 'C-B', nato: 1000 }]));
    t('H · `nato` illeggibile va in fondo, un numero vale come ms', g && g[0].id === 'C-B' && g[1].id === 'C-A', g); }
  { const c = mondo(); const h = c._contoTesta({ c: { origen: 'mesa', aperto_da: null, total: null } }, 0, 2); t('H2 · total null ⇒ «Total —», niente nomi inventati', /Total —/.test(h) && !/abrió/.test(h), h); }
  { const c = mondo(); const h = c._contoTesta({ c: { aperto_da: 'mesero:<img>' , total: 1 } }, 0, 2); t('H3 · aperto_da passa da esc', !/<img>/.test(h), h); }
  // il collegamento in renderMesaSheet
  t('I · renderMesaSheet chiede i gruppi e, senza, disegna la scheda di oggi', /const _gruppi = _contiDeMesa\(m, r\);[^\n]*\n\s*if \(_gruppi\) \{\n[^\n]*_contoTesta\(g, i, _gruppi\.length\)[^\n]*\n\s*\} else \{/.test(SRC));
  t('I2 · /salud legge sala_por_conto_on', /PORCONTO_SRV = String\(cercaK\(j, 'sala_por_conto_on'\)\) === '1';/.test(SRC));
  t('I3 · la leva nasce spenta', /var PORCONTO_SRV = false;/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const MU = [
    ['raggruppa con un conto solo', 'if (ids.length < 2 ||', 'if (ids.length < 1 ||'],
    ['pedido senza conto passa', "if (!tutti.length || tutti.some(function (c) { return !c.p || c.p.conto_id == null || String(c.p.conto_id).trim() === ''; })) return null;", 'if (!tutti.length) return null;'],
    ['conto fuori elenco passa', " || ids.some(function (id) { return !info[id]; })) return null;", ') return null;'],
    ['leva ignorata', 'if (!_porContoOn() || !m', 'if (!m'],
    ['ordine invertito', 'return nato(info[a]) - nato(info[b])', 'return nato(info[b]) - nato(info[a])'],
    ['freno del telefono ignorato', "return PORCONTO_QS === '0' ? false : (", 'return ('],
    ['«falta» anche senza pagato', "(pag && res != null ? ' · falta", "(res != null ? ' · falta"],
    ['vuoto letto come zero', "if (v == null || v === '') return null; const x", 'const x'],
    ['niente esc su aperto_da', "' <span style=\"opacity:.75\">· ' + esc(da) + '</span>'", "' <span style=\"opacity:.75\">· ' + da + '</span>'"],
  ];
  let m = 0; for (const [n, a, b] of MU) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + MU.length); process.exitCode = m === MU.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
