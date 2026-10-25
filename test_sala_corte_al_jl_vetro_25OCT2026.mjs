// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il corte con la mesa senza erede arriva al bordo (25-oct)
// Reperto: 🖐 QUARTA `QUARTA V32 LA PROVA DEL CORTE SULLA 998 IL VETRO BLOCCA` — v3.228.45, Wilbert AM, la 998 senza mesero la sera: il vetro bloccava
// («pide al JL que la pase o la cierre») e il corte non partiva mai, quindi il ramo del JL del bordo (corte_senza_erede_jl_on) non si raggiungeva.
// Gira _ciePaso1 VERA in vm. node test_sala_corte_al_jl_vetro_25OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const paso1 = (mesas, { jl = true, tras = true, bloqueo = true } = {}) => { let h = '';
    const ctx = { CIE: { data: { mesero: 'Wilbert', n_abiertas: mesas.length, monto_abierto: mesas.reduce((a, m) => a + m.consumo, 0), mesas_abiertas: mesas } },
      esc: String, fmtPrice: (n) => '$' + n, _cieRender: (x) => { h = x; }, String };
    vm.createContext(ctx);
    vm.runInContext('var CORTE_UNICO_ON = false; var CORTE_JL_ON = ' + jl + '; var CORTE_TRAS_BORDE_ON = ' + tras + '; var FINTURNO_BLOQUEO_ON = ' + bloqueo + ';\n' + fnVin(SRC, '_ciePaso1') + '\n_ciePaso1();', ctx);
    return h; };
  const M998 = [{ mesa: '998', consumo: 3190, pasa_a: '' }];
  { const h = paso1(M998);
    t('A · la 998 senza erede, leve del bordo accese ⇒ nessun blocco, il bottone che passa e chiude (va al bordo)', !/No puedes cerrar tu turno/.test(h) && /onclick="_ciePasar\(\)">Las paso y cierro mi turno/.test(h), h);
    t('A2 · la riga dice dove va: «quien tome la plaza, o el JL»; la nota dice che il turno si chiude', /Mesa 998 <span[^>]*>→ quien tome la plaza, o el JL/.test(h) && /pasa al JL y tu turno se cierra igual/.test(h), h); }
  { const h = paso1(M998, { jl: false });
    t('B · leva del JL spenta ⇒ il blocco di ieri', /No puedes cerrar tu turno con mesas abiertas: mesa 998/.test(h) && !/_ciePasar/.test(h), h); }
  { const h = paso1(M998, { tras: false });
    t('C · corte al bordo spento (il GAS non conosce il JL) ⇒ il blocco di ieri', /No puedes cerrar tu turno/.test(h), h); }
  { const h = paso1([{ mesa: '31', consumo: 5000, pasa_a: 'Isa' }, { mesa: '998', consumo: 3190, pasa_a: '' }]);
    t('D · una con erede e una senza ⇒ «→ Isa» e «→ quien tome la plaza, o el JL», un bottone solo', /Mesa 31 <span[^>]*>→ Isa/.test(h) && /Mesa 998 <span[^>]*>→ quien tome la plaza, o el JL/.test(h) && (h.match(/_ciePasar\(\)/g) || []).length === 1, h); }
  { const h = paso1([{ mesa: '31', consumo: 5000, pasa_a: 'Isa' }]);
    t('E · tutte con erede ⇒ il bottone, senza la nota del JL', /_ciePasar\(\)/.test(h) && !/pasa al JL/.test(h), h); }
  { const h = paso1([]);
    t('F · nessuna mesa ⇒ «Todo cobrado» come ieri', /No tienes mesas abiertas/.test(h) && !/_ciePasar/.test(h), h); }
  t('G · la leva si legge da /salud (corte_senza_erede_jl_on)', /CORTE_JL_ON = String\(cercaK\(j, 'corte_senza_erede_jl_on'\)\) === '1';/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il blocco resta', '    if (_alJL) {\n', '    if (false) {\n'],
    ['non guarda il corte al bordo', 'const _alJL = CORTE_JL_ON && CORTE_TRAS_BORDE_ON;', 'const _alJL = CORTE_JL_ON;'],
    ['la riga non dice il JL', "(_alJL ? ' <span style=\"opacity:.65;font-size:12px\">→ quien tome la plaza, o el JL</span>'", "(false ? ''"],
    ['la leva non si legge', "      CORTE_JL_ON = String(cercaK(j, 'corte_senza_erede_jl_on')) === '1';", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
