// BANCO · LA MESA CON SOLO PEDIDOS PAGATI È LIBERA (prova 997 con Alberto, 16-ott · 🎛 BKP `BKP V31 LA 997 HA FATTO UNA BOLETA VERA` 🟡) · TERZA PENNA
// Il fatto: dopo il saldo la 997 tornava «1 con gente · ✓ bien · $0 · 0 líneas». La regola del 27-set svuotava i pagados ma lasciava la mesa nel modello.
// Criteri: ① solo pagados ⇒ la mesa NON è nel modello (LIBRE) ② pagados + qualcosa da cobrare ⇒ resta, coi pagados nel pannello ③ le altre liste non cambiano
//          ④ nessuna mesa del modello ha zero pedidos ⑤ mutante.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const P = (mesa, uuid, estado, total) => ({ mesa: mesa, uuid: uuid, estado: estado || 'entregado', total: total || 1000 });
function modello(SRC, r) {
  const ctx = { STATE: { tomando: {} }, Object, Array, parseInt };
  vm.createContext(ctx); vm.runInContext(fnDe(SRC, '_mesasModel') + '\nthis.M = _mesasModel;', ctx);
  return ctx.M(r);
}
function banco(SRC) {
  const k0 = ko;
  { const l = modello(SRC, { pagados: [P('997', 'u1', 'cerrado', 6080)] });
    t('① la 997 con SOLO pedidos pagati non è nel modello: LIBRE, non «con gente · ✓ bien · $0»', !l.some((m) => m.mesa === '997'), l); }
  { const l = modello(SRC, { pagados: [P('998', 'u1', 'cerrado', 3290)], por_limpiar: [P('998', 'u2', 'entregado', 2790)] });
    const m = l.find((x) => x.mesa === '998');
    t('② pagados + un entregado da cobrare: la mesa resta, «por cobrar», coi pagados nel pannello', m && m.st === 'cobrar' && m.pagados.length === 1 && m.n === 2, m); }
  { const l = modello(SRC, { pagados: [P('50', 'u1', 'cerrado')], mios: [P('50', 'u2', 'digitado')] });
    const m = l.find((x) => x.mesa === '50'); t('② bis pagados + un mío in preparazione: la mesa resta', m && m.st === 'prep' && m.n === 2, m); }
  { const l = modello(SRC, { mios: [P('31', 'a', 'atendido')], pendientes: [P('32', 'b', 'pendiente')], por_limpiar: [P('33', 'c', 'entregado')] });
    t('③ le altre liste come prima: 31 digitar · 32 nuevo · 33 cobrar', l.length === 3 && l.find((m) => m.mesa === '31').st === 'digitar' && l.find((m) => m.mesa === '32').st === 'nuevo' && l.find((m) => m.mesa === '33').st === 'cobrar', l.map((m) => m.mesa + ':' + m.st)); }
  { const l = modello(SRC, { pagados: [P('997', 'u1', 'cerrado'), P('996', 'u3', 'cerrado')], mios: [P('40', 'x', 'digitado')] });
    t('④ nessuna mesa del modello ha zero pedidos', l.every((m) => m.n > 0) && l.length === 1, l.map((m) => m.mesa + ':' + m.n)); }
  t('versione >= 3.226.9', /sala v3\.(226\.(9|\d\d)|22[7-9]\.\d|2[3-9]\d\.\d)/.test(SRC));
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» ⇒ banco ROSSO', rossi > 0, rossi); };
mut('la mesa svuotata resta nel modello (il difetto della 997)', '}).filter(function (m) { return m.n > 0; });', '});');
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
