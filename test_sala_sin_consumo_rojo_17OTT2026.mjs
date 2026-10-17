// BANCO · TERZA PENNA V30 · CONTROLLO DELL'AUTRICE · AUT-0696 · «sin consumo» con linee vive è ROSSO (17-ott, nota G di EL GIRO su 4bcf657)
// Gira le QUATTRO porte vere di sala.html (cobrar · precuenta directa · descontar v2 · descontar v1) con resto 0, e _sinConsumo vera.
// node test_sala_sin_consumo_rojo_17OTT2026.mjs [sala.html]
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(process.argv[2] || new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
const fnV = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const PORTE = ['_cobrarMesaSola', 'vPrecuentaDirecta', 'vDescontar3', 'vDescontarSala'];
function gira(porta, { base }) {
  const log = [];
  const ctx = { Math, String, log, DESCONTAR_V2_ON: false,
    _vpTot: () => 0, _vpBase: () => base, toast: (k, s) => log.push([k, s]), fmtPrice: (n) => '$' + Number(n).toLocaleString('es-CL'),
    muroT0: () => {}, vhoja: () => log.push(['vhoja']), vPrecuentaImprimir: () => log.push(['stampa']), vPrecuentaSala: () => log.push(['papel']) };
  vm.createContext(ctx); vm.runInContext(fnV('_sinConsumo') + fnV(porta) + '\n' + porta + "('50');", ctx); return log;
}
for (const p of PORTE) {
  const l = gira(p, { base: 15880 });
  t(p + ' · linee vive ($15.880) e resto 0 ⇒ toast ROSSO con la somma, «no cobres de nuevo ni por fuera», «avisa al JL»',
    l.length === 1 && l[0][0] === 'err' && /15\.880/.test(l[0][1]) && /No cobres de nuevo ni por fuera/.test(l[0][1]) && /avisa al JL/.test(l[0][1]), l);
  const l0 = gira(p, { base: 0 });
  t(p + ' · nessuna linea ⇒ il «sin consumo» di sempre, ámbar', l0.length === 1 && l0[0][0] === 'warn' && /Mesa 50 sin consumo/.test(l0[0][1]), l0);
}
t('nessuna porta col vecchio toast ámbar fisso rimasta', !SRC.includes("if (!tot) { toast('warn', 'Mesa ' + mesa + ' sin consumo'); return; }"));
console.log('\n' + (ko ? '🔴 ' + ko + ' rossi su ' + (ok + ko) : '🟢 ' + ok + ' controlli, tutti verdi'));
process.exitCode = ko ? 1 : 0;
